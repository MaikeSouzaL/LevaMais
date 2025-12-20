import React, { forwardRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import GorhomBottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";

interface LocationPickerSheetProps {
  onClose?: () => void;
  onSelectLocation?: (location: string) => void;
  currentLocation?: string;
  currentAddress?: string;
}

export const LocationPickerSheet = forwardRef<
  GorhomBottomSheet,
  LocationPickerSheetProps
>(
  (
    {
      onClose,
      onSelectLocation,
      currentLocation = "Av. Paulista, 1578",
      currentAddress = "Bela Vista, São Paulo - SP",
    },
    ref
  ) => {
    // Apenas 1 snap point - totalmente aberto (90%)
    const snapPoints = useMemo(() => ["90%"], []);

    const favorites = [
      { icon: "home", title: "Casa", address: "Rua Augusta, 500 - Consolação" },
      {
        icon: "work",
        title: "Trabalho",
        address: "Av. Faria Lima, 3477 - Itaim Bibi",
      },
    ];

    const recents = [
      {
        title: "Shopping Cidade São Paulo",
        address: "Av. Paulista, 1230 - Bela Vista",
      },
      { title: "Aeroporto de Congonhas", address: "Vila Congonhas, São Paulo" },
      {
        title: "Parque Ibirapuera - Portão 3",
        address: "Av. Pedro Álvares Cabral",
      },
    ];

    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onClose={onClose}
        handleIndicatorStyle={{
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          width: 48,
          height: 6,
        }}
        backgroundStyle={{
          backgroundColor: "#0f231c",
        }}
        style={{
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.5,
          shadowRadius: 32,
          elevation: 20,
        }}
      >
        <BottomSheetView style={{ flex: 1, paddingBottom: 24 }}>
          {/* Header - Current Location */}
          <View className="px-6 pt-2 pb-4 flex items-center">
            <Text className="text-primary text-xs font-bold tracking-widest uppercase mb-1">
              Local Atual
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-2xl font-bold">
                {currentLocation}
              </Text>
              <MaterialIcons name="edit" size={20} color="#02de95" />
            </View>
            <Text className="text-gray-400 text-sm mt-1">{currentAddress}</Text>
          </View>

          {/* Search Bar */}
          <View className="px-6 py-2">
            <View className="relative">
              <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <MaterialIcons name="search" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                placeholder="Digite um endereço ou escolha no mapa"
                placeholderTextColor="#6B7280"
                className="w-full p-4 pl-12 text-sm text-white border border-white/10 rounded-xl bg-surface-dark"
              />
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            className="flex-1 px-6 pt-4"
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity className="flex-1 p-4 rounded-2xl bg-surface-dark border border-white/5 active:opacity-80">
                <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center mb-3">
                  <MaterialIcons name="my-location" size={20} color="#02de95" />
                </View>
                <Text className="text-sm font-semibold text-white">
                  Localização Atual
                </Text>
                <Text className="text-xs text-gray-400">Usar GPS</Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 p-4 rounded-2xl bg-surface-dark border border-white/5 active:opacity-80">
                <View className="h-10 w-10 rounded-full bg-blue-500/10 items-center justify-center mb-3">
                  <MaterialIcons name="map" size={20} color="#60A5FA" />
                </View>
                <Text className="text-sm font-semibold text-white">
                  Escolher no Mapa
                </Text>
                <Text className="text-xs text-gray-400">Ajustar pino</Text>
              </TouchableOpacity>
            </View>

            {/* Favorites */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-1">
                Favoritos
              </Text>
              <View>
                {favorites.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                    onPress={() => onSelectLocation?.(item.address)}
                  >
                    <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center mr-4">
                      <MaterialIcons
                        name={item.icon as any}
                        size={20}
                        color="#D1D5DB"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-white">
                        {item.title}
                      </Text>
                      <Text className="text-xs text-gray-400" numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={18}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                ))}

                {/* Add Favorite */}
                <TouchableOpacity className="flex-row items-center p-3 rounded-xl active:bg-white/5">
                  <View className="h-10 w-10 rounded-full border border-dashed border-gray-500 items-center justify-center mr-4">
                    <MaterialIcons name="add" size={20} color="#9CA3AF" />
                  </View>
                  <Text className="text-sm font-medium text-white">
                    Adicionar Favorito
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent History */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-1">
                Recentes
              </Text>
              <View>
                {recents.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                    onPress={() => onSelectLocation?.(item.address)}
                  >
                    <View className="h-10 w-10 rounded-full bg-white/5 items-center justify-center mr-4">
                      <MaterialIcons
                        name="schedule"
                        size={20}
                        color="#9CA3AF"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-white">
                        {item.title}
                      </Text>
                      <Text className="text-xs text-gray-400" numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </BottomSheetView>
      </GorhomBottomSheet>
    );
  }
);

LocationPickerSheet.displayName = "LocationPickerSheet";
