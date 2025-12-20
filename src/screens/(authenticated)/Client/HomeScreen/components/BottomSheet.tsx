import React, { forwardRef, useMemo } from "react";
import { View } from "react-native";
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { SearchBar } from "./SearchBar";
import { ServiceCard } from "./ServiceCard";

interface BottomSheetProps {
  onPressSearch?: () => void;
  onPressRide?: () => void;
  onPressDelivery?: () => void;
}

export const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ onPressSearch, onPressRide, onPressDelivery }, ref) => {
    // Pontos de snap: fechado (10%), médio (35%), aberto (90%)
    const snapPoints = useMemo(() => ["35%"], []);

    return (
      <GorhomBottomSheet
        ref={ref}
        index={0} // Inicia no ponto (35%)
        snapPoints={snapPoints}
        enablePanDownToClose={false} // Não fecha completamente
        handleIndicatorStyle={{
          backgroundColor: "rgba(156, 163, 175, 0.5)",
          width: 48,
          height: 4,
        }}
        backgroundStyle={{
          backgroundColor: "#0f231c",
        }}
        style={{
          // Removidas margens laterais para ocupar toda a largura
          marginBottom: -6,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <BottomSheetView style={{ flex: 1, paddingBottom: 24 }}>
          {/* Conteúdo */}
          <View className="px-6 pt-2">
            {/* Barra de busca */}
            <SearchBar onPress={onPressSearch} />

            {/* Cards de serviços - grid 2 colunas */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <ServiceCard
                  icon="local-taxi"
                  title="Corrida"
                  subtitle="Carro ou Moto"
                  onPress={onPressRide}
                />
              </View>
              <View className="flex-1">
                <ServiceCard
                  icon="local-shipping"
                  title="Entrega"
                  subtitle="Enviar itens"
                  onPress={onPressDelivery}
                />
              </View>
            </View>
          </View>
        </BottomSheetView>
      </GorhomBottomSheet>
    );
  }
);
