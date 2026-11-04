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
  ActivityIndicator,
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createMMKV } from 'react-native-mmkv';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';

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

// Оптимізована мемоізована картка магазину у стилі темного скла
const ShopCard = memo(({ shop, isVisible, onToggleToken, onDelete }: ShopCardProps) => {
  const { theme } = useAppTheme();

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
    <View style={[styles.shopCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
      <View style={styles.shopInfo}>
        <Text style={[styles.shopName, { color: theme.textPrimary }]} numberOfLines={1}>{shop.name}</Text>
        <Text style={[styles.shopToken, { color: theme.textSecondary }]} numberOfLines={1}>
          Токен: {isVisible ? shop.token : maskedToken}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }]}
          onPress={handlePressToggle}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>
            {isVisible ? 'Сховати' : 'Показати'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: 'rgba(255, 59, 48, 0.3)' }]}
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
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

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
        <Text style={[styles.listTitle, { color: theme.textPrimary }]}>Підключені магазини ({shops.length})</Text>
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
  }, [shops, showTokens, toggleShowToken, handleDelete, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Розкішний фоновий градієнт із променями */}
      <AuraHeader />

      {/* Наш власний преміальний TopBar із кнопкою меню ☰ */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }]}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: theme.textPrimary }]}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>🔗 Інтеграції та Магазини</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Синхронізація маркетплейсів через ШІ</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Підключення магазину</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Введіть назву та API-токен вашої платформи для безперебійного зв'язку з агентами.</Text>

          <Text style={[styles.label, { color: theme.textPrimary }]}>Назва магазину</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            placeholder="Наприклад: my-store або my-store.myshopify.com"
            placeholderTextColor={theme.textSecondary}
            value={shopName}
            onChangeText={setShopName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: theme.textPrimary }]}>API-токен (Ключ доступу)</Text>
          <View style={[styles.passwordContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.textPrimary }]}
              placeholder="Введіть ваш токен..."
              placeholderTextColor={theme.textSecondary}
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
              <Text style={[styles.eyeButtonText, { color: theme.primary }]}>
                {isApiKeyVisible ? 'Сховати' : 'Показати'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.primary }, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.bgDark} size="small" />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.bgDark }]}>Зберегти інтеграцію</Text>
            )}
          </TouchableOpacity>
        </View>

        {renderedShopsList}
      </ScrollView>
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

  content: { padding: 12, paddingBottom: 40, zIndex: 1 },
  
  formCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14 },
  
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 18 },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 10 },
  eyeButtonText: { fontSize: 13, fontWeight: '700' },

  saveButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 15, fontWeight: '800' },
  
  listContainer: { marginTop: 4 },
  listTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, marginLeft: 4 },
  
  shopCard: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  shopInfo: { marginBottom: 10 },
  shopName: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  shopToken: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionButtonText: { fontSize: 12, fontWeight: '700' },
  deleteButton: { borderWidth: 1 },
  deleteButtonText: { fontSize: 12, fontWeight: '700', color: '#ff3b30' },
});