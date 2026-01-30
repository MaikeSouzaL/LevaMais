import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddFavoriteScreen from "../screens/(authenticated)/Client/HomeScreen/AddFavoriteScreen";
import MapLocationPickerScreen from "../screens/(authenticated)/Client/HomeScreen/MapLocationPickerScreen";

const Stack = createNativeStackNavigator();

export default function FavoriteStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0f231c" },
      }}
    >
      <Stack.Screen name="AddFavoriteMain" component={AddFavoriteScreen} />
      <Stack.Screen
        name="AddFavoriteMap"
        component={MapLocationPickerScreen}
        options={{
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}
