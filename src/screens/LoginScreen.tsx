// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../services/AuthContext';

const API_BASE_URL = 'https://ecombot-2.onrender.com';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Alert.alert('Введіть email', 'Вкажіть адресу електронної пошти.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-code`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();
      if (!response.ok || data?.success === false) {
        Alert.alert('Помилка', data?.detail || data?.error || 'Не вдалося надіслати код.');
        return;
      }

      setCodeSent(true);
      Alert.alert('Код надіслано', 'Перевірте пошту та введіть 4-значний код.');
    } catch {
      Alert.alert('Помилка з’єднання', 'Не вдалося підключитися до сервера.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const cleanEmail = email.trim();
    const cleanCode = code.trim();
    if (cleanCode.length !== 4) {
      Alert.alert('Невірний код', 'Введіть 4-значний код з email.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });

      const data = await response.json();
      const token = data?.access_token || data?.token;

      if (!response.ok || data?.success === false || !token) {
        Alert.alert('Помилка входу', data?.detail || data?.error || 'Невірний код або термін дії вийшов.');
        return;
      }

      const userData = {
        id: String(data.user?.id ?? ''),
        email: String(data.user?.email ?? cleanEmail),
      };

      await login(token, userData);
    } catch {
      Alert.alert('Помилка з’єднання', 'Не вдалося підключитися до сервера.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вхід в акаунт</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} editable={!loading} />

      {!codeSent ? (
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendCode} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Надіслати пароль</Text>}
        </TouchableOpacity>
      ) : (
        <>
          <TextInput style={[styles.input, styles.codeInput]} placeholder="0000" placeholderTextColor="#888" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} editable={!loading} />
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyCode} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Увійти</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={handleSendCode} disabled={loading}>
            <Text style={styles.linkText}>Надіслати код ще раз</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#111318' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#1c2029', color: '#fff', borderWidth: 1, borderColor: '#2e3545', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15 },
  codeInput: { textAlign: 'center', letterSpacing: 10, fontSize: 20, fontWeight: '700' },
  button: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { marginTop: 14, alignItems: 'center' },
  linkText: { color: '#9ca3af', fontSize: 14 },
});