import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverHeader from './DriverHeader';
import { driverColors, driverSpacing, driverRadius } from '@/theme/driverTheme';

export type DriverScreenVariant = 'default' | 'map' | 'fullscreen';

export interface DriverScreenWrapperProps {
  title?: string;
  headerRight?: React.ReactNode;
  /** Variante visual: default (com padding), map (fundo transparente p/ mapa), fullscreen (sem padding/safe area top) */
  variant?: DriverScreenVariant;
  /** Conteúdo com ScrollView */
  scroll?: boolean;
  /** Esconder o header customizado */
  hideHeader?: boolean;
  /** Padding automático (default: true, exceto map e fullscreen) */
  padded?: boolean;
  /** Header customizado (substitui DriverHeader) */
  customHeader?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * DriverScreenWrapper — Layout wrapper unificado para todas as telas do motorista.
 *
 * Substitui o DriverScreen antigo com suporte a variantes:
 * - default: header + conteúdo com padding (telas de formulário, listas)
 * - map: conteúdo sem padding, ideal para telas com mapa em background
 * - fullscreen: sem safe area top, para overlays e telas imersivas
 */
export function DriverScreenWrapper({
  title = '',
  headerRight,
  variant = 'default',
  scroll = false,
  hideHeader = false,
  padded,
  customHeader,
  children,
}: DriverScreenWrapperProps) {
  // Resolve padding automático por variante
  const resolvedPadded = padded ?? (variant === 'default');

  // Safe area edges
  const safeAreaEdges: Array<'top' | 'bottom' | 'left' | 'right'> =
    variant === 'fullscreen'
      ? ['bottom', 'left', 'right']
      : hideHeader
        ? ['bottom', 'left', 'right']
        : ['top', 'bottom', 'left', 'right'];

  // Background por variante
  const bgColor =
    variant === 'map'
      ? 'transparent'
      : variant === 'fullscreen'
        ? driverColors.bg
        : driverColors.bg;

  const renderHeader = () => {
    if (hideHeader) return null;
    if (customHeader) return customHeader;
    if (!title && !headerRight) return null;
    return <DriverHeader title={title} right={headerRight} />;
  };

  const contentStyle = {
    padding: resolvedPadded ? driverSpacing.lg : 0,
    gap: resolvedPadded ? driverSpacing.md : 0,
  };

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={[styles.base, { backgroundColor: bgColor }]}
    >
      {renderHeader()}

      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default DriverScreenWrapper;
