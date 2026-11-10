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
  Platform,
  FlatList,
  KeyboardAvoidingView 
} from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { useAppTheme } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';
import { MARKETPLACES, MarketplaceConfig, MarketplaceField } from '../constants/marketplaces';

const storage = createMMKV();
export const RENDER_SERVER_URL = 'https://ecombot-2.onrender.com';

const STORAGE_KEYS = {
  SAVED_SHOPS: 'saved_shops',
  SERVER_URL: 'server_url',
  EXPIRED_TOKENS: 'expired_tokens_map',
} as const;

interface ShopIntegration {
  id: string;
  platformId: string;
  platformName: string;
  credentials: Record<string, string>;
}

interface ShopCardProps {
  shop: ShopIntegration;
  isVisible: boolean;
  isExpired: boolean;
  onToggleToken: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: (shop: ShopIntegration) => void;
}

const ShopCard = memo(({ shop, isVisible, isExpired, onToggleToken, onDelete, onRefresh }: ShopCardProps) => {
  const { theme } = useAppTheme();

  const credentialsSummary = useMemo(() => {
    return Object.entries(shop.credentials)
      .map(([key, val]) => {
        const masked = '•'.repeat(Math.min(val.length, 16));
        return `${key}: ${isVisible ? val : masked}`;
      })
      .join(' | ');
  }, [shop.credentials, isVisible]);

  return (
    <View style={[styles.shopCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: isExpired ? '#ff3b30' : theme.cardBorder }]}>
      <View style={styles.shopInfo}>
        <View style={styles.rowBetween}>
          <Text style={[styles.shopName, { color: theme.textPrimary }]} numberOfLines={1}>
            {shop.platformName}
          </Text>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>⚠️ Токен застарів</Text>
            </View>
          )}
        </View>
        <Text style={[styles.shopToken, { color: theme.textSecondary }]} numberOfLines={2}>
          {credentialsSummary}
        </Text>
      </View>

      <View style={styles.cardActions}>
        {isExpired && (
          <TouchableOpacity
            style={[styles.actionButton, styles.refreshButton]}
            onPress={() => onRefresh(shop)}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>Оновити токен</Text>
          </TouchableOpacity>
        )}

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
          style={[styles.actionButton, styles.deleteButton]}
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

interface MarketplaceSelectorProps {
  selectedId: string;
  onSelect: (item: MarketplaceConfig) => void;
  theme: any;
}

const MarketplaceSelector = memo(({ selectedId, onSelect, theme }: MarketplaceSelectorProps) => {
  const renderItem = useCallback(({ item }: { item: MarketplaceConfig }) => {
    const isSelected = selectedId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.chip,
          { 
            backgroundColor: isSelected ? theme.primary : theme.cardBg, 
            borderColor: isSelected ? theme.primary : theme.cardBorder 
          }
        ]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, { color: isSelected ? theme.bgDark : theme.textPrimary }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedId, onSelect, theme]);

  return (
    <View style={styles.selectorContainer}>
      <Text style={[styles.label, { color: theme.textPrimary }]}>Оберіть платформу або маркетплейс</Text>
      <FlatList
        data={MARKETPLACES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
});

MarketplaceSelector.displayName = 'MarketplaceSelector';

export default function IntegrationsScreen() {
  const { theme } = useAppTheme();

  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceConfig>(MARKETPLACES[0]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [shops, setShops] = useState<ShopIntegration[]>([]);
  const [expiredMap, setExpiredMap] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [showSecureFields, setShowSecureFields] = useState<Record<string, boolean>>({});
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const loadData = useCallback(() => {
    try {
      const savedShopsJson = storage.getString(STORAGE_KEYS.SAVED_SHOPS);
      if (savedShopsJson) {
        const parsed = JSON.parse(savedShopsJson);
        if (Array.isArray(parsed)) setShops(parsed);
      }

      const expiredJson = storage.getString(STORAGE_KEYS.EXPIRED_TOKENS);
      if (expiredJson) {
        const parsedExpired = JSON.parse(expiredJson);
        if (typeof parsedExpired === 'object') setExpiredMap(parsedExpired);
      }
    } catch (error) {
      console.log('Помилка завантаження даних інтеграцій', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectMarketplace = useCallback((item: MarketplaceConfig) => {
    setSelectedMarketplace(item);
    setFormValues({});
    setShowSecureFields({});
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSecureFieldVisibility = useCallback((key: string) => {
    setShowSecureFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = useCallback(() => {
    for (const field of selectedMarketplace.fields) {
      const val = formValues[field.key]?.trim();
      if (!val) {
        Alert.alert('Помилка ❌', `Будь ласка, заповніть поле: "${field.label}"`);
        return;
      }
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const newShop: ShopIntegration = {
        id: Date.now().toString(),
        platformId: selectedMarketplace.id,
        platformName: selectedMarketplace.name,
        credentials: { ...formValues },
      };

      const updatedShops = [...shops, newShop];
      setShops(updatedShops);
      storage.set(STORAGE_KEYS.SAVED_SHOPS, JSON.stringify(updatedShops));
      storage.set(STORAGE_KEYS.SERVER_URL, RENDER_SERVER_URL);

      // Знімаємо статус прострочення для щойно збереженого магазину
      const newExpiredMap = { ...expiredMap, [newShop.id]: false };
      setExpiredMap(newExpiredMap);
      storage.set(STORAGE_KEYS.EXPIRED_TOKENS, JSON.stringify(newExpiredMap));

      setFormValues({});
      setShowSecureFields({});
      Alert.alert('Успіх ✅', `Магазин "${selectedMarketplace.name}" успішно інтегровано!`);
    } catch (error) {
      Alert.alert('Помилка ❌', 'Не вдалося зберегти інтеграцію.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedMarketplace, formValues, isSaving, shops, expiredMap]);

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

  const handleRefreshShopToken = useCallback((shop: ShopIntegration) => {
    const market = MARKETPLACES.find((m) => m.id === shop.platformId);
    if (market) {
      setSelectedMarketplace(market);
      setFormValues(shop.credentials);
      handleDelete(shop.id);
      Alert.alert('Оновлення токена', 'Введіть нові актуальні дані та натисніть «Зберегти інтеграцію».');
    }
  }, [handleDelete]);

  const toggleShowToken = useCallback((id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderedDynamicFields = useMemo(() => {
    return selectedMarketplace.fields.map((field: MarketplaceField) => {
      const isSecured = field.secure;
      const isVisible = !!showSecureFields[field.key];
      const value = formValues[field.key] || '';

      if (isSecured) {
        return (
          <View key={field.key}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>{field.label}</Text>
            <View style={[styles.passwordContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.textPrimary }]}
                placeholder={field.placeholder}
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!isVisible}
                value={value}
                onChangeText={(text) => handleFieldChange(field.key, text)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.eyeButton} 
                onPress={() => toggleSecureFieldVisibility(field.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.eyeButtonText, { color: theme.primary }]}>
                  {isVisible ? 'Сховати' : 'Показати'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View key={field.key}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>{field.label}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            placeholder={field.placeholder}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={(text) => handleFieldChange(field.key, text)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      );
    });
  }, [selectedMarketplace, formValues, showSecureFields, theme, handleFieldChange, toggleSecureFieldVisibility]);

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

      <KeyboardAvoidingView 
        style={styles.flexContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.content} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Підключення магазину</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Оберіть платформу із каталогу та введіть необхідні ключі доступу для надійного зв'язку з агентами.
            </Text>

            <MarketplaceSelector 
              selectedId={selectedMarketplace.id} 
              onSelect={handleSelectMarketplace} 
              theme={theme} 
            />

            {renderedDynamicFields}

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

          {shops.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={[styles.listTitle, { color: theme.textPrimary }]}>Підключені магазини ({shops.length})</Text>
              {shops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  isVisible={!!showTokens[shop.id]}
                  isExpired={!!expiredMap[shop.id]}
                  onToggleToken={toggleShowToken}
                  onDelete={handleDelete}
                  onRefresh={handleRefreshShopToken}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexContainer: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, zIndex: 10 },
  topBarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  topBarSub: { fontSize: 11 },
  content: { padding: 12, paddingBottom: 110, zIndex: 1 },
  formCard: { borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  selectorContainer: { marginBottom: 12 },
  chipsScroll: { paddingVertical: 4, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 6, height: 36, justifyContent: 'center', alignItems: 'center' },
  chipText: { fontSize: 13, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 10 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 10 },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 10 },
  eyeButtonText: { fontSize: 13, fontWeight: '700' },
  saveButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 15, fontWeight: '800' },
  listContainer: { marginTop: 4 },
  listTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, marginLeft: 4 },
  shopCard: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  shopInfo: { marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  shopName: { fontSize: 15, fontWeight: 'bold' },
  expiredBadge: { backgroundColor: 'rgba(255,59,48,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  expiredBadgeText: { color: '#ff3b30', fontSize: 10, fontWeight: '700' },
  shopToken: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionButtonText: { fontSize: 12, fontWeight: '700' },
  refreshButton: { backgroundColor: '#ff3b30', borderColor: '#ff3b30' },
  refreshButtonText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  deleteButton: { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: 'rgba(255, 59, 48, 0.3)' },
  deleteButtonText: { fontSize: 12, fontWeight: '700', color: '#ff3b30' },
});