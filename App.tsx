import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import OrdersScreen from './src/screens/OrdersScreen';
import IntegrationsScreen from './src/screens/IntegrationsScreen';
import AIScreen from './src/screens/AIScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Сувора типізація маршрутів навігації (захист від помилок на рівні компілятора)
export type RootDrawerParamList = {
  Orders: undefined;
  Integrations: undefined;
  AI: undefined;
  Settings: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

// Кастомна тема додатку для плавної інтеграції з системними кольорами
const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f5f5f7',
    card: '#ffffff',
    text: '#1c1c1e',
    border: '#e5e5ea',
  },
};

// Інтерфейси для Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enterprise-grade Error Boundary для повного запобігання білим екранам смерті
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Тут у майбутньому можна підключити Sentry або Firebase Crashlytics
    console.error("[CRITICAL_UI_ERROR]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Сталася системна помилка</Text>
            <Text style={styles.errorSubtitle}>
              Ми вже знаємо про збій та працюємо над його усуненням. Спробуйте перезапустити екран.
            </Text>
            <TouchableOpacity 
              style={styles.errorButton} 
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.errorButtonText}>Спробувати знову</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Головний сайдбар-навігатор з оптимізованими параметрами анімації та стилізації
 */
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Orders"
      screenOptions={{
        headerStyle: { 
          backgroundColor: '#ffffff',
          elevation: 0, // Прибирає тінь на Android для сучасного плоского дизайну
          shadowOpacity: 0, // Прибирає тінь на iOS
          borderBottomWidth: 1,
          borderBottomColor: '#e5e5ea',
        },
        headerTintColor: '#1c1c1e',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        drawerActiveTintColor: '#007aff',
        drawerInactiveTintColor: '#3a3a3c',
        drawerLabelStyle: { 
          fontSize: 15, 
          fontWeight: '600',
          marginLeft: -10,
        },
        drawerType: 'slide',
        swipeEnabled: true,
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: 280,
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

/**
 * Кореневий компонент додатку з повною ієрархією безпеки
 */
export default function App() {
  return (
    <ErrorBoundary>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer theme={CustomTheme}>
        <DrawerNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f7',
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorButton: {
    backgroundColor: '#007aff',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});