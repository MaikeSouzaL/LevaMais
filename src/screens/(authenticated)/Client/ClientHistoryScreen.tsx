import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import rideService, { Ride } from "../../../services/ride.service";
import SectionCard from "../../../components/ui/SectionCard";

function formatDate(value?: string) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleString("pt-BR");
  } catch {
    return String(value);
  }
}

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

function getStatusConfig(status: string) {
    switch(status) {
        case 'completed': return { label: 'Finalizada', color: '#02de95', icon: 'check-circle' };
        case 'cancelled_by_client': return { label: 'Cancelada por você', color: '#ef4444', icon: 'close-circle' };
        case 'cancelled_by_driver': return { label: 'Cancelada pelo motorista', color: '#ef4444', icon: 'close-circle' };
        case 'cancelled_no_driver': return { label: 'Não encontrado', color: '#fbbf24', icon: 'alert-circle' };
        case 'in_progress': return { label: 'Em andamento', color: '#32BCAD', icon: 'time' };
        default: return { label: status, color: '#fff', icon: 'help-circle' };
    }
}

export default function ClientHistoryScreen() {
  const navigation = useNavigation();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  
  // Animation for filter change
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await rideService.getHistory({ limit: 50, page: 1 });
        setRides(res.rides || []);
      } catch (e: any) {
        // silent error
      } finally {
        setLoading(false);
      }
  };

  const filteredRides = useMemo(() => {
      if (filter === 'all') return rides;
      if (filter === 'completed') return rides.filter(r => r.status === 'completed');
      return rides.filter(r => r.status.includes('cancelled'));
  }, [rides, filter]);

  const stats = useMemo(() => {
      const totalSpent = filteredRides
        .filter(r => r.status === 'completed')
        .reduce((acc, r) => acc + (r.pricing?.total || 0), 0);
      return { count: filteredRides.length, total: totalSpent };
  }, [filteredRides]);

  const handleFilterChange = (newFilter: typeof filter) => {
      if (newFilter === filter) return;
      Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
      setFilter(newFilter);
  };

  const SummaryHeader = () => (
      <LinearGradient
        colors={['#162e25', '#0f231c']}
        style={{ margin: 16, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}
      >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700" }}>Total Gasto</Text>
                  <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 }}>
                      {formatBRL(stats.total)}
                  </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                   <View style={{ backgroundColor: "rgba(2, 222, 149, 0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                       <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 14 }}>
                           {stats.count} {stats.count === 1 ? 'corrida' : 'corridas'}
                       </Text>
                   </View>
              </View>
          </View>
      </LinearGradient>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      {/* Top Bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
           <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Minhas Viagens</Text>
        <TouchableOpacity style={{ padding: 8 }}>
            <MaterialIcons name="search" size={24} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SummaryHeader />

        {/* Filters */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 20, gap: 10 }}>
          {(['all', 'completed', 'cancelled'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => handleFilterChange(f)}
                activeOpacity={0.7}
                style={{
                    backgroundColor: filter === f ? "#02de95" : "transparent",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 30,
                    borderWidth: 1,
                    borderColor: filter === f ? "#02de95" : "rgba(255,255,255,0.15)"
                }}
              >
                  <Text style={{ 
                      color: filter === f ? "#0f231c" : "rgba(255,255,255,0.7)", 
                      fontWeight: "700",
                      fontSize: 13
                  }}>
                      {f === 'all' ? 'Todas' : f === 'completed' ? 'Finalizadas' : 'Canceladas'}
                  </Text>
              </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16, gap: 16 }}>
            {filteredRides.length === 0 && !loading ? (
                <View style={{ alignItems: "center", marginTop: 40, opacity: 0.5 }}>
                    <MaterialIcons name="history-toggle-off" size={64} color="#fff" />
                    <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>Nenhuma viagem encontrada</Text>
                </View>
            ) : (
                filteredRides.map((r, i) => {
                    const statusConfig = getStatusConfig(r.status);
                    const date = new Date(r.createdAt);
                    
                    return (
                        <TouchableOpacity
                            key={r._id || i}
                            activeOpacity={0.9}
                            onPress={() => {
                                (navigation as any).navigate("FinalOrderSummary", {
                                    data: {
                                        pickupAddress: r.pickup.address,
                                        dropoffAddress: r.dropoff.address,
                                        vehicleType: (r as any).vehicleType,
                                        etaMinutes: 0,
                                        pricing: {
                                            base: (r as any).pricing.basePrice,
                                            distancePrice: (r as any).pricing.distancePrice,
                                            serviceFee: (r as any).pricing.serviceFee || (r as any).pricing.extraFees || 0,
                                            total: (r as any).pricing.total,
                                            distanceKm: (r.distance?.value || 0) / 1000
                                        },
                                        paymentSummary: r.payment?.method?.type === 'credit_card' ? 'Cartão de Crédito' : 
                                                        r.payment?.method?.type === 'pix' ? 'Pix' : 'Dinheiro',
                                        pickupLatLng: r.pickup,
                                        dropoffLatLng: r.dropoff,
                                        isHistory: true, 
                                        date: r.createdAt 
                                    }
                                });
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
                                    <View style={{ flexDirection: "row", gap: 12 }}>
                                        <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{date.getDate()}</Text>
                                            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase", fontWeight: "700" }}>
                                                {date.toLocaleDateString("pt-BR", { month: "short" }).replace('.','')}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                                                {date.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                                                <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                                                <Text style={{ color: statusConfig.color, fontSize: 12, fontWeight: "600" }}>{statusConfig.label}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                         <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{formatBRL((r as any).pricing.total)}</Text>
                                         <FontAwesome5 
                                            name={(r as any).vehicleType === 'motorcycle' ? 'motorcycle' : 'car'} 
                                            size={12} 
                                            color="rgba(255,255,255,0.3)"
                                            style={{ marginTop: 6 }} 
                                          />
                                    </View>
                                </View>

                                {/* Route Visualization */}
                                <View style={{ position: "relative", paddingLeft: 12 }}>
                                    {/* Dotted Line */}
                                    <View style={{ position: "absolute", left: 15, top: 8, bottom: 24, width: 2, backgroundColor: "rgba(255,255,255,0.1)" }} />
                                    
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                                         <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", marginTop: 6 }} />
                                         <Text numberOfLines={1} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, flex: 1 }}>
                                             {r.pickup.address.split(',')[0]}
                                         </Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                                         <View style={{ width: 8, height: 8, borderRadius: 0, backgroundColor: "#ef4444", marginTop: 6 }} />
                                         <Text numberOfLines={1} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, flex: 1 }}>
                                             {r.dropoff.address.split(',')[0]}
                                         </Text>
                                    </View>
                                </View>

                            </LinearGradient>
                        </TouchableOpacity>
                    );
                })
            )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
