import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { borderRadius } from '../../theme/dimensions';

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  isGoogleLoading?: boolean;
}

export function SocialLoginButtons({ onGooglePress, isGoogleLoading }: SocialLoginButtonsProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: 350 }}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={onGooglePress}
        disabled={isGoogleLoading}
        activeOpacity={0.9}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color="#11253E" />
        ) : (
          <>
            <Image
              source={{ uri: 'https://www.google.com/favicon.ico' }}
              style={styles.icon}
              resizeMode="contain"
            />
            <Text style={styles.text}>Continuar com Google</Text>
          </>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 4,
  },
  button: {
    height: 56,
    width: '100%',
    backgroundColor: '#FFFFFF', // Keep pristine white per design asset
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#1F2937', // Clean dark slate for reading on white
    fontWeight: '600',
  },
});
