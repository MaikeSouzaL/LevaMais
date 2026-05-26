import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import userService from "@/services/user.service";
import {
  User,
  History,
  Receipt,
  Star,
  Wallet,
  CreditCard,
  Tag,
  Shield,
  Bell,
  HeadphonesIcon,
  Lock,
  UserPlus,
  Settings,
  HelpCircle,
  ChevronRight,
  LogOut,
  Truck,
  Edit3,
  ArrowLeft,
} from "lucide-react-native";

import { useAuthStore } from "@/context/authStore";
import { ClientStackParamList } from "../../types/navigation";

type ProfileRoute = keyof ClientStackParamList;

interface MenuItem {
  icon: any;
  label: string;
  subtitle?: string;
  screen: ProfileRoute;
  color?: string;
  badge?: string;
}

const MENU_GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Pedidos",
    items: [
      { icon: History,       label: "Histórico",          subtitle: "Corridas e entregas",     screen: "History",           color: "#60a5fa" },
      { icon: Receipt,       label: "Comprovantes",        subtitle: "Notas e recibos",         screen: "Receipts",          color: "#34d399" },
      { icon: Truck,         label: "Plantões Motoboy",    subtitle: "Motoristas fixos",        screen: "ShiftOffersClient", color: "#a78bfa" },
      { icon: Star,          label: "Favoritos",           subtitle: "Endereços salvos",        screen: "Favorites",         color: "#fbbf24" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: Wallet,        label: "Carteira",            subtitle: "Saldo e movimentações",   screen: "Wallet",            color: "#02de95" },
      { icon: CreditCard,    label: "Pagamentos",          subtitle: "Cartões e métodos",       screen: "PaymentsCenter",    color: "#3b82f6" },
      { icon: Tag,           label: "Cupons",              subtitle: "Descontos e promoções",   screen: "Coupons",           color: "#f59e0b" },
    ],
  },
  {
    title: "Conta e Segurança",
    items: [
      { icon: Edit3,         label: "Editar Perfil",       subtitle: "Nome, foto e dados",      screen: "EditAccount",       color: "#94a3b8" },
      { icon: Shield,        label: "Segurança",           subtitle: "Proteção e emergência",   screen: "SafetyCenter",      color: "#f43f5e" },
      { icon: Bell,          label: "Notificações",        subtitle: "Alertas e mensagens",     screen: "NotificationsCenter", color: "#fb923c" },
      { icon: Lock,          label: "Privacidade",         subtitle: "Seus dados",              screen: "PrivacyData",       color: "#64748b" },
    ],
  },
  {
    title: "Mais",
    items: [
      { icon: HeadphonesIcon, label: "Suporte",            subtitle: "Central de atendimento",  screen: "SupportCenter",     color: "#22d3ee" },
      { icon: UserPlus,      label: "Convidar Amigos",     subtitle: "Ganhe bônus",             screen: "InviteFriends",     color: "#a78bfa" },
      { icon: Settings,      label: "Configurações",       subtitle: "Preferências do app",     screen: "Settings",          color: "#94a3b8" },
      { icon: HelpCircle,    label: "Ajuda Rápida",        subtitle: "FAQ e tutoriais",         screen: "Help",              color: "#60a5fa" },
    ],
  },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "Profile">>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.userData);
  const logout = useAuthStore((state) => state.logout);

  const displayName = user?.name || user?.nome || "Usuário";
  const displayEmail = user?.email || "sem-email@leva-mais.app";
  const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  const [uploadingImage, setUploadingImage] = React.useState(false);

  const profileImageUrl = user?.fotoPerfil || user?.profilePhoto;

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Precisamos de permissão para acessar suas fotos.",
      });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const uri = pickerResult.assets[0].uri;
      setUploadingImage(true);
      try {
        const newPhotoUrl = await userService.uploadProfilePhoto(uri);
        useAuthStore.getState().updateUserData({ 
          profilePhoto: newPhotoUrl,
          fotoPerfil: newPhotoUrl
        });
        Toast.show({
          type: "success",
          text1: "Foto atualizada!",
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Erro ao atualizar foto",
          text2: error.message || "Tente novamente mais tarde.",
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Avatar */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            paddingTop: insets.top + 24,
            paddingHorizontal: 24,
            paddingBottom: 28,
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              top: insets.top + 12,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.03)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          {/* Avatar */}
          <View style={{ position: "relative", marginBottom: 16 }}>
            {profileImageUrl ? (
              <Image 
                source={{ uri: profileImageUrl }} 
                style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 2.5, borderColor: "rgba(2,222,149,0.35)" }} 
              />
            ) : (
              <View style={{
                width: 88, height: 88, borderRadius: 44,
                backgroundColor: "rgba(2,222,149,0.12)",
                borderWidth: 2.5, borderColor: "rgba(2,222,149,0.35)",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: "#02de95", fontSize: 32, fontWeight: "900" }}>{initials}</Text>
              </View>
            )}

            {uploadingImage && (
              <View style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: "rgba(9,26,47,0.6)", borderRadius: 44, 
                alignItems: "center", justifyContent: "center"
              }}>
                <ActivityIndicator color="#02de95" size="small" />
              </View>
            )}

            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploadingImage}
              style={{
                position: "absolute", bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: "#02de95",
                borderWidth: 2, borderColor: "#091A2F",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Edit3 size={13} color="#091A2F" />
            </TouchableOpacity>
          </View>

          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 4 }}>
            {displayName}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {displayEmail}
          </Text>
        </MotiView>

        {/* Menu Groups */}
        {MENU_GROUPS.map((group, gIndex) => (
          <MotiView
            key={group.title}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: gIndex * 60 }}
            style={{ marginTop: 20, paddingHorizontal: 20 }}
          >
            <Text style={{
              color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "800",
              textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginLeft: 4,
            }}>
              {group.title}
            </Text>

            <View style={{
              backgroundColor: "#11253E", borderRadius: 20,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              {group.items.map((item, iIndex) => {
                const Icon = item.icon;
                const isLast = iIndex === group.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.screen}
                    onPress={() => navigation.navigate(item.screen as any)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row", alignItems: "center",
                      paddingHorizontal: 16, paddingVertical: 14,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: "rgba(255,255,255,0.04)",
                      gap: 14,
                    }}
                  >
                    <View style={{
                      width: 38, height: 38, borderRadius: 12,
                      backgroundColor: (item.color || "#02de95") + "18",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} color={item.color || "#02de95"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                        {item.label}
                      </Text>
                      {item.subtitle && (
                        <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 }}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                    {item.badge && (
                      <View style={{ backgroundColor: "#02de95", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ color: "#091A2F", fontSize: 10, fontWeight: "900" }}>{item.badge}</Text>
                      </View>
                    )}
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </MotiView>
        ))}

        {/* Logout */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 280 }}
          style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 8 }}
        >
          <TouchableOpacity
            onPress={logout}
            activeOpacity={0.85}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 10, height: 52, borderRadius: 16,
              borderWidth: 1.5, borderColor: "rgba(239,68,68,0.35)",
              backgroundColor: "rgba(239,68,68,0.07)",
            }}
          >
            <LogOut size={18} color="#ef4444" />
            <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "800" }}>Sair da Conta</Text>
          </TouchableOpacity>
        </MotiView>

        <Text style={{ color: "rgba(255,255,255,0.12)", fontSize: 11, textAlign: "center", marginTop: 12 }}>
          Leva Mais · v1.0
        </Text>
      </ScrollView>
    </View>
  );
}
