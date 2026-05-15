import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LogoImg = require('../../assets/Logo/logo.png');

interface AuthHeaderProps {
  showBackButton?: boolean;
}

export function AuthHeader({ showBackButton = true }: AuthHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {showBackButton ? (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.text.primary} size={24} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.logoContainer}>
        <Image 
          source={LogoImg} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
      </View>
      
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    width: '100%',
    zIndex: 50,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 140,
    height: 45,
  },
  spacer: {
    width: 44, // matches backButton width for accurate centering
  }
});
