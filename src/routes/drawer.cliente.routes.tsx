import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import HomeScreen from "../screens/(authenticated)/HomeScreen";
import { useAuthStore } from "../context/authStore";
import theme from "../theme";

const Drawer = createDrawerNavigator();
const { Navigator, Screen } = Drawer;

function CustomDrawerContent(props: any) {
  const { logout, userData } = useAuthStore();

  function handleLogout() {
    logout();
    // A navegação será automática através do componente Routes
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flex: 1,
        backgroundColor: theme.COLORS.BRAND_DARK,
      }}
    >
      {/* Header do drawer */}
      <View className="px-6 py-8 border-b border-gray-700">
        <View className="flex-row items-center mb-2">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
          >
            <Text className="text-brand-dark font-bold text-xl">
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
        {props.state.routes.map((route: any, index: number) => {
          const isFocused = props.state.index === index;
          const { options } = props.descriptors[route.key];

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => props.navigation.navigate(route.name)}
              className={`flex-row items-center px-6 py-4 ${
                isFocused ? "bg-brand-light bg-opacity-10" : ""
              }`}
            >
              <MaterialCommunityIcons
                name="home"
                size={24}
                color={
                  isFocused ? theme.COLORS.BRAND_LIGHT : theme.COLORS.GRAY_400
                }
              />
              <Text
                className="ml-4 text-base font-semibold"
                style={{
                  color: isFocused
                    ? theme.COLORS.BRAND_LIGHT
                    : theme.COLORS.GRAY_400,
                }}
              >
                {options.drawerLabel || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botão de sair */}
      <View className="px-6 py-4 border-t border-gray-700">
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center py-4"
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
        headerShown: true,
        drawerStyle: {
          backgroundColor: theme.COLORS.BRAND_DARK,
        },
        drawerActiveTintColor: theme.COLORS.BRAND_LIGHT,
        drawerInactiveTintColor: theme.COLORS.GRAY_400,
        headerStyle: {
          backgroundColor: theme.COLORS.BRAND_DARK,
        },
        headerTintColor: theme.COLORS.WHITE,
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
    </Navigator>
  );
}
