// src/components/GlassCard.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

interface GlassCardProps {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.outerContainer, style]}>
      {/* Зовнішній світловий зріз (імітація дорогого скла) */}
      <View style={styles.glassHighlight}>
        {/* Внутрішній глибокий матовий шар */}
        <View style={styles.glassInner}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 24,
    // Глибока розсіяна тінь, яка відділяє картку від фонової аури
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.75,
    shadowRadius: 24,
    elevation: 10,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  glassHighlight: {
    borderRadius: 24,
    borderWidth: 1,
    // Тонка світлова грань зверху і з боків (створює ефект дорогого фасету)
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.28)', // Верхнє ребро яскравиіше, бо на нього "падає світло"
    backgroundColor: '#0a0c10', // Насичена глибока матово-чорна база
    overflow: 'hidden',
  },
  glassInner: {
    width: '100%',
    padding: 16,
    // Внутрішній мікро-градієнт для відчуття глибини матеріалу
    backgroundColor: 'rgba(14, 17, 23, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
});