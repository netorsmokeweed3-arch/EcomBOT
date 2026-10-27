import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Order } from './src/types/order';
import { ApiService } from './src/services/api';

// Імпортуємо інші екрани для сайдбару
import IntegrationsScreen from './src/screens/IntegrationsScreen';
import AIScreen from './src/screens/AIScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Головний компонент списку замовлень (твій дизайн)
function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

const Drawer = createDrawerNavigator();

// Сайдбар навігатор, який об'єднує всі твої розділи
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Orders"
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1c1c1e',
        drawerActiveTintColor: '#007aff',
        drawerInactiveTintColor: '#3a3a3c',
        drawerLabelStyle: { fontSize: 16, fontWeight: '600' },
      }}
    >
      <Drawer.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{ title: '📦 Замовлення Prom.ua' }} 
      />
      <Drawer.Screen 
        name="Integrations" 
        component={IntegrationsScreen} 
        options={{ title: '🔌 Інтеграції (Магазини)' }} 
      />
      <Drawer.Screen 
        name="AI" 
        component={AIScreen} 
        options={{ title: '🤖 ШІ-Помічник' }} 
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: '⚙️ Налаштування' }} 
      />
    </Drawer.Navigator>
  );
}

// Головний експорт додатку
export default function App() {
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
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