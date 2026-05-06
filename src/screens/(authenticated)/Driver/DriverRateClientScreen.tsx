import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import ActionButton from "../../../components/ui/ActionButton";
import rideService from "../../../services/ride.service";

type Params = {
  DriverRateClient: {
    rideId: string;
  };
};

const QUICK_TAGS = [
  "Educado",
  "Amigável",
  "Pontual",
  "Excelente passageiro",
  "Fácil comunicação",
];

const RATING_LABELS: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

export default function DriverRateClientScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRateClient">>();
  const rideId = route.params?.rideId;

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [ride, setRide] = useState<any>(null);
  const [loadingRide, setLoadingRide] = useState(false);

  const canSubmit = useMemo(() => {
    return !!rideId && stars >= 1 && stars <= 5;
  }, [rideId, stars]);

  useEffect(() => {
    if (!rideId) return;
    setLoadingRide(true);
    rideService.getById(rideId)
      .then((res) => {
        setRide(res);
      })
      .catch((err) => {
        console.log("Erro ao carregar detalhes da corrida:", err);
      })
      .finally(() => {
        setLoadingRide(false);
      });
  }, [rideId]);

  const toggleTag = (tag: string) => {
    const tags = comment
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean);

    const exists = tags.includes(tag);
    const next = exists ? tags.filter((t) => t !== tag) : [...tags, tag];
    setComment(next.join("; "));
  };

  const hasTag = (tag: string) =>
    comment
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean)
      .includes(tag);

  async function submit() {
    if (!rideId) return;
    if (!canSubmit) return;

    setLoading(true);
    try {
      await rideService.rateDriverToClient(rideId, {
        stars,
        comment: comment?.trim() || undefined,
      });

      Toast.show({ type: "success", text1: "Avaliação enviada" });
      try {
        (navigation as any).navigate("DriverHome");
      } catch {
        navigation.goBack();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Corrida Concluída
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
          Confira seus ganhos e avalie seu cliente.
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {loadingRide ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#02de95" />
          </View>
        ) : ride ? (
          <View
            style={{
              backgroundColor: "rgba(2,222,149,0.06)",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(2,222,149,0.18)",
              padding: 16,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>
              VOCÊ FATUROU NESSA CORRIDA
            </Text>
            <Text style={{ color: "#02de95", fontSize: 32, fontWeight: "900", marginTop: 4 }}>
              R$ {Number(ride.pricing?.driverValue ?? ride.pricing?.total ?? 0).toFixed(2)}
            </Text>
            
            <View style={{ width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 14 }} />
            
            <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Distância</Text>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                  {ride.distance?.text || "—"}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Duração</Text>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                  {ride.duration?.text || "—"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Total Pago</Text>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                  R$ {Number(ride.pricing?.total ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Avaliação do Cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Como foi sua experiência com o cliente?</Text>
          
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setStars(star)}>
                <MaterialIcons
                  name={star <= stars ? "star" : "star-border"}
                  size={46}
                  color="#02de95"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingLabel}>
            {stars > 0 ? RATING_LABELS[stars] : "Toque nas estrelas para avaliar"}
          </Text>
        </View>

        {/* Destaques */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Destaques do Cliente (opcional)</Text>
          
          <View style={styles.tagsWrap}>
            {QUICK_TAGS.map((tag) => {
              const selected = hasTag(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Escreva um comentário ou adicione tags acima..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
            style={styles.input}
          />
        </View>
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(9,26,47,0.9)" }}>
        <ActionButton
          title={loading ? "Enviando..." : "Enviar avaliação"}
          variant="primary"
          onPress={submit}
          disabled={!canSubmit || loading}
        />
        <View style={{ height: 10 }} />
        <ActionButton
          title="Pular"
          variant="secondary"
          onPress={() => {
            try {
              (navigation as any).navigate("DriverHome");
            } catch {
              navigation.goBack();
            }
          }}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 12,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  ratingLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  tagChipSelected: {
    borderColor: "#02de95",
    backgroundColor: "rgba(2,222,149,0.15)",
  },
  tagText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  tagTextSelected: {
    color: "#02de95",
    fontWeight: "700",
  },
  input: {
    minHeight: 100,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    textAlignVertical: "top",
    fontSize: 13,
  },
});
