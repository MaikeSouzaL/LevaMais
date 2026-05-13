import React, { useCallback, useMemo, useState } from "react";
import { Text, View, Image, TouchableOpacity, Modal, Dimensions, ActivityIndicator, ScrollView } from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import userService, { UserProfile } from "../../../services/user.service";

const { width, height } = Dimensions.get("window");

export default function DriverDocumentsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
         try {
           const me = await userService.getProfile();
           if (!mounted) return;
           setProfile(me);
         } catch (error) {
           console.error("Erro ao carregar documentos:", error);
           if (!mounted) return;
           setProfile(null);
         }
      })();

      return () => {
        mounted = false;
      };
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
      return { label: "Cadastro Aprovado", icon: "verified", color: "#10B981" } as const;
    }
    if (status === "rejected") {
      return { label: "Documentos Rejeitados", icon: "error-outline", color: "#EF4444" } as const;
    }
    return { label: "Em AnÃ¡lise / Pendente", icon: "history", color: "#F59E0B" } as const;
  };

  const statusCfg = getStatusConfig();

  const renderDocThumbnail = (title: string, url: string | null) => {
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          minHeight: 120,
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: url ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.08)",
          borderStyle: url ? "solid" : "dashed",
          overflow: "hidden",
          padding: 6,
        }}
        disabled={!url}
        onPress={() => {
          if (url) {
            setImageLoading(true);
            setSelectedImage(url);
          }
        }}
      >
        <View style={{ flex: 1, borderRadius: 12, overflow: "hidden", backgroundColor: "#081322", justifyContent: "center", alignItems: "center" }}>
          {url ? (
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
            <View style={{ alignItems: "center", opacity: 0.4 }}>
              <MaterialIcons name="add-photo-alternate" size={24} color="#fff" />
            </View>
          )}
        </View>
        <View style={{ paddingHorizontal: 4, paddingVertical: 6, alignItems: "center" }}>
          <Text numberOfLines={1} style={{ color: url ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700" }}>{title}</Text>
          {url ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 2 }}>
              <MaterialIcons name="check-circle" size={10} color="#10B981" />
              <Text style={{ color: "#10B981", fontSize: 9, fontWeight: "800" }}>ENVIADO</Text>
            </View>
          ) : (
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>NÃ£o enviado</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <DriverScreen title="Documentos Enviados" scroll hideHeader={true}>
      
      {/* 📊 Resumo do Painel */}
      <SectionCard style={{ padding: 18 }}>
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

        {/* Barra de progresso de nÃ­vel premium */}
        <View style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, marginTop: 16, overflow: "hidden" }}>
          <View style={{ width: `${progress}%`, height: "100%", backgroundColor: statusCfg.color, borderRadius: 3 }} />
        </View>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 6 }}>
          {completedCount} de {totalCount} documentos vÃ¡lidos detectados.
        </Text>
      </SectionCard>

      {/* 💳 Grupo 1: Carteira de HabilitaÃ§Ã£o */}
      <View style={{ marginVertical: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <FontAwesome5 name="id-card" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase" }}>
            Carteira de Motorista (CNH)
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("FRENTE CNH", docs.cnhFront)}
          {renderDocThumbnail("VERSO CNH", docs.cnhBack)}
        </View>
      </View>

      {/* 🚗 Grupo 2: Documento Veicular */}
      <View style={{ marginVertical: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <FontAwesome5 name="file-contract" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase" }}>
            Documento do VeÃ­culo (CRLV)
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("FRENTE CRLV", docs.crlvFront)}
          {renderDocThumbnail("VERSO CRLV", docs.crlvBack)}
        </View>
      </View>

      {/* 🛡️ Grupo 3: Identidade e VeÃ­culo */}
      <View style={{ marginVertical: 8, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
          <FontAwesome5 name="shield-alt" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 13, textTransform: "uppercase" }}>
            SeguranÃ§a e Fotos
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {renderDocThumbnail("FOTO DO VEÃCULO", docs.vehiclePhoto)}
          {renderDocThumbnail("SELFIE DO MOTORISTA", docs.selfie)}
        </View>
      </View>

      <SectionCard style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 16 }}>
            Toque em qualquer miniatura de documento acima para visualizÃ¡-lo em tela cheia em alta resoluÃ§Ã£o.
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
          
          {/* BotÃ£o flutuante para fechar */}
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
