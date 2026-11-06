// src/screens/SupportScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';
import { GlassCard } from '../components/GlassCard';

interface SupportTicket {
  id: string;
  orderNumber: string;
  clientName: string;
  issueType: 'damaged' | 'refund' | 'wrong_item' | 'other';
  message: string;
  aiSuggestedSolution: string;
  riskLevel?: string;
  status: 'incoming' | 'archive' | 'rejected';
  date: string;
}

export default function SupportScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'incoming' | 'archive' | 'rejected'>('incoming');
  const [isLoading, setIsLoading] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'ticket-101',
      orderNumber: '#1001',
      clientName: 'Іван Петренко',
      issueType: 'damaged',
      message: 'Посилка прийшла пошкоджена, коробка зім\'ята, товар розбитий!',
      aiSuggestedSolution: 'Рекомендація: Запропонувати повторну відправку або повернення 100% коштів.',
      riskLevel: 'HIGH',
      status: 'incoming',
      date: '28.10.2026 18:30',
    },
  ]);

  const runAiSupportAnalysis = async () => {
    setIsLoading(true);
    try {
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
        
        const newTicket: SupportTicket = {
          id: `ticket-${Date.now()}`,
          orderNumber: '#2005',
          clientName: 'Олена Ковальчук',
          issueType: 'refund',
          message: 'Клієнтка скаржиться на затримку відправки та вимагає повернення коштів.',
          aiSuggestedSolution: report.ai_suggested_solution || 'Рекомендація зв\'язатися з клієнтом.',
          riskLevel: report.risk_level || 'MEDIUM',
          status: 'incoming',
          date: new Date().toLocaleString(),
        };

        setTickets(prev => [newTicket, ...prev]);
        Alert.alert("Успіх", "ШІ успішно просканував магазин та оновив список претензій.");
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

  const moveTicket = (id: string, newStatus: 'incoming' | 'archive' | 'rejected') => {
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <AuraHeader />

      <View style={styles.topBar}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Підтримка та повернення</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Управління претензіями клієнтів</Text>
        </View>

        <TouchableOpacity 
          style={[styles.aiScanButton, { backgroundColor: theme.primary }]} 
          onPress={runAiSupportAnalysis}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#070907" />
          ) : (
            <Text style={[styles.aiScanButtonText, { color: '#070907' }]}>Сканувати</Text>
          )}
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.tabGlassWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'incoming' && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
            onPress={() => setActiveTab('incoming')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'incoming' && { color: '#070907', fontWeight: '800' }]}>Вхідні</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'archive' && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
            onPress={() => setActiveTab('archive')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'archive' && { color: '#070907', fontWeight: '800' }]}>Архів</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'rejected' && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
            onPress={() => setActiveTab('rejected')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'rejected' && { color: '#070907', fontWeight: '800' }]}>Відхилені</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredTickets.length === 0 ? (
          <GlassCard style={styles.glassCardWrapper}>
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>У цій категорії поки немає запитів.</Text>
            </View>
          </GlassCard>
        ) : (
          filteredTickets.map((item) => (
            <GlassCard key={item.id} style={styles.glassCardWrapper}>
              <View style={styles.cardHeader}>
                <Text style={[styles.orderNumber, { color: theme.primary }]}>Замовлення {item.orderNumber}</Text>
                {item.riskLevel && (
                  <View style={[styles.riskBadge, item.riskLevel === 'HIGH' ? styles.riskHigh : styles.riskLow]}>
                    <Text style={styles.riskText}>РИЗИК: {item.riskLevel}</Text>
                  </View>
                )}
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>{item.date}</Text>
              </View>

              <Text style={[styles.clientInfo, { color: theme.textPrimary }]}>Клієнт: {item.clientName}</Text>

              <TouchableOpacity style={[styles.goToChatButton, { backgroundColor: theme.primary }]} onPress={() => openChatWithClient(item)} activeOpacity={0.85}>
                <Text style={[styles.goToChatButtonText, { color: '#070907' }]}>Перейти в чат з клієнтом</Text>
              </TouchableOpacity>

              <View style={[styles.messageBox, { backgroundColor: 'rgba(255,255,255,0.04)', borderLeftColor: '#ff3b30' }]}>
                <Text style={[styles.messageTitle, { color: theme.textPrimary }]}>Претензія:</Text>
                <Text style={[styles.messageText, { color: theme.textSecondary }]}>"{item.message}"</Text>
              </View>

              <View style={[styles.aiBox, { backgroundColor: 'rgba(0, 122, 255, 0.1)', borderLeftColor: theme.primary }]}>
                <Text style={[styles.aiTitle, { color: theme.primary }]}>Аналіз ШІ (Агент 3):</Text>
                <Text style={[styles.aiText, { color: theme.textPrimary }]}>{item.aiSuggestedSolution}</Text>
              </View>

              <View style={styles.actionRow}>
                {item.status === 'incoming' && (
                  <>
                    <TouchableOpacity style={[styles.btnSuccess, { backgroundColor: '#34c759' }]} onPress={() => moveTicket(item.id, 'archive')} activeOpacity={0.85}>
                      <Text style={styles.btnText}>В архів (Вирішено)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnDanger, { backgroundColor: '#ff3b30' }]} onPress={() => moveTicket(item.id, 'rejected')} activeOpacity={0.85}>
                      <Text style={styles.btnText}>Відхилити</Text>
                    </TouchableOpacity>
                  </>
                )}

                {(item.status === 'archive' || item.status === 'rejected') && (
                  <TouchableOpacity style={[styles.btnDelete, { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: 'rgba(255, 59, 48, 0.3)' }]} onPress={() => deleteTicket(item.id)} activeOpacity={0.85}>
                    <Text style={styles.btnDeleteText}>Видалити назавжди</Text>
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, zIndex: 10 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  headerSub: { fontSize: 11 },
  aiScanButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  aiScanButtonText: { fontSize: 11, fontWeight: '800' },
  tabGlassWrapper: { marginHorizontal: 12, marginBottom: 12 },
  tabContainer: { flexDirection: 'row', gap: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600' },
  scrollContent: { padding: 12, paddingBottom: 90, zIndex: 1 },
  glassCardWrapper: { marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 15, fontWeight: 'bold' },
  riskBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  riskHigh: { backgroundColor: 'rgba(255, 59, 48, 0.2)' },
  riskLow: { backgroundColor: 'rgba(52, 199, 89, 0.2)' },
  riskText: { fontSize: 9, fontWeight: 'bold', color: '#ff3b30' },
  dateText: { fontSize: 10 },
  clientInfo: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  goToChatButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 12, alignItems: 'center' },
  goToChatButtonText: { fontWeight: '700', fontSize: 13 },
  messageBox: { padding: 12, borderRadius: 10, borderLeftWidth: 3, marginBottom: 10 },
  messageTitle: { fontSize: 12, fontWeight: 'bold' },
  messageText: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  aiBox: { padding: 12, borderRadius: 10, borderLeftWidth: 3, marginBottom: 12 },
  aiTitle: { fontSize: 12, fontWeight: 'bold' },
  aiText: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 8 },
  btnSuccess: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnDanger: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#070907', fontWeight: '700', fontSize: 12 },
  btnDelete: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  btnDeleteText: { fontWeight: '700', fontSize: 12, color: '#ff3b30' },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500' }
});