import React, { useCallback, useMemo, useState } from "react";
import { Text, View, Image, TouchableOpacity, Modal, Dimensions, ActivityIndicator, Alert, Platform } from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import userService, { UserProfile } from "../../../services/user.service";
import { submitDriverVerification } from "../../../services/auth.service";
import { useAuthStore } from "../../../context/authStore";

const { width, height } = Dimensions.get("window");

type DocKey = "cnhFront" | "cnhBack" | "crlvFront" | "crlvBack" | "vehiclePhoto" | "selfie";

export default function DriverDocumentsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  const loadProfile = async () => {
    try {
      const me = await userService.getProfile();
      setProfile(me);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      setProfile(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const docs = useMemo(() => {
    const d = profile?.driverDocuments || {};
    return {
      cnhFront: d.cnhFront || null,
      cnhBack: d.cnhBack || null,
      crlvFront: d.crlvFront || null,
      crlvBack: d.crlvBack || null,
      vehiclePhoto: d.vehiclePhoto || null,
      selfie: d.selfie || null,
    };
  }, [profile]);

  const completedCount = Object.values(docs).filter(Boolean).length;
  const totalCount = 6;
  const progress = Math.round((completedCount / totalCount) * 100);

  const getStatusConfig = () => {
    const status = profile?.driverStatus || "pending";
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
        quality: 0.75,
      };

      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        await uploadFile(key, uri);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Erro ao selecionar arquivo" });
    }
  };

  const uploadFile = async (key: DocKey, uri: string) => {
    setUploadingKeys((prev) => ({ ...prev, [key]: true }));
    Toast.show({
      type: "info",
      text1: "Enviando documento...",
      text2: "Por favor, aguarde alguns instantes.",
      autoHide: false,
    });

    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || `${key}.jpg`;
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      formData.append(key, {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: mimeType,
      } as any);

      const token = useAuthStore.getState().token || undefined;
      const response = await submitDriverVerification(formData, token);

      Toast.hide();
      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Documento anexado com sucesso.",
        });
        await loadProfile(); // Refresh UI
      } else {
        Toast.show({
          type: "error",
          text1: "Falha no envio",
          text2: response.message || "Não foi possível salvar o documento.",
        });
      }
    } catch (e) {
      Toast.hide();
      Toast.show({ type: "error", text1: "Erro crítico de conexão" });
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
          borderColor: isUploading ? "#02de95" : url ? "rgba(2, 222, 149, 0.25)" : "rgba(255,255,255,0.08)",
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
                <Ionicons name="eye" size={12} color="#fff" />
              </View>
            </>
          ) : (
            <View style={{ alignItems: "center", opacity: 0.5 }}>
              <MaterialIcons name="add-photo-alternate" size={26} color="#02de95" />
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
              <MaterialIcons name="check-circle" size={10} color="#02de95" />
              <Text style={{ color: "#02de95", fontSize: 9, fontWeight: "900" }}>ENVIADO</Text>
            </View>
          ) : (
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>Pendente</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <DriverScreen title="Documentos do Condutor" scroll hideHeader={true}>
      
      {/* 📊 Resumo do Painel */}
      <SectionCard style={{ padding: 18, borderRadius: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Status do Cadastro
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 }}>
              <MaterialIcons name={statusCfg.icon} size={20} color={statusCfg.color} />
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
          {completedCount} de {totalCount} documentos válidos detectados.
        </Text>
      </SectionCard>

      {/* 💳 Grupo 1: Carteira de Habilitação */}
      <View style={{ marginVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <FontAwesome5 name="id-card" size={14} color="#02de95" style={{ opacity: 0.8 }} />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Carteira de Motorista (CNH)
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("FRENTE CNH", "cnhFront", docs.cnhFront)}
          {renderDocThumbnail("VERSO CNH", "cnhBack", docs.cnhBack)}
        </View>
      </View>

      {/* 🚗 Grupo 2: Documento Veicular */}
      <View style={{ marginVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <FontAwesome5 name="file-contract" size={14} color="#02de95" style={{ opacity: 0.8 }} />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Documento do Veículo (CRLV)
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("FRENTE CRLV", "crlvFront", docs.crlvFront)}
          {renderDocThumbnail("VERSO CRLV", "crlvBack", docs.crlvBack)}
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          {renderDocThumbnail("FOTO DO VEÍCULO", "vehiclePhoto", docs.vehiclePhoto)}
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* 🛡️ Grupo 3: Identidade e Veículo */}
      <View style={{ marginVertical: 12, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <FontAwesome5 name="shield-alt" size={14} color="#02de95" style={{ opacity: 0.8 }} />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Segurança e Fotos
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("SELFIE DO MOTORISTA", "selfie", docs.selfie)}
          <View style={{ flex: 1 }} />
        </View>
      </View>

      <SectionCard style={{ marginBottom: 30, borderRadius: 16 }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Ionicons name="information-circle-outline" size={20} color="#02de95" style={{ opacity: 0.7 }} />
          <Text style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 16 }}>
            Toque nos itens vazios para carregar fotos nítidas ou toque em miniaturas já enviadas para visualizá-las em tela cheia.
          </Text>
        </View>
      </SectionCard>

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
            <Ionicons name="close" size={28} color="#fff" />
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
