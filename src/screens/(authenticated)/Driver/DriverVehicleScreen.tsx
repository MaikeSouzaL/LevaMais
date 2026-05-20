import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { FileText, Truck, AlertCircle, Plus, ArrowLeft, CheckCircle2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import TextField from "../../../components/ui/TextField";
import ActionButton from "../../../components/ui/ActionButton";
import driverService, { DriverVehicle } from "../../../services/driver.service";
import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import { DualUploadDocumentCard } from "../../../components/driver/documents/DualUploadDocumentCard";
import { UploadDocumentCard } from "../../../components/driver/documents/UploadDocumentCard";

const VEHICLE_TYPES = [
  { id: "motorcycle", label: "Motocicleta", icon: "two-wheeler" as const },
  { id: "car", label: "Carro", icon: "directions-car" as const },
  { id: "van", label: "Van", icon: "airport-shuttle" as const },
  { id: "truck", label: "Caminhão", icon: "local-shipping" as const },
];

type DocState = {
  uri: string | null;
  loading: boolean;
};

export default function DriverVehicleScreen() {
  const [viewMode, setViewMode] = useState<"list" | "add">("list");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fleet, setFleet] = useState<DriverVehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);

  // State for "Add New Vehicle" form
  const [submitting, setSubmitting] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState<string>("motorcycle");
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newRenavam, setNewRenavam] = useState("");
  
  // Vehicle Documents State
  const [crlvFront, setCrlvFront] = useState<DocState>({ uri: null, loading: false });
  const [crlvBack, setCrlvBack] = useState<DocState>({ uri: null, loading: false });
  const [vehiclePhoto, setVehiclePhoto] = useState<DocState>({ uri: null, loading: false });

  useEffect(() => {
    fetchFleet();
  }, []);

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const res = await driverService.listVehicles();
      setFleet(res.vehicles || []);
      setActiveVehicleId(res.activeVehicleId || null);
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao carregar frota",
        text2: e?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Document picker handler matching established app convention
  const handlePick = async (source: "camera" | "gallery", target: "crlvFront" | "crlvBack" | "photo") => {
    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão negada", "Precisamos de acesso à câmera.");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão negada", "Precisamos de acesso à galeria.");
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.8,
      };

      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        const setter = target === "crlvFront" ? setCrlvFront : target === "crlvBack" ? setCrlvBack : setVehiclePhoto;
        
        setter({ uri, loading: true });
        
        // Simulate processing/upload delay for great UX visual feel
        setTimeout(() => {
          setter({ uri, loading: false });
          Toast.show({
            type: "success",
            text1: "Arquivo anexado!",
            text2: "Documento capturado com sucesso.",
          });
        }, 1000);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Erro ao obter arquivo." });
    }
  };

  const handleClearDoc = (target: "crlvFront" | "crlvBack" | "photo") => {
    const setter = target === "crlvFront" ? setCrlvFront : target === "crlvBack" ? setCrlvBack : setVehiclePhoto;
    setter({ uri: null, loading: false });
  };

  const handleActivate = async (id: string) => {
    setRefreshing(true);
    try {
      const res = await driverService.activateVehicle(id);
      Toast.show({
        type: "success",
        text1: "Veículo alterado!",
        text2: res?.message || "Você está pronto para receber chamadas.",
      });
      // Fast re-sync
      const refreshed = await driverService.listVehicles();
      setFleet(refreshed.vehicles || []);
      setActiveVehicleId(refreshed.activeVehicleId || null);
    } catch (e: any) {
      Alert.alert("Não foi possível ativar", e?.response?.data?.error || e?.message || "Erro desconhecido.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRegister = async () => {
    if (!newPlate || !newModel || !newVehicleType || !newRenavam) {
      Alert.alert("Atenção", "Preencha modelo, placa, renavam e tipo do veículo.");
      return;
    }

    if (String(newRenavam).trim().length !== 11) {
      Alert.alert("Atenção", "O RENAVAM deve conter exatamente 11 dígitos numéricos.");
      return;
    }

    // Gating for documents
    if (!crlvFront.uri || !crlvBack.uri || !vehiclePhoto.uri) {
      Alert.alert("Documentos ausentes", "É obrigatório anexar Frente/Verso do CRLV e Foto do Veículo para prosseguir.");
      return;
    }

    setSubmitting(true);
    try {
      const vehicle = await driverService.addVehicle({
        type: newVehicleType as any,
        plate: newPlate,
        model: newModel,
        color: newColor || undefined,
        year: newYear ? Number(newYear) : undefined,
        renavam: newRenavam,
        documents: {
          crlvFront: crlvFront.uri,
          crlvBack: crlvBack.uri,
          vehiclePhoto: vehiclePhoto.uri,
        }
      });

      if (vehicle && vehicle._id) {
        const formData = new FormData();
        
        if (crlvFront.uri) {
          const filename = crlvFront.uri.split("/").pop() || "crlvFront.jpg";
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          formData.append("crlvFront", {
            uri: Platform.OS === "ios" ? crlvFront.uri.replace("file://", "") : crlvFront.uri,
            name: filename,
            type: mimeType,
          } as any);
        }

        if (crlvBack.uri) {
          const filename = crlvBack.uri.split("/").pop() || "crlvBack.jpg";
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          formData.append("crlvBack", {
            uri: Platform.OS === "ios" ? crlvBack.uri.replace("file://", "") : crlvBack.uri,
            name: filename,
            type: mimeType,
          } as any);
        }

        if (vehiclePhoto.uri) {
          const filename = vehiclePhoto.uri.split("/").pop() || "vehiclePhoto.jpg";
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          formData.append("vehiclePhoto", {
            uri: Platform.OS === "ios" ? vehiclePhoto.uri.replace("file://", "") : vehiclePhoto.uri,
            name: filename,
            type: mimeType,
          } as any);
        }

        await driverService.uploadVehicleDocuments(vehicle._id, formData);
      }

      Toast.show({
        type: "success",
        text1: "Veículo e documentos enviados!",
        text2: "Aguarde a liberação administrativa.",
      });

      // Reset states
      setNewPlate("");
      setNewModel("");
      setNewColor("");
      setNewYear("");
      setNewRenavam("");
      setCrlvFront({ uri: null, loading: false });
      setCrlvBack({ uri: null, loading: false });
      setVehiclePhoto({ uri: null, loading: false });

      // Go back and refresh
      setViewMode("list");
      fetchFleet();

    } catch (e: any) {
      Alert.alert("Falha ao registrar", e?.response?.data?.error || e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeVehicle = useMemo(() => {
    return fleet.find((v) => v._id === activeVehicleId);
  }, [fleet, activeVehicleId]);

  const activeLabel = VEHICLE_TYPES.find(v => v.id === activeVehicle?.type)?.label || "Nenhum Veículo Ativo";
  const activeIcon = VEHICLE_TYPES.find(v => v.id === activeVehicle?.type)?.icon || "directions-car";

  if (loading) {
    return (
      <DriverScreen title="Frota..." hideHeader={true}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#02de95" />
        </View>
      </DriverScreen>
    );
  }

  // ------------------ MODE: LIST ALL FLEET VEHICLES ------------------
  if (viewMode === "list") {
    return (
      <DriverScreen title="Minha Frota" hideHeader={true} scroll>
        
        {/* 👑 Top Glow Active Vehicle Card */}
        <LinearGradient
          colors={activeVehicle ? ["rgba(2, 222, 149, 0.15)", "rgba(11, 26, 42, 0.8)"] : ["rgba(239, 68, 68, 0.08)", "rgba(11, 26, 42, 0.6)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 24,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: activeVehicle ? "rgba(2, 222, 149, 0.35)" : "rgba(255,255,255,0.1)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: activeVehicle ? "#02de95" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 }}>
              {activeVehicle ? "🟢 VEÍCULO ATIVO ATUALMENTE" : "🔴 NENHUM VEÍCULO SELECIONADO"}
            </Text>
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 4 }}>
              {activeVehicle ? activeVehicle.model : "Selecione um veículo"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <View style={{ backgroundColor: activeVehicle ? "rgba(2, 222, 149, 0.12)" : "rgba(255,255,255,0.08)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ color: activeVehicle ? "#02de95" : "#fff", fontSize: 12, fontWeight: "700" }}>
                  {activeVehicle ? activeVehicle.plate : "---"}
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" }}>
                {activeLabel}
              </Text>
            </View>
          </View>
          
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: activeVehicle ? "rgba(2, 222, 149, 0.18)" : "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: activeVehicle ? "#02de95" : "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <MaterialIcons name={activeIcon} size={32} color={activeVehicle ? "#02de95" : "rgba(255,255,255,0.4)"} />
          </View>
        </LinearGradient>

        {/* 📑 Active Vehicle Documents Section (Centralized here) */}
        {activeVehicle && (
          <View style={{ marginBottom: 30 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
              <FileText size={16} color="#02de95" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Documentação do Veículo Ativo
              </Text>
            </View>
            
            <SectionCard style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", marginBottom: 6, textTransform: "uppercase" }}>CRLV Frente/Verso</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1, height: 80, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: activeVehicle.documents?.crlvFront ? "rgba(2, 222, 149, 0.3)" : "rgba(255,255,255,0.1)" }}>
                      {activeVehicle.documents?.crlvFront ? (
                        <Image source={{ uri: activeVehicle.documents.crlvFront }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      ) : (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><MaterialIcons name="image-not-supported" size={20} color="rgba(255,255,255,0.2)" /></View>
                      )}
                    </View>
                    <View style={{ flex: 1, height: 80, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: activeVehicle.documents?.crlvBack ? "rgba(2, 222, 149, 0.3)" : "rgba(255,255,255,0.1)" }}>
                      {activeVehicle.documents?.crlvBack ? (
                        <Image source={{ uri: activeVehicle.documents.crlvBack }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      ) : (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><MaterialIcons name="image-not-supported" size={20} color="rgba(255,255,255,0.2)" /></View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={{ flex: 0.5 }}>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", marginBottom: 6, textTransform: "uppercase" }}>Foto Veículo</Text>
                  <View style={{ width: "100%", height: 80, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: activeVehicle.documents?.vehiclePhoto ? "rgba(2, 222, 149, 0.3)" : "rgba(255,255,255,0.1)" }}>
                    {activeVehicle.documents?.vehiclePhoto ? (
                      <Image source={{ uri: activeVehicle.documents.vehiclePhoto }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><MaterialIcons name="image-not-supported" size={20} color="rgba(255,255,255,0.2)" /></View>
                    )}
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={{ marginTop: 12, alignSelf: "center", paddingVertical: 4, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8 }}
                onPress={() => setViewMode("add")}
              >
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700" }}>Editar ou Trocar Veículo</Text>
              </TouchableOpacity>
            </SectionCard>
          </View>
        )}

        {/* Row Header for Fleet */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingHorizontal: 2 }}>
          <View>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Todos os Veículos</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{fleet.length} {fleet.length === 1 ? "veículo registrado" : "veículos registrados"}</Text>
          </View>
          
          <TouchableOpacity 
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(2, 222, 149, 0.12)",
              borderWidth: 1,
              borderColor: "#02de95",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6
            }}
            onPress={() => setViewMode("add")}
          >
            <Plus size={16} color="#02de95" />
            <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 12 }}>Novo</Text>
          </TouchableOpacity>
        </View>

        {/* Empty Fleet Alert */}
        {fleet.length === 0 && (
          <View style={{ alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderStyle: "dashed" }}>
            <Truck size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Nenhum veículo cadastrado</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", marginTop: 6, paddingHorizontal: 20 }}>
              Cadastre seu primeiro veículo fornecendo os dados técnicos e fotos da documentação para começar.
            </Text>
          </View>
        )}

        {/* Fleet List */}
        <View style={{ gap: 16, marginBottom: 40 }}>
          {fleet.map((vehicle) => {
            const isActive = vehicle._id === activeVehicleId;
            const isApproved = vehicle.status === "approved";
            const isPending = vehicle.status === "pending";
            const isRejected = vehicle.status === "rejected";
            
            const vIcon = VEHICLE_TYPES.find(v => v.id === vehicle.type)?.icon || "directions-car";
            const vTypeLabel = VEHICLE_TYPES.find(v => v.id === vehicle.type)?.label || "Veículo";

            return (
              <SectionCard key={vehicle._id} style={{ padding: 16, borderWidth: 1.5, borderColor: isActive ? "#02de95" : "rgba(255,255,255,0.06)", opacity: refreshing ? 0.6 : 1 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
                  
                  {/* Mini Avatar */}
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: isApproved ? "rgba(2, 222, 149, 0.1)" : isPending ? "rgba(234, 179, 8, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <MaterialIcons name={vIcon} size={26} color={isApproved ? "#02de95" : isPending ? "#EAB308" : "#EF4444"} />
                  </View>

                  {/* Vehicle Data */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{vehicle.model}</Text>
                      
                      {/* Custom status pill badges */}
                      {isApproved ? (
                        <View style={{ backgroundColor: "rgba(2, 222, 149, 0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Aprovado</Text>
                        </View>
                      ) : isPending ? (
                        <View style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ color: "#EAB308", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Em Análise</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Recusado</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" }}>{vehicle.plate}</Text>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
                      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{vTypeLabel} • {vehicle.year || "Ano N/D"}</Text>
                      {vehicle.renavam ? (
                        <>
                          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>RNV: {vehicle.renavam}</Text>
                        </>
                      ) : null}
                    </View>

                    {/* Rejection Message */}
                    {isRejected && vehicle.rejectionReason && (
                      <View style={{ flexDirection: "row", backgroundColor: "rgba(239, 68, 68, 0.06)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)", padding: 10, borderRadius: 10, marginTop: 10, gap: 8, alignItems: "center" }}>
                        <AlertCircle size={16} color="#EF4444" />
                        <Text style={{ color: "rgba(239, 68, 68, 0.85)", fontSize: 12, fontWeight: "600", flex: 1 }}>
                          {vehicle.rejectionReason}
                        </Text>
                      </View>
                    )}

                    {/* Action Area per vehicle */}
                    {isApproved && !isActive && (
                      <TouchableOpacity
                        disabled={refreshing}
                        onPress={() => handleActivate(vehicle._id)}
                        style={{
                          alignSelf: "flex-end",
                          borderWidth: 1,
                          borderColor: "rgba(2, 222, 149, 0.5)",
                          backgroundColor: "rgba(2, 222, 149, 0.04)",
                          paddingHorizontal: 16,
                          paddingVertical: 6,
                          borderRadius: 12,
                          marginTop: 12
                        }}
                      >
                        <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 12 }}>Usar este Veículo</Text>
                      </TouchableOpacity>
                    )}

                    {isActive && (
                      <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-end", gap: 4, marginTop: 12, backgroundColor: "rgba(2, 222, 149, 0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <CheckCircle2 size={12} color="#02de95" />
                        <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "800" }}>Veículo Selecionado</Text>
                      </View>
                    )}

                  </View>
                </View>
              </SectionCard>
            );
          })}
        </View>

      </DriverScreen>
    );
  }

  // ------------------ MODE: ADD NEW VEHICLE FORM ------------------
  return (
    <DriverScreen title="Novo Veículo" hideHeader={true} scroll>
      
      {/* Floating header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 14 }}>
        <TouchableOpacity 
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            alignItems: "center",
            justifyContent: "center"
          }}
          onPress={() => setViewMode("list")}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>Cadastrar Veículo</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 1 }}>Envie os dados e documentos da máquina</Text>
        </View>
      </View>

      {/* Type Selector Grid */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "800", textTransform: "uppercase", paddingLeft: 4, marginBottom: 12 }}>
          Selecione o Tipo
        </Text>
        
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
          {VEHICLE_TYPES.map((item) => {
            const active = newVehicleType === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={{
                  width: "48.5%",
                  backgroundColor: active ? "rgba(2, 222, 149, 0.08)" : "rgba(255,255,255,0.02)",
                  borderRadius: 20,
                  paddingVertical: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: active ? "#02de95" : "rgba(255,255,255,0.08)",
                  gap: 8,
                  position: "relative",
                  shadowColor: active ? "#02de95" : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: active ? 0.15 : 0,
                  shadowRadius: 8,
                  elevation: active ? 3 : 0,
                }}
                onPress={() => setNewVehicleType(item.id)}
              >
                <MaterialIcons name={item.icon} size={26} color={active ? "#02de95" : "rgba(255,255,255,0.4)"} />
                <Text style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: active ? "800" : "600" }}>
                  {item.label}
                </Text>
                {active && (
                  <View style={{ position: "absolute", top: 8, right: 8 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#02de95" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main technical information inputs */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "800", textTransform: "uppercase", paddingLeft: 4, marginBottom: 12 }}>
          Informações Técnicas
        </Text>

        <SectionCard style={{ padding: 18, gap: 16 }}>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Ionicons name="build-outline" size={16} color="#02de95" style={{ opacity: 0.8 }} />
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>Modelo do Veículo</Text>
            </View>
            <TextField
              value={newModel}
              onChangeText={setNewModel}
              placeholder="Ex: Toyota Corolla, Yamaha Lander..."
            />
          </View>

          <View style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ flex: 1.2, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Ionicons name="card-outline" size={16} color="#02de95" style={{ opacity: 0.8 }} />
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>Placa</Text>
              </View>
              <TextField
                value={newPlate}
                onChangeText={(val) => setNewPlate(val.toUpperCase())}
                placeholder="ABC-1234"
                autoCapitalize="characters"
              />
            </View>

            <View style={{ flex: 0.8, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Ionicons name="calendar-outline" size={16} color="#02de95" style={{ opacity: 0.8 }} />
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>Ano</Text>
              </View>
              <TextField
                value={newYear}
                onChangeText={setNewYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="2024"
              />
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Ionicons name="color-palette-outline" size={16} color="#02de95" style={{ opacity: 0.8 }} />
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>Cor Predominante</Text>
            </View>
            <TextField
              value={newColor}
              onChangeText={setNewColor}
              placeholder="Ex: Preto, Prata, Vermelho..."
            />
          </View>

          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Ionicons name="document-text-outline" size={16} color="#02de95" style={{ opacity: 0.8 }} />
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>Renavam *</Text>
            </View>
            <TextField
              value={newRenavam}
              onChangeText={setNewRenavam}
              keyboardType="numeric"
              maxLength={11}
              placeholder="Código de 11 dígitos"
            />
          </View>
        </SectionCard>
      </View>

      {/* Document Pickers Integration */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "800", textTransform: "uppercase", paddingLeft: 4, marginBottom: 14 }}>
          Fotos de Documentação do Veículo
        </Text>

        {/* CRLV DUAL CARD */}
        <DualUploadDocumentCard
          title="Documento do Veículo (CRLV)"
          description="Certificado de Registro atualizado de licenciamento"
          icon={FileText}
          front={crlvFront}
          back={crlvBack}
          onPickFront={(s) => handlePick(s, "crlvFront")}
          onClearFront={() => handleClearDoc("crlvFront")}
          onPickBack={(s) => handlePick(s, "crlvBack")}
          onClearBack={() => handleClearDoc("crlvBack")}
          delay={50}
        />

        <View style={{ height: 8 }} />

        {/* VEHICLE PHOTO SINGLE CARD */}
        <UploadDocumentCard
          title="Foto Externa do Veículo"
          description="Garante que a placa e modelo estejam bem legíveis"
          icon={Truck}
          uri={vehiclePhoto.uri}
          loading={vehiclePhoto.loading}
          onCameraPress={() => handlePick("camera", "photo")}
          onGalleryPress={() => handlePick("gallery", "photo")}
          onClear={() => handleClearDoc("photo")}
          delay={150}
        />
      </View>

      {/* Submit Button Area */}
      <View style={{ marginBottom: 50 }}>
        {submitting ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#02de95" />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8, fontWeight: "700" }}>
              Enviando ficha de frota...
            </Text>
          </View>
        ) : (
          <ActionButton
            title="Cadastrar e Enviar p/ Análise"
            variant="primary"
            onPress={handleRegister}
          />
        )}
      </View>

    </DriverScreen>
  );
}
