import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import SectionCard from "../../../components/ui/SectionCard";
import ActionButton from "../../../components/ui/ActionButton";
import citiesService, { type City } from "../../../services/cities.service";
import { useClientCityStore } from "../../../context/clientCityStore";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function ClientCityScreen() {
  const navigation = useNavigation();
  const { city, setCity, clearCity } = useClientCityStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await citiesService.list({ isActive: true });
        if (!mounted) return;
        setCities(list || []);
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Falha ao carregar cidades",
          text2: e?.message || "Tente novamente",
        });
        if (mounted) setCities([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return cities;
    return cities.filter((c) => {
      const name = normalize(c.name);
      const st = normalize(c.state);
      return name.includes(q) || st.includes(q) || `${name}/${st}`.includes(q);
    });
  }, [cities, query]);

  async function selectCity(c: City) {
    setSaving(true);
    try {
      setCity({
        cityId: c._id,
        name: c.name,
        state: c.state,
        source: "manual",
        updatedAt: Date.now(),
      });
      Toast.show({
        type: "success",
        text1: "Cidade atualizada",
        text2: `${c.name}/${c.state}`,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  async function useGpsAgain() {
    // Por enquanto só limpa o override manual.
    // O ClientBoot vai tentar detectar novamente na próxima inicialização.
    // Depois podemos adicionar um botão "Atualizar agora" aqui.
    clearCity();
    Toast.show({
      type: "success",
      text1: "Pronto",
      text2: "A cidade será detectada novamente pelo GPS.",
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Cidade
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#9abcb0", fontWeight: "800" }}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons
              name="map-marker"
              size={22}
              color="#02de95"
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Cidade atual
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                {city
                  ? `${city.name}/${city.state} (${city.source === "gps" ? "GPS" : "Manual"})`
                  : "Não definida"}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <ActionButton
              title={saving ? "Aguarde..." : "Usar GPS automaticamente"}
              variant="secondary"
              onPress={useGpsAgain}
              disabled={saving}
            />
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            Selecionar manualmente
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            Ideal quando o GPS estiver desativado ou a cidade estiver errada.
          </Text>

          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#162e25",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              paddingHorizontal: 12,
            }}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color="rgba(255,255,255,0.55)"
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar cidade ou UF (ex.: São Paulo, SP)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={{
                flex: 1,
                height: 44,
                color: "#fff",
                marginLeft: 8,
              }}
            />
          </View>

          <View style={{ marginTop: 12, height: 420 }}>
            {loading ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color="#02de95" />
                <Text
                  style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}
                >
                  Carregando cidades...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }) => {
                  const isActive = city?.cityId === item._id;
                  return (
                    <TouchableOpacity
                      onPress={() => selectCity(item)}
                      disabled={saving}
                      activeOpacity={0.85}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: isActive
                          ? "rgba(2,222,149,0.10)"
                          : "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: isActive
                          ? "rgba(2,222,149,0.35)"
                          : "rgba(255,255,255,0.06)",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ color: "#fff", fontWeight: "900" }}>
                          {item.name}/{item.state}
                        </Text>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            marginTop: 4,
                          }}
                        >
                          Cidade habilitada no painel Leva Mais
                        </Text>
                      </View>
                      {isActive ? (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={22}
                          color="#02de95"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color="rgba(255,255,255,0.5)"
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={{ paddingVertical: 24, alignItems: "center" }}>
                    <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                      Nenhuma cidade encontrada.
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}
