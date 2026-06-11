import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundMap } from './components/BackgroundMap';
import { Particles } from './components/Particles';
import { AnimatedLoader } from './components/AnimatedLoader';
import theme from '../../theme';
const LogoImg = require('../../assets/Logo/logo.png');

interface SplashScreenProps {
  durationMs?: number;
  onFinish?: () => void;
}

export default function SplashScreen({ durationMs = 3500, onFinish }: SplashScreenProps) {
  
  useEffect(() => {
    if (onFinish) {
      const timer = setTimeout(() => {
        onFinish();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [onFinish, durationMs]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Base Deep Background Layer */}
      <LinearGradient
        colors={[theme.COLORS.BRAND_DARK, '#060E18', '#040910']}
        style={StyleSheet.absoluteFill}
      />

      {/* Cinematic Background Elements */}
      <BackgroundMap />
      <Particles />

      {/* Soft overlay for cinematic vignette/contrast */}
      <LinearGradient
        colors={['rgba(9, 26, 47, 0.4)', 'transparent', '#040910']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Main Visual Content */}
      <View style={styles.content}>
        {/* Animated Logo "LEVA" with Glowing Clone behind it */}
        <View style={styles.logoWrapper}>
          <MotiView
            from={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 0.6, scale: 1.1 }}
            transition={{ type: 'timing', duration: 2000, delay: 300 }}
            style={[StyleSheet.absoluteFill, styles.logoGlow]}
            pointerEvents="none"
          >
            <Image source={LogoImg} style={styles.logoImageGlow} resizeMode="contain" />
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.8, translateY: 15 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 100,
              delay: 100,
            }}
          >
            <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
          </MotiView>
        </View>

        {/* Animated Subtitle */}
        <MotiText
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 0.8, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 1000,
            delay: 800,
          }}
          style={styles.subtitle}
        >
          Corridas e entregas inteligentes
        </MotiText>
      </View>

      {/* Fixed position Bottom Loader */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800, delay: 1200 }}
        style={styles.loaderPosition}
      >
        <AnimatedLoader />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.BRAND_DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 280,
    height: 100,
  },
  logoImageGlow: {
    width: 280,
    height: 100,
    opacity: 0.5,
  },
  logoGlow: {
    justifyContent: 'center',
    alignItems: 'center',
    // Basic shadow glow for RN core fallback if custom blur isn't explicit
    shadowColor: theme.COLORS.BRAND_LIGHT,
    shadowRadius: 20,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontFamily: theme.FONT_FAMILY.REGULAR,
    fontSize: 14,
    color: theme.COLORS.GRAY_100,
    marginTop: 12,
    letterSpacing: 1.8,
    opacity: 0.8,
    textAlign: 'center',
  },
  loaderPosition: {
    position: 'absolute',
    bottom: 60,
    zIndex: 20,
  }
});
