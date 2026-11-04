import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, View } from 'react-native';
import { ApiService, getErrorMessage } from '../services/api';
import { AIReport } from '../types/aiReport';
import AIReportView from '../components/AIReportView';
import { orderStore } from '../services/orderStore';

export default function AIScreen() {
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
    <ScrollView contentContainerStyle={styles.container} bounces={true} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => handleRunAIAnalysis(true)} tintColor="#007AFF" />}>
      <Text style={styles.title}>🤖 ШІ-Помічник та Аналітика</Text>
      <Text style={styles.subtitle}>Комплексний аналіз замовлень, чатів та актуальних курсів валют через Claude</Text>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={() => handleRunAIAnalysis(false)} disabled={loading} activeOpacity={0.8}>
        {loading && !refreshing ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonTextLoading}>{loadingStepText}</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{loadingStepText}</Text>
        )}
      </TouchableOpacity>

      {report ? (
        <AIReportView key={resetButtonKey} report={report} onAddOrder={handleAddOrderBack} showAddButton={true} />
      ) : (
        !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Натисніть кнопку вище, щоб отримати повний звіт замовлень та актуальні фінансові дані 🚀</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f7', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  buttonDisabled: { opacity: 0.8 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextLoading: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  emptyContainer: { padding: 24, alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e5ea', borderStyle: 'dashed' },
  emptyText: { textAlign: 'center', color: '#8e8e93', fontSize: 14, lineHeight: 20 },
});