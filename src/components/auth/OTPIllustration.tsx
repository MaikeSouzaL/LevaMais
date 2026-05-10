import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Smartphone } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export function OTPIllustration() {
  return (
    <View style={styles.container}>
      <View style={styles.ringsContainer}>
        {[1, 2, 3].map((index) => (
          <MotiView
            key={index}
            from={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1 + (index * 0.4) }}
            transition={{
              type: 'timing',
              duration: 2500,
              loop: true,
              delay: index * 400,
              repeatReverse: false,
            }}
            style={[
              StyleSheet.absoluteFillObject,
              styles.ring,
              { borderColor: colors.primary[500] }
            ]}
          />
        ))}
        
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          style={[
            styles.iconCircle,
            { backgroundColor: colors.background.secondary, borderColor: colors.border.light }
          ]}
        >
          <Smartphone size={32} color={colors.primary[500]} />
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  ringsContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  }
});
