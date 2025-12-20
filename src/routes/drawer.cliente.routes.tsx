import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import HomeScreen from "../screens/(authenticated)/Client/HomeScreen/index";
import LocationPickerScreen from "../screens/(authenticated)/Client/HomeScreen/LocationPickerScreen";
import MapLocationPickerScreen from "../screens/(authenticated)/Client/HomeScreen/MapLocationPickerScreen";
import FinalOrderSummaryScreen from "../screens/(authenticated)/Client/HomeScreen/FinalOrderSummaryScreen";
import CancelFeeScreen from "../screens/(authenticated)/Client/HomeScreen/CancelFeeScreen";
import ChatScreen from "../screens/(authenticated)/Client/HomeScreen/ChatScreen";
import OrderDetailsScreen from "../screens/(authenticated)/Client/HomeScreen/OrderDetailsScreen";
import PaymentScreen from "../screens/(authenticated)/Client/HomeScreen/PaymentScreen";
import { useAuthStore } from "../context/authStore";

const Drawer = createDrawerNavigator();
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
        backgroundColor: "#0f231c", // background-dark
      }}
    >
      {/* Header do drawer */}
      <View className="px-6 py-8 border-b border-white/10">
        <View className="flex-row items-center mb-2">
          <View className="w-16 h-16 rounded-full items-center justify-center mr-4 bg-primary">
            <Text className="text-background-dark font-bold text-xl">
              {userData?.nome
                ?.split(" ")
                .map((n) => n[0])
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
                if (item.name === "Home") {
                  props.navigation.navigate(item.name);
                } else {
                  // TODO: Implementar navegação para outras telas
                  console.log(`Navigate to ${item.name}`);
                }
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

export default function DrawerClienteRoutes() {
  return (
    <Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false, // Esconder header padrão, usar custom
        drawerStyle: {
          backgroundColor: "#0f231c",
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
        options={{
          title: "Leva+",
          drawerLabel: "Início",
        }}
      />
      <Screen
        name="LocationPicker"
        component={LocationPickerScreen}
        options={{
          drawerLabel: () => null,
          title: "Selecionar Destino",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Screen
        name="MapLocationPicker"
        component={MapLocationPickerScreen}
        options={{
          drawerLabel: () => null,
          title: "Escolher no Mapa",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Screen
        name="FinalOrderSummary"
        component={FinalOrderSummaryScreen}
        options={{
          drawerLabel: () => null,
          title: "Resumo do pedido",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Screen
        name="CancelFee"
        component={CancelFeeScreen}
        options={{
          drawerLabel: () => null,
          title: "Cancelar corrida",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Screen
        name="Chat"
        component={ChatScreen}
        options={{
          drawerLabel: () => null,
          title: "Chat",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          drawerLabel: () => null,
          title: "Detalhes do pedido",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          drawerLabel: () => null,
          title: "Pagamento",
          drawerItemStyle: { display: "none" },
        }}
      />
      {/* TODO: Adicionar outras screens quando forem criadas */}
      {/* <Screen name="History" component={HistoryScreen} options={{ drawerLabel: "Histórico" }} /> */}
      {/* <Screen name="Wallet" component={WalletScreen} options={{ drawerLabel: "Carteira" }} /> */}
      {/* <Screen name="Profile" component={ProfileScreen} options={{ drawerLabel: "Perfil" }} /> */}
      {/* <Screen name="Help" component={HelpScreen} options={{ drawerLabel: "Ajuda" }} /> */}
      {/* <Screen name="Settings" component={SettingsScreen} options={{ drawerLabel: "Configurações" }} /> */}
    </Navigator>
  );
}
