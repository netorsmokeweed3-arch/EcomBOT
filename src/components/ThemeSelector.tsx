import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme, THEMES, ThemeMode } from '../theme/ThemeContext';

export const ThemeSelector = () => {
  const { theme, setThemeMode } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>🎨 Преміальна Тема Оформлення</Text>
      <View style={styles.buttonsRow}>
        {(Object.keys(THEMES) as ThemeMode[]).map((mode) => {
          const item = THEMES[mode];
          const isActive = theme.mode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.themeBtn,
                { backgroundColor: item.bgDark, borderColor: isActive ? item.primary : 'transparent' },
              ]}
              onPress={() => setThemeMode(mode)}
            >
              <View style={[styles.colorDot, { backgroundColor: item.primary }]} />
              <Text style={[styles.btnText, { color: isActive ? item.primary : item.textSecondary }]}>
                {item.name.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 14, borderRadius: 16, borderWidth: 1, marginVertical: 10 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  buttonsRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  themeBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  btnText: { fontSize: 10, fontWeight: '700' },
});