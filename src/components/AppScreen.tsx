// src/components/AppScreen.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface AppScreenProps {
  children: React.ReactNode;
}

export const AppScreen: React.FC<AppScreenProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Повністю прозорий, щоб пропускати фон AuraHeader наскрізь
  },
});