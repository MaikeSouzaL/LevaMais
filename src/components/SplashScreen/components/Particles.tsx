import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { MotiView } from 'moti';
import theme from '../../../theme';

const { width, height } = Dimensions.get('window');

// Helper to generate a set number of floating dots
const generateParticlePositions = (count: number) => {
  return Array.from({ length: count }).map((_, index) => ({
    id: index,
    startX: Math.random() * width,
    startY: Math.random() * height,
    endX: Math.random() * width,
    endY: Math.random() * height,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3000 + 4000,
    delay: Math.random() * 1000,
  }));
};

const particles = generateParticlePositions(15);

export const Particles = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <MotiView
          key={particle.id}
          from={{
            translateX: particle.startX,
            translateY: particle.startY,
            opacity: 0.2,
            scale: 0.5,
          }}
          animate={{
            translateX: particle.endX,
            translateY: particle.endY,
            opacity: [0.2, 0.6, 0.2],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            type: 'timing',
            duration: particle.duration,
            delay: particle.delay,
            loop: true,
            repeatReverse: true,
          }}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: theme.COLORS.BRAND_LIGHT,
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    shadowColor: theme.COLORS.BRAND_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
});
