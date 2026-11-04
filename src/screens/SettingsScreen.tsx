import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, THEMES, ThemeMode } from '../theme/ThemeContext';
import { AuraHeader } from '../components/AuraHeader';
import { SidebarButton } from '../components/SidebarButton'; // Імпортуємо наш ідеальний окремий компонент піраміди!

export default function SettingsScreen() {
  const { theme, setThemeMode } = useAppTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Анімована аура переливу хвиль у шапці */}
      <AuraHeader />

      {/* Преміальний TopBar із нашим чистим анімованим компонентом SidebarButton */}
      <View style={styles.topBar}>
        <SidebarButton />

        <View>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>⚙️ Налаштування системи</Text>
          <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>Персоналізація інтерфейсу та сповіщень</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Блок вибору преміальної теми (Dark Glassmorphism) */}
        <View style={[styles.card, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🎨 Преміальна Тема Оформлення</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Обери свій візуальний стиль. Шапка екрана та акценти почнуть плавно переливатися.
          </Text>

          <View style={styles.themesGrid}>
            {(Object.keys(THEMES) as ThemeMode[]).map((mode) => {
              const item = THEMES[mode];
              const isActive = theme.mode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: item.bgDark,
                      borderColor: isActive ? item.primary : item.cardBorder,
                      shadowColor: isActive ? item.primary : 'transparent',
                      shadowOpacity: isActive ? 0.5 : 0,
                      shadowRadius: 10,
                      elevation: isActive ? 8 : 0,
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorDot, { backgroundColor: item.primary }]} />
                  <Text style={[styles.themeBtnText, { color: isActive ? item.textPrimary : item.textSecondary }]}>
                    {item.name}
                  </Text>
                  {isActive && <Text style={[styles.activeMark, { color: item.primary }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Блок додаткових налаштувань у тому ж стилі */}
        <View style={[styles.card, { backgroundColor: 'rgba(18, 22, 32, 0.75)', borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🔔 Автономні Сповіщення</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Expo Push повідомлення для миттєвого контролю замовлень та SOS-режиму підтримки.
          </Text>
          
          <View style={styles.rowBetween}>
            <Text style={[styles.rowText, { color: theme.textPrimary }]}>Фоновий агент ШІ</Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
              <Text style={{ color: theme.accentGain, fontWeight: '700', fontSize: 12 }}>АКТИВНИЙ 24/7</Text>
            </View>
          </View>
        </View>

        {/* Інформація про версію */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Omnichannel SaaS-CRM Engine v2.5</Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Dark Glassmorphism Edition • 2026</Text>
        </View>
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
    paddingTop: 55,
    paddingBottom: 12,
    zIndex: 10,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topBarSub: {
    fontSize: 11,
  },

  scrollContent: { padding: 12, paddingBottom: 40, zIndex: 1 },
  
  card: {
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
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardSub: { fontSize: 12, marginBottom: 16, lineHeight: 18 },

  themesGrid: { gap: 10 },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  themeBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  activeMark: { fontSize: 16, fontWeight: '900' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  rowText: { fontSize: 13, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  footerInfo: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  footerText: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
});