import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { driverColors, driverTypography, driverRadius, driverSpacing } from '@/theme/driverTheme';

interface BarData {
  label: string;
  value: number;
  count?: number;
}

interface EarningsBarChartProps {
  data: BarData[];
  /** Meta diária/semanal (linha tracejada) */
  goal?: number;
  /** Cor das barras */
  color?: string;
  /** Altura máxima das barras */
  maxHeight?: number;
}

export default function EarningsBarChart({
  data,
  goal,
  color = driverColors.accent,
  maxHeight = 140,
}: EarningsBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), goal || 0, 1);

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem dados de ganhos</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Goal line */}
      {goal != null && goal > 0 && (
        <View style={[styles.goalLine, { bottom: (goal / maxValue) * maxHeight + 20 }]}>
          <View style={[styles.goalDash, { borderColor: driverColors.warning }]} />
          <Text style={styles.goalLabel}>Meta R$ {goal.toFixed(0)}</Text>
        </View>
      )}

      {/* Bars */}
      <View style={[styles.barsWrap, { height: maxHeight + 24 }]}>
        {data.map((item, index) => {
          const barHeight = Math.max(4, (item.value / maxValue) * maxHeight);
          const isSelected = selectedIndex === index;
          const isAboveGoal = goal != null && item.value >= goal;

          return (
            <MotiView
              key={index}
              from={{ height: 0, opacity: 0 }}
              animate={{ height: barHeight, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, delay: index * 60 }}
              style={styles.barCol}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedIndex(isSelected ? null : index)}
                style={{ alignItems: 'center' }}
              >
                {/* Value tooltip */}
                {isSelected && (
                  <MotiView
                    from={{ opacity: 0, translateY: 4 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={styles.tooltip}
                  >
                    <Text style={styles.tooltipText}>R$ {item.value.toFixed(2)}</Text>
                    {item.count != null && (
                      <Text style={styles.tooltipSub}>{item.count} corridas</Text>
                    )}
                  </MotiView>
                )}

                {/* Bar */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isAboveGoal ? driverColors.accent : isSelected ? color : 'rgba(2,222,149,0.35)',
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                    },
                  ]}
                />
              </TouchableOpacity>

              {/* Label */}
              <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingBottom: 8,
  },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: driverColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  goalDash: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  goalLabel: {
    color: driverColors.warning,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 6,
  },
  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    gap: 4,
    paddingTop: 24,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: 48,
  },
  tooltip: {
    backgroundColor: driverColors.elevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: driverColors.border,
    marginBottom: 4,
    alignItems: 'center',
  },
  tooltipText: {
    color: driverColors.accent,
    fontSize: 10,
    fontWeight: '900',
  },
  tooltipSub: {
    color: driverColors.textMuted,
    fontSize: 8,
    fontWeight: '700',
  },
  bar: {
    width: '60%',
    minWidth: 16,
    marginBottom: 4,
  },
  label: {
    color: driverColors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});
