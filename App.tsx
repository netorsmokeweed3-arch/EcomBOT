import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { Order } from './src/types/order';
import { ApiService } from './src/services/api';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Функція для завантаження замовлень через наш сервіс
  const loadOrders = async () => {
    setLoading(true);
    const data = await ApiService.getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const renderOrderItem = ({ item }: { item: Order }) => (
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
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Обробити</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EcomBot 📦</Text>
        <Text style={styles.headerSubtitle}>Замовлення Prom.ua</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor="#007aff" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1c1c1e' },
  headerSubtitle: { fontSize: 14, color: '#8e8e93', marginTop: 2 },
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
  actionButton: { backgroundColor: '#007aff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  actionButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});