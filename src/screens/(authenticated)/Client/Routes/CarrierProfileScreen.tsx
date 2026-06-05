import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import ClientScreenHeader from "../Shared/components/ClientScreenHeader";
import freightService from "@/services/freight.service";
import type { CarrierProfile } from "@/types/freight";
import type { DriverRoute } from "@/types/routes";
import { colors } from "@/theme";
import { Icon } from "@/components/ui/Icon";

function fmt(value?: string) {
  if (!value) return "";
  try { return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return value; }
}

export default function CarrierProfileScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const slug: string = params?.slug;

  const [profile, setProfile] = useState<CarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    freightService.getProfile(slug).then(setProfile).catch(() => setProfile(null)).finally(() => setLoading(false));
  }, [slug]));

  const share = async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Conheça a transportadora ${profile.brandName} no Leva+ e envie suas encomendas: https://levamais.app/t/${profile.slug}`,
      });
    } catch { /* no-op */ }
  };

  const requestFreight = () => {
    if (!profile) return;
    navigation.navigate("Freight", { presetCarrierId: profile._id, presetCarrierName: profile.brandName });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <ClientScreenHeader title="Transportadora" showBack />
        <View style={{ paddingTop: 50, alignItems: "center" }}><ActivityIndicator color={colors.primary[500]} /></View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <ClientScreenHeader title="Transportadora" showBack />
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Icon name="truck" size={46} color="rgba(255,255,255,0.2)" />
          <Text style={{ color: colors.text.secondary, marginTop: 14, fontWeight: "700" }}>Perfil indisponível</Text>
        </View>
      </View>
    );
  }

  const rating = profile.rating?.average || 0;
  const areas = (profile.serviceAreas || []).map((a) => a.label).filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ClientScreenHeader title="Transportadora" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ backgroundColor: "rgba(2,222,149,0.08)", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "rgba(2,222,149,0.2)" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(2,222,149,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Icon name="truck" size={28} color={colors.primary[500]} />
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: colors.text.primary, fontWeight: "900", fontSize: 19 }} numberOfLines={1}>{profile.brandName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <Icon name="star" size={14} color="#f59e0b" />
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginLeft: 4 }}>
                  {rating > 0 ? `${rating.toFixed(1)} (${profile.rating?.count || 0})` : "Sem avaliações ainda"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={share} style={{ padding: 8 }}>
              <Icon name="share-2" size={22} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>

          {!!profile.bio && <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 14 }}>{profile.bio}</Text>}

          {areas.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {areas.map((a, i) => (
                <View key={i} style={{ backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700" }}>{a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity onPress={requestFreight} style={{ backgroundColor: colors.primary[500], borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16, flexDirection: "row", justifyContent: "center" }}>
          <Icon name="package" size={18} color="#062b22" />
          <Text style={{ color: "#062b22", fontWeight: "900", fontSize: 15, marginLeft: 8 }}>Solicitar um frete</Text>
        </TouchableOpacity>

        <Text style={{ color: colors.text.primary, fontWeight: "800", marginTop: 24, marginBottom: 12 }}>
          Rotas disponíveis ({profile.routes?.length || 0})
        </Text>

        {(!profile.routes || profile.routes.length === 0) ? (
          <Text style={{ color: colors.text.secondary, fontSize: 13 }}>Nenhuma rota publicada no momento. Você pode solicitar um frete sob demanda.</Text>
        ) : (
          profile.routes.map((r: DriverRoute) => {
            const free = (r.capacity?.maxItems || 0) - (r.capacityUsed?.items || 0);
            return (
              <TouchableOpacity key={r._id} activeOpacity={0.85} onPress={() => navigation.navigate("RouteReserve", { routeId: r._id })}
                style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Icon name="route" size={16} color={colors.primary[500]} />
                  <Text style={{ color: colors.text.primary, fontWeight: "800", marginLeft: 8, flex: 1 }} numberOfLines={1}>
                    {r.origin?.label} → {r.destination?.label}
                  </Text>
                </View>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 6 }}>
                  {fmt(r.departAt)} · {free} vaga(s) · a partir de R$ {Number(r.pricing?.basePrice || 0).toFixed(0)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
