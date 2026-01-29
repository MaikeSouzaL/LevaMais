import React from "react";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import DriverHomeScreen from "../screens/(authenticated)/Driver/DriverHomeScreen";
import DriverRequestsScreen from "../screens/(authenticated)/Driver/DriverRequestsScreen";
import DriverRideScreen from "../screens/(authenticated)/Driver/DriverRideScreen";
import DriverEarningsScreen from "../screens/(authenticated)/Driver/DriverEarningsScreen";
import DriverHistoryScreen from "../screens/(authenticated)/Driver/DriverHistoryScreen";
import DriverWalletScreen from "../screens/(authenticated)/Driver/DriverWalletScreen";
import DriverProfileScreen from "../screens/(authenticated)/Driver/DriverProfileScreen";
import DriverVehicleScreen from "../screens/(authenticated)/Driver/DriverVehicleScreen";
import DriverSettingsScreen from "../screens/(authenticated)/Driver/DriverSettingsScreen";
import DriverHelpScreen from "../screens/(authenticated)/Driver/DriverHelpScreen";
import DriverSafetyScreen from "../screens/(authenticated)/Driver/DriverSafetyScreen";
import { useAuthStore } from "../context/authStore";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { logout, userData } = useAuthStore();

  const menuItems = [
    { name: "DriverHome", label: "Mapa", icon: "map" },
    { name: "DriverRequests", label: "Solicitações", icon: "car" },
    { name: "DriverEarnings", label: "Ganhos", icon: "cash" },
    { name: "DriverHistory", label: "Histórico", icon: "history" },
    { name: "DriverWallet", label: "Carteira", icon: "wallet" },
    { name: "DriverVehicle", label: "Veículo", icon: "car-info" },
    { name: "DriverProfile", label: "Perfil", icon: "account" },
    { name: "DriverSafety", label: "Segurança", icon: "shield" },
    { name: "DriverHelp", label: "Ajuda", icon: "help-circle" },
    { name: "DriverSettings", label: "Configurações", icon: "cog" },
  ];

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: "#0f231c" }}
    >
      <View
        style={{
          padding: 24,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
          {userData?.name || "Motorista"}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
          {userData?.email}
        </Text>
      </View>

      <View style={{ flex: 1, paddingTop: 12 }}>
        {menuItems.map((item) => {
          const isFocused =
            props.state.routeNames[props.state.index] === item.name;

          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => props.navigation.navigate(item.name as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: isFocused
                  ? "rgba(2,222,149,0.12)"
                  : "transparent",
              }}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color={isFocused ? "#02de95" : "#9ca5a3"}
              />
              <Text
                style={{
                  color: isFocused ? "#02de95" : "#9ca5a3",
                  marginLeft: 12,
                  fontWeight: "700",
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
          paddingHorizontal: 20,
          paddingVertical: 12,
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
          <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
          <Text style={{ color: "#ef4444", marginLeft: 12, fontWeight: "800" }}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerDriverRoutes() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: "#0f231c", width: 280 },
        drawerType: "slide",
        overlayColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Drawer.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ title: "Início" }}
      />
      <Drawer.Screen
        name="DriverRequests"
        component={DriverRequestsScreen}
        options={{ title: "Solicitações" }}
      />
      <Drawer.Screen
        name="DriverEarnings"
        component={DriverEarningsScreen}
        options={{ title: "Ganhos" }}
      />
      <Drawer.Screen
        name="DriverHistory"
        component={DriverHistoryScreen}
        options={{ title: "Histórico" }}
      />
      <Drawer.Screen
        name="DriverWallet"
        component={DriverWalletScreen}
        options={{ title: "Carteira" }}
      />
      <Drawer.Screen
        name="DriverVehicle"
        component={DriverVehicleScreen}
        options={{ title: "Veículo" }}
      />
      <Drawer.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{ title: "Perfil" }}
      />
      <Drawer.Screen
        name="DriverSafety"
        component={DriverSafetyScreen}
        options={{ title: "Segurança" }}
      />
      <Drawer.Screen
        name="DriverHelp"
        component={DriverHelpScreen}
        options={{ title: "Ajuda" }}
      />
      <Drawer.Screen
        name="DriverSettings"
        component={DriverSettingsScreen}
        options={{ title: "Configurações" }}
      />
      <Drawer.Screen
        name="DriverRide"
        component={DriverRideScreen}
        options={{
          drawerLabel: () => null,
          title: "Corrida",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer.Navigator>
  );
}
