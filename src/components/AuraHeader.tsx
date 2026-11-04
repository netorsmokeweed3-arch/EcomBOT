import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export const AuraHeader = () => {
  const { theme } = useAppTheme();
  
  // Дуже повільне, глибоке і м'яке дихання світла (без різких ривків)
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 7000, // Повільний, кінематографічний перелив
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 7000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const gradientColors = theme.gradientHeader as [string, string, ...string[]];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. Глибокий базовий темний фон */}
      <View style={[styles.absolute, { backgroundColor: theme.bgDark }]} />

      {/* 2. Преміальна текстура зоряного неба (можна замінити на будь-яке посилання або локальний імпорт asset) */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop' }}
        style={styles.absolute}
        resizeMode="cover"
      >
        {/* 3. М'яке світлове «сонце» / аура з кута, яка плавно переливається поверх зірок */}
        <Animated.View style={[styles.absolute, { opacity: pulseAnim }]}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.absolute}
          />
        </Animated.View>

        {/* 4. Затемнення знизу, щоб інтерфейс і картки замовлень чітко читались */}
        <LinearGradient
          colors={['transparent', 'rgba(11, 15, 25, 0.85)', theme.bgDark]}
          locations={[0, 0.6, 1]}
          style={styles.absolute}
        />
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
});