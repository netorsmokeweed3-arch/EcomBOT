// src/screens/IntegrationsScreen.tsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StatusBar, 
  ScrollView, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';
import { ShopIntegration } from '../types/shop';

const storage = createMMKV();
export const RENDER_SERVER_URL = 'https://ecombot-2.onrender.com';

const STORAGE_KEYS = {
  SAVED_SHOPS: 'saved_shops',
  SERVER_URL: 'server_url',
} as const;

interface ShopCardProps {
  shop: ShopIntegration;
  isVisible: boolean;
  onToggleToken: (id: string) => void;
  onDelete: (id: string) => void;
}

const ShopCard = memo(({ shop, isVisible, onToggleToken, onDelete }: ShopCardProps) => {
  const { theme } = useAppTheme();

  const credentialDisplay = useMemo(() => {
    const secret = shop.consumer_secret || shop.token || '';
    return isVisible ? secret : '•'.repeat(Math.min(secret.length, 20));
  }, [shop.consumer_secret, shop.token, isVisible]);

  return (
    <View style={[styles.shopCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
      <View style={styles.shopInfo}>
        <Text style={[styles.shopName, { color: theme.textPrimary }]} numberOfLines={1}>
          {shop.name} {shop.platform ? `(${shop.platform})` : ''}
        </Text>
        <Text style={[styles.shopToken, { color: theme.textSecondary }]} numberOfLines={1}>
          Ключ/Токен: {credentialDisplay}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.cardBorder }]}
          onPress={() => onToggleToken(shop.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>
            {isVisible ? 'Сховати' : 'Показати'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: 'rgba(255, 59, 48, 0.3)' }]}
          onPress={() => onDelete(shop.id)}
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

  const [shopName, setShopName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
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

  const isWooCommerce = shopName.includes('localsite') || shopName.includes('wp') || consumerSecret.trim().length > 0;

  const handleSave = useCallback(() => {
    const trimmedName = shopName.trim();
    const trimmedKey = apiKey.trim();
    const trimmedSecret = consumerSecret.trim();

    if (!trimmedName || !trimmedKey) {
      Alert.alert('Помилка ❌', 'Будь ласка, введіть назву магазину та основний ключ/токен.');
      return;
    }

    if (isWooCommerce && !trimmedSecret) {
      Alert.alert('Помилка ❌', 'Для WooCommerce обов’язково потрібен Consumer Secret.');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const platform = isWooCommerce ? 'woocommerce' : 'shopify';
      
      const newShop: ShopIntegration = {
        id: Date.now().toString(),
        name: trimmedName,
        platform: platform,
        token: platform === 'shopify' ? trimmedKey : '',
        consumer_key: platform === 'woocommerce' ? trimmedKey : undefined,
        consumer_secret: platform === 'woocommerce' ? trimmedSecret : undefined,
      };

      setShops((prevShops) => {
        const updatedShops = [...prevShops, newShop];
        storage.set(STORAGE_KEYS.SAVED_SHOPS, JSON.stringify(updatedShops));
        return updatedShops;
      });

      storage.set(STORAGE_KEYS.SERVER_URL, RENDER_SERVER_URL);

      setShopName('');
      setApiKey('');
      setConsumerSecret('');
      setIsApiKeyVisible(false);
      Alert.alert('Успіх ✅', `Магазин (${platform}) успішно інтегровано!`);
    } catch (error) {
      Alert.alert('Помилка ❌', 'Не вдалося зберегти інтеграцію.');
    } finally {
      setIsSaving(false);
    }
  }, [shopName, apiKey, consumerSecret, isWooCommerce, isSaving]);

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
      
      <AuraHeader />

      <View style={styles.topBar}>
        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>🔗 Інтеграції та Магазини</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Синхронізація маркетплейсів через ШІ</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Підключення магазину</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Для Shopify введіть домен і Token. Для WooCommerce (localsite) введіть домен, Consumer Key та Consumer Secret.
          </Text>

          <Text style={[styles.label, { color: theme.textPrimary }]}>Назва магазину / Домен</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            placeholder="Наприклад: tiny-emoji.localsite.io"
            placeholderTextColor={theme.textSecondary}
            value={shopName}
            onChangeText={setShopName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isWooCommerce ? 'Consumer Key (CK)' : 'API-токен (Shopify Token)'}
          </Text>
          <View style={[styles.passwordContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.textPrimary }]}
              placeholder={isWooCommerce ? 'ck_... або токен' : 'shpat_...'}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!isApiKeyVisible}
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.eyeButton} 
              onPress={() => setIsApiKeyVisible(!isApiKeyVisible)}
              activeOpacity={0.7}
            >
              <Text style={[styles.eyeButtonText, { color: theme.primary }]}>
                {isApiKeyVisible ? 'Сховати' : 'Показати'}
              </Text>
            </TouchableOpacity>
          </View>

          {isWooCommerce && (
            <>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Consumer Secret (CS)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="cs_..."
                placeholderTextColor={theme.textSecondary}
                value={consumerSecret}
                onChangeText={setConsumerSecret}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

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
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, zIndex: 10 },
  topBarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  topBarSub: { fontSize: 11 },
  content: { padding: 12, paddingBottom: 90, zIndex: 1 },
  formCard: { borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
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