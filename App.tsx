// App.tsx
import React, { Component, ErrorInfo, ReactNode, useContext, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar, Platform, PanResponder, Image } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import OrdersScreen from './src/screens/OrdersScreen'; // Повертаємо оригінальний стабільний екран замовлень
import IntegrationsScreen from './src/screens/IntegrationsScreen';
import AIScreen from './src/screens/AIScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SupportScreen from './src/screens/SupportScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { ThemeProvider, ThemeContext } from './src/theme/ThemeContext';
import { ProfileProvider, ProfileContext } from './src/theme/ProfileContext';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { AuraHeader } from './src/components/AuraHeader';

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
          <View style={[styles.errorCard, { backgroundColor: '#070907', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={styles.errorTitle}>Сталася системна помилка</Text>
            <TouchableOpacity style={[styles.errorButton, { backgroundColor: '#34c759' }]} onPress={() => this.setState({ hasError: false, error: null })} activeOpacity={0.85}>
              <Text style={styles.errorButtonText}>Спробувати знову</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

function MainLayout() {
  const { theme } = useContext(ThemeContext);
  const { nickname, firstName, avatarUri } = useContext(ProfileContext);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'integrations'>('orders');
  const [modalScreen, setModalScreen] = useState<'chats' | 'support' | 'settings' | 'ai' | null>(null);

  usePushNotifications();

  // Логіка жестів свайпу (зліва направо / справа наліво) для всього додатку
  const tabsList: ('orders' | 'analytics' | 'integrations')[] = ['orders', 'analytics', 'integrations'];

  const handleSwipeGesture = (direction: 'left' | 'right') => {
    if (modalScreen) {
      setModalScreen(null);
      return;
    }

    const currentIndex = tabsList.indexOf(activeTab);
    if (direction === 'left' && currentIndex < tabsList.length - 1) {
      setActiveTab(tabsList[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveTab(tabsList[currentIndex - 1]);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 50 && Math.abs(gestureState.dy) < 40;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          handleSwipeGesture('right');
        } else if (gestureState.dx < -50) {
          handleSwipeGesture('left');
        }
      },
    })
  ).current;

  const dynamicNavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
      card: 'transparent',
      text: theme.textPrimary,
      border: 'transparent',
    },
  };

  const renderContent = () => {
    if (modalScreen === 'chats') return <AIChatScreen />;
    if (modalScreen === 'support') return <SupportScreen />;
    if (modalScreen === 'settings') return <SettingsScreen />;
    if (modalScreen === 'ai') return <AIScreen />;

    switch (activeTab) {
      case 'orders': return <OrdersScreen />; // Повернено стабільний OrdersScreen
      case 'analytics': return <AnalyticsScreen />;
      case 'integrations': return <IntegrationsScreen />;
      default: return <OrdersScreen />;
    }
  };

  // Динамічний стан аватарки в шапці (синхронізований з профілем)
  let avatarContent;
  let avatarBgColor = '#2c2c2e'; // Темно-сірий за замовчуванням
  let avatarBorderColor = '#3a3a3c';

  if (avatarUri) {
    avatarContent = <Image source={{ uri: avatarUri }} style={styles.headerAvatarImage} />;
    avatarBorderColor = theme.primary;
  } else if (nickname.trim()) {
    const letter = nickname.trim().charAt(0).toUpperCase();
    avatarContent = <Text style={[styles.avatarInitialText, { color: theme.primary }]}>{letter}</Text>;
    avatarBgColor = theme.primary + '20';
    avatarBorderColor = theme.primary;
  } else if (firstName.trim()) {
    const letter = firstName.trim().charAt(0).toUpperCase();
    avatarContent = <Text style={[styles.avatarInitialText, { color: theme.primary }]}>{letter}</Text>;
    avatarBgColor = theme.primary + '20';
    avatarBorderColor = theme.primary;
  } else {
    // Якщо нічого не заповнено — сірий кружечок зі світло-сірим плюсиком
    avatarContent = <Ionicons name="add" size={20} color="#8e8e93" />;
    avatarBgColor = '#2c2c2e';
    avatarBorderColor = '#3a3a3c';
  }

  return (
    <NavigationContainer theme={dynamicNavigationTheme}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <AuraHeader />

        <View style={styles.headerQuickActions}>
          <TouchableOpacity 
            style={[styles.profileAvatarBtn, { backgroundColor: avatarBgColor, borderColor: avatarBorderColor }]} 
            onPress={() => setModalScreen('settings')} 
            activeOpacity={0.8}
          >
            {avatarContent}
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
            {modalScreen ? (
              <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setModalScreen(null)} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setModalScreen('chats')} activeOpacity={0.7}>
                  <Ionicons name="chatbubbles-outline" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setModalScreen('support')} activeOpacity={0.7}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setModalScreen('ai')} activeOpacity={0.7}>
                  <Ionicons name="sparkles-outline" size={20} color={modalScreen === 'ai' ? theme.primary : theme.textSecondary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.contentBody}>{renderContent()}</View>

        {!modalScreen && (
          <View style={[styles.tabBarWrapper, { bottom: Math.max(insets.bottom, 10) + 6 }]}>
            <View style={styles.bottomTabBar}>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]} onPress={() => setActiveTab('orders')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={20} color={activeTab === 'orders' ? theme.primary : theme.textSecondary} />
                <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'orders' && { color: theme.primary, fontWeight: '700' }]}>Замовлення</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.tabItem, activeTab === 'analytics' && styles.tabItemActive]} onPress={() => setActiveTab('analytics')} activeOpacity={0.8}>
                <Ionicons name="stats-chart-outline" size={20} color={activeTab === 'analytics' ? theme.primary : theme.textSecondary} />
                <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'analytics' && { color: theme.primary, fontWeight: '700' }]}>Аналітика</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.tabItem, activeTab === 'integrations' && styles.tabItemActive]} onPress={() => setActiveTab('integrations')} activeOpacity={0.8}>
                <Ionicons name="hardware-chip-outline" size={20} color={activeTab === 'integrations' ? theme.primary : theme.textSecondary} />
                <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'integrations' && { color: theme.primary, fontWeight: '700' }]}>Інтеграції</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <ProfileProvider>
            <MainLayout />
          </ProfileProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070907' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#070907' },
  errorCard: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  errorButton: { width: '100%', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  errorButtonText: { color: '#070907', fontSize: 14, fontWeight: '700' },
  headerQuickActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 48 : 44, 
    paddingBottom: 10, 
    zIndex: 20 
  },
  headerRightGroup: { flexDirection: 'row', gap: 10 },
  headerIconBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  profileAvatarBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 5 
  },
  headerAvatarImage: { width: '100%', height: '100%' },
  avatarInitialText: { fontSize: 17, fontWeight: '800' },
  contentBody: { flex: 1 },
  tabBarWrapper: { position: 'absolute', left: 16, right: 16, zIndex: 30 },
  bottomTabBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: 'rgba(12, 15, 12, 0.65)',
    paddingVertical: 6, 
    paddingHorizontal: 8, 
    borderRadius: 22, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 8, 
    borderRadius: 14, 
    gap: 2 
  },
  tabItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});





