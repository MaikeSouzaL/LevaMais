import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from "@/components/ui/Icon";
import { driverColors, driverTypography, driverRadius } from '@/theme/driverTheme';

interface DriverHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBackPress?: () => void;
  showMenuInsteadOfBack?: boolean;
}

export function DriverHeader({
  title,
  subtitle,
  right,
  onBackPress,
  showMenuInsteadOfBack = false,
}: DriverHeaderProps) {
  const navigation = useNavigation();
  const canGoBack = (navigation as any).canGoBack?.() ?? false;
  const showBack = !showMenuInsteadOfBack && canGoBack;

  const handlePress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (showBack) {
      navigation.goBack();
    } else {
      (navigation as any).openDrawer?.();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={styles.iconButton}
          accessibilityLabel={showBack ? 'Voltar' : 'Abrir menu'}
          accessibilityRole="button"
        >
          <Icon
            name={showBack ? 'arrow-back' : 'menu'}
            size={22}
            color={showBack ? driverColors.text : driverColors.accent}
          />
        </TouchableOpacity>

        <View style={styles.titleGroup}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: driverColors.border,
    backgroundColor: driverColors.bg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  right: {
    flexShrink: 0,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    color: driverColors.text,
    fontSize: driverTypography.heading3.fontSize,
    fontWeight: '900',
  },
  subtitle: {
    color: driverColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(17,24,22,0.9)',
    borderWidth: 1,
    borderColor: driverColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DriverHeader;
