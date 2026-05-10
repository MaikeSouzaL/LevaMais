import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import theme from '../../../theme';

export const AnimatedLoader = () => {
  return (
    <View style={styles.container}>
      {/* Loader track */}
      <View 
        style={[styles.track, { backgroundColor: theme.COLORS.SURFACE_PRIMARY + '60' }]}
        className="border border-white/5 overflow-hidden"
      >
        {/* Animated progressing bar */}
        <MotiView
          from={{
            translateX: -120,
          }}
          animate={{
            translateX: 200,
          }}
          transition={{
            type: 'timing',
            duration: 1800,
            loop: true,
            repeatReverse: false,
          }}
          style={[styles.bar, { backgroundColor: theme.COLORS.BRAND_LIGHT }]}
        >
          {/* Glow Simulation attached to internal bar edge */}
          <View style={[styles.glow, { backgroundColor: theme.COLORS.BRAND_LIGHT }]} />
        </MotiView>
      </View>
      
      {/* Subtext underneath */}
      <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.7 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          repeatReverse: true,
        }}
        className="mt-4"
      >
        <Text style={styles.loadingText}>INICIANDO AMBIENTE</Text>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 200,
  },
  track: {
    width: '100%',
    height: 3,
    borderRadius: 4,
    position: 'relative',
  },
  bar: {
    width: '60%',
    height: '100%',
    position: 'absolute',
    borderRadius: 4,
  },
  glow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: theme.COLORS.BRAND_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    color: 'white',
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    opacity: 0.5,
    fontWeight: '500',
  },
});
