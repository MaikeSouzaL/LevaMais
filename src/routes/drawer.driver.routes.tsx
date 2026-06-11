import React from "react";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Icon } from "@/components/ui/Icon";

import DriverStackRoutes from "./driver.stack.routes";

import { useAuthStore } from "../context/authStore";
import { resolveAssetURL } from "@/utils/mappers";

const Drawer = createDrawerNavigator();

type DrawerDriverRoutesProps = {
  initialRideId?: string | null;
};

const menuItems = [
  { name: "DriverHome", label: "Mapa", icon: "map" },
  { name: "DriverRequests", label: "Solicitações", icon: "car" },
  { name: "DriverFinance", label: "Ganhos e carteira", icon: "cash" },
  { name: "DriverShiftOffers", label: "Plantões", icon: "store-clock-outline" },
  { name: "DriverRatings", label: "Avaliações", icon: "star-circle" },
  { name: "DriverHistory", label: "Histórico", icon: "history" },
  { name: "DriverVehicle", label: "Veículo", icon: "car-info" },
  { name: "DriverDocuments", label: "Documentos", icon: "file-document-outline" },
  { name: "DriverWorkPreferences", label: "Preferências", icon: "tune" },
  { name: "DriverProfile", label: "Perfil", icon: "account" },
  { name: "DriverSafety", label: "Segurança", icon: "shield" },
  { name: "DriverSupportCenter", label: "Suporte", icon: "lifebuoy" },
  { name: "DriverHelp", label: "Ajuda rápida", icon: "help-circle" },
  { name: "DriverSettings", label: "Configurações", icon: "cog" },
] as const;

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { logout, userData } = useAuthStore();
  const currentRouteName = props.state.routeNames[props.state.index];

  const isApproved = userData?.driverStatus === "approved";
  const filteredMenuItems = menuItems.filter((item) => {
    if (isApproved) return true;
    const allowed = [
      "DriverHome",
      "DriverVehicle",
      "DriverDocuments",
      "DriverProfile",
      "DriverSupportCenter",
    ];
    return allowed.includes(item.name);
  });

  const profileImageUrl = resolveAssetURL(userData?.fotoPerfil || userData?.profilePhoto);
  const displayName = userData?.name || userData?.nome || "Motorista";
  const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#091A2F" }}
    >
      <View
        style={{
          padding: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4, fontSize: 13 }} numberOfLines={1}>
            {userData?.email || ""}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => props.navigation.navigate("DriverProfile" as never)}
          activeOpacity={0.8}
        >
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 2,
                borderColor: "#02de95",
              }}
            />
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "rgba(2,222,149,0.12)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "rgba(2,222,149,0.35)",
              }}
            >
              <Text style={{ color: "#02de95", fontSize: 18, fontWeight: "900" }}>
                {initials}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingTop: 12 }}>
        {filteredMenuItems.map((item) => {
          const isFocused = currentRouteName === item.name;

          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => props.navigation.navigate(item.name as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: isFocused ? "rgba(2,222,149,0.12)" : "transparent",
                borderLeftWidth: isFocused ? 3 : 0,
                borderLeftColor: "#02de95",
              }}
            >
              <Icon
                name={item.icon as any}
                size={22}
                color={isFocused ? "#02de95" : "rgba(255,255,255,0.75)"}
              />
              <Text
                style={{
                  color: isFocused ? "#02de95" : "rgba(255,255,255,0.85)",
                  marginLeft: 12,
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

      <View
        style={{
          marginTop: "auto",
          paddingHorizontal: 20,
          paddingBottom: 24,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.08)",
        }}
      >
        <TouchableOpacity
          onPress={logout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
          }}
        >
          <Icon name="logout" size={22} color="#ef4444" />
          <Text style={{ color: "#ef4444", marginLeft: 12, fontWeight: "800" }}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerDriverRoutes({ initialRideId }: DrawerDriverRoutesProps) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: "#091A2F", width: 280 },
        drawerType: "slide",
        overlayColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Drawer.Screen
        name="DriverMain"
        options={{ title: "Leva+", drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      >
        {() => <DriverStackRoutes initialRideId={initialRideId} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
