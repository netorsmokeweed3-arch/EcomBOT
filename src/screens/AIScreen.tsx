import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ApiService } from '../services/api';

export default function AIScreen() {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRunAIAnalysis = async () => {
    setLoading(true);
    try {
      // 1. Спочатку затягуємо замовлення з нашого бекенда (які підтягнулися з Prom.ua)
      const orders = await ApiService.getOrders();
      
      // 2. Беремо для прикладу перше замовлення та симулюємо/збираємо історію чату
      const sampleOrder = orders.length > 0 ? JSON.stringify(orders[0]) : "Немає нових замовлень";
      const sampleChat = "Покупець запитав: 'Чи є цей товар синього кольору в наявності?' Продавець відповів: 'Так, є в наявності, відправляємо сьогодні.'";

      // 3. Відправляємо це все на наш сервер на обробку до Claude Haiku 5.5
      const aiResult = await ApiService.processWithAI(sampleOrder, sampleChat);
      setReport(aiResult);
    } catch (error) {
      console.error(error);
      setReport("Сталася помилка при аналізі.");
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

      {report ? (
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>Звіт від штучного інтелекту:</Text>
          <Text style={styles.reportText}>{report}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f7', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  reportContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  reportText: { fontSize: 14, color: '#444', lineHeight: 20 },
});