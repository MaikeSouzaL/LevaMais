import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import rideService, { Ride } from "../../../services/ride.service";

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function DriverRatingsScreen() {
  const [rides, setRides] = useState<Ride[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
         try {
           const result = await rideService.getHistory({ page: 1, limit: 60, status: "completed" });
           if (!mounted) return;
           setRides(result?.rides || []);
         } catch (error) {
           console.error('Failed to load ride ratings:', error);
           if (!mounted) return;
           setRides([]);
         }
      })();

      return () => {
        mounted = false;
      };
    }, []),
  );

  const summary = useMemo(() => {
    const stars = rides
      .map((ride: any) => toNumber(ride?.rating?.driverRating?.stars))
      .filter((value) => value > 0);

    const avg = stars.length
      ? stars.reduce((acc, value) => acc + value, 0) / stars.length
      : 0;

    const five = stars.filter((value) => value >= 4.5).length;
    return {
      avg,
      total: stars.length,
      five,
    };
  }, [rides]);

  return (
    <DriverScreen title="Avaliações" scroll hideHeader={true}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Main Rating Card */}
        <LinearGradient
          colors={["#1a3a2f", "#091A2F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: "rgba(2,222,149,0.3)",
            overflow: "hidden",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Sua Nota Média
          </Text>

          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "rgba(2,222,149,0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 2,
                borderColor: "#02de95",
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "#02de95", fontSize: 44, fontWeight: "900" }}>
                  {summary.avg > 0 ? summary.avg.toFixed(1) : "--"}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <MaterialIcons
                      key={i}
                      name="star"
                      size={14}
                      color={i < Math.round(summary.avg || 0) ? "#02de95" : "rgba(255,255,255,0.2)"}
                      style={{ marginHorizontal: 1 }}
                    />
                  ))}
                </View>
              </View>
            </View>

            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, textAlign: "center" }}>
              {summary.total} avaliações recebidas
            </Text>
          </View>

          {/* Stats Row */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <LinearGradient
              colors={["rgba(2,222,149,0.12)", "rgba(2,222,149,0.06)"]}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(2,222,149,0.2)",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" }}>
                5 Estrelas
              </Text>
              <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 24, marginTop: 6 }}>
                {summary.five}
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" }}>
                Concluídas
              </Text>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 24, marginTop: 6 }}>
                {rides.length}
              </Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Recent Feedbacks */}
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, paddingHorizontal: 4 }}>
            <MaterialIcons name="comment" size={24} color="#02de95" />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
              Últimos Feedbacks
            </Text>
            <View style={{ backgroundColor: "rgba(2,222,149,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 12 }}>
                {rides.slice(0, 10).filter((r: any) => r?.rating?.driverRating?.comment).length}
              </Text>
            </View>
          </View>

          {rides.slice(0, 10).length === 0 ? (
            <LinearGradient
              colors={["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"]}
              style={{
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <MaterialIcons name="rate-review" size={40} color="rgba(255,255,255,0.2)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, textAlign: "center" }}>
                Nenhuma avaliação recebida ainda
              </Text>
            </LinearGradient>
          ) : (
            rides.slice(0, 10).map((ride: any) => {
              const stars = toNumber(ride?.rating?.driverRating?.stars);
              const comment = String(ride?.rating?.driverRating?.comment || "").trim();
              const clientName = ride?.client?.name || "Cliente";

              return (
                <LinearGradient
                  key={ride._id}
                  colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
                        {clientName}
                      </Text>
                    </View>
                    {stars > 0 && (
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {[...Array(5)].map((_, i) => (
                          <MaterialIcons
                            key={i}
                            name="star"
                            size={14}
                            color={i < Math.round(stars) ? "#fbbf24" : "rgba(255,255,255,0.15)"}
                          />
                        ))}
                      </View>
                    )}
                  </View>

                  {comment && (
                    <View
                      style={{
                        backgroundColor: "rgba(2,222,149,0.08)",
                        padding: 10,
                        borderRadius: 10,
                        borderLeftWidth: 3,
                        borderLeftColor: "#02de95",
                      }}
                    >
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.75)",
                          fontSize: 13,
                          lineHeight: 18,
                        }}
                        numberOfLines={3}
                      >
                        "{comment}"
                      </Text>
                    </View>
                  )}

                  {!comment && stars > 0 && (
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        padding: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic" }}>
                        Avaliação sem comentário
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              );
            })
          )}
        </View>

        {/* Rating Distribution */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, paddingHorizontal: 4 }}>
            <MaterialIcons name="assessment" size={24} color="#60a5fa" />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
              Distribuição de Notas
            </Text>
          </View>

          {[5, 4, 3, 2, 1].map((stars) => {
            const count = rides.filter((r: any) => Math.round(toNumber(r?.rating?.driverRating?.stars)) === stars).length;
            const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;

            return (
              <View key={stars} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <View style={{ width: 24, alignItems: "center" }}>
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontWeight: "700", fontSize: 12 }}>
                      {stars}⭐
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${percentage}%`,
                        backgroundColor:
                          stars >= 4
                            ? "#02de95"
                            : stars >= 3
                              ? "#fbbf24"
                              : stars >= 2
                                ? "#f97316"
                                : "#ef4444",
                      }}
                    />
                  </View>
                  <View style={{ width: 35, alignItems: "flex-end" }}>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontWeight: "700", fontSize: 12 }}>
                      {percentage}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </DriverScreen>
  );
}
