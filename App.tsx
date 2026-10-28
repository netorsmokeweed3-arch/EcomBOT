import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import OrdersScreen from './src/screens/OrdersScreen';
import IntegrationsScreen from './src/screens/IntegrationsScreen';
import AIScreen from './src/screens/AIScreen';
import SettingsScreen from './src/screens/SettingsScreen';


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

