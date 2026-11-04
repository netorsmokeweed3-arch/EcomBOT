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

// Імпортуємо контекст преміальних тем та хук сповіщень
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { usePushNotifications } from './src/hooks/usePushNotifications';

const Drawer = createDrawerNavigator();

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

function AppNavigator() {
  const { theme } = useAppTheme();
  
  // Динамічна тема навігації
  const dynamicNavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.bgDark,
      card: 'transparent',
      text: theme.textPrimary,
      border: 'transparent',
    },
  };

  // Автоматично ініціалізуємо фонові Push-сповіщення при запуску додатка
  usePushNotifications();

  return (
    <NavigationContainer theme={dynamicNavigationTheme}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <Drawer.Navigator
        initialRouteName="Orders"
        screenOptions={{
          headerShown: false,
          drawerType: 'front', // Меню виїжджає поверх екрана шторкою, нічого не зсуваючи!
          overlayColor: 'rgba(3, 5, 10, 0.8)', // Глибоке затемнення, що повністю гасить задній план
          drawerStyle: {
            backgroundColor: '#0E121C', // Щільний матовий фон — жодних просвітів ззаду!
            width: 280,
            marginVertical: 35, // Плаваюча капсула з відступами зверху і знизу
            height: '92%',      // Фіксована висота для акуратних закруглень
            borderTopRightRadius: 36,
            borderBottomRightRadius: 36,
            // Світловий ефект об'єму (опуклість) по правій та верхній межі
            borderRightWidth: 1.5,
            borderRightColor: 'rgba(255, 255, 255, 0.22)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.12)',
            // Глибока преміальна тінь
            shadowColor: '#000',
            shadowOffset: { width: 25, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 35,
            elevation: 30,
          },
          drawerActiveTintColor: theme.primary,
          drawerInactiveTintColor: theme.textSecondary,
          drawerLabelStyle: { fontSize: 15, fontWeight: '700', marginLeft: -8 },
          drawerItemStyle: {
            borderRadius: 14,
            paddingHorizontal: 12,
            marginVertical: 4,
          },
        }}
      >
        <Drawer.Screen name="Orders" component={OrdersScreen} options={{ title: '📦 Замовлення' }} />
        <Drawer.Screen name="Integrations" component={IntegrationsScreen} options={{ title: '🔌 Інтеграції (Магазини)' }} />
        <Drawer.Screen name="Analytics" component={AnalyticsScreen} options={{ title: '📊 Аналітика та Доходи' }} />
        <Drawer.Screen name="AI" component={AIScreen} options={{ title: '🤖 ШІ-Помічник' }} />
        <Drawer.Screen name="AIChat" component={AIChatScreen} options={{ title: '💬 Чати та клієнти' }} />
        <Drawer.Screen name="Support" component={SupportScreen} options={{ title: '⚠️ Підтримка та повернення' }} />
        <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: '⚙️ Налаштування' }} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#0B0C0E' },
  errorCard: { backgroundColor: '#15171E', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  errorButton: { backgroundColor: '#D4AF37', width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  errorButtonText: { color: '#0B0C0E', fontSize: 16, fontWeight: '700' },
});