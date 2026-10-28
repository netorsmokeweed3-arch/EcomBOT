import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ApiService, getErrorMessage } from '../services/api';
import { AIReport } from '../types/aiReport';
import AIReportView from '../components/AIReportView';

export default function AIScreen() {
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRunAIAnalysis = async () => {
    setLoading(true);
    try {
      // 1. Завантажуємо замовлення з усіх підключених магазинів
      const orders = await ApiService.getAllOrders();
      if (orders.length === 0) {
        Alert.alert('Увага ⚠️', 'Немає замовлень для аналізу.');
        return;
      }

      // 2. Аналізуємо перше замовлення разом з історією його переписки з покупцем
      const [firstOrder] = orders;
      const aiReport = await ApiService.processWithAI(firstOrder, firstOrder.chatHistory ?? '');
      setReport(aiReport);
    } catch (error) {
      Alert.alert('Помилка ❌', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🤖 ШІ-Помічник та Аналітика</Text>
      <Text style={styles.subtitle}>Аналіз замовлень, наявності та чатів з покупцями через Claude</Text>

      <TouchableOpacity style={styles.button} onPress={handleRunAIAnalysis} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Запустити аналіз замовлень і чатів</Text>
        )}
      </TouchableOpacity>

      {report ? <AIReportView report={report} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f7', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
