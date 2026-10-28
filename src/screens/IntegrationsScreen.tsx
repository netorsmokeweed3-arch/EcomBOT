import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
export const RENDER_SERVER_URL = 'https://ecombot-2.onrender.com';

interface ShopIntegration {
  id: string;
  name: string;
  token: string;
}

export default function IntegrationsScreen() {
  const [shopName, setShopName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [shops, setShops] = useState<ShopIntegration[]>([]);
  
  // Стан для видимості токена в полі введення при наборі
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Об'єкт для відстеження видимості токенів у списку збережених магазинів: { [id]: true/false }
  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = () => {
    try {
      const savedShopsJson = storage.getString('saved_shops');
      if (savedShopsJson) {
        setShops(JSON.parse(savedShopsJson));
      }
    } catch (error) {
      console.log('Помилка завантаження магазинів', error);
    }
  };

  const handleSave = () => {
    if (!shopName.trim() || !apiKey.trim()) {
      Alert.alert('Помилка ❌', 'Будь ласка, введіть назву магазину та API-токен.');
      return;
    }

    try {
      const newShop: ShopIntegration = {
        id: Date.now().toString(),
        name: shopName.trim(),
        token: apiKey.trim(),
      };

      const updatedShops = [...shops, newShop];
      storage.set('saved_shops', JSON.stringify(updatedShops));
      storage.set('server_url', RENDER_SERVER_URL);

      setShops(updatedShops);
      setShopName('');
      setApiKey('');
      setIsApiKeyVisible(false);
      Alert.alert('Успіх ✅', 'Магазин успішно інтегровано!');
    } catch (error) {
      Alert.alert('Помилка ❌', 'Не вдалося зберегти інтеграцію.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Видалення',
      'Ви дійсно хочете видалити цей магазин?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => {
            const updatedShops = shops.filter((shop) => shop.id !== id);
            storage.set('saved_shops', JSON.stringify(updatedShops));
            setShops(updatedShops);
          },
        },
      ]
    );
  };

  const toggleShowToken = (id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Підключення магазинів</Text>
        <Text style={styles.subtitle}>Додайте назву та API-токен вашого маркетплейса для синхронізації через ШІ.</Text>

        <Text style={styles.label}>Назва магазину</Text>
        <TextInput
          style={styles.input}
          placeholder="Наприклад: Prom Одеса"
          placeholderTextColor="#8e8e93"
          value={shopName}
          onChangeText={setShopName}
        />

        <Text style={styles.label}>API-токен (Ключ доступу)</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Введіть ваш токен..."
            placeholderTextColor="#8e8e93"
            secureTextEntry={!isApiKeyVisible}
            value={apiKey}
            onChangeText={setApiKey}
          />
          <TouchableOpacity 
            style={styles.eyeButton} 
            onPress={() => setIsApiKeyVisible(!isApiKeyVisible)}
          >
            <Text style={styles.eyeButtonText}>
              {isApiKeyVisible ? 'Сховати' : 'Показати'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Зберегти інтеграцію</Text>
        </TouchableOpacity>

        {/* Список підключених магазинів */}
        {shops.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Підключені магазини ({shops.length})</Text>
            {shops.map((shop) => {
              const isVisible = showTokens[shop.id];
              const maskedToken = '•'.repeat(Math.min(shop.token.length, 20));

              return (
                <View key={shop.id} style={styles.shopCard}>
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{shop.name}</Text>
                    <Text style={styles.shopToken}>
                      Токен: {isVisible ? shop.token : maskedToken}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleShowToken(shop.id)}
                    >
                      <Text style={styles.actionButtonText}>
                        {isVisible ? 'Сховати' : 'Показати'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(shop.id)}
                    >
                      <Text style={styles.deleteButtonText}>Видалити</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8e8e93', marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#3a3a3c', marginBottom: 6 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1c1c1e', marginBottom: 16 },
  
  // Стилі для поля введення токена з кнопкою перемикання
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, marginBottom: 16 },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1c1c1e' },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 10 },
  eyeButtonText: { fontSize: 14, fontWeight: '600', color: '#007aff' },

  saveButton: { backgroundColor: '#007aff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 24, shadowColor: '#007aff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  listContainer: { marginTop: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 12 },
  shopCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e5ea', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  shopInfo: { marginBottom: 12 },
  shopName: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 4 },
  shopToken: { fontSize: 14, color: '#8e8e93', fontFamily: 'monospace' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionButton: { backgroundColor: '#f2f2f7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#007aff' },
  deleteButton: { backgroundColor: '#ffe5e5' },
  deleteButtonText: { fontSize: 13, fontWeight: '600', color: '#ff3b30' },
});