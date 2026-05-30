import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Search, SlidersHorizontal } from 'lucide-react-native';

import rideService, { Ride } from '../../../services/ride.service';
import { useAuthStore } from '../../../context/authStore';
import HistoryRideCard from '@/components/driver/cards/HistoryRideCard';
import GlassCard from '@/components/driver/cards/GlassCard';
import { driverColors, driverSpacing, driverRadius } from '@/theme/driverTheme';

type Filter = 'all' | 'completed' | 'cancelled' | 'active' | 'declined';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'cancelled', label: 'Canceladas' },
  { id: 'active', label: 'Ativas' },
  { id: 'declined', label: 'Recusadas' },
];

const ACTIVE_STATUSES = ['requesting', 'driver_assigned', 'accepted', 'driver_arriving', 'arrived', 'in_progress'];

function groupByDate(rides: any[]): { title: string; data: any[] }[] {
  const groups: Record<string, any[]> = {};
  const now = new Date();

  rides.forEach((ride) => {
    const date = new Date(ride.completedAt || ride.cancelledAt || ride.updatedAt || ride.createdAt);
    let key: string;
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) key = 'Hoje';
    else if (diffDays === 1) key = 'Ontem';
    else if (diffDays < 7) key = 'Esta semana';
    else {
      key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(ride);
  });

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function DriverHistoryScreen() {
  const navigation = useNavigation<any>();
  const driverId = useAuthStore((s) => s.userData?.id);
  const [filter, setFilter] = useState<Filter>('all');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadRides = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);

      let statusParam: string | undefined;
      if (filter === 'completed') statusParam = 'completed';
      else if (filter === 'cancelled') statusParam = 'cancelled';
      else if (filter === 'active') statusParam = 'active';
      else if (filter === 'declined') statusParam = 'declined';

      const res = await rideService.getHistory({ limit: 100, page: 1, status: statusParam });
      let result = res.rides || [];

      // Mark declined-by-me
      result = result.map((ride: any) => {
        const declinedByMe = Array.isArray(ride.rejectedBy)
          ? ride.rejectedBy.some((r: any) => String(r.driverId) === String(driverId))
          : false;
        return { ...ride, declinedByMe };
      });

      setRides(result);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, driverId]);

  useFocusEffect(useCallback(() => { loadRides(); }, [loadRides]));

  const filteredRides = useMemo(() => {
    if (!search.trim()) return rides;
    const q = search.toLowerCase();
    return rides.filter(
      (ride: any) =>
        ride.pickup?.address?.toLowerCase().includes(q) ||
        ride.dropoff?.address?.toLowerCase().includes(q) ||
        ride.clientId?.name?.toLowerCase().includes(q),
    );
  }, [rides, search]);

  const sections = useMemo(() => groupByDate(filteredRides), [filteredRides]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <HistoryRideCard
      item={item}
      index={index}
      declinedByMe={item.declinedByMe}
      onPress={(rideItem) => navigation.navigate('DriverHistoryRideDetails', { rideId: rideItem._id })}
    />
  );

  const renderSectionHeader = ({ section }: any) => (
    <View style={{ paddingVertical: driverSpacing.sm, paddingHorizontal: 4 }}>
      <Text style={{ color: driverColors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {section.title}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: driverColors.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: driverSpacing.lg, paddingTop: driverSpacing.lg, paddingBottom: driverSpacing.md }}>
        <Text style={{ color: driverColors.text, fontSize: 20, fontWeight: '900', marginBottom: 12 }}>Histórico</Text>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: driverColors.surface, borderRadius: driverRadius.md,
          paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: driverColors.borderLight,
        }}>
          <Search size={16} color={driverColors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por endereço ou cliente..."
            placeholderTextColor={driverColors.textMuted}
            style={{ flex: 1, color: driverColors.text, fontSize: 13, fontWeight: '600' }}
          />
        </View>

        {/* Filter pills */}
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ gap: 6, paddingRight: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.id)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === item.id ? driverColors.accent : 'transparent',
                borderWidth: 1.5,
                borderColor: filter === item.id ? driverColors.accent : driverColors.border,
              }}
            >
              <Text style={{
                color: filter === item.id ? driverColors.bg : driverColors.textSecondary,
                fontWeight: '700', fontSize: 12,
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Ride list grouped by date */}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        renderItem={({ item: section }) => (
          <View style={{ paddingHorizontal: driverSpacing.lg }}>
            {renderSectionHeader({ section })}
            {section.data.map((ride: any, i: number) => (
              <View key={ride._id}>{renderItem({ item: ride, index: i })}</View>
            ))}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadRides(true)} tintColor={driverColors.accent} />
        }
        ListEmptyComponent={
          loading ? null : (
            <GlassCard variant="default" padding="lg" style={{ margin: driverSpacing.lg, alignItems: 'center' }}>
              <Text style={{ color: driverColors.textMuted, fontSize: 14, fontWeight: '700' }}>Nenhuma corrida encontrada</Text>
            </GlassCard>
          )
        }
      />
    </View>
  );
}
