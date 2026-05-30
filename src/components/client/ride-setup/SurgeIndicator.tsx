/**
 * SurgeIndicator — Indicador visual de preços dinâmicos.
 *
 * Exibe quando o surge está ativo:
 * - Multiplicador (ex: "1.5x")
 * - Nível (normal/moderate/high/very_high)
 * - Barra de cores: verde → amarelo → laranja → vermelho
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { TrendingUp, Zap } from 'lucide-react-native';

interface SurgeIndicatorProps {
  multiplier: number;
  level: 'normal' | 'moderate' | 'high' | 'very_high';
  demandCount?: number;
  supplyCount?: number;
}

const levelConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  normal: { color: '#02de95', bg: 'rgba(2,222,149,0.1)', label: 'Normal', icon: TrendingUp },
  moderate: { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', label: 'Demanda elevada', icon: TrendingUp },
  high: { color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'Alta demanda', icon: Zap },
  very_high: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Demanda extrema', icon: Zap },
};

export function SurgeIndicator({ multiplier, level, demandCount, supplyCount }: SurgeIndicatorProps) {
  const cfg = levelConfig[level] || levelConfig.normal;
  const Icon = cfg.icon;
  const hasSurge = multiplier > 1.0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}
    >
      <View style={styles.left}>
        <Icon size={16} color={cfg.color} />
        <View>
          <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
          {demandCount != null && (
            <Text style={styles.subtext}>
              {demandCount} pedidos · {supplyCount} motoristas
            </Text>
          )}
        </View>
      </View>

      {hasSurge && (
        <View style={[styles.multiplierBadge, { backgroundColor: cfg.color }]}>
          <Text style={styles.multiplierText}>{multiplier.toFixed(1)}x</Text>
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
  },
  multiplierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  multiplierText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
});

export default SurgeIndicator;
