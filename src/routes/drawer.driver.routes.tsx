import React from "react";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Icon } from "@/components/ui/Icon";
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
import DriverHistoryRideDetailsScreen from "../screens/(authenticated)/Driver/DriverHistoryRideDetailsScreen";
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

import DeliveryPickupConfirmScreen from "../screens/(authenticated)/Driver/DeliveryPickupConfirm";
import DeliveryDropoffConfirmScreen from "../screens/(authenticated)/Driver/DeliveryDropoffConfirm";

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

  const profileImageUrl = userData?.fotoPerfil || userData?.profilePhoto;
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
      <Drawer.Screen name="DriverHome" component={DriverHomeScreen} options={{ title: "Início", headerShown: false }} />
      <Drawer.Screen name="DriverRequests" component={DriverRequestsScreen} options={{ title: "Solicitações" }} />
      <Drawer.Screen name="DriverFinance" component={DriverFinanceStack} options={{ title: "Ganhos e carteira", headerShown: false }} />
      <Drawer.Screen name="DriverShiftOffers" component={DriverShiftOffersScreen} options={{ title: "Plantões" }} />
      <Drawer.Screen name="DriverHistory" component={DriverHistoryScreen} options={{ title: "Histórico" }} />
      <Drawer.Screen name="DriverVehicle" component={DriverVehicleScreen} options={{ title: "Veículo" }} />
      <Drawer.Screen name="DriverRatings" component={DriverRatingsScreen} options={{ title: "Avaliações" }} />
      <Drawer.Screen name="DriverDocuments" component={DriverDocumentsScreen} options={{ title: "Documentos" }} />
      <Drawer.Screen name="DriverWorkPreferences" component={DriverWorkPreferencesScreen} options={{ title: "Preferências" }} />
      <Drawer.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: "Perfil" }} />
      <Drawer.Screen name="DriverSafety" component={DriverSafetyScreen} options={{ title: "Segurança" }} />
      <Drawer.Screen name="DriverSupportCenter" component={DriverSupportCenterScreen} options={{ title: "Suporte" }} />
      <Drawer.Screen name="DriverHelp" component={DriverHelpScreen} options={{ title: "Ajuda" }} />
      <Drawer.Screen name="DriverSettings" component={DriverSettingsScreen} options={{ title: "Configurações" }} />

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

      <Drawer.Screen name="DeliveryPickupConfirm" component={DeliveryPickupConfirmScreen} options={HiddenScreenOptions} />
      <Drawer.Screen name="DeliveryDropoffConfirm" component={DeliveryDropoffConfirmScreen} options={HiddenScreenOptions} />
      <Drawer.Screen name="DriverHistoryRideDetails" component={DriverHistoryRideDetailsScreen} options={HiddenScreenOptions} />
    </Drawer.Navigator>
  );
}
