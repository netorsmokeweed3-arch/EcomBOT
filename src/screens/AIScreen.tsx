import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, View, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ApiService, getErrorMessage } from '../services/api';
import { AIReport } from '../types/aiReport';
import AIReportView from '../components/AIReportView';
import { orderStore } from '../services/orderStore';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';

export default function AIScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>('Запустити аналіз замовлень, чатів і курсу валют');
  const [resetButtonKey, setResetButtonKey] = useState<number>(0);

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleAddOrderBack = useCallback((order: any) => {
    orderStore.addManualOrder(order);
    Alert.alert('✅ Успіх', 'Замовлення успішно додано до розділу "Замовлення"!');
  }, []);

  const handleRunAIAnalysis = useCallback(async (isRefresh = false) => {
    if (loading) return;
    
    setResetButtonKey((prev) => prev + 1);

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (isMountedRef.current) setLoadingStepText('Синхронізація курсів валют та замовлень...');
      
      const orders = await ApiService.getAllOrders();
      
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        if (isMountedRef.current) Alert.alert('Увага ⚠️', 'Немає замовлень для аналізу.');
        return;
      }

      const [firstOrder] = orders;
      const shopId = firstOrder.shopId || (firstOrder as any).shop_id;
      if (!firstOrder || !shopId) {
        if (isMountedRef.current) Alert.alert('Помилка ❌', 'Некоректні дані замовлення або відсутній ID магазину.');
        return;
      }

      const savedShops = ApiService.getSavedShops() || [];
      const shop = savedShops.find((saved) => saved.id === shopId);
      
      if (!shop) {
        if (isMountedRef.current) Alert.alert('Помилка ❌', 'Не знайдено магазин для цього замовлення.');
        return;
      }

      const chatHistory = typeof firstOrder.chatHistory === 'string' ? firstOrder.chatHistory : JSON.stringify(firstOrder.chatHistory ?? '');

      if (isMountedRef.current) setLoadingStepText('ШІ аналізує дані та ринкові тренди...');
      const aiReport = await ApiService.processWithAI(firstOrder, chatHistory, shop);

      if (isMountedRef.current) setReport(aiReport);
    } catch (error) {
      if (isMountedRef.current) Alert.alert('Помилка ❌', getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingStepText('Запустити аналіз замовлень, чатів і курсу валют');
      }
    }
  }, [loading]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Розкішний фоновий градієнт із променями */}
      <AuraHeader />

      {/* Наш власний преміальний TopBar із кнопкою меню ☰ */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }]}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: theme.textPrimary }]}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>🤖 ШІ-Помічник та Аналітика</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Інтелектуальний аналіз через Claude</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        bounces={true} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => handleRunAIAnalysis(true)} tintColor={theme.primary} />}
      >
        <View style={[styles.cardHeaderBanner, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Комплексний корпоративний аналіз</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Глибока перевірка замовлень, комунікації в чатах та актуальних ринкових трендів.</Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]} 
            onPress={() => handleRunAIAnalysis(false)} 
            disabled={loading} 
            activeOpacity={0.8}
          >
            {loading && !refreshing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.bgDark} size="small" />
                <Text style={[styles.buttonTextLoading, { color: theme.bgDark }]}>{loadingStepText}</Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: theme.bgDark }]}>{loadingStepText}</Text>
            )}
          </TouchableOpacity>
        </View>

        {report ? (
          <AIReportView key={resetButtonKey} report={report} onAddOrder={handleAddOrderBack} showAddButton={true} />
        ) : (
          !loading && (
            <View style={[styles.emptyContainer, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Натисніть кнопку вище, щоб отримати повний звіт замовлень та актуальні фінансові дані 🚀</Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    zIndex: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topBarSub: {
    fontSize: 11,
  },

  scrollContent: { padding: 12, paddingBottom: 40, zIndex: 1 },
  
  cardHeaderBanner: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  
  button: { 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 3 
  },
  buttonDisabled: { opacity: 0.8 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttonText: { fontSize: 15, fontWeight: '800' },
  buttonTextLoading: { fontSize: 14, fontWeight: '800', marginLeft: 6 },
  
  emptyContainer: { 
    padding: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 18, 
    borderWidth: 1, 
    borderStyle: 'dashed',
    marginTop: 4
  },
  emptyText: { textAlign: 'center', fontSize: 13, lineHeight: 20 },
});