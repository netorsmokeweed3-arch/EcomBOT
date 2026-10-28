import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Order } from '../types/order';
import { ApiService, getErrorMessage } from '../services/api';
import AIReportView from '../components/AIReportView';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  // Рендеринг елемента списку через єдиний професійний компонент AIReportView
  const renderOrderItem = ({ item }: { item: Order }) => {
    return (
      <AIReportView 
        report={item} 
        totalAmount={item.totalAmount} 
      />
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
});