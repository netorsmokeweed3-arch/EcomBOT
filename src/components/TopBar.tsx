import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { SidebarButton } from './SidebarButton'; // Використовуємо наш вивірений ідеальний компонент піраміди!

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export const TopBar = ({ title, subtitle }: TopBarProps) => {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Наша футуристична анімована кнопка-піраміда */}
      <SidebarButton />

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 55, // Ідеальний відступ під статус-бар та камери
    paddingBottom: 12,
    zIndex: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});