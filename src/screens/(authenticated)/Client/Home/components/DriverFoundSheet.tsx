import React, { useMemo, forwardRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";

export type DriverFoundInfo = {
  id?: string;
  name?: string;
  phone?: string;
  profilePhoto?: string;
  rating?: number;
  vehicle?: {
    plate?: string;
    model?: string;
    color?: string;
    year?: number;
  };
};

interface DriverFoundSheetProps {
  driver?: DriverFoundInfo | null;
  etaText?: string;
  onClose?: () => void;
  onCall?: () => void;
  onChat?: () => void;
  onShare?: () => void;
  onCancel?: () => void;
  onDetails?: () => void;
}

export const DriverFoundSheet = forwardRef<BottomSheet, DriverFoundSheetProps>(
  (
    { driver, etaText, onClose, onCall, onChat, onShare, onCancel, onDetails },
    ref,
  ) => {
    const snapPoints = useMemo(() => ["45%", "85%"], []);

    const driverName = driver?.name || "Motorista";
    const rating = driver?.rating ?? 4.9;
    const vehicleModel = driver?.vehicle?.model || "Veículo";
    const vehicleColor = driver?.vehicle?.color || "";
    const plate = driver?.vehicle?.plate || "---";
    const photoUrl =
      driver?.profilePhoto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        driverName,
      )}&background=0D8ABC&color=fff&size=128`;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        backgroundStyle={{ backgroundColor: "#111816" }}
      >
        <BottomSheetView
          style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24 }}
        >
          {/* Status & ETA */}
          <View className="flex-col gap-3 mb-5">
            {/* Badge */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5 bg-[#0bd592]/10 px-3 py-1 rounded-full border border-[#0bd592]/20">
                <View className="w-1.5 h-1.5 rounded-full bg-[#0bd592]" />
                <Text className="text-[#0bd592] text-xs font-bold uppercase tracking-wide">
                  Motorista a caminho
                </Text>
              </View>
              <Text className="text-[#9cbab0] text-xs">Atualizado agora</Text>
            </View>

            {/* Headline ETA */}
            <View>
              <Text className="text-white text-3xl font-bold tracking-tight">
                {etaText ? `Chega em ${etaText}` : "Motorista a caminho"}
              </Text>
              <View className="mt-3 h-1.5 w-full bg-[#2a3833] rounded-full overflow-hidden">
                <View
                  className="h-full bg-[#0bd592] rounded-full w-[35%]"
                  style={{
                    shadowColor: "#0bd592",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                  }}
                />
              </View>
              <Text className="text-[#9cbab0] text-sm mt-2">
                O motorista está finalizando uma corrida próxima.
              </Text>
            </View>
          </View>

          {/* Driver & Vehicle Card */}
          <View className="bg-[#1b2723] rounded-2xl p-4 flex-row items-center justify-between border border-white/5 mb-5">
            {/* Left: Driver Info */}
            <View className="flex-row items-center gap-3">
              <View className="relative">
                <Image
                  source={{
                    uri: photoUrl,
                  }}
                  className="w-12 h-12 rounded-full border-2 border-[#0bd592]"
                />
                <View className="absolute -bottom-1 -right-1 bg-[#111816] rounded-full p-0.5">
                  <View className="flex items-center justify-center bg-yellow-500 w-5 h-5 rounded-full">
                    <Text className="text-black text-[10px] font-bold">
                      {String(rating).slice(0, 3)}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-col">
                <Text className="text-white font-semibold text-base leading-tight">
                  {driverName}
                </Text>
                <Text className="text-[#9cbab0] text-xs">5.203 corridas</Text>
              </View>
            </View>

            {/* Vertical Divider */}
            <View className="w-px h-8 bg-white/10 mx-2" />

            {/* Right: Vehicle Info */}
            <View className="flex-col items-end">
              <Text className="text-white font-medium text-sm text-right">
                {vehicleModel}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[#9cbab0] text-xs">
                  {vehicleColor || "—"}
                </Text>
                <View className="bg-white/90 px-1.5 py-0.5 rounded">
                  <Text className="text-[10px] text-[#111816] font-bold tracking-wider">
                    {plate}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions Grid */}
          <View className="flex-row justify-between mb-4">
            {/* Action: Call */}
            <TouchableOpacity
              onPress={onCall}
              className="flex-col items-center gap-2"
            >
              <View className="w-12 h-12 rounded-2xl bg-[#2a3833] items-center justify-center">
                <MaterialIcons name="call" size={24} color="white" />
              </View>
              <Text className="text-[#9cbab0] text-xs font-medium">Ligar</Text>
            </TouchableOpacity>

            {/* Action: Chat */}
            <TouchableOpacity
              onPress={onChat}
              className="flex-col items-center gap-2"
            >
              <View className="w-12 h-12 rounded-2xl bg-[#2a3833] items-center justify-center relative">
                <MaterialIcons name="chat" size={24} color="white" />
                <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#2a3833]" />
              </View>
              <Text className="text-[#9cbab0] text-xs font-medium">Chat</Text>
            </TouchableOpacity>

            {/* Action: Share */}
            <TouchableOpacity
              onPress={onShare}
              className="flex-col items-center gap-2"
            >
              <View className="w-12 h-12 rounded-2xl bg-[#2a3833] items-center justify-center">
                <MaterialIcons name="share-location" size={24} color="white" />
              </View>
              <Text className="text-[#9cbab0] text-xs font-medium">
                Compartilhar
              </Text>
            </TouchableOpacity>

            {/* Action: Cancel */}
            <TouchableOpacity
              onPress={onCancel}
              className="flex-col items-center gap-2"
            >
              <View className="w-12 h-12 rounded-2xl bg-[#2a3833] items-center justify-center">
                <MaterialIcons name="close" size={24} color="#f87171" />
              </View>
              <Text className="text-[#9cbab0] text-xs font-medium">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="h-px w-full bg-white/5 my-1 mb-4" />

          {/* Collapsible Details Trigger */}
          <TouchableOpacity
            onPress={onDetails}
            className="flex-row items-center justify-between w-full py-2"
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-[#2a3833] p-1.5 rounded-lg">
                <MaterialIcons name="receipt-long" size={20} color="#0bd592" />
              </View>
              <Text className="text-white text-sm font-medium">
                Ver detalhes do pedido
              </Text>
            </View>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color="#9cbab0"
            />
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);
