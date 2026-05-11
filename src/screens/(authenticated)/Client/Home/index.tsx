import React, { useCallback, useState } from "react";
import { StyleSheet, StatusBar, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 📍 Custom Hooks / Global System
import { useAuthStore } from "@/context/authStore";
import favoriteAddressService from "@/services/favoriteAddress.service";
import { LocationLoadingScreen } from "@/components/ui/LocationLoadingScreen";

// 🛠️ Reused Domain Hooks from Original Flow
import { useMapLocation } from "../Shared/hooks/useMapLocation";

// 🎨 Premium Visual Shell Components
import { ClientRealtimeMap } from "@/components/client/home/ClientRealtimeMap";
import { ClientFloatingHeader } from "@/components/client/home/ClientFloatingHeader";
import { ClientBottomSheet } from "@/components/client/home/ClientBottomSheet";
import { FloatingActions } from "@/components/client/home/FloatingActions";
import { colors } from "@/theme";

export default function HomeScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { userData: user } = useAuthStore();
  
  // Mapping Engine Instance & Actions
  const {
    mapRef,
    region,
    userRegion,
    currentAddress,
    centerOnUser,
    handleRegionChangeComplete
  } = useMapLocation();

  // Component States
  const [favorites, setFavorites] = useState<any[]>([]);
  const [sheetSnapIndex, setSheetSnapIndex] = useState(0);

  // Load context on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const favs = await favoriteAddressService.list();
          setFavorites(favs || []);
        } catch (e) {
          setFavorites([]);
        }
      })();
    }, [])
  );

  // Drawer Open
  const handleMenuPress = useCallback(() => {
    const parent = navigation.getParent();
    if (parent && "openDrawer" in parent) {
      (parent as any).openDrawer();
    } else if ("openDrawer" in navigation) {
      (navigation as any).openDrawer();
    } else {
      Alert.alert("Menu", "Navegador Drawer não encontrado.");
    }
  }, [navigation]);

  // Routing Bridge: Navigates exactly into user's new Premium Search Flow
  const handleServiceSelect = useCallback((type: "ride" | "delivery") => {
    const defaultVehicle = type === "ride" ? "car" : "motorcycle";
    
    navigation.navigate("DestinationSearch", {
      initialVehicle: defaultVehicle,
      pickup: {
        address: currentAddress || "Localização Atual",
        latitude: userRegion?.latitude || region?.latitude,
        longitude: userRegion?.longitude || region?.longitude,
      }
    } as never);
  }, [navigation, currentAddress, userRegion, region]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate("DestinationSearch", {
      pickup: {
        address: currentAddress || "Localização Atual",
        latitude: userRegion?.latitude || region?.latitude,
        longitude: userRegion?.longitude || region?.longitude,
      }
    } as never);
  }, [navigation, currentAddress, userRegion, region]);

  const handleWalletPress = useCallback(() => {
    // Example route - if specific wallet exists
    Alert.alert("Carteira", `Olá ${user?.name || "Cliente"}! Seu saldo está disponível.`);
  }, [user?.name]);

  // ⏳ Loading Guard while Map Logic warms up
  if (!region) {
    return <LocationLoadingScreen />;
  }


  return (
    <GestureHandlerRootView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 1. Background Map Layer (The World View) */}
      <ClientRealtimeMap 
        mapRef={mapRef}
        region={region}
        userRegion={userRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* 2. Floating Controls Layer */}
      <ClientFloatingHeader 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
        onWalletPress={handleWalletPress}
        currentAddress={currentAddress}
      />

      <FloatingActions 
        onLocationPress={centerOnUser}
        onSosPress={() => Alert.alert("SOS", "Ativando modo de emergência...")}
      />

      {/* 3. Bottom User-Action Sheet */}
      <ClientBottomSheet 
        onSelectService={handleServiceSelect}
        favorites={favorites}
        onSelectFavorite={(fav) => {
          // Emulates handling of legacy favorite flow triggers
          navigation.navigate("DestinationSearch", {
            pickup: { 
              address: currentAddress || "Localização Atual",
              latitude: userRegion?.latitude || region.latitude,
              longitude: userRegion?.longitude || region.longitude,
            },
            dropoff: {
              address: fav.formattedAddress || fav.address,
              latitude: Number(fav.latitude),
              longitude: Number(fav.longitude),
            }
          } as never);
        }}
        onChangeSnap={(idx) => setSheetSnapIndex(idx)}
      />
      
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  }
});
