import React, { useMemo, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import ActionButton from "../../../components/ui/ActionButton";
import StarRating from "../../../components/ui/StarRating";
import rideService from "../../../services/ride.service";

type Params = {
  DriverRateClient: {
    rideId: string;
  };
};

export default function DriverRateClientScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRateClient">>();
  const rideId = route.params?.rideId;

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return !!rideId && stars >= 1 && stars <= 5;
  }, [rideId, stars]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Avaliar cliente
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
          Ajude a comunidade mantendo boas avaliações.
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "800", marginBottom: 10 }}>
          Nota
        </Text>
        <StarRating value={stars} onChange={setStars} />

        <Text
          style={{
            color: "#fff",
            fontWeight: "800",
            marginTop: 18,
            marginBottom: 10,
          }}
        >
          Comentário (opcional)
        </Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="(opcional)"
          placeholderTextColor="rgba(255,255,255,0.35)"
          multiline
          style={{
            minHeight: 110,
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            borderRadius: 14,
            padding: 12,
            textAlignVertical: "top",
          }}
        />
      </View>

      <View style={{ padding: 16 }}>
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
