// src/screens/AIChatScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';

interface ChatThread {
  id: string;
  customerName: string;
  shopName: string; // Напр. Prom, Rozetka, OLX, Shopify
  orderInfo: string;
  lastMessage: string;
  time: string;
  status: 'active' | 'sos' | 'archive';
  isManualMode: boolean;
  messages: { sender: 'client' | 'ai' | 'manager'; text: string; time: string }[];
}

const INITIAL_CHATS: ChatThread[] = [
  {
    id: '1',
    customerName: 'Іван Петренко',
    shopName: 'Prom.ua',
    orderInfo: 'Замовлення #1001 (Футболка бавовняна)',
    lastMessage: 'Посилка прийшла пошкоджена, коробка зім\'ята!',
    time: '12:10',
    status: 'sos',
    isManualMode: true,
    messages: [
      { sender: 'client', text: 'Доброго дня, забрав замовлення, але коробка зім\'ята і товар пошкоджений!', time: '12:05' },
      { sender: 'ai', text: 'Вітаю! Перепрошуємо за ситуацію. Рекомендуємо оформити заміну або повернення коштів.', time: '12:06' },
      { sender: 'client', text: 'Посилка прийшла пошкоджена, коробка зім\'ята!', time: '12:10' }
    ]
  },
  {
    id: '2',
    customerName: 'Марія Ковальчук',
    shopName: 'Rozetka',
    orderInfo: 'Замовлення #1005 (Кросівки)',
    lastMessage: 'Дякую, все супер, розмір підійшов!',
    time: 'Вчора',
    status: 'archive',
    isManualMode: false,
    messages: [
      { sender: 'client', text: 'Добрий день, чи є 38 розмір?', time: 'Вчора 14:00' },
      { sender: 'ai', text: 'Вітаю! Так, 38 розмір є в наявності, готовий відправити сьогодні.', time: 'Вчора 14:02' },
      { sender: 'client', text: 'Дякую, все супер, розмір підійшов!', time: 'Вчора 16:30' }
    ]
  },
  {
    id: '3',
    customerName: 'Олександр Бойко',
    shopName: 'Shopify',
    orderInfo: 'Замовлення #1012 (Рюкзак)',
    lastMessage: 'Коли буде відправка?',
    time: '11:45',
    status: 'active',
    isManualMode: false,
    messages: [
      { sender: 'client', text: 'Коли буде відправка?', time: '11:45' },
      { sender: 'ai', text: 'Вітаю! Ваше замовлення обробляється і буде передано на пошту сьогодні до 17:00.', time: '11:46' }
    ]
  }
];

export default function AIChatScreen() {
  const { theme } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'active' | 'sos' | 'archive'>('active');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [inputText, setInputText] = useState('');

  const filteredChats = chats.filter(c => c.status === activeTab);
  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChatId) return;

    const newMessage = {
      sender: 'manager' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          lastMessage: newMessage.text,
          time: newMessage.time,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));

    setInputText('');
  };

  const toggleManualMode = (chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const newMode = !chat.isManualMode;
        return {
          ...chat,
          isManualMode: newMode,
          status: newMode ? 'sos' : 'active'
        };
      }
      return chat;
    }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {selectedChat ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, zIndex: 1 }}>
          <View style={[styles.chatHeader, { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
            <TouchableOpacity onPress={() => setSelectedChatId(null)} style={styles.backButton} activeOpacity={0.7}>
              <Text style={[styles.backButtonText, { color: theme.primary }]}>← Назад</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.chatHeaderTitle, { color: theme.textPrimary }]} numberOfLines={1}>{selectedChat.customerName}</Text>
              <Text style={[styles.chatHeaderSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {selectedChat.shopName} • {selectedChat.orderInfo}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.modeToggleBtn, selectedChat.isManualMode ? styles.modeManual : styles.modeAI]}
              onPress={() => toggleManualMode(selectedChat.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeToggleText, { color: selectedChat.isManualMode ? '#ff3b30' : theme.primary }]}>
                {selectedChat.isManualMode ? 'Ручний режим' : 'ШІ активний'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={selectedChat.messages}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isClient = item.sender === 'client';
              const isManager = item.sender === 'manager';
              return (
                <View style={[
                  styles.messageBubble, 
                  isClient ? [styles.clientBubble, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }] : 
                  isManager ? [styles.managerBubble, { backgroundColor: theme.primary }] : 
                  [styles.aiBubble, { backgroundColor: 'rgba(0, 122, 255, 0.15)', borderColor: theme.primary }]
                ]}>
                  <Text style={[styles.messageText, { color: isClient ? theme.textPrimary : isManager ? '#070907' : theme.textPrimary }]}>{item.text}</Text>
                  <Text style={[styles.messageTime, { color: isClient ? theme.textSecondary : isManager ? 'rgba(7,9,7,0.7)' : theme.textSecondary }]}>{item.time}</Text>
                </View>
              );
            }}
          />

          <View style={[styles.inputContainer, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.08)', color: theme.textPrimary }]}
              placeholder="Написати повідомлення клієнту..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={handleSendMessage} activeOpacity={0.85}>
              <Text style={[styles.sendButtonText, { color: '#070907' }]}>Надіслати</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, zIndex: 1 }}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Клієнтські чати та ШІ</Text>
              <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Мультиканальна підтримка покупців</Text>
            </View>
          </View>

          <GlassCard style={styles.tabGlassWrapper}>
            <View style={styles.tabsRow}>
              <TouchableOpacity style={[styles.tab, activeTab === 'active' && { backgroundColor: theme.primary }]} onPress={() => setActiveTab('active')} activeOpacity={0.85}>
                <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'active' && { color: '#070907', fontWeight: '800' }]}>Активні</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'sos' && { backgroundColor: '#ff3b30' }]} onPress={() => setActiveTab('sos')} activeOpacity={0.85}>
                <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'sos' && { color: '#fff', fontWeight: '800' }]}>SOS / Ручний</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'archive' && { backgroundColor: theme.primary }]} onPress={() => setActiveTab('archive')} activeOpacity={0.85}>
                <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'archive' && { color: '#070907', fontWeight: '800' }]}>Архів</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <FlatList
            data={filteredChats}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <GlassCard style={styles.glassCardWrapper}>
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>У цій вкладці поки немає діалогів.</Text>
                </View>
              </GlassCard>
            }
            renderItem={({ item }) => (
              <GlassCard style={styles.glassCardWrapper}>
                <TouchableOpacity onPress={() => setSelectedChatId(item.id)} activeOpacity={0.85}>
                  <View style={styles.threadHeaderRow}>
                    <Text style={[styles.threadName, { color: theme.textPrimary }]} numberOfLines={1}>{item.customerName}</Text>
                    <View style={[styles.shopBadge, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                      <Text style={[styles.shopBadgeText, { color: theme.primary }]}>{item.shopName}</Text>
                    </View>
                  </View>
                  <Text style={[styles.threadOrder, { color: theme.primary }]} numberOfLines={1}>{item.orderInfo}</Text>
                  <Text style={[styles.threadLastMsg, { color: theme.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
                  <View style={[styles.threadFooter, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                    <Text style={[styles.threadTime, { color: theme.textSecondary }]}>{item.time}</Text>
                    <Text style={[styles.threadStatusText, item.isManualMode ? { color: '#ff3b30' } : { color: '#34c759' }]}>
                      {item.isManualMode ? 'Ручний режим' : 'ШІ-агент'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </GlassCard>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, zIndex: 10 },
  topBarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  topBarSub: { fontSize: 11 },
  tabGlassWrapper: { marginHorizontal: 12, marginBottom: 8 },
  tabsRow: { flexDirection: 'row', gap: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 12, fontWeight: '600' },
  listContainer: { padding: 12, paddingBottom: 90 },
  glassCardWrapper: { marginBottom: 10 },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, fontWeight: '500' },
  threadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  threadName: { fontSize: 15, fontWeight: '700' },
  shopBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  shopBadgeText: { fontSize: 10, fontWeight: '700' },
  threadOrder: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  threadLastMsg: { fontSize: 13, marginBottom: 8 },
  threadFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 8 },
  threadTime: { fontSize: 11 },
  threadStatusText: { fontSize: 11, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, zIndex: 10 },
  backButton: { paddingRight: 8 },
  backButtonText: { fontSize: 14, fontWeight: '700' },
  chatHeaderTitle: { fontSize: 15, fontWeight: '700' },
  chatHeaderSub: { fontSize: 11 },
  modeToggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modeAI: { backgroundColor: 'rgba(52, 199, 89, 0.15)' },
  modeManual: { backgroundColor: 'rgba(255, 59, 48, 0.15)' },
  modeToggleText: { fontSize: 11, fontWeight: '700' },
  messagesList: { padding: 12, gap: 8 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 14, marginBottom: 4, borderWidth: 1 },
  clientBubble: { alignSelf: 'flex-start' },
  aiBubble: { alignSelf: 'flex-start' },
  managerBubble: { alignSelf: 'flex-end', borderColor: 'transparent' },
  messageText: { fontSize: 13, marginBottom: 4, lineHeight: 18 },
  messageTime: { fontSize: 9, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, gap: 8, alignItems: 'center', paddingBottom: 24 },
  input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13 },
  sendButton: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, minHeight: 46 },
  sendButtonText: { fontWeight: '800', fontSize: 13 },
});