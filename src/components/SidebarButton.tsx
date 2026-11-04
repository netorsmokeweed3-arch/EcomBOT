import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';

export function SidebarButton() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

  const handlePress = () => {
    const toValue = isOpenRef.current ? 0 : 1;
    isOpenRef.current = !isOpenRef.current;

    Animated.spring(rotateAnim, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <TouchableOpacity
      style={[
        styles.glassBox,
        {
          backgroundColor: 'rgba(18, 22, 32, 0.4)',
          borderColor: theme.cardBorder,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.pyramidWrapper,
          {
            transform: [{ rotate: rotation }],
          },
        ]}
      >
        <View 
          style={[
            styles.geometricTriangle, 
            { 
              borderBottomColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 4,
            }
          ]} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  glassBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  pyramidWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  geometricTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});