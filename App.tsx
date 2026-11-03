import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import OrdersScreen from './src/screens/OrdersScreen';
import IntegrationsScreen from './src/screens/IntegrationsScreen';
import AIScreen from './src/screens/AIScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SupportScreen from './src/screens/SupportScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Drawer = createDrawerNavigator();

const CustomTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#f5f5f7', card: '#ffffff', text: '#1c1c1e', border: '#e5e5ea' },
};

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("[CRITICAL_UI_ERROR]", error, errorInfo); }
  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Сталася системна помилка</Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => this.setState({ hasError: false, error: null })}>
              <Text style={styles.errorButtonText}>Спробувати знову</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer theme={CustomTheme}>
        <Drawer.Navigator
          initialRouteName="Orders"
          screenOptions={{
            headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
            headerTintColor: '#1c1c1e',
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            drawerActiveTintColor: '#007aff',
            drawerInactiveTintColor: '#3a3a3c',
            drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -10 },
          }}
        >
          <Drawer.Screen name="Orders" component={OrdersScreen} options={{ title: '📦 Замовлення' }} />
          <Drawer.Screen name="Integrations" component={IntegrationsScreen} options={{ title: '🔌 Інтеграції (Магазини)' }} />
          <Drawer.Screen name="Analytics" component={AnalyticsScreen} options={{ title: '📊 Аналітика та Доходи' }} />
          <Drawer.Screen name="AI" component={AIScreen} options={{ title: '🤖 ШІ-Помічник' }} />
          <Drawer.Screen name="AIChat" component={AIChatScreen} options={{ title: '💬 Інтерактивний чат ШІ' }} />
          <Drawer.Screen name="Support" component={SupportScreen} options={{ title: '⚠️ Підтримка та повернення', headerShown: false }} />
          <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: '⚙️ Налаштування' }} />
        </Drawer.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f7' },
  errorCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1, borderColor: '#e5e5ea' },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 8, textAlign: 'center' },
  errorButton: { backgroundColor: '#007aff', width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  errorButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});