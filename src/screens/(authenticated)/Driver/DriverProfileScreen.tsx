import React, { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View, Text, Image, ActivityIndicator, Alert } from "react-native";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import SectionCard from "../../../components/ui/SectionCard";
import TextField from "../../../components/ui/TextField";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";
import { DriverScreen } from "./components/DriverScreen";
import { useAuthStore } from "../../../context/authStore";

export default function DriverProfileScreen() {
  const navigation = useNavigation<any>();
  const cachedUser = useAuthStore((s) => s.userData);
  const updateAuthCache = useAuthStore((s) => s.updateUserData);
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Pre-hydrate immediately from local session cache! ⚡
  const [name, setName] = useState(cachedUser?.name || cachedUser?.nome || "");
  const [phone, setPhone] = useState(cachedUser?.phone || cachedUser?.telefone || "");
  const [city, setCity] = useState(cachedUser?.city || cachedUser?.cidade || "");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(cachedUser?.fotoPerfil || null);

  const canSave = useMemo(() => name.trim().length >= 2, [name]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        console.log("[Profile] Buscando dados do servidor...");
        const u = await userService.getProfile();
        
        if (__DEV__) {
          console.log("[Profile] Resposta do servidor:", JSON.stringify(u));
        }
        
        if (!mounted) return;
        
        // Sync states with DB values
        const resolvedName = u?.name || u?.nome || name;
        const resolvedPhone = u?.phone || u?.telefone || phone;
        const resolvedCity = u?.city || u?.cidade || city;
        const photoUrl = u?.profilePhoto || u?.driverDocuments?.selfie || profilePhoto;
        
        setName(resolvedName);
        setPhone(resolvedPhone);
        setCity(resolvedCity);
        setProfilePhoto(photoUrl);

        // Gracefully refresh local store cache for other screens
        updateAuthCache({
          name: resolvedName,
          nome: resolvedName,
          telefone: resolvedPhone,
          cidade: resolvedCity,
          fotoPerfil: photoUrl,
        });

      } catch (e: any) {
        console.error("[Profile] Erro ao carregar perfil:", e);
        Toast.show({
          type: "error",
          text1: "Falha ao carregar",
          text2: e?.message || "Verifique sua internet.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "info",
          text1: "Permissão negada",
          text2: "Precisamos de acesso à galeria para alterar sua foto.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const localUri = result.assets[0].uri;
      setUploadingPhoto(true);
      
      // Instantly stream photo binary up to the dedicated profile uploader 🚀
      const remoteUrl = await userService.uploadProfilePhoto(localUri);
      setProfilePhoto(remoteUrl);
      
      Toast.show({ type: "success", text1: "Foto de perfil atualizada!" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha no upload",
        text2: e?.message || "Não foi possível enviar a imagem.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function save() {
    if (!canSave) return;
    setLoading(true);
    try {
      const updated = await userService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      
      // Update local cache immediately 🚀
      updateAuthCache({
        name: updated?.name || name.trim(),
        nome: updated?.name || name.trim(),
        telefone: updated?.phone || phone.trim(),
        cidade: updated?.city || city.trim(),
      });

      Toast.show({ type: "success", text1: "Perfil atualizado" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível salvar",
        text2: e?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverScreen title="Perfil" hideHeader={true} scroll={true}>
      {/* High-end Interactive Avatar Selector Component 👑 */}
      <View style={{ alignItems: "center", marginVertical: 24 }}>
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={pickImage}
          disabled={uploadingPhoto}
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            borderWidth: 2,
            borderColor: "#02de95",
            backgroundColor: "rgba(255,255,255,0.04)",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            shadowColor: "#02de95",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {uploadingPhoto ? (
            <ActivityIndicator color="#02de95" size="small" />
          ) : profilePhoto ? (
            <Image 
              source={{ uri: profilePhoto }} 
              style={{ width: "100%", height: "100%", borderRadius: 55 }} 
            />
          ) : (
            <MaterialIcons name="person" size={60} color="rgba(255,255,255,0.2)" />
          )}
          
          {/* Absolute camera edit badge over the bottom-right curve */}
          <View style={{
            position: "absolute",
            bottom: 0,
            right: 2,
            backgroundColor: "#02de95",
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 3,
            borderColor: "#091A2F", // Using default screen dark bg
          }}>
            <MaterialIcons name="camera-alt" size={15} color="#091A2F" />
          </View>
        </TouchableOpacity>
        <Text style={{ 
          color: "rgba(255,255,255,0.4)", 
          fontSize: 12, 
          fontWeight: "700", 
          marginTop: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5
        }}>
          Alterar foto de perfil
        </Text>
      </View>

      <SectionCard>
        <Text style={{ color: "#fff", fontWeight: "900" }}>Dados</Text>
        <View style={{ height: 12 }} />
        <TextField label="Nome" value={name} onChangeText={setName} />
        <TextField label="Telefone" value={phone} onChangeText={setPhone} />
        <TextField label="Cidade" value={city} onChangeText={setCity} />
      </SectionCard>

      <SectionCard>
        <Text style={{ color: "#fff", fontWeight: "900", marginBottom: 8 }}>
          Atalhos de conta
        </Text>

        <QuickAccessRow
          icon="description"
          title="Documentos"
          subtitle="Status da sua documentacao"
          onPress={() => navigation.navigate("DriverDocuments")}
        />
        <QuickAccessRow
          icon="tune"
          title="Preferencias"
          subtitle="Corridas, entregas e aceite"
          onPress={() => navigation.navigate("DriverWorkPreferences")}
        />
        <QuickAccessRow
          icon="star"
          title="Avaliacoes"
          subtitle="Notas e feedback dos clientes"
          onPress={() => navigation.navigate("DriverRatings")}
        />
      </SectionCard>

      <ActionButton
        title={loading ? "Salvando..." : "Salvar"}
        variant="primary"
        onPress={save}
        disabled={!canSave || loading}
      />
    </DriverScreen>
  );
}

function QuickAccessRow(props: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={props.onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
      }}
    >
      <MaterialIcons name={props.icon} size={20} color="#02de95" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{props.title}</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
          {props.subtitle}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );
}
