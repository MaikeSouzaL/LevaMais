import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

import rideService, { Ride } from '../../../services/ride.service';
import driverService from '../../../services/driver.service';
import websocketService from '../../../services/websocket.service';
import { DriverScreen } from './components/DriverScreen';
import { DriverDepositModal } from '@/components/DriverDepositModal';
import GlassCard from '@/components/driver/cards/GlassCard';
import MetricCard from '@/components/driver/cards/MetricCard';
import EarningsBarChart from '@/components/driver/charts/EarningsBarChart';
import ProgressBar from '@/components/driver/feedback/ProgressBar';
import HistoryRideCard from '@/components/driver/cards/HistoryRideCard';
import { driverColors, driverSpacing } from '@/theme/driverTheme';

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverEarningsScreen() {
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [availableBalance, setAvailableBalance] = useState(0);
  const [driverStats, setDriverStats] = useState({ earnings: 0, rides: 0, goal: 10, bonus: 0 });
  const [rides, setRides] = useState<Ride[]>([]);
  const [chartData, setChartData] = useState<{ label: string; value: number; count?: number }[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [balanceRes, statsRes, historyRes, chartRes] = await Promise.all([
        driverService.getBalance(),
        rideService.getDriverStats(),
        rideService.getHistory({ limit: 20, page: 1 }),
        rideService.getEarningsHistory(period),
      ]);

      setAvailableBalance(Number(balanceRes?.balance || 0));
      setDriverStats(statsRes);
      setRides(historyRes.rides || []);
      setChartData((chartRes || []).map((item: any) => ({
        label: item.label,
        value: item.value || 0,
        count: item.count || 0,
      })));
    } catch (error) {
      console.error('Failed to load earnings data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    const handleBalanceUpdate = () => loadData(true);
    websocketService.on('balance_updated', handleBalanceUpdate);
    return () => { websocketService.off('balance_updated', handleBalanceUpdate); };
  }, [loadData]);

  const periodTotals = useMemo(() => {
    return chartData.reduce(
      (acc, item) => { acc.earnings += item.value || 0; acc.rides += item.count || 0; return acc; },
      { earnings: 0, rides: 0 },
    );
  }, [chartData]);

  const goalProgress = useMemo(() => {
    const goal = Math.max(1, Number(driverStats.goal || 0));
    return Math.min(1, (Number(driverStats.rides || 0)) / goal);
  }, [driverStats.goal, driverStats.rides]);

  const periodLabel = period === 'day' ? 'do dia' : period === 'week' ? 'da semana' : 'do mês';

  return (
    <DriverScreen title="Financeiro" scroll hideHeader={true}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={driverColors.accent} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Balance Hero Card ── */}
        <GlassCard variant="accent" padding="lg">
          <Text style={{ color: driverColors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
            Saldo disponível
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Text style={{ color: driverColors.accent, fontSize: 32, fontWeight: '900' }}>
              {balanceVisible ? formatBRL(availableBalance) : '••••••••'}
            </Text>
            <TouchableOpacity onPress={() => setBalanceVisible(p => !p)}>
              <Ionicons name={balanceVisible ? 'eye-off' : 'eye'} size={22} color={driverColors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowDepositModal(true)}
            activeOpacity={0.85}
            style={{
              backgroundColor: driverColors.accent,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginTop: 20,
            }}
          >
            <FontAwesome5 name="plus-circle" size={16} color={driverColors.bg} />
            <Text style={{ color: driverColors.bg, fontWeight: '900', fontSize: 14 }}>DEPOSITAR / RECARREGAR</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('DriverWithdraw')}
              activeOpacity={0.8}
              style={actionBtn}
            >
              <FontAwesome5 name="money-bill-wave" size={15} color={driverColors.text} />
              <Text style={actionBtnText}>SACAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('DriverStatement')}
              activeOpacity={0.8}
              style={actionBtn}
            >
              <MaterialIcons name="history" size={18} color={driverColors.text} />
              <Text style={actionBtnText}>EXTRATO</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── Period Tabs ── */}
        <View style={{ flexDirection: 'row', marginTop: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, gap: 4 }}>
          {(['day', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 10,
                backgroundColor: period === p ? driverColors.accent : 'transparent',
              }}
            >
              <Text style={{
                color: period === p ? driverColors.bg : driverColors.textSecondary,
                fontWeight: '700', fontSize: 13,
              }}>
                {p === 'day' ? 'Dia' : p === 'week' ? 'Semana' : 'Mês'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Chart ── */}
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: driverColors.text, fontSize: 17, fontWeight: '800' }}>Ganhos {periodLabel}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverStatement')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: driverColors.accent, fontWeight: '700', fontSize: 13 }}>Ver extrato</Text>
              <MaterialIcons name="chevron-right" size={18} color={driverColors.accent} />
            </TouchableOpacity>
          </View>

          <GlassCard variant="default" padding="md">
            <EarningsBarChart data={chartData} goal={driverStats.goal ? driverStats.goal * 15 : undefined} maxHeight={130} />
          </GlassCard>
        </View>

        {/* ── Metric Cards ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <MetricCard
            icon={<MaterialIcons name="trending-up" size={16} color={driverColors.accent} />}
            label="Total ganho"
            value={balanceVisible ? formatBRL(periodTotals.earnings) : '---'}
            accent="green"
          />
          <MetricCard
            icon={<MaterialIcons name="directions-car" size={16} color="#FBBF24" />}
            label="Concluídas"
            value={periodTotals.rides}
            accent="yellow"
          />
          <MetricCard
            icon={<MaterialIcons name="flag" size={16} color={driverColors.info} />}
            label="Meta"
            value={`${Math.round(goalProgress * 100)}%`}
            subtitle={`${driverStats.rides}/${driverStats.goal} corridas`}
            accent="blue"
          />
        </View>

        {/* ── Goal Progress ── */}
        <GlassCard variant="default" padding="md" style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: driverColors.textSecondary, fontSize: 12, fontWeight: '700' }}>
              Progresso da meta diária
            </Text>
            <Text style={{ color: driverColors.accent, fontSize: 12, fontWeight: '900' }}>
              {driverStats.rides}/{driverStats.goal} corridas
            </Text>
          </View>
          <ProgressBar progress={goalProgress} height={10} />
          {driverStats.bonus > 0 && (
            <Text style={{ color: driverColors.warning, fontSize: 11, fontWeight: '700', marginTop: 8 }}>
              🎯 Bônus de {formatBRL(driverStats.bonus)} ao atingir {driverStats.goal} corridas!
            </Text>
          )}
        </GlassCard>

        {/* ── Recent Rides ── */}
        <View style={{ marginTop: 28 }}>
          <Text style={{ color: driverColors.text, fontSize: 17, fontWeight: '800', marginBottom: 14 }}>Corridas recentes</Text>
          {loading ? (
            <ActivityIndicator size="large" color={driverColors.accent} style={{ marginTop: 20 }} />
          ) : rides.length === 0 ? (
            <GlassCard variant="default" padding="lg" style={{ alignItems: 'center' }}>
              <MaterialIcons name="history" size={40} color={driverColors.textMuted} />
              <Text style={{ color: driverColors.textMuted, marginTop: 10, fontWeight: '600' }}>Nenhuma corrida recente</Text>
            </GlassCard>
          ) : (
            rides.slice(0, 5).map((ride: any, i: number) => (
              <HistoryRideCard
                key={ride._id}
                item={ride}
                index={i}
                onPress={(item) => navigation.navigate('DriverRideDetails', { rideId: (item as any)._id })}
              />
            ))
          )}
        </View>
      </ScrollView>

      <DriverDepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => { setShowDepositModal(false); loadData(true); }}
      />
    </DriverScreen>
  );
}

const actionBtn: any = {
  flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 14, borderRadius: 14,
  alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
};
const actionBtnText: any = { color: '#fff', fontWeight: '700', fontSize: 14 };
