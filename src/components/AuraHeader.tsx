// src/components/AuraHeader.tsx
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';

export const AuraHeader: React.FC = () => {
  const { theme } = useContext(ThemeContext);

  const hexToRgba = (hex: string, opacity: number) => {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${opacity})`;
  };

  const primaryColor = theme.primary || '#E2B167';

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark || '#070907' }]} pointerEvents="none">
      {/* Глибока преміальна база */}
      <View style={styles.absoluteFill} />

      {/* Верхнє розсіяне світло (Аура) — робимо його м'якшим і ширшим для дорогого ефекту */}
      <LinearGradient
        colors={[
          hexToRgba(primaryColor, 0.18), // Делікатне, не кричуще світло згори
          hexToRgba(primaryColor, 0.05), // Легкий перехід
          'transparent',                 // Плавне зникнення
        ]}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 0.65 }}
        style={styles.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
});