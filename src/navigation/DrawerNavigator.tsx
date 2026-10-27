import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Імпортуємо створені екрани (додаємо фігурні дужки, якщо експорт іменований, або залишаємо так, залежно від того, як написані самі екрани)
import OrdersScreen from '../screens/OrdersScreen';
import IntegrationsScreen from '../screens/IntegrationsScreen';
import AIScreen from '../screens/AIScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Orders"
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#2563eb',
        drawerInactiveTintColor: '#334155',
        drawerLabelStyle: { fontSize: 16, fontWeight: '600' },
      }}
    >
      <Drawer.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{ title: '📦 Замовлення' }} 
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