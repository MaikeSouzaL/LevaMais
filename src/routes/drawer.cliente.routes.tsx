import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuthStore } from "../context/authStore";
import ClientStackRoutes from "./client.stack.routes";
import { colors } from "@/theme";

type DrawerClienteRoutesProps = {
  initialRideId?: string | null;
};

const Drawer = createDrawerNavigator();

const menuItems = [
  { route: "Home", label: "Início", icon: "home" },
  { route: "History", label: "Histórico", icon: "history" },
  { route: "ActiveOrders", label: "Pedidos ativos", icon: "map-marker-path" },
  { route: "ShiftOffersClient", label: "Plantões motoboy", icon: "store-clock-outline" },
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

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { userData, logout } = useAuthStore();

  const nestedState = (props.state.routes[props.state.index] as any)?.state;
  const nestedRoutes = nestedState?.routes || [];
  const nestedIndex = nestedState?.index || 0;
  const activeNestedRoute = nestedRoutes[nestedIndex]?.name || "Home";

  const navigateToStackScreen = (screenName: string) => {
    (props.navigation as any).navigate("ClientMain", { screen: screenName });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background.primary }}
    >
      <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Text style={{ color: "white", fontSize: 20, fontWeight: "800" }}>
          {userData?.name || userData?.nome || "Cliente"}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
          {userData?.email || "Bem-vindo"}
        </Text>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }} />

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
              <MaterialCommunityIcons
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
          <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
          <Text style={{ marginLeft: 12, color: colors.error, fontWeight: "700" }}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerClienteRoutes({
  initialRideId,
}: DrawerClienteRoutesProps) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        overlayColor: "rgba(0,0,0,0.45)",
        drawerStyle: {
          backgroundColor: colors.background.primary,
          width: 300,
        },
      }}
    >
      <Drawer.Screen
        name="ClientMain"
        options={{ title: "Leva Mais" }}
      >
        {() => <ClientStackRoutes initialRideId={initialRideId} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
