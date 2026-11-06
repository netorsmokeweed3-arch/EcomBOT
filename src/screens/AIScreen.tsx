// src/screens/AIScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, View, StatusBar } from 'react-native';
import { ApiService, getErrorMessage } from '../services/api';
import { AIReport } from '../types/aiReport';
import AIReportView from '../components/AIReportView';
import { orderStore } from '../services/orderStore';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';
import { GlassCard } from '../components/GlassCard';

export default function AIScreen() {
  const { theme } = useAppTheme();

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
    Alert.alert('Успіх', 'Замовлення успішно додано до розділу "Замовлення".');
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
        if (isMountedRef.current) Alert.alert('Увага', 'Немає замовлень для аналізу.');
        return;
      }

      const [firstOrder] = orders;
      const shopId = firstOrder.shopId || (firstOrder as any).shop_id;
      if (!firstOrder || !shopId) {
        if (isMountedRef.current) Alert.alert('Помилка', 'Некоректні дані замовлення або відсутній ID магазину.');
        return;
      }

      const savedShops = ApiService.getSavedShops() || [];
      const shop = savedShops.find((saved) => saved.id === shopId);
      
      if (!shop) {
        if (isMountedRef.current) Alert.alert('Помилка', 'Не знайдено магазин для цього замовлення.');
        return;
      }

      const chatHistory = typeof firstOrder.chatHistory === 'string' ? firstOrder.chatHistory : JSON.stringify(firstOrder.chatHistory ?? '');

      if (isMountedRef.current) setLoadingStepText('ШІ аналізує дані та ринкові тренди...');
      const aiReport = await ApiService.processWithAI(firstOrder, chatHistory, shop);

      if (isMountedRef.current) setReport(aiReport);
    } catch (error) {
      if (isMountedRef.current) Alert.alert('Помилка', getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingStepText('Запустити аналіз замовлень, чатів і курсу валют');
      }
    }
  }, [loading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>ШІ-Помічник та Аналітика</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Інтелектуальний аналіз через Claude</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        bounces={true} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => handleRunAIAnalysis(true)} tintColor={theme.primary} />}
      >
        <GlassCard style={styles.glassCardWrapper}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Комплексний корпоративний аналіз</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Глибока перевірка замовлень, комунікації в чатах та актуальних ринкових трендів.</Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]} 
            onPress={() => handleRunAIAnalysis(false)} 
            disabled={loading} 
            activeOpacity={0.85}
          >
            {loading && !refreshing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#070907" size="small" />
                <Text style={styles.buttonTextLoading}>{loadingStepText}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{loadingStepText}</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {report ? (
          <AIReportView key={resetButtonKey} report={report} onAddOrder={handleAddOrderBack} showAddButton={true} />
        ) : (
          !loading && (
            <GlassCard style={styles.glassCardWrapper}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Натисніть кнопку вище, щоб отримати повний звіт замовлень та актуальні фінансові дані.
              </Text>
            </GlassCard>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, zIndex: 10 },
  topBarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  topBarSub: { fontSize: 11 },
  scrollContent: { padding: 12, paddingBottom: 90, zIndex: 1 },
  glassCardWrapper: { marginBottom: 14 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  button: { padding: 14, borderRadius: 12, alignItems: 'center', shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  buttonDisabled: { opacity: 0.7 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttonText: { fontSize: 14, fontWeight: '800', color: '#070907' },
  buttonTextLoading: { fontSize: 13, fontWeight: '800', color: '#070907', marginLeft: 6 },
  emptyText: { textAlign: 'center', fontSize: 13, lineHeight: 20, paddingVertical: 4 },
});