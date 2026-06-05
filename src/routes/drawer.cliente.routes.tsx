import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Icon } from "@/components/ui/Icon";

import { useAuthStore } from "../context/authStore";
import ClientStackRoutes from "./client.stack.routes";
import { colors } from "@/theme";
import { resolveAssetURL } from "@/utils/mappers";

type DrawerClienteRoutesProps = {
  initialRideId?: string | null;
  onActivated?: () => void;
};

const Drawer = createDrawerNavigator();

const menuItems = [
  { route: "Home", label: "Início", icon: "home" },
  { route: "History", label: "Histórico", icon: "history" },
  { route: "ActiveOrders", label: "Pedidos ativos", icon: "map-marker-path" },
  { route: "ShiftOffersClient", label: "Plantões motoboy", icon: "store-clock-outline" },
  { route: "PlannedRoutes", label: "Encomendas em rota", icon: "route" },
  { route: "Freight", label: "Fretes / Transportadoras", icon: "truck" },
  { route: "Receipts", label: "Comprovantes", icon: "receipt-text-outline" },
  { route: "Wallet", label: "Carteira", icon: "wallet" },
  { route: "PaymentsCenter", label: "Pagamentos", icon: "credit-card-outline" },
  { route: "Coupons", label: "Cupons", icon: "ticket-percent-outline" },
  { route: "Profile", label: "Perfil", icon: "account-circle" },
  { route: "NotificationsCenter", label: "Notificações", icon: "bell" },
  { route: "Favorites", label: "Favoritos", icon: "star" },
  { route: "SafetyCenter", label: "Segurança", icon: "shield-check" },
  { route: "SupportCenter", label: "Suporte", icon: "lifebuoy" },
  { route: "PrivacyData", label: "Privacidade", icon: "shield-account-outline" },
  { route: "InviteFriends", label: "Convidar amigos", icon: "account-multiple-plus-outline" },
  { route: "Settings", label: "Configurações", icon: "cog" },
];

import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { userData, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const nestedState = (props.state.routes[props.state.index] as any)?.state;
  const nestedRoutes = nestedState?.routes || [];
  const nestedIndex = nestedState?.index || 0;
  const activeNestedRoute = nestedRoutes[nestedIndex]?.name || "Home";

  const navigateToStackScreen = (screenName: string) => {
    (props.navigation as any).navigate("ClientMain", { screen: screenName });
  };

  const displayName = userData?.name || userData?.nome || "Cliente";
  const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  const profileImageUrl = resolveAssetURL(userData?.fotoPerfil || userData?.profilePhoto);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Fixed Header */}
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {userData?.email || "Bem-vindo"}
          </Text>
          <TouchableOpacity 
            onPress={() => navigateToStackScreen("Profile")} 
            style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" }}>
              Editar minhas informações
            </Text>
            <Icon name="chevron-right" size={14} color="rgba(255,255,255,0.5)" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => navigateToStackScreen("Profile")}
          activeOpacity={0.8}
        >
          {profileImageUrl ? (
            <Image 
              source={{ uri: profileImageUrl }} 
              style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.primary[500] }} 
            />
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(2,222,149,0.12)", alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: "rgba(2,222,149,0.35)" }}>
              <Text style={{ color: "#02de95", fontSize: 20, fontWeight: "900" }}>{initials}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }} />

      {/* Scrollable Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ flex: 1 }}
      >
        <View style={{ paddingVertical: 12 }}>
          {menuItems.map((item) => {
            const active = activeNestedRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => navigateToStackScreen(item.route)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: active ? "rgba(2,222,149,0.12)" : "transparent",
                  borderLeftWidth: active ? 3 : 0,
                  borderLeftColor: colors.primary[500],
                }}
                activeOpacity={0.8}
              >
                <Icon
                  name={item.icon as any}
                  size={22}
                  color={active ? colors.primary[500] : colors.text.secondary}
                />
                <Text
                  style={{
                    marginLeft: 12,
                    color: active ? colors.primary[500] : colors.text.primary,
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginTop: "auto", paddingHorizontal: 20, paddingBottom: 24 }}>
          <TouchableOpacity
            onPress={logout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.08)",
            }}
            activeOpacity={0.8}
          >
            <Icon name="logout" size={22} color={colors.error} />
            <Text style={{ marginLeft: 12, color: colors.error, fontWeight: "700" }}>
              Sair
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

export default function DrawerClienteRoutes({
  initialRideId,
  onActivated: _onActivated,
}: DrawerClienteRoutesProps) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        overlayColor: "rgba(0,0,0,0.45)",
        swipeEnabled: false,
        drawerStyle: {
          backgroundColor: colors.background.primary,
          width: 300,
        },
      }}
    >
      <Drawer.Screen
        name="ClientMain"
        component={ClientStackRoutes}
        options={{ title: "Leva Mais" }}
        initialParams={{ initialRideId }}
      />
    </Drawer.Navigator>
  );
}
