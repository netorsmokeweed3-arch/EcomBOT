import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Order } from '../types/order';
import { AIReport } from '../types/aiReport';
import { ApiService, getErrorMessage } from '../services/api';
import AIReportView from '../components/AIReportView';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  // ID замовлення, яке зараз обробляє ШІ
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Звіти ШІ за ID замовлення
  const [reports, setReports] = useState<Record<string, AIReport>>({});

  // Завантаження замовлень з усіх підключених магазинів
  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await ApiService.getAllOrders();
      setOrders(data);
    } catch (error) {
      Alert.alert('Помилка ❌', getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Відправка замовлення і переписки на аналіз ШІ
  const handleProcess = async (order: Order) => {
    setProcessingId(order.id);
    try {
      const report = await ApiService.processWithAI(order, order.chatHistory ?? '');
      setReports((prev) => ({ ...prev, [order.id]: report }));
    } catch (error) {
      Alert.alert('Помилка ❌', getErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const report = reports[item.id];
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={[styles.badge, item.status === 'new' ? styles.badgeNew : styles.badgeProcessing]}>
            {item.status === 'new' ? ' НОВЕ' : ' В ОБРОБЦІ'}
          </Text>
        </View>

        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.phone}>{item.phone}</Text>

        <View style={styles.divider} />

        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryText}>📍 {item.city}, {item.postOffice}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalText}>Сума: <Text style={styles.price}>{item.totalAmount} грн</Text></Text>
          <TouchableOpacity
            style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
            onPress={() => handleProcess(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Обробити</Text>
            )}
          </TouchableOpacity>
        </View>

        {report ? <AIReportView report={report} /> : null}
      </View>
    );
  };

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
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.loadingText}>Нових замовлень немає</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} tintColor="#007aff" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  centered: { flex: 1, backgroundColor: '#f5f5f7', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#8e8e93', textAlign: 'center' },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#007aff' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  badgeNew: { backgroundColor: '#ffe5e5', color: '#ff3b30' },
  badgeProcessing: { backgroundColor: '#e5f2ff', color: '#007aff' },
  customerName: { fontSize: 18, fontWeight: '600', color: '#1c1c1e' },
  phone: { fontSize: 14, color: '#636366', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f2f2f7', marginVertical: 10 },
  deliveryRow: { marginBottom: 12 },
  deliveryText: { fontSize: 14, color: '#3a3a3c', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 14, color: '#8e8e93' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#34c759' },
  actionButton: { backgroundColor: '#007aff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});
