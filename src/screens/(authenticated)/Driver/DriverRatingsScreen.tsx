import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Star } from 'lucide-react-native';
import { MotiView } from 'moti';
import { DriverScreen } from './components/DriverScreen';
import GlassCard from '@/components/driver/cards/GlassCard';
import ProgressBar from '@/components/driver/feedback/ProgressBar';
import { driverColors, driverSpacing, driverRadius } from '@/theme/driverTheme';

function StarRow({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color="#FBBF24" fill={i <= count ? '#FBBF24' : 'transparent'} />
      ))}
    </View>
  );
}

export default function DriverRatingsScreen() {
  const [ratingData] = useState({
    average: 4.8,
    total: 156,
    distribution: { '5': 120, '4': 24, '3': 8, '2': 3, '1': 1 },
    feedbacks: [
      { id: '1', name: 'Maria S.', stars: 5, comment: 'Motorista muito educado e pontual! Carro limpo e confortável.', date: '28/05' },
      { id: '2', name: 'João P.', stars: 5, comment: 'Chegou rápido, dirigiu com cuidado. Recomendo!', date: '27/05' },
      { id: '3', name: 'Ana L.', stars: 4, comment: 'Boa comunicação, só demorou um pouco para encontrar o endereço.', date: '26/05' },
      { id: '4', name: 'Carlos M.', stars: 5, comment: 'Excelente atendimento! Muito profissional.', date: '25/05' },
    ],
  });

  const maxDist = Math.max(...Object.values(ratingData.distribution), 1);

  return (
    <DriverScreen title="Avaliações" hideHeader={true} scroll={true}>
      {/* Hero Rating */}
      <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
        <GlassCard variant="accent" padding="lg" style={{ alignItems: 'center', marginBottom: driverSpacing.lg }}>
          <View style={styles.ratingCircle}>
            <Text style={styles.ratingValue}>{ratingData.average.toFixed(1)}</Text>
          </View>
          <StarRow count={Math.round(ratingData.average)} size={22} />
          <Text style={styles.totalText}>{ratingData.total} avaliações</Text>
        </GlassCard>
      </MotiView>

      {/* Distribution */}
      <GlassCard variant="default" padding="md" style={{ marginBottom: driverSpacing.lg }}>
        <Text style={styles.sectionLabel}>Distribuição de notas</Text>
        {[5, 4, 3, 2, 1].map((star, i) => {
          const count = ratingData.distribution[String(star) as keyof typeof ratingData.distribution] || 0;
          const pct = count / maxDist;
          const barColors = ['#02de95', '#02de95', '#FBBF24', '#F97316', '#ef4444'];
          return (
            <MotiView key={star}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: i * 80 }}
              style={styles.distRow}
            >
              <Text style={styles.distStar}>{star} ★</Text>
              <View style={{ flex: 1 }}>
                <ProgressBar progress={pct} height={6} color={barColors[i]} showGlow={false} />
              </View>
              <Text style={styles.distCount}>{count}</Text>
            </MotiView>
          );
        })}
      </GlassCard>

      {/* Feedback Cards */}
      <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Comentários recentes</Text>
      {ratingData.feedbacks.map((fb, i) => (
        <MotiView key={fb.id}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: i * 100 }}
        >
          <GlassCard variant="default" padding="md" style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.fbAvatar}>
                  <Text style={styles.fbAvatarText}>{fb.name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.fbName}>{fb.name}</Text>
                  <StarRow count={fb.stars} size={12} />
                </View>
              </View>
              <Text style={styles.fbDate}>{fb.date}</Text>
            </View>
            {fb.comment && (
              <View style={styles.fbComment}>
                <Text style={styles.fbCommentText}>"{fb.comment}"</Text>
              </View>
            )}
          </GlassCard>
        </MotiView>
      ))}
    </DriverScreen>
  );
}

const styles = StyleSheet.create({
  ratingCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: driverColors.accentBg, borderWidth: 3, borderColor: driverColors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  ratingValue: { color: driverColors.accent, fontSize: 36, fontWeight: '900' },
  totalText: { color: driverColors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 8 },
  sectionLabel: { color: driverColors.text, fontSize: 15, fontWeight: '800', marginBottom: 12 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  distStar: { color: driverColors.textSecondary, fontSize: 12, fontWeight: '700', width: 32 },
  distCount: { color: driverColors.textMuted, fontSize: 11, fontWeight: '600', width: 28, textAlign: 'right' },
  fbAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: driverColors.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  fbAvatarText: { color: driverColors.accent, fontSize: 15, fontWeight: '900' },
  fbName: { color: driverColors.text, fontSize: 13, fontWeight: '800' },
  fbDate: { color: driverColors.textMuted, fontSize: 10, fontWeight: '600' },
  fbComment: { marginTop: 8, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: driverColors.accent },
  fbCommentText: { color: driverColors.textSecondary, fontSize: 12, fontWeight: '600', fontStyle: 'italic', lineHeight: 18 },
});
