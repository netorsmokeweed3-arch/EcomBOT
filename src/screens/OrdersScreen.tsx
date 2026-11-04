import React, { useMemo, memo, useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, RefreshControl, Alert, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Order } from '../types/order';
import { ApiService } from '../services/api';
import AIReportView from '../components/AIReportView';
import { orderStore } from '../services/orderStore';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';

interface OrderItemProps {
  item: Order;
  onCompleteOrder: (order: Order) => void;
}

const OrderItemRow = memo(({ item, onCompleteOrder }: OrderItemProps) => {
  const { theme } = useAppTheme();
  const [steps, setSteps] = useState({ step1: false, step2: false, step3: false });
  const [trackingNumber, setTrackingNumber] = useState(item?.trackingNumber || '');
  const [carrier, setCarrier] = useState(item?.carrier || 'Нова Пошта');
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<string[]>(
    item?.timelineEvents || ['📦 Замовлення створено в системі']
  );
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const handleFetchTracking = async (ttn: string, selectedCarrier: string) => {
    if (!ttn || ttn.length < 5) return;
    setIsTrackingLoading(true);
    try {
      const res = await ApiService.trackParcel(ttn, selectedCarrier);
      if (res.success && res.timelineEvents) {
        setTimelineEvents(res.timelineEvents);
      } else if (res.error) {
        setTimelineEvents((prev) => [...prev, `⚠️ ${res.error}`]);
      }
    } catch (error) {
      console.warn('Помилка трекінгу посилки:', error);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handleTrackingChange = (ttn: string) => {
    setTrackingNumber(ttn);
    if (ttn.length >= 8) {
      handleFetchTracking(ttn, carrier);
    }
  };

  const handleCarrierChange = (newCarrier: string) => {
    setCarrier(newCarrier);
    if (trackingNumber.length >= 8) {
      handleFetchTracking(trackingNumber, newCarrier);
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
    <View style={[styles.orderCardWrapper, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
      <AIReportView report={item} totalAmount={formattedTotal} showAddButton={false} />

      {/* Блок введення ТТН та вибору пошти */}
      <View style={[styles.trackingContainer, { backgroundColor: theme.bgDark, borderColor: theme.cardBorder }]}>
        <View style={styles.carrierRow}>
          <TouchableOpacity 
            style={[styles.carrierBadge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.cardBorder }, carrier === 'Нова Пошта' && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
            onPress={() => handleCarrierChange('Нова Пошта')}
          >
            <Text style={[styles.carrierText, { color: theme.textSecondary }, carrier === 'Нова Пошта' && { color: theme.bgDark, fontWeight: '700' }]}>Нова Пошта</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.carrierBadge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.cardBorder }, carrier === 'Укрпошта' && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
            onPress={() => handleCarrierChange('Укрпошта')}
          >
            <Text style={[styles.carrierText, { color: theme.textSecondary }, carrier === 'Укрпошта' && { color: theme.bgDark, fontWeight: '700' }]}>Укрпошта</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.trackingInput, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            placeholder="Введіть номер ТТН (напр. 20450...)"
            placeholderTextColor={theme.textSecondary}
            value={trackingNumber}
            onChangeText={handleTrackingChange}
          />
          {isTrackingLoading && <ActivityIndicator size="small" color={theme.primary} style={styles.loaderInput} />}
        </View>
      </View>

      {/* Кнопки кроків життєвого циклу */}
      <View style={styles.stepsRow}>
        <TouchableOpacity 
          style={[styles.stepBtn, { backgroundColor: theme.bgDark, borderColor: theme.cardBorder }, steps.step1 && { backgroundColor: theme.accentGain, borderColor: theme.accentGain }]} 
          onPress={() => handleToggleStep(1)}
        >
          <Text style={[styles.stepText, { color: theme.textSecondary }, steps.step1 && styles.stepTextActive]}>{steps.step1 ? '✓ В роботу' : '1. В роботу'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.stepBtn, { backgroundColor: theme.bgDark, borderColor: theme.cardBorder }, steps.step2 && { backgroundColor: theme.accentGain, borderColor: theme.accentGain }]} 
          onPress={() => handleToggleStep(2)}
        >
          <Text style={[styles.stepText, { color: theme.textSecondary }, steps.step2 && styles.stepTextActive]}>{steps.step2 ? '✓ Відправлено' : '2. Відправлено'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.stepBtn, { backgroundColor: theme.bgDark, borderColor: theme.cardBorder }, steps.step3 && { backgroundColor: theme.accentGain, borderColor: theme.accentGain }]} 
          onPress={() => handleToggleStep(3)}
        >
          <Text style={[styles.stepText, { color: theme.textSecondary }, steps.step3 && styles.stepTextActive]}>{steps.step3 ? '✓ Забрано' : '3. Забрано'}</Text>
        </TouchableOpacity>
      </View>

      {/* Кнопка розгортання логів (Таймлайн посилки) */}
      <TouchableOpacity style={[styles.timelineToggleBtn, { backgroundColor: theme.bgDark }]} onPress={() => setShowTimeline(!showTimeline)}>
        <Text style={[styles.timelineToggleText, { color: theme.primary }]}>
          {showTimeline ? '▲ Сховати історію подій (Трекінг)' : '📦 Показати історію подій (Трекінг)'}
        </Text>
      </TouchableOpacity>

      {showTimeline && (
        <View style={[styles.timelineBox, { backgroundColor: theme.bgDark, borderColor: theme.cardBorder }]}>
          {timelineEvents.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.timelineText, { color: theme.textPrimary }]}>{event}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

OrderItemRow.displayName = 'OrderItemRow';

export default function OrdersScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Стан для автономного швидкого трекінгу будь-якої посилки зверху
  const [standaloneTTN, setStandaloneTTN] = useState('');
  const [standaloneCarrier, setStandaloneCarrier] = useState<'Нова Пошта' | 'Укрпошта'>('Нова Пошта');
  const [standaloneResult, setStandaloneResult] = useState<any>(null);
  const [isStandaloneLoading, setIsStandaloneLoading] = useState(false);

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleStandaloneTrack = async () => {
    if (!standaloneTTN || standaloneTTN.length < 5) {
      Alert.alert('Увага', 'Введіть коректний номер ТТН');
      return;
    }
    setIsStandaloneLoading(true);
    try {
      const res = await ApiService.trackParcel(standaloneTTN, standaloneCarrier);
      if (res.success) {
        setStandaloneResult(res);
      } else {
        Alert.alert('Помилка', res.error || 'Посилку не знайдено');
      }
    } catch (err) {
      Alert.alert('Помилка', 'Не вдалося отримати дані з поштового сервера.');
    } finally {
      setIsStandaloneLoading(false);
    }
  };

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
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.bgDark }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Завантаження замовлень...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Розкішний фоновий градієнт із променями */}
      <AuraHeader />

      {/* Наш власний преміальний TopBar із кнопкою меню ☰ */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }]}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: theme.textPrimary }]}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>📦 Замовлення</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Управління та швидкий трекінг</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item, index) => item?.id ? String(item.id) : `order-${index}`}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.standaloneTrackingCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
            <Text style={[styles.standaloneTitle, { color: theme.textPrimary }]}>⚡ Швидкий пошук посилки за ТТН</Text>
            
            <View style={styles.carrierRow}>
              <TouchableOpacity 
                style={[styles.carrierBadge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.cardBorder }, standaloneCarrier === 'Нова Пошта' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setStandaloneCarrier('Нова Пошта')}
              >
                <Text style={[styles.carrierText, { color: theme.textSecondary }, standaloneCarrier === 'Нова Пошта' && { color: theme.bgDark, fontWeight: '700' }]}>Нова Пошта</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.carrierBadge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.cardBorder }, standaloneCarrier === 'Укрпошта' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setStandaloneCarrier('Укрпошта')}
              >
                <Text style={[styles.carrierText, { color: theme.textSecondary }, standaloneCarrier === 'Укрпошта' && { color: theme.bgDark, fontWeight: '700' }]}>Укрпошта</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <TextInput
                style={[styles.standaloneInput, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="Введіть номер ТТН (напр. 20450...)"
                placeholderTextColor={theme.textSecondary}
                value={standaloneTTN}
                onChangeText={setStandaloneTTN}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={[styles.trackButton, { backgroundColor: theme.primary }]} onPress={handleStandaloneTrack} disabled={isStandaloneLoading}>
                {isStandaloneLoading ? (
                  <ActivityIndicator size="small" color={theme.bgDark} />
                ) : (
                  <Text style={[styles.trackButtonText, { color: theme.bgDark }]}>Знайти</Text>
                )}
              </TouchableOpacity>
            </View>

            {standaloneResult && (
              <View style={[styles.resultBox, { backgroundColor: theme.bgDark, borderColor: theme.cardBorder }]}>
                <Text style={[styles.resultStatus, { color: theme.primary }]}>📍 Статус: {standaloneResult.status}</Text>
                {standaloneResult.warehouse && <Text style={[styles.resultSub, { color: theme.textPrimary }]}>🏢 Відділення: {standaloneResult.warehouse}</Text>}
                {standaloneResult.weight && <Text style={[styles.resultSub, { color: theme.textPrimary }]}>⚖️ Вага: {standaloneResult.weight} кг</Text>}
                {standaloneResult.backDeliverySum && Number(standaloneResult.backDeliverySum) > 0 && (
                  <Text style={[styles.resultSub, { color: theme.textPrimary }]}>💰 Післяплата: {standaloneResult.backDeliverySum} грн</Text>
                )}
                
                <View style={styles.autoStepsRow}>
                  <View style={[styles.autoStep, { backgroundColor: theme.cardBorder }, styles.autoStepActive]}>
                    <Text style={styles.autoStepText}>✓ В роботу</Text>
                  </View>
                  <View style={[styles.autoStep, { backgroundColor: theme.cardBorder }, (standaloneResult.status.includes('прямує') || standaloneResult.status.includes('Отримано') || standaloneResult.status.includes('Прибуло')) ? { backgroundColor: theme.primary } : null]}>
                    <Text style={styles.autoStepText}>
                      {(standaloneResult.status.includes('прямує') || standaloneResult.status.includes('Отримано') || standaloneResult.status.includes('Прибуло')) ? '✓ Відправлено' : '2. Відправлено'}
                    </Text>
                  </View>
                  <View style={[styles.autoStep, { backgroundColor: theme.cardBorder }, (standaloneResult.status.includes('Отримано') || standaloneResult.status.includes('забрано')) ? { backgroundColor: theme.accentGain } : null]}>
                    <Text style={styles.autoStepText}>
                      {(standaloneResult.status.includes('Отримано') || standaloneResult.status.includes('забрано')) ? '✓ Забрано' : '3. Забрано'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.timelineHeader, { color: theme.textPrimary }]}>📋 Історія подій:</Text>
                {standaloneResult.timelineEvents?.map((evt: string, idx: number) => (
                  <Text key={idx} style={[styles.timelineItemText, { color: theme.textSecondary }]}>{evt}</Text>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Активних замовлень у каталозі немає 📭{'\n'}Використовуйте швидкий пошук вище або додайте через ШІ!</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} tintColor={theme.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    zIndex: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topBarSub: {
    fontSize: 11,
  },

  listContainer: { padding: 12, flexGrow: 1, zIndex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, textAlign: 'center', fontWeight: '500', lineHeight: 20 },
  
  standaloneTrackingCard: { borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, shadowOpacity: 0.2, elevation: 5 },
  standaloneTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  standaloneInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  trackButton: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, borderRadius: 10 },
  trackButtonText: { fontWeight: '700', fontSize: 13 },
  
  resultBox: { marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  resultStatus: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  resultSub: { fontSize: 12, marginBottom: 3 },
  
  autoStepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 10, gap: 4 },
  autoStep: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  autoStepActive: { backgroundColor: '#007aff' },
  autoStepText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  
  timelineHeader: { fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  timelineItemText: { fontSize: 11, marginBottom: 2 },

  orderCardWrapper: { marginBottom: 16, borderRadius: 18, padding: 16, borderWidth: 1, shadowOpacity: 0.1, elevation: 3 },
  
  trackingContainer: { marginTop: 12, marginBottom: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  carrierRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  carrierBadge: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, borderWidth: 1 },
  carrierText: { fontSize: 11, fontWeight: '600' },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  trackingInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, paddingRight: 30 },
  loaderInput: { position: 'absolute', right: 10 },

  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, gap: 6 },
  stepBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  stepText: { fontSize: 11, fontWeight: '600' },
  stepTextActive: { color: '#ffffff', fontWeight: '700' },

  timelineToggleBtn: { marginTop: 12, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  timelineToggleText: { fontSize: 11, fontWeight: '700' },
  timelineBox: { marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  timelineText: { fontSize: 11 }
});