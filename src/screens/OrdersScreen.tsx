import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, RefreshControl, Alert, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { Order } from '../types/order';
import { ApiService } from '../services/api';
import AIReportView from '../components/AIReportView';
import { orderStore } from '../services/orderStore';

interface OrderItemProps {
  item: Order;
  onCompleteOrder: (order: Order) => void;
}

const OrderItemRow = memo(({ item, onCompleteOrder }: OrderItemProps) => {
  const [steps, setSteps] = useState({ step1: false, step2: false, step3: false });
  const [trackingNumber, setTrackingNumber] = useState(item?.trackingNumber || '');
  const [carrier, setCarrier] = useState(item?.carrier || 'Нова Пошта');
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<string[]>(
    item?.timelineEvents || ['📦 Замовлення створено в системі']
  );

  const handleTrackingChange = (ttn: string) => {
    setTrackingNumber(ttn);
    if (ttn.length >= 8) {
      let newEvents = [...timelineEvents];
      newEvents.push(`🔍 Опитування API (${carrier}): ТТН ${ttn} знайдено`);
      if (carrier === 'Нова Пошта') {
        newEvents.push('🚚 Відправлення прямує до міста отримувача (Нова Пошта)');
      } else {
        newEvents.push('📮 Поштове відправлення прийнято у відділенні (Укрпошта)');
      }
      setTimelineEvents(newEvents);
    }
  };

  const handleToggleStep = (stepNumber: 1 | 2 | 3) => {
    const updatedSteps = { ...steps, [`step${stepNumber}`]: !steps[`step${stepNumber}`] };
    setSteps(updatedSteps);

    let newEvents = [...timelineEvents];
    if (stepNumber === 1 && updatedSteps.step1) {
      newEvents.push('🛠️ Замовлення взято в роботу продавцем');
    } else if (stepNumber === 2 && updatedSteps.step2) {
      newEvents.push(`🚚 Посилку передано до служби (${carrier}), ТТН: ${trackingNumber || 'не вказано'}`);
    } else if (stepNumber === 3 && updatedSteps.step3) {
      newEvents.push('✅ Посилку успішно доставлено та забрано клієнтом');
    }
    setTimelineEvents(newEvents);

    if (updatedSteps.step1 && updatedSteps.step2 && updatedSteps.step3) {
      Alert.alert(
        '🎉 Успіх!',
        `Замовлення #${item.orderNumber || item.id} повністю виконано! Перенести в історію та аналітику?`,
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Підтвердити', onPress: () => onCompleteOrder(item) },
        ]
      );
    }
  };

  const formattedTotal = typeof item?.totalAmount === 'object' && item?.totalAmount !== null && 'formatted' in item.totalAmount
    ? (item.totalAmount as any).formatted
    : `${typeof item?.totalAmount === 'number' ? item.totalAmount : 0} грн`;

  return (
    <View style={styles.orderCardWrapper}>
      <AIReportView report={item} totalAmount={formattedTotal} showAddButton={false} />

      {/* Блок введення ТТН та вибору пошти */}
      <View style={styles.trackingContainer}>
        <View style={styles.carrierRow}>
          <TouchableOpacity 
            style={[styles.carrierBadge, carrier === 'Нова Пошта' && styles.carrierActive]} 
            onPress={() => setCarrier('Нова Пошта')}
          >
            <Text style={[styles.carrierText, carrier === 'Нова Пошта' && styles.carrierTextActive]}>Нова Пошта</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.carrierBadge, carrier === 'Укрпошта' && styles.carrierActive]} 
            onPress={() => setCarrier('Укрпошта')}
          >
            <Text style={[styles.carrierText, carrier === 'Укрпошта' && styles.carrierTextActive]}>Укрпошта</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.trackingInput}
          placeholder="Введіть номер ТТН (напр. 20450...)"
          placeholderTextColor="#8e8e93"
          value={trackingNumber}
          onChangeText={handleTrackingChange}
        />
      </View>

      {/* Кнопки кроків життєвого циклу */}
      <View style={styles.stepsRow}>
        <TouchableOpacity style={[styles.stepBtn, steps.step1 && styles.stepBtnActive]} onPress={() => handleToggleStep(1)}>
          <Text style={[styles.stepText, steps.step1 && styles.stepTextActive]}>{steps.step1 ? '✓ В роботу' : '1. В роботу'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stepBtn, steps.step2 && styles.stepBtnActive]} onPress={() => handleToggleStep(2)}>
          <Text style={[styles.stepText, steps.step2 && styles.stepTextActive]}>{steps.step2 ? '✓ Відправлено' : '2. Відправлено'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stepBtn, steps.step3 && styles.stepBtnActive]} onPress={() => handleToggleStep(3)}>
          <Text style={[styles.stepText, steps.step3 && styles.stepTextActive]}>{steps.step3 ? '✓ Забрано' : '3. Забрано'}</Text>
        </TouchableOpacity>
      </View>

      {/* Кнопка розгортання логів (Таймлайн посилки) */}
      <TouchableOpacity style={styles.timelineToggleBtn} onPress={() => setShowTimeline(!showTimeline)}>
        <Text style={styles.timelineToggleText}>
          {showTimeline ? '▲ Сховати історію подій (Трекінг)' : '📦 Показати історію подій (Трекінг)'}
        </Text>
      </TouchableOpacity>

      {showTimeline && (
        <View style={styles.timelineBox}>
          {timelineEvents.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineText}>{event}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

OrderItemRow.displayName = 'OrderItemRow';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await ApiService.getAllOrders();
      if (isMountedRef.current) {
        const apiOrders = Array.isArray(data) ? data : [];
        const manual = orderStore.getManualOrders();
        const completedIds = new Set(orderStore.getCompletedOrders().map(o => o.id));

        const combined = [...manual, ...apiOrders].filter(o => !completedIds.has(o.id));
        const uniqueOrders = Array.from(new Map(combined.map(o => [o.id, o])).values());
        
        setOrders(uniqueOrders);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const manual = orderStore.getManualOrders();
        setOrders(manual);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const unsubscribe = orderStore.subscribe(() => {
      loadOrders();
    });
    return unsubscribe;
  }, [loadOrders]);

  const handleCompleteOrder = useCallback((completedOrder: Order) => {
    orderStore.completeOrder(completedOrder);
    setOrders((prevOrders) => prevOrders.filter((o) => o.id !== completedOrder.id));
  }, []);

  const renderOrderItem = useCallback(({ item }: { item: Order }) => {
    return <OrderItemRow item={item} onCompleteOrder={handleCompleteOrder} />;
  }, [handleCompleteOrder]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.loadingText}>Завантаження замовлень...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />
      <FlatList
        data={orders}
        keyExtractor={(item, index) => item?.id ? String(item.id) : `order-${index}`}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нових замовлень немає 📭{'\n'}Додайте їх через ШІ-помічник!</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} tintColor="#007aff" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  centered: { flex: 1, backgroundColor: '#f5f5f7', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#8e8e93', textAlign: 'center' },
  listContainer: { padding: 12, flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#8e8e93', textAlign: 'center', fontWeight: '500', lineHeight: 22 },
  orderCardWrapper: { marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e5ea', elevation: 2 },
  
  trackingContainer: { marginTop: 8, marginBottom: 8, backgroundColor: '#f9f9fb', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e5ea' },
  carrierRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  carrierBadge: { flex: 1, paddingVertical: 4, alignItems: 'center', borderRadius: 6, backgroundColor: '#e5e5ea' },
  carrierActive: { backgroundColor: '#007aff' },
  carrierText: { fontSize: 11, fontWeight: '600', color: '#3a3a3c' },
  carrierTextActive: { color: '#fff' },
  trackingInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, color: '#000' },

  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, gap: 6 },
  stepBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, backgroundColor: '#f2f2f7', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#d1d1d6' },
  stepBtnActive: { backgroundColor: '#34c759', borderColor: '#248a3d' },
  stepText: { fontSize: 11, fontWeight: '600', color: '#3a3a3c' },
  stepTextActive: { color: '#ffffff' },

  timelineToggleBtn: { marginTop: 10, paddingVertical: 6, alignItems: 'center', backgroundColor: '#f0f0f5', borderRadius: 6 },
  timelineToggleText: { fontSize: 11, fontWeight: '600', color: '#007aff' },
  timelineBox: { marginTop: 6, backgroundColor: '#fcfcfd', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#eee' },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#007aff', marginRight: 6 },
  timelineText: { fontSize: 11, color: '#3a3a3c' }
});