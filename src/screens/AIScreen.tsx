import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, View } from 'react-native';
import { ApiService, getErrorMessage } from '../services/api';
import { AIReport } from '../types/aiReport';
import AIReportView from '../components/AIReportView';

export default function AIScreen() {
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>('Запустити аналіз замовлень і чатів');

  // Захист від оновлення стану на розмонтованому компоненті (Memory Leak Prevention)
  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRunAIAnalysis = useCallback(async (isRefresh = false) => {
    if (loading) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Крок 1: Завантаження замовлень
      if (isMountedRef.current) setLoadingStepText('Завантаження замовлень...');
      const orders = await ApiService.getAllOrders();
      
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        if (isMountedRef.current) {
          Alert.alert('Увага ⚠️', 'Немає замовлень для аналізу.');
        }
        return;
      }

      // Крок 2: Валідація першого замовлення
      const [firstOrder] = orders;
      if (!firstOrder || !firstOrder.shopId) {
        if (isMountedRef.current) {
          Alert.alert('Помилка ❌', 'Некоректні дані замовлення або відсутній ID магазину.');
        }
        return;
      }

      // Крок 3: Пошук магазину
      const savedShops = ApiService.getSavedShops() || [];
      const shop = savedShops.find((saved) => saved.id === firstOrder.shopId);
      
      if (!shop) {
        if (isMountedRef.current) {
          Alert.alert('Помилка ❌', 'Не знайдено магазин для цього замовлення.');
        }
        return;
      }

      // Крок 4: Підготовка історії чату
      const chatHistory = typeof firstOrder.chatHistory === 'string' 
        ? firstOrder.chatHistory 
        : JSON.stringify(firstOrder.chatHistory ?? '');

      // Крок 5: Запит до штучного інтелекту
      if (isMountedRef.current) setLoadingStepText('ШІ аналізує дані...');
      const aiReport = await ApiService.processWithAI(
        firstOrder, 
        chatHistory, 
        shop
      );

      if (isMountedRef.current) {
        setReport(aiReport);
      }
    } catch (error) {
      if (isMountedRef.current) {
        Alert.alert('Помилка ❌', getErrorMessage(error));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingStepText('Запустити аналіз замовлень і чатів');
      }
    }
  }, [loading]);

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      bounces={true}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => handleRunAIAnalysis(true)} tintColor="#007AFF" />
      }
    >
      <Text style={styles.title}>🤖 ШІ-Помічник та Аналітика</Text>
      <Text style={styles.subtitle}>Аналіз замовлень, наявності та чатів з покупцями через Claude</Text>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={() => handleRunAIAnalysis(false)} 
        disabled={loading}
        activeOpacity={0.8}
      >
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
        <AIReportView report={report} />
      ) : (
        !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Натисніть кнопку вище, щоб отримати свіжий аналіз замовлень за допомогою ШІ 🚀</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: '#f5f5f7', 
    flexGrow: 1 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#111', 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 20 
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  buttonDisabled: {
    opacity: 0.8
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  buttonTextLoading: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderStyle: 'dashed'
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    fontSize: 14,
    lineHeight: 20
  }
});