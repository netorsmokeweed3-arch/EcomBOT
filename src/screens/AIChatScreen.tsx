import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Вітаю! Я ШІ-консультант магазину. Допоможу підібрати товар, розповім про наявність (наприклад, про наші футболки) та оформлю замовлення. Чим можу допомогти?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Функція відправки повідомлення на наш Flask-бекенд (з урахуванням емулятора Android 10.0.2.2)
  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMsgText = inputText.trim();
    setInputText('');

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Збираємо історію діалогу для контексту ШІ
      const historyString = messages
        .map((m) => `${m.sender === 'user' ? 'Покупець' : 'ШІ'}: ${m.text}`)
        .join('\n');

      const response = await fetch('http://10.0.2.2:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: 'ai-store',
          token: 'ai_test_token_123',
          message: userMsgText,
          history: historyString,
        }),
      });

      const data = await response.json();

      if (data.success && data.reply) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Помилка відповіді сервера');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '⚠️ Не вдалося зв’язатися з бекендом. Переконайся, що сервер запущені та працює!',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Список повідомлень */}
      <ScrollView contentContainerStyle={styles.chatContainer}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.sender === 'user' ? styles.userText : styles.aiText,
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>ШІ друкує відповідь...</Text>
          </View>
        )}
      </ScrollView>

      {/* Панель введення тексту */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Напишіть повідомлення (напр. Хочу чорну футболку)..."
          placeholderTextColor="#888"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Надіслати</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4ED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#333333',
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E4ED',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333333',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});