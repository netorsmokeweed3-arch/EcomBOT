import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Order } from '../types/order';
import { ApiService, getErrorMessage } from '../services/api';
import AIReportView from '../components/AIReportView';

interface OrderItemProps {
  item: Order;
}

// Мемоізований рядок замовлення для нульових перерендерів під час скролу
const OrderItemRow = memo(({ item }: OrderItemProps) => {
  return (
    <AIReportView 
      report={item} 
      totalAmount={item?.totalAmount} 
    />
  );
});

OrderItemRow.displayName = 'OrderItemRow';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Захист від оновлення стану на розмонтованому компоненті (Memory Leak Prevention)
  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Стабільна функція завантаження замовлень
  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await ApiService.getAllOrders();
      if (isMountedRef.current) {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (isMountedRef.current) {
        Alert.alert('Помилка ❌', getErrorMessage(error));
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
  }, [loadOrders]);

  // Стабільні колбеки для FlatList
  const renderOrderItem = useCallback(({ item }: { item: Order }) => {
    return <OrderItemRow item={item} />;
  }, []);

  const keyExtractor = useCallback((item: Order, index: number) => {
    return item?.id ? String(item.id) : `order-${index}`;
  }, []);

  const handleRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

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
        keyExtractor={keyExtractor}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нових замовлень немає 📭</Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            tintColor="#007aff" 
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f7' 
  },
  centered: { 
    flex: 1, 
    backgroundColor: '#f5f5f7', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: '#8e8e93', 
    textAlign: 'center' 
  },
  listContainer: { 
    padding: 16,
    flexGrow: 1
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: { 
    fontSize: 15, 
    color: '#8e8e93', 
    textAlign: 'center',
    fontWeight: '500'
  },
});