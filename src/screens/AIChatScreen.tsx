import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';

interface ChatThread {
  id: string;
  customerName: string;
  shopName: string; // Напр. Prom, Rozetka, OLX, Shopify
  orderInfo: string;
  lastMessage: string;
  time: string;
  status: 'active' | 'sos' | 'archive'; // вкладки: активні, ручний режим/SOS, архів
  isManualMode: boolean; // чи перехоплено управління людиною
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
      { sender: 'ai', text: 'Вітаю! Перепрошуємо за ситуацію. ШІ рекомендує оформити заміну або повернення коштів.', time: '12:06' },
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
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'active' | 'sos' | 'archive'>('active');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [inputText, setInputText] = useState('');

  // Фільтрація чатів за вкладками
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
    <View style={[styles.container, { backgroundColor: theme.bgDark }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Розкішний фоновий градієнт із променями */}
      <AuraHeader />

      {selectedChat ? (
        /* ЕКРАН ДЕТАЛЬНОГО ДІАЛОГУ З КЛІЄНТОМ */
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, zIndex: 1 }}>
          <View style={[styles.chatHeader, { backgroundColor: 'rgba(18, 22, 32, 0.85)', borderColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={() => setSelectedChatId(null)} style={styles.backButton} activeOpacity={0.7}>
              <Text style={[styles.backButtonText, { color: theme.primary }]}>← Назад</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.chatHeaderTitle, { color: theme.textPrimary }]} numberOfLines={1}>{selectedChat.customerName}</Text>
              <Text style={[styles.chatHeaderSub, { color: theme.textSecondary }]} numberOfLines={1}>{selectedChat.shopName} • {selectedChat.orderInfo}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.modeToggleBtn, selectedChat.isManualMode ? styles.modeManual : styles.modeAI]}
              onPress={() => toggleManualMode(selectedChat.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeToggleText, { color: selectedChat.isManualMode ? '#ff3b30' : theme.primary }]}>
                {selectedChat.isManualMode ? '👤 Ручний' : '🤖 ШІ активний'}
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
                  isClient ? [styles.clientBubble, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }] : 
                  isManager ? [styles.managerBubble, { backgroundColor: theme.primary }] : 
                  [styles.aiBubble, { backgroundColor: 'rgba(0, 122, 255, 0.2)', borderColor: theme.primary }]
                ]}>
                  <Text style={[styles.messageText, { color: isClient ? theme.textPrimary : '#fff' }]}>{item.text}</Text>
                  <Text style={[styles.messageTime, { color: isClient ? theme.textSecondary : 'rgba(255,255,255,0.7)' }]}>{item.time}</Text>
                </View>
              );
            }}
          />

          <View style={[styles.inputContainer, { backgroundColor: 'rgba(18, 22, 32, 0.9)', borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
              placeholder="Написати повідомлення клієнту..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={handleSendMessage} activeOpacity={0.8}>
              <Text style={[styles.sendButtonText, { color: theme.bgDark }]}>Надіслати</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* ГОЛОВНИЙ ЕКРАН: СПИСОК ЧАТІВ ТА ВКЛАДКИ */
        <View style={{ flex: 1, zIndex: 1 }}>
          {/* Наш преміальний TopBar */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }]}
              onPress={() => navigation.openDrawer()}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuIcon, { color: theme.textPrimary }]}>☰</Text>
            </TouchableOpacity>
            <View>
              <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>💬 Клієнтські чати та ШІ</Text>
              <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Мультиканальна підтримка покупців</Text>
            </View>
          </View>

          <View style={[styles.tabsRow, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'active' && { backgroundColor: theme.primary }]} 
              onPress={() => setActiveTab('active')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'active' && { color: theme.bgDark, fontWeight: '800' }]}>Активні (ШІ)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'sos' && { backgroundColor: '#ff3b30' }]} 
              onPress={() => setActiveTab('sos')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'sos' && { color: '#fff', fontWeight: '800' }]}>🚨 SOS / Ручний</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'archive' && { backgroundColor: theme.primary }]} 
              onPress={() => setActiveTab('archive')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'archive' && { color: theme.bgDark, fontWeight: '800' }]}>Архів</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredChats}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>У цій вкладці поки немає діалогів 📭</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.threadCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]} 
                onPress={() => setSelectedChatId(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.threadHeaderRow}>
                  <Text style={[styles.threadName, { color: theme.textPrimary }]} numberOfLines={1}>{item.customerName}</Text>
                  <View style={[styles.shopBadge, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }]}>
                    <Text style={[styles.shopBadgeText, { color: theme.primary }]}>{item.shopName}</Text>
                  </View>
                </View>
                <Text style={[styles.threadOrder, { color: theme.primary }]} numberOfLines={1}>{item.orderInfo}</Text>
                <Text style={[styles.threadLastMsg, { color: theme.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
                <View style={[styles.threadFooter, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={[styles.threadTime, { color: theme.textSecondary }]}>{item.time}</Text>
                  <Text style={[styles.threadStatusText, item.isManualMode ? { color: '#ff3b30' } : { color: '#34c759' }]}>
                    {item.isManualMode ? '👤 Ручний режим' : '🤖 ШІ-агент'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
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

  tabsRow: { 
    flexDirection: 'row', 
    marginHorizontal: 12, 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 8, 
    borderWidth: 1, 
    gap: 4 
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 12, fontWeight: '600' },
  
  listContainer: { padding: 12, paddingBottom: 40 },
  emptyBox: { padding: 30, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginTop: 10 },
  emptyText: { fontSize: 13, fontWeight: '500' },
  
  threadCard: { 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10, 
    borderWidth: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 3 
  },
  threadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  threadName: { fontSize: 15, fontWeight: '700' },
  shopBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  shopBadgeText: { fontSize: 10, fontWeight: '700' },
  threadOrder: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  threadLastMsg: { fontSize: 13, marginBottom: 8 },
  threadFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 8 },
  threadTime: { fontSize: 11 },
  threadStatusText: { fontSize: 11, fontWeight: '700' },

  chatHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 45, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    zIndex: 10 
  },
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

  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, gap: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13 },
  sendButton: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  sendButtonText: { fontWeight: '800', fontSize: 13 },
});