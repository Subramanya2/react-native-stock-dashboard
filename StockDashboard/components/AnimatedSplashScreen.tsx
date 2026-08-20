import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(1400),
      // Fade out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: Animated.multiply(opacity, fadeOut) }]}>
      <View style={styles.center}>
        <Image
          source={require('../assets/images/icon.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.name}>FINORA</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0f17',
    zIndex: 999,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  name: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
    paddingBottom: 48,
  },
});
