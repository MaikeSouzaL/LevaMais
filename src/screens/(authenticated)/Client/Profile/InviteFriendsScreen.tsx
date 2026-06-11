import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Share, Clipboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MotiView } from "moti";
import { ArrowLeft, UserPlus, Share2, Copy, Gift, Users, CheckCircle } from "lucide-react-native";
import Toast from "react-native-toast-message";

import { useAuthStore } from "@/context/authStore";

export default function InviteFriendsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.userData);

  const code = React.useMemo(() => {
    const seed = String(user?.id || "123456").slice(-6).toUpperCase();
    return `LEVA-${seed}`;
  }, [user?.id]);

  const handleCopy = () => {
    Clipboard.setString(code);
    Toast.show({ type: "success", text1: "Código copiado!", text2: "Cole no app para se cadastrar." });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Conheça o Leva Mais — corridas, entregas e fretes em um só lugar! Use meu código ${code} para se cadastrar e aproveitar o app.`,
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Não foi possível compartilhar", text2: error?.message || "Tente novamente" });
    }
  };

  const BENEFITS = [
    { icon: Gift,  text: "Ganhe créditos quando seu amigo fizer a primeira corrida" },
    { icon: Users, text: "Sem limite de convites — convide quantos quiser" },
    { icon: CheckCircle, text: "Créditos aplicados automaticamente na carteira" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16,
        flexDirection: "row", alignItems: "center",
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginRight: 14 }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Convidar Amigos</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Ganhe bônus por indicações</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: "#11253E", borderRadius: 28, padding: 28,
            borderWidth: 1, borderColor: "rgba(2,222,149,0.18)",
            alignItems: "center", marginBottom: 16, overflow: "hidden", position: "relative",
          }}
        >
          <View style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(2,222,149,0.05)" }} />
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: "rgba(2,222,149,0.1)",
            borderWidth: 2, borderColor: "rgba(2,222,149,0.25)",
            alignItems: "center", justifyContent: "center", marginBottom: 18,
          }}>
            <UserPlus size={34} color="#02de95" />
          </View>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 6 }}>Seu Código de Convite</Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
            Compartilhe com amigos e ganhe créditos quando eles fizerem a primeira corrida.
          </Text>

          {/* Código */}
          <TouchableOpacity
            onPress={handleCopy}
            activeOpacity={0.8}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              backgroundColor: "rgba(2,222,149,0.08)",
              borderRadius: 18, paddingHorizontal: 24, paddingVertical: 16,
              borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(2,222,149,0.35)",
              width: "100%", justifyContent: "center",
            }}
          >
            <Text style={{ color: "#02de95", fontSize: 26, fontWeight: "900", letterSpacing: 3 }}>{code}</Text>
            <Copy size={18} color="rgba(2,222,149,0.6)" />
          </TouchableOpacity>
          <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 10 }}>Toque para copiar</Text>
        </MotiView>

        {/* Benefícios */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          style={{
            backgroundColor: "#11253E", borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 16,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>
            Como funciona
          </Text>
          {BENEFITS.map((item, index) => {
            const Icon = item.icon;
            return (
              <View key={index} style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: index < BENEFITS.length - 1 ? 14 : 0 }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(2,222,149,0.1)", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} color="#02de95" />
                </View>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, flex: 1, lineHeight: 20, marginTop: 6 }}>
                  {item.text}
                </Text>
              </View>
            );
          })}
        </MotiView>

        {/* Botão compartilhar */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 180 }}>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.85}
            style={{
              height: 56, borderRadius: 18, backgroundColor: "#02de95",
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
            }}
          >
            <Share2 size={20} color="#091A2F" />
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Compartilhar Convite
            </Text>
          </TouchableOpacity>
        </MotiView>

        <Text style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 18 }}>
          O programa de bonificação financeira por indicação está em desenvolvimento e será ativado em breve.
        </Text>
      </ScrollView>
    </View>
  );
}
