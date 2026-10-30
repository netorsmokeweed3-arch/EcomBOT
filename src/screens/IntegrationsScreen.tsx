import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
export const RENDER_SERVER_URL = 'https://ecombot-2.onrender.com';

const STORAGE_KEYS = {
  SAVED_SHOPS: 'saved_shops',
  SERVER_URL: 'server_url',
} as const;

interface ShopIntegration {
  id: string;
  name: string;
  token: string;
}

interface ShopCardProps {
  shop: ShopIntegration;
  isVisible: boolean;
  onToggleToken: (id: string) => void;
  onDelete: (id: string) => void;
}

// Повністю оптимізована мемоізована картка магазину
const ShopCard = memo(({ shop, isVisible, onToggleToken, onDelete }: ShopCardProps) => {
  const maskedToken = useMemo(() => {
    return '•'.repeat(Math.min(shop.token.length, 20));
  }, [shop.token]);

  const handlePressToggle = useCallback(() => {
    onToggleToken(shop.id);
  }, [onToggleToken, shop.id]);

  const handlePressDelete = useCallback(() => {
    onDelete(shop.id);
  }, [onDelete, shop.id]);

  return (
    <View style={styles.shopCard}>
      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
        <Text style={styles.shopToken} numberOfLines={1}>
          Токен: {isVisible ? shop.token : maskedToken}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePressToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>
            {isVisible ? 'Сховати' : 'Показати'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handlePressDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Видалити</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

ShopCard.displayName = 'ShopCard';

export default function IntegrationsScreen() {
  const [shopName, setShopName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [shops, setShops] = useState<ShopIntegration[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const loadShops = useCallback(() => {
    try {
      const savedShopsJson = storage.getString(STORAGE_KEYS.SAVED_SHOPS);
      if (savedShopsJson) {
        const parsed = JSON.parse(savedShopsJson);
        if (Array.isArray(parsed)) {
          setShops(parsed);
        }
      }
    } catch (error) {
      console.log('Помилка завантаження магазинів', error);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleSave = useCallback(() => {
    const trimmedName = shopName.trim();
    const trimmedToken = apiKey.trim();

    if (!trimmedName || !trimmedToken) {
      Alert.alert('Помилка ❌', 'Будь ласка, введіть назву магазину та API-токен.');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const newShop: ShopIntegration = {
        id: Date.now().toString(),
        name: trimmedName,
        token: trimmedToken,
      };

      setShops((prevShops) => {
        const updatedShops = [...prevShops, newShop];
        storage.set(STORAGE_KEYS.SAVED_SHOPS, JSON.stringify(updatedShops));
        return updatedShops;
      });

      storage.set(STORAGE_KEYS.SERVER_URL, RENDER_SERVER_URL);

      setShopName('');
      setApiKey('');
      setIsApiKeyVisible(false);
      Alert.alert('Успіх ✅', 'Магазин успішно інтегровано!');
    } catch (error) {
      Alert.alert('Помилка ❌', 'Не вдалося зберегти інтеграцію.');
    } finally {
      setIsSaving(false);
    }
  }, [shopName, apiKey, isSaving]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'Видалення',
      'Ви дійсно хочете видалити цей магазин?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => {
            setShops((prevShops) => {
              const updatedShops = prevShops.filter((shop) => shop.id !== id);
              storage.set(STORAGE_KEYS.SAVED_SHOPS, JSON.stringify(updatedShops));
              return updatedShops;
            });
          },
        },
      ]
    );
  }, []);

  const toggleShowToken = useCallback((id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleApiKeyVisibility = useCallback(() => {
    setIsApiKeyVisible((prev) => !prev);
  }, []);

  const renderedShopsList = useMemo(() => {
    if (shops.length === 0) return null;

    return (
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Підключені магазини ({shops.length})</Text>
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            isVisible={!!showTokens[shop.id]}
            onToggleToken={toggleShowToken}
            onDelete={handleDelete}
          />
        ))}
      </View>
    );
  }, [shops, showTokens, toggleShowToken, handleDelete]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Підключення магазинів</Text>
        <Text style={styles.subtitle}>Додайте назву та API-токен вашого маркетплейса для синхронізації через ШІ.</Text>

        <Text style={styles.label}>Назва магазину</Text>
        <TextInput
          style={styles.input}
          placeholder="Наприклад: my-store або my-store.myshopify.com"
          placeholderTextColor="#8e8e93"
          value={shopName}
          onChangeText={setShopName}
          autoCapitalize="none"
          autoCorrect={false}
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
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.eyeButton} 
            onPress={toggleApiKeyVisibility}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeButtonText}>
              {isApiKeyVisible ? 'Сховати' : 'Показати'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Зберегти інтеграцію</Text>
          )}
        </TouchableOpacity>

        {renderedShopsList}
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
  
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, marginBottom: 16 },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1c1c1e' },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 10 },
  eyeButtonText: { fontSize: 14, fontWeight: '600', color: '#007aff' },

  saveButton: { backgroundColor: '#007aff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 24, shadowColor: '#007aff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  saveButtonDisabled: { opacity: 0.7 },
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