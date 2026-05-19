import React from "react";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DriverHomeScreen from "../screens/(authenticated)/Driver/DriverHomeScreen";
import DriverRequestsScreen from "../screens/(authenticated)/Driver/DriverRequestsScreen";
import DriverRideScreen from "../screens/(authenticated)/Driver/DriverRideScreen";
import DriverRateClientScreen from "../screens/(authenticated)/Driver/DriverRateClientScreen";
import DriverCancelRideScreen from "../screens/(authenticated)/Driver/DriverCancelRideScreen";
import DriverEarningsScreen from "../screens/(authenticated)/Driver/DriverEarningsScreen";
import DriverHistoryScreen from "../screens/(authenticated)/Driver/DriverHistoryScreen";
import DriverProfileScreen from "../screens/(authenticated)/Driver/DriverProfileScreen";
import DriverVehicleScreen from "../screens/(authenticated)/Driver/DriverVehicleScreen";
import DriverSettingsScreen from "../screens/(authenticated)/Driver/DriverSettingsScreen";
import DriverWithdrawScreen from "../screens/(authenticated)/Driver/DriverWithdrawScreen";
import DriverStatementScreen from "../screens/(authenticated)/Driver/DriverStatementScreen";
import DriverRideDetailsScreen from "../screens/(authenticated)/Driver/DriverRideDetailsScreen";
import DriverHelpScreen from "../screens/(authenticated)/Driver/DriverHelpScreen";
import DriverChatScreen from "../screens/(authenticated)/Driver/DriverChatScreen";
import DriverSafetyScreen from "../screens/(authenticated)/Driver/DriverSafetyScreen";
import DriverPayoutsScreen from "../screens/(authenticated)/Driver/DriverPayoutsScreen";
import DriverIncentivesScreen from "../screens/(authenticated)/Driver/DriverIncentivesScreen";
import DriverWorkPreferencesScreen from "../screens/(authenticated)/Driver/DriverWorkPreferencesScreen";
import DriverDocumentsScreen from "../screens/(authenticated)/Driver/DriverDocumentsScreen";
import DriverRatingsScreen from "../screens/(authenticated)/Driver/DriverRatingsScreen";
import DriverSupportCenterScreen from "../screens/(authenticated)/Driver/DriverSupportCenterScreen";
import DriverShiftOffersScreen from "../screens/(authenticated)/Driver/DriverShiftOffersScreen";
import DeliveryOfferScreen from "../screens/(authenticated)/Driver/DeliveryOfferScreen";
import DriverNegotiationScreen from "../screens/(authenticated)/Driver/DriverNegotiationScreen";

import { useAuthStore } from "../context/authStore";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

type DrawerDriverRoutesProps = {
  initialRideId?: string | null;
};

function DriverFinanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
      <Stack.Screen name="DriverWithdraw" component={DriverWithdrawScreen} />
      <Stack.Screen name="DriverStatement" component={DriverStatementScreen} />
      <Stack.Screen name="DriverPayouts" component={DriverPayoutsScreen} />
      <Stack.Screen name="DriverIncentives" component={DriverIncentivesScreen} />
      <Stack.Screen name="DriverRideDetails" component={DriverRideDetailsScreen} />
    </Stack.Navigator>
  );
}

const menuItems = [
  { name: "DriverHome", label: "Mapa", icon: "map" },
  { name: "DriverRequests", label: "SolicitaÃ§Ãµes", icon: "car" },
  { name: "DriverFinance", label: "Ganhos e carteira", icon: "cash" },
  { name: "DriverShiftOffers", label: "PlantÃµes", icon: "store-clock-outline" },
  { name: "DriverRatings", label: "AvaliaÃ§Ãµes", icon: "star-circle" },
  { name: "DriverHistory", label: "HistÃ³rico", icon: "history" },
  { name: "DriverVehicle", label: "VeÃ­culo", icon: "car-info" },
  { name: "DriverDocuments", label: "Documentos", icon: "file-document-outline" },
  { name: "DriverWorkPreferences", label: "PreferÃªncias", icon: "tune" },
  { name: "DriverProfile", label: "Perfil", icon: "account" },
  { name: "DriverSafety", label: "SeguranÃ§a", icon: "shield" },
  { name: "DriverSupportCenter", label: "Suporte", icon: "lifebuoy" },
  { name: "DriverHelp", label: "Ajuda rÃ¡pida", icon: "help-circle" },
  { name: "DriverSettings", label: "ConfiguraÃ§Ãµes", icon: "cog" },
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

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#091A2F" }}
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
          {userData?.email || ""}
        </Text>
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
              <MaterialCommunityIcons
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
          <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
          <Text style={{ color: "#ef4444", marginLeft: 12, fontWeight: "800" }}>
            Sair
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

function HiddenScreenOptions() {
  return {
    headerShown: false,
    drawerLabel: () => null,
    title: "",
    drawerItemStyle: { display: "none" as const },
  };
}

export default function DrawerDriverRoutes({ initialRideId }: DrawerDriverRoutesProps) {
  const initialRoute = initialRideId ? "DriverRide" : "DriverHome";

  return (
    <Drawer.Navigator
      initialRouteName={initialRoute}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#091A2F",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 16,
        },
        drawerStyle: { backgroundColor: "#091A2F", width: 280 },
        drawerType: "slide",
        overlayColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Drawer.Screen name="DriverHome" component={DriverHomeScreen} options={{ title: "InÃ­cio", headerShown: false }} />
      <Drawer.Screen name="DriverRequests" component={DriverRequestsScreen} options={{ title: "SolicitaÃ§Ãµes" }} />
      <Drawer.Screen name="DriverFinance" component={DriverFinanceStack} options={{ title: "Ganhos e carteira" }} />
      <Drawer.Screen name="DriverShiftOffers" component={DriverShiftOffersScreen} options={{ title: "PlantÃµes" }} />
      <Drawer.Screen name="DriverHistory" component={DriverHistoryScreen} options={{ title: "HistÃ³rico" }} />
      <Drawer.Screen name="DriverVehicle" component={DriverVehicleScreen} options={{ title: "VeÃ­culo" }} />
      <Drawer.Screen name="DriverRatings" component={DriverRatingsScreen} options={{ title: "AvaliaÃ§Ãµes" }} />
      <Drawer.Screen name="DriverDocuments" component={DriverDocumentsScreen} options={{ title: "Documentos" }} />
      <Drawer.Screen name="DriverWorkPreferences" component={DriverWorkPreferencesScreen} options={{ title: "PreferÃªncias" }} />
      <Drawer.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: "Perfil" }} />
      <Drawer.Screen name="DriverSafety" component={DriverSafetyScreen} options={{ title: "SeguranÃ§a" }} />
      <Drawer.Screen name="DriverSupportCenter" component={DriverSupportCenterScreen} options={{ title: "Suporte" }} />
      <Drawer.Screen name="DriverHelp" component={DriverHelpScreen} options={{ title: "Ajuda" }} />
      <Drawer.Screen name="DriverSettings" component={DriverSettingsScreen} options={{ title: "ConfiguraÃ§Ãµes" }} />

      <Drawer.Screen
        name="DriverRide"
        component={DriverRideScreen}
        initialParams={initialRideId ? { rideId: initialRideId } : undefined}
        options={HiddenScreenOptions}
      />
      <Drawer.Screen name="DriverRateClient" component={DriverRateClientScreen} options={HiddenScreenOptions} />
      <Drawer.Screen name="DriverCancelRide" component={DriverCancelRideScreen} options={HiddenScreenOptions} />
      <Drawer.Screen name="DriverChat" component={DriverChatScreen} options={HiddenScreenOptions} />
      <Drawer.Screen name="DriverNegotiation" component={DriverNegotiationScreen} options={HiddenScreenOptions} />
      <Drawer.Screen name="DeliveryOfferScreen" component={DeliveryOfferScreen} options={HiddenScreenOptions} />
    </Drawer.Navigator>
  );
}
