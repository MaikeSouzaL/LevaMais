import React, { useCallback, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import carrierService from "@/services/carrier.service";
import type { Carrier, CarrierKycStatus, CarrierStatus } from "@/types/carrier";
import { DriverScreen } from "./components/DriverScreen";
import { Icon } from "@/components/ui/Icon";

const KYC_LABEL: Record<CarrierKycStatus, string> = {
  none: "Não enviado",
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Reprovado",
  suspended: "Suspenso",
};
const KYC_COLOR: Record<CarrierKycStatus, string> = {
  none: "#94a3b8", pending: "#f59e0b", approved: "#02de95", rejected: "#ef4444", suspended: "#ef4444",
};
const STATUS_LABEL: Record<CarrierStatus, string> = {
  active: "Ativa", paused: "Pausada", under_review: "Em análise", blocked: "Bloqueada",
};

const inputStyle = {
  backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
} as const;

function Lbl({ text }: { text: string }) {
  return <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 13, marginBottom: 8 }}>{text}</Text>;
}

export default function CarrierScreen() {
  const navigation = useNavigation<any>();
  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [brandName, setBrandName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [areas, setAreas] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");

  const load = useCallback(async () => {
    try {
      setCarrier(await carrierService.getMe());
    } catch {
      setCarrier(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const submit = async () => {
    if (!brandName.trim()) return Toast.show({ type: "error", text1: "Informe o nome da transportadora" });
    setSaving(true);
    try {
      const serviceAreas = areas.split(",").map((a) => a.trim()).filter(Boolean).map((label) => ({ label }));
      await carrierService.onboarding({
        brandName: brandName.trim(),
        document: document.trim(),
        contact: { phone: phone.trim() },
        serviceAreas,
        pricing: { basePrice: Number(basePrice) || 0, pricePerKg: Number(pricePerKg) || 0 },
      });
      Toast.show({ type: "success", text1: "Cadastro enviado!", text2: "Aguarde a aprovação." });
      load();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao cadastrar", text2: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DriverScreen title="Modo Transportadora">
        <View style={{ paddingTop: 60, alignItems: "center" }}><ActivityIndicator color="#02de95" /></View>
      </DriverScreen>
    );
  }

  // --- Já cadastrado: status / KYC ---
  if (carrier) {
    const kyc = (carrier.kyc?.status || "pending") as CarrierKycStatus;
    const approved = carrier.status === "active" && kyc === "approved";
    return (
      <DriverScreen title="Modo Transportadora" scroll>
        <View style={{ backgroundColor: "rgba(2,222,149,0.08)", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "rgba(2,222,149,0.2)", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(2,222,149,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Icon name="truck" size={24} color="#02de95" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }} numberOfLines={1}>{carrier.brandName}</Text>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>@{carrier.slug}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <Badge label={`KYC: ${KYC_LABEL[kyc]}`} color={KYC_COLOR[kyc]} />
            <Badge label={`Conta: ${STATUS_LABEL[carrier.status]}`} color={carrier.status === "active" ? "#02de95" : "#f59e0b"} />
          </View>

          {kyc === "rejected" && !!carrier.kyc?.rejectionReason && (
            <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 12 }}>Motivo: {carrier.kyc.rejectionReason}</Text>
          )}
        </View>

        {approved ? (
          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16 }}>
            <Text style={{ color: "#fff", fontWeight: "800", marginBottom: 12 }}>Sua transportadora está ativa 🎉</Text>
            <Feature icon="route" text="Publicar rotas e levar encomendas" onPress={() => navigation.navigate("DriverRoutes")} />
            <Feature icon="calendar" text="Rotas recorrentes — agenda automática" onPress={() => navigation.navigate("CarrierSchedules")} />
            <Feature icon="package" text="Frete sob demanda com cotação" onPress={() => navigation.navigate("CarrierFreight")} />
            <Feature icon="share-2" text="Perfil público compartilhável (em breve)" />
          </View>
        ) : (
          <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
            <Text style={{ color: "#f59e0b", fontWeight: "800" }}>Cadastro em análise</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 }}>
              Assim que aprovarmos sua transportadora, você libera rotas recorrentes, frete sob demanda e seu perfil público.
            </Text>
          </View>
        )}
      </DriverScreen>
    );
  }

  // --- Não cadastrado: onboarding ---
  return (
    <DriverScreen title="Modo Transportadora" scroll>
      <View style={{ paddingBottom: 30 }}>
        <View style={{ backgroundColor: "rgba(2,222,149,0.08)", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "rgba(2,222,149,0.2)" }}>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Trabalhe como transportadora 🚚</Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 }}>
            Tenha mais liberdade financeira: rotas recorrentes, frete sob demanda e um perfil próprio para os clientes te contratarem direto.
          </Text>
        </View>

        <Lbl text="Nome da transportadora" />
        <TextInput value={brandName} onChangeText={setBrandName} placeholder="Ex.: Rápido Cacoal Transportes" placeholderTextColor="rgba(255,255,255,0.35)" style={[inputStyle, { marginBottom: 16 }]} />

        <Lbl text="CNPJ ou CPF" />
        <TextInput value={document} onChangeText={setDocument} placeholder="Somente números" placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="number-pad" style={[inputStyle, { marginBottom: 16 }]} />

        <Lbl text="Telefone / WhatsApp" />
        <TextInput value={phone} onChangeText={setPhone} placeholder="(69) 9....." placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="phone-pad" style={[inputStyle, { marginBottom: 16 }]} />

        <Lbl text="Cidades atendidas (separe por vírgula)" />
        <TextInput value={areas} onChangeText={setAreas} placeholder="Cacoal, Pimenta Bueno, Ji-Paraná" placeholderTextColor="rgba(255,255,255,0.35)" style={[inputStyle, { marginBottom: 20 }]} />

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
          <View style={{ flex: 1 }}>
            <Lbl text="Preço base (R$)" />
            <TextInput value={basePrice} onChangeText={setBasePrice} keyboardType="decimal-pad" style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <Lbl text="R$/kg" />
            <TextInput value={pricePerKg} onChangeText={setPricePerKg} keyboardType="decimal-pad" style={inputStyle} />
          </View>
        </View>

        <TouchableOpacity disabled={saving} onPress={submit} style={{ backgroundColor: "#02de95", borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#062b22" /> : <Text style={{ color: "#062b22", fontWeight: "900", fontSize: 16 }}>Enviar cadastro</Text>}
        </TouchableOpacity>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 12, textAlign: "center" }}>
          Seu cadastro passa por aprovação antes de liberar os recursos de transportadora.
        </Text>
      </View>
    </DriverScreen>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}22`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
      <Text style={{ color, fontWeight: "800", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function Feature({ icon, text, onPress }: { icon: string; text: string; onPress?: () => void }) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
      <Icon name={icon} size={16} color="#02de95" />
      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginLeft: 10, flex: 1 }}>{text}</Text>
      {onPress && <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.4)" />}
    </Wrapper>
  );
}
