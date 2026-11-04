import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Імпортуємо екрани
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
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(5, 8, 15, 0.75)',
        drawerStyle: {
          backgroundColor: '#121620',
          width: 280,
          marginVertical: 35, // Робить панель плаваючою по вертикалі
          height: '92%',      // Фіксована висота, щоб верх і низ були акуратно заокругленими
          borderTopRightRadius: 36,
          borderBottomRightRadius: 36,
          borderRightWidth: 1.5,
          borderRightColor: 'rgba(255, 255, 255, 0.22)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 20, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 30,
          elevation: 25,
        },
        drawerActiveTintColor: '#34c759',
        drawerInactiveTintColor: '#94a3b8',
        drawerLabelStyle: { 
          fontSize: 15, 
          fontWeight: '700',
          marginLeft: -8,
        },
        drawerItemStyle: {
          borderRadius: 14,
          paddingHorizontal: 12,
          marginVertical: 4,
        },
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