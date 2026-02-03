import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Telas Refatoradas
import HomeScreen from "../screens/(authenticated)/Client/Home";
import HistoryScreen from "../screens/(authenticated)/Client/History/HistoryList";
import WalletScreen from "../screens/(authenticated)/Client/Profile/Wallet";
import ProfileScreen from "../screens/(authenticated)/Client/Profile/ProfileView";
import HelpScreen from "../screens/(authenticated)/Client/Profile/Help";
import SettingsScreen from "../screens/(authenticated)/Client/Profile/Settings";
import AddressPickerScreen from "../screens/(authenticated)/Client/Ride/Request/AddressPicker";
import FavoritesScreen from "../screens/(authenticated)/Client/Favorites/FavoritesList";
import SelectVehicleScreen from "../screens/(authenticated)/Client/Ride/Request/SelectVehicle";
import ServicePurposeScreen from "../screens/(authenticated)/Client/Ride/Request/ServicePurpose";
import OrderSummaryScreen from "../screens/(authenticated)/Client/Ride/Request/OrderSummary";
import CancelFeeScreen from "../screens/(authenticated)/Client/Ride/Cancellation/CancelFee";
import ChatScreen from "../screens/(authenticated)/Client/Ride/Tracking/Chat";
import OrderDetailsScreen from "../screens/(authenticated)/Client/History/OrderDetails";
import PaymentScreen from "../screens/(authenticated)/Client/Ride/Request/Payment";
import RideTrackingScreen from "../screens/(authenticated)/Client/Ride/Tracking/RideTracking";
import RideCompletedScreen from "../screens/(authenticated)/Client/Ride/Completion/RideCompleted";
import RateDriverScreen from "../screens/(authenticated)/Client/Ride/Completion/RateDriver";
import CancelRideScreen from "../screens/(authenticated)/Client/Ride/Cancellation/CancelRide";
import ServiceSelectionScreen from "../screens/(authenticated)/Client/Ride/Request/ServiceSelection";

import { useAuthStore } from "../context/authStore";

// Tela não refatorada ainda (se necessário)
// import ClientCityScreen from "../screens/(authenticated)/Client/_backup_old_screens/ClientCityScreen";

const Drawer = createDrawerNavigator();

type DrawerClienteRoutesProps = {
  initialRideId?: string | null;
};
const { Navigator, Screen } = Drawer;

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { logout, userData } = useAuthStore();

  function handleLogout() {
    logout();
  }

  // Itens do menu
  const menuItems = [
    { name: "Home", label: "Início", icon: "home" },
    { name: "History", label: "Histórico", icon: "history" },
    { name: "Wallet", label: "Carteira", icon: "wallet" },
    { name: "Profile", label: "Perfil", icon: "account" },
    { name: "Help", label: "Ajuda", icon: "help-circle" },
    { name: "Settings", label: "Configurações", icon: "cog" },
  ];

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flex: 1,
        backgroundColor: "#091A2F", // background-dark
      }}
    >
      {/* Header do drawer */}
      <View className="px-6 py-8 border-b border-white/10">
        <View className="flex-row items-center mb-2">
          <View className="w-16 h-16 rounded-full items-center justify-center mr-4 bg-primary">
            <Text className="text-background-dark font-bold text-xl">
              {userData?.nome
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">
              {userData?.nome || "Usuário"}
            </Text>
            <Text className="text-gray-400 text-sm">{userData?.email}</Text>
          </View>
        </View>
      </View>

      {/* Itens do menu */}
      <View className="flex-1 pt-4">
        {menuItems.map((item) => {
          const isFocused =
            props.state.routeNames[props.state.index] === item.name;

          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => {
                props.navigation.navigate(item.name);
              }}
              className={`flex-row items-center px-6 py-4 ${
                isFocused ? "bg-primary/10 border-l-4 border-primary" : ""
              }`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={24}
                color={isFocused ? "#02de95" : "#9ca5a3"}
              />
              <Text
                className={`ml-4 text-base font-semibold ${
                  isFocused ? "text-primary" : "text-gray-400"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botão de sair */}
      <View className="px-6 py-4 border-t border-white/10">
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center py-4"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
          <Text
            className="ml-4 text-base font-semibold"
            style={{ color: "#ef4444" }}
          >
            Sair
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerClienteRoutes(props: DrawerClienteRoutesProps) {
  const initialRoute = props?.initialRideId ? "RideTracking" : "Home";

  return (
    <Navigator
      initialRouteName={initialRoute}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: "#091A2F",
          width: 280,
        },
        drawerActiveTintColor: "#02de95",
        drawerInactiveTintColor: "#9ca5a3",
        drawerType: "slide",
        overlayColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Início", drawerLabel: "Início" }}
      />
      <Screen
        name="History"
        component={HistoryScreen}
        options={{ title: "Histórico", drawerLabel: "Histórico" }}
      />
      <Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: "Carteira", drawerLabel: "Carteira" }}
      />
      <Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil", drawerLabel: "Perfil" }}
      />
      <Screen
        name="Help"
        component={HelpScreen}
        options={{ title: "Ajuda", drawerLabel: "Ajuda" }}
      />
      <Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Configurações", drawerLabel: "Configurações" }}
      />
      
      {/* Telas secundárias (não aparecem no menu drawer) */}
      <Screen
        name="LocationPicker"
        component={AddressPickerScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="EditFavorite"
        component={AddressPickerScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="MapLocationPicker"
        component={AddressPickerScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="SelectVehicle"
        component={SelectVehicleScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="ServicePurpose"
        component={ServicePurposeScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="FinalOrderSummary"
        component={OrderSummaryScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="CancelFee"
        component={CancelFeeScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="Chat"
        component={ChatScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="Payment"
        component={PaymentScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="RideTracking"
        component={RideTrackingScreen}
        initialParams={props?.initialRideId ? { rideId: props.initialRideId } : undefined}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="RideCompleted"
        component={RideCompletedScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="ClientRateDriver"
        component={RateDriverScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="ClientCancelRide"
        component={CancelRideScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
      <Screen
        name="ServiceSelection"
        component={ServiceSelectionScreen}
        options={{ drawerLabel: () => null, drawerItemStyle: { display: "none" } }}
      />
    </Navigator>
  );
}
