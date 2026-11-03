import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Platform, StatusBar, ActivityIndicator } from 'react-native';

interface SupportTicket {
  id: string;
  orderNumber: string;
  clientName: string;
  issueType: 'damaged' | 'refund' | 'wrong_item' | 'other';
  message: string;
  aiSuggestedSolution: string;
  riskLevel?: string;
  status: 'incoming' | 'active' | 'archive' | 'rejected';
  date: string;
}

export default function SupportScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'archive' | 'rejected'>('incoming');
  const [isLoading, setIsLoading] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'ticket-101',
      orderNumber: '#1001',
      clientName: 'Іван Петренко',
      issueType: 'damaged',
      message: 'Посилка прийшла пошкоджена, коробка зім\'ята, товар розбитий!',
      aiSuggestedSolution: 'ШІ рекомендує: Запропонувати повторну відправку або повернення 100% коштів.',
      riskLevel: 'HIGH',
      status: 'incoming',
      date: '28.10.2026 18:30',
    },
  ]);

  // Функція автоматичного сканування магазину та аналізу скарг (як на інших екранах)
  const runAiSupportAnalysis = async () => {
    setIsLoading(true);
    try {
      // Виклик твого бекенд-ендпоїнта (заміни IP на свій актуальний або localhost/домен)
      const response = await fetch('http://10.0.2.2:5000/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: 'ai-store',
          token: 'test-token-ai',
          complaint: 'Перевірити останні скарги клієнтів з приводу пошкоджених товарів та затримок доставки.',
          order_info: { store_scan: true }
        }),
      });

      const data = await response.json();

      if (data.success && data.support_report) {
        const report = data.support_report;
        
        // Створюємо новий тікет на основі відповіді Агента 3
        const newTicket: SupportTicket = {
          id: `ticket-${Date.now()}`,
          orderNumber: '#2005',
          clientName: 'Олена Ковальчук',
          issueType: 'refund',
          message: 'Клієнтка скаржиться на затримку відправки та вимагає повернення коштів.',
          aiSuggestedSolution: report.ai_suggested_solution || 'ШІ рекомендує зв\'язатися з клієнтом.',
          riskLevel: report.risk_level || 'MEDIUM',
          status: 'incoming',
          date: new Date().toLocaleString(),
        };

        setTickets(prev => [newTicket, ...prev]);
        Alert.alert("Успіх", "ШІ успішно просканував магазин та оновив список претензій!");
      } else {
        Alert.alert("Помилка", data.error || "Не вдалося отримати дані від ШІ.");
      }
    } catch (error) {
      console.error("AI Support Error:", error);
      Alert.alert("Помилка мережі", "Не вдалося з'єднатися з бекендом підтримки.");
    } finally {
      setIsLoading(false);
    }
  };

  const moveTicket = (id: string, newStatus: 'incoming' | 'active' | 'archive' | 'rejected') => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTicket = (id: string) => {
    Alert.alert("Видалення", "Ви впевнені, що хочете остаточно видалити цей запис?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: () => setTickets(prev => prev.filter(t => t.id !== id)) }
    ]);
  };

  const openChatWithClient = (ticket: SupportTicket) => {
    navigation.navigate('AIChat', { 
      orderNumber: ticket.orderNumber, 
      clientName: ticket.clientName,
      initialMessage: ticket.message 
    });
  };

  const filteredTickets = tickets.filter(t => t.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      {/* Верхня панель */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>⚠️ Підтримка та повернення</Text>
          <Text style={styles.headerSub}>Управління претензіями клієнтів</Text>
        </View>

        {/* Кнопка запуску AI-аналізу скарг */}
        <TouchableOpacity 
          style={styles.aiScanButton} 
          onPress={runAiSupportAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.aiScanButtonText}>🤖 Сканувати</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Меню вкладок */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'incoming' && styles.activeTab]} onPress={() => setActiveTab('incoming')}>
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>Вхідні</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Активні</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'archive' && styles.activeTab]} onPress={() => setActiveTab('archive')}>
          <Text style={[styles.tabText, activeTab === 'archive' && styles.activeTabText]}>Архів</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'rejected' && styles.activeTab]} onPress={() => setActiveTab('rejected')}>
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>Відхилені</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>У цій категорії поки немає запитів</Text>
          </View>
        ) : (
          filteredTickets.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>Замовлення {item.orderNumber}</Text>
                {item.riskLevel && (
                  <View style={[styles.riskBadge, item.riskLevel === 'HIGH' ? styles.riskHigh : styles.riskLow]}>
                    <Text style={styles.riskText}>РИЗИК: {item.riskLevel}</Text>
                  </View>
                )}
                <Text style={styles.dateText}>{item.date}</Text>
              </View>

              <Text style={styles.clientInfo}>Клієнт: {item.clientName}</Text>

              <TouchableOpacity style={styles.chatLinkBtn} onPress={() => openChatWithClient(item)}>
                <Text style={styles.chatLinkText}>💬 Відкрити діалог з клієнтом</Text>
              </TouchableOpacity>

              <View style={styles.messageBox}>
                <Text style={styles.messageTitle}>Претензія:</Text>
                <Text style={styles.messageText}>"{item.message}"</Text>
              </View>

              <View style={styles.aiBox}>
                <Text style={styles.aiTitle}>🤖 Аналіз ШІ (Агент 3):</Text>
                <Text style={styles.aiText}>{item.aiSuggestedSolution}</Text>
              </View>

              <View style={styles.actionRow}>
                {item.status === 'incoming' && (
                  <>
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => moveTicket(item.id, 'active')}>
                      <Text style={styles.btnText}>В активні</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSuccess} onPress={() => moveTicket(item.id, 'archive')}>
                      <Text style={styles.btnText}>В архів</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnDanger} onPress={() => moveTicket(item.id, 'rejected')}>
                      <Text style={styles.btnText}>Відхилити</Text>
                    </TouchableOpacity>
                  </>
                )}

                {item.status === 'active' && (
                  <>
                    <TouchableOpacity style={styles.btnSuccess} onPress={() => moveTicket(item.id, 'archive')}>
                      <Text style={styles.btnText}>Вирішено (Архів)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnDanger} onPress={() => moveTicket(item.id, 'rejected')}>
                      <Text style={styles.btnText}>Відхилити</Text>
                    </TouchableOpacity>
                  </>
                )}

                {(item.status === 'archive' || item.status === 'rejected') && (
                  <TouchableOpacity style={styles.btnDelete} onPress={() => deleteTicket(item.id)}>
                    <Text style={styles.btnDeleteText}>🗑️ Видалити назавжди</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 10 },
  menuBtn: { padding: 8, marginRight: 8 },
  menuIcon: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 11, color: '#666', marginTop: 1 },
  aiScanButton: { backgroundColor: '#0052cc', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  aiScanButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea', paddingHorizontal: 8, elevation: 2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#0052cc' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#0052cc' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eef2f5', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#0052cc' },
  riskBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  riskHigh: { backgroundColor: '#ffebe6' },
  riskLow: { backgroundColor: '#e3fcef' },
  riskText: { fontSize: 9, fontWeight: 'bold', color: '#de350b' },
  dateText: { fontSize: 10, color: '#888' },
  clientInfo: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  chatLinkBtn: { backgroundColor: '#eef2ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#d0e1fd' },
  chatLinkText: { color: '#0052cc', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  messageBox: { backgroundColor: '#fafbfc', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#de350b', marginBottom: 10 },
  messageTitle: { fontSize: 12, fontWeight: 'bold', color: '#444' },
  messageText: { fontSize: 13, color: '#333', fontStyle: 'italic', marginTop: 2 },
  aiBox: { backgroundColor: '#f0f5ff', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#0052cc', marginBottom: 12 },
  aiTitle: { fontSize: 12, fontWeight: 'bold', color: '#0052cc' },
  aiText: { fontSize: 13, color: '#172b4d', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  btnPrimary: { flex: 1, backgroundColor: '#0052cc', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  btnSuccess: { flex: 1, backgroundColor: '#28a745', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  btnDanger: { flex: 1, backgroundColor: '#dc3545', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 11 },
  btnDelete: { flex: 1, backgroundColor: '#f8d7da', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#f5c6cb' },
  btnDeleteText: { color: '#721c24', fontWeight: '600', fontSize: 11 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 }
});