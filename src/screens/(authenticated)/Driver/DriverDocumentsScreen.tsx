import React, { useCallback, useMemo, useState } from "react";
import { Text, View, Image, TouchableOpacity, Modal, Dimensions, ActivityIndicator, Alert, Platform } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import {
  getMyDriverDetails,
  uploadDriverDocument,
  getKycSelfieUrl,
  type DriverDocKind,
} from "../../../services/supabase-auth.service";

const { width, height } = Dimensions.get("window");

type DocKey = "cnhFront" | "cnhBack" | "crlvFront" | "crlvBack" | "vehiclePhoto" | "selfie";

// Mapeia a chave da UI para o tipo de documento do Supabase
const DOC_KIND_MAP: Record<DocKey, DriverDocKind> = {
  cnhFront: "cnh_front",
  cnhBack: "cnh_back",
  selfie: "selfie",
  crlvFront: "crlv_front",
  crlvBack: "crlv_back",
  vehiclePhoto: "vehicle_photo",
};

export default function DriverDocumentsScreen() {
  const navigation = useNavigation();
  const [driverStatus, setDriverStatus] = useState<string>("none");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ cnhFront: string | null; cnhBack: string | null; selfie: string | null }>({
    cnhFront: null,
    cnhBack: null,
    selfie: null,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  const loadProfile = async () => {
    try {
      const d = await getMyDriverDetails();
      setDriverStatus((d?.status as string) || "none");
      setRejectionReason(d?.rejection_reason || null);
      // Gera URLs assinadas para exibição (bucket privado)
      const [cnhFront, cnhBack, selfie] = await Promise.all([
        getKycSelfieUrl(d?.cnh_front_url),
        getKycSelfieUrl(d?.cnh_back_url),
        getKycSelfieUrl(d?.selfie_url),
      ]);
      setDocs({ cnhFront, cnhBack, selfie });
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const isApproved = useMemo(() => driverStatus === "approved", [driverStatus]);

  const completedCount = Object.values(docs).filter(Boolean).length;
  const totalCount = 3;
  const progress = Math.round((completedCount / totalCount) * 100);

  const getStatusConfig = () => {
    const status = driverStatus || "pending";
    if (status === "approved") {
      return { label: "Cadastro Aprovado", icon: "verified", color: "#02de95" } as const;
    }
    if (status === "rejected") {
      return { label: "Documentos Rejeitados", icon: "error-outline", color: "#EF4444" } as const;
    }
    return { label: "Em Análise / Pendente", icon: "history", color: "#F59E0B" } as const;
  };

  const statusCfg = getStatusConfig();

  const handleUpload = async (key: DocKey) => {
    Alert.alert(
      "Selecionar Documento",
      "Escolha a origem da imagem:",
      [
        {
          text: "Câmera",
          onPress: () => pickImage(key, "camera"),
        },
        {
          text: "Galeria",
          onPress: () => pickImage(key, "gallery"),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]
    );
  };

  const pickImage = async (key: DocKey, source: "camera" | "gallery") => {
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
        quality: 0.7,
        base64: true,
      };

      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64 = result.assets[0].base64;
        if (!base64) {
          Toast.show({ type: "error", text1: "Imagem inválida (sem dados)" });
          return;
        }
        await uploadFile(key, base64);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Erro ao selecionar arquivo" });
    }
  };

  const uploadFile = async (key: DocKey, base64: string) => {
    setUploadingKeys((prev) => ({ ...prev, [key]: true }));
    Toast.show({
      type: "info",
      text1: "Enviando documento...",
      text2: "Por favor, aguarde alguns instantes.",
      autoHide: false,
    });

    try {
      const { status } = await uploadDriverDocument(DOC_KIND_MAP[key], base64);
      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: status === "approved" ? "Documento anexado — cadastro aprovado!" : "Documento anexado com sucesso.",
      });
      await loadProfile(); // Atualiza UI (URLs assinadas + status)
    } catch (e: any) {
      Toast.hide();
      Toast.show({ type: "error", text1: "Falha no envio", text2: e?.message || "Erro de conexão" });
    } finally {
      setUploadingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const renderDocThumbnail = (title: string, key: DocKey, url: string | null) => {
    const isUploading = uploadingKeys[key];

    return (
      <TouchableOpacity
        style={{
          flex: 1,
          minHeight: 130,
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isUploading ? "#02de95" : url ? (isApproved ? "rgba(2, 222, 149, 0.25)" : "rgba(245, 158, 11, 0.25)") : "rgba(255,255,255,0.08)",
          borderStyle: url ? "solid" : "dashed",
          overflow: "hidden",
          padding: 6,
        }}
        onPress={() => {
          if (isUploading) return;
          if (url) {
            setImageLoading(true);
            setSelectedImage(url);
          } else {
            handleUpload(key);
          }
        }}
      >
        <View style={{ flex: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#081322", justifyContent: "center", alignItems: "center" }}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#02de95" />
          ) : url ? (
            <>
              <Image 
                source={{ uri: url }} 
                style={{ width: "100%", height: "100%" }} 
                resizeMode="cover"
              />
              <View style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }}>
                <Icon name="eye" size={12} color="#fff" />
              </View>
            </>
          ) : (
            <View style={{ alignItems: "center", opacity: 0.5 }}>
              <Icon name="add-photo-alternate" size={26} color="#02de95" />
              <Text style={{ color: "#02de95", fontSize: 9, fontWeight: "900", marginTop: 4, letterSpacing: 0.5 }}>ENVIAR</Text>
            </View>
          )}
        </View>
        <View style={{ paddingHorizontal: 4, paddingVertical: 6, alignItems: "center" }}>
          <Text numberOfLines={1} style={{ color: url ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "800" }}>{title}</Text>
          {isUploading ? (
            <Text style={{ color: "#02de95", fontSize: 9, fontWeight: "700", marginTop: 2 }}>Enviando...</Text>
          ) : url ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 2 }}>
              <Icon name="check-circle" size={10} color={isApproved ? "#02de95" : "#f59e0b"} />
              <Text style={{ color: isApproved ? "#02de95" : "#f59e0b", fontSize: 9, fontWeight: "900" }}>
                {isApproved ? "APROVADO" : "EM ANÁLISE"}
              </Text>
            </View>
          ) : (
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>Pendente</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <DriverScreen title="Meus Documentos" scroll hideHeader={true}>
      
      {/* 📊 Resumo do Painel */}
      <SectionCard style={{ padding: 18, borderRadius: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Status do Cadastro
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 }}>
              <Icon name={statusCfg.icon} size={20} color={statusCfg.color} />
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
            <Text style={{ color: statusCfg.color, fontSize: 18, fontWeight: "900" }}>
              {progress}%
            </Text>
          </View>
        </View>

        {/* Barra de progresso de nível premium */}
        <View style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, marginTop: 16, overflow: "hidden" }}>
          <View style={{ width: `${progress}%`, height: "100%", backgroundColor: statusCfg.color, borderRadius: 3 }} />
        </View>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 6 }}>
          {completedCount} de {totalCount} documentos pessoais válidos.
        </Text>

        {/* Motivo da Rejeição */}
        {driverStatus === "rejected" && rejectionReason && (
          <View style={{ 
            flexDirection: "row", 
            backgroundColor: "rgba(239, 68, 68, 0.06)", 
            borderWidth: 1, 
            borderColor: "rgba(239, 68, 68, 0.2)", 
            padding: 12, 
            borderRadius: 14, 
            marginTop: 16, 
            gap: 8, 
            alignItems: "center" 
          }}>
            <Icon name="error" size={20} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>Motivo da Recusa:</Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                {rejectionReason}
              </Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* 💳 Grupo 1: Carteira de Habilitação */}
      <View style={{ marginVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <Icon name="id-card" size={14} color="#02de95" style={{ opacity: 0.8 }} />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Carteira de Motorista (CNH)
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("FRENTE CNH", "cnhFront", docs.cnhFront)}
          {renderDocThumbnail("VERSO CNH", "cnhBack", docs.cnhBack)}
        </View>
      </View>

      {/* 🛡️ Grupo 3: Identidade e Veículo */}
      <View style={{ marginVertical: 12, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <Icon name="camera" size={14} color="#02de95" style={{ opacity: 0.8 }} />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Reconhecimento Facial
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("SELFIE DO MOTORISTA", "selfie", docs.selfie)}
          <View style={{ flex: 1 }} />
        </View>
      </View>

      <SectionCard style={{ marginBottom: 30, borderRadius: 16 }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Icon name="information-circle-outline" size={20} color="#02de95" style={{ opacity: 0.7 }} />
          <Text style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 16 }}>
            Toque nos itens vazios para carregar fotos nítidas ou toque em miniaturas já enviadas para visualizá-las em tela cheia.
          </Text>
        </View>
      </SectionCard>

      {/* 🟢 Botão Salvar e Voltar */}
      <TouchableOpacity
        onPress={() => {
          if (completedCount < totalCount) {
            Alert.alert(
              "Documentação Incompleta",
              "Você não enviou todos os documentos necessários. Deseja salvar o progresso atual e voltar para o início?",
              [
                { text: "Continuar Editando", style: "cancel" },
                {
                  text: "Salvar e Sair",
                  onPress: () => {
                    Toast.show({
                      type: "success",
                      text1: "Progresso salvo!",
                      text2: "Conclua o envio mais tarde para ser aprovado.",
                    });
                    navigation.navigate("DriverHome" as never);
                  }
                }
              ]
            );
          } else {
            Toast.show({
              type: "success",
              text1: "Documentos salvos!",
              text2: "Suas informações estão sob análise da nossa equipe.",
            });
            navigation.navigate("DriverHome" as never);
          }
        }}
        style={{
          backgroundColor: "#02de95",
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          shadowColor: "#02de95",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Text style={{ color: "#081322", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 }}>
          SALVAR E VOLTAR
        </Text>
      </TouchableOpacity>

      {/* 🌌 Lightbox Modal Viewer (Visualizador Imersivo) */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
          
          {/* Botão flutuante para fechar */}
          <TouchableOpacity
            style={{ position: "absolute", top: 40, right: 20, zIndex: 10, padding: 8, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.1)" }}
            onPress={() => setSelectedImage(null)}
          >
            <Icon name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {selectedImage && (
            <View style={{ width: width, height: height * 0.8, justifyContent: "center", alignItems: "center" }}>
              {imageLoading && (
                <ActivityIndicator size="large" color="#fff" style={{ position: "absolute" }} />
              )}
              <Image
                source={{ uri: selectedImage }}
                style={{ width: "90%", height: "100%" }}
                resizeMode="contain"
                onLoadEnd={() => setImageLoading(false)}
              />
            </View>
          )}

          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, position: "absolute", bottom: 40 }}>
            Visualizador de Documento Seguro
          </Text>
        </View>
      </Modal>
    </DriverScreen>
  );
}
