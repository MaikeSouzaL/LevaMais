import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, CheckCircle, AlertCircle, Package, Phone } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { DriverStackParamList } from "../types/navigation";
import rideService from "@/services/ride.service";
import Toast from "react-native-toast-message";
import { TextInput } from "react-native-gesture-handler";

type DeliveryPickupConfirmRouteProp = RouteProp<DriverStackParamList, "DeliveryPickupConfirm">;

export default function DeliveryPickupConfirm() {
  const navigation = useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const route = useRoute<DeliveryPickupConfirmRouteProp>();
  const { rideId } = route.params;

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const loadRide = async () => {
      try {
        const data = await rideService.getById(rideId);
        setRide(data);
      } catch (error) {
        console.error("Erro ao carregar entrega:", error);
        Toast.show({ type: "error", text1: "Erro ao carregar entrega" });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadRide();
  }, [rideId]);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso à câmera para tirar fotos da entrega.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPhoto(base64);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Toast.show({ type: "error", text1: "Erro ao tirar foto" });
    }
  };

  const handleConfirm = async () => {
    if (!photo) {
      Alert.alert("Foto necessária", "Por favor, tire uma foto do pacote antes de confirmar.");
      return;
    }

    if (ride?.details?.pickupPin && pin !== ride.details.pickupPin) {
      Alert.alert("PIN incorreto", "O PIN de coleta informado está incorreto. Verifique com o remetente.");
      return;
    }

    setUploading(true);

    try {
      await rideService.updateStatus(rideId, "in_progress");
      await rideService.uploadPickupProof(rideId, photo);

      setConfirmed(true);
      Toast.show({ type: "success", text1: "Coleta confirmada!" });

      setTimeout(() => {
        navigation.replace("DeliveryDropoffConfirm", { rideId });
      }, 1500);
    } catch (error) {
      console.error("Erro ao confirmar coleta:", error);
      Toast.show({ type: "error", text1: "Erro ao confirmar coleta" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <ActivityIndicator size="large" color="#02de95" />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <Text className="text-white text-lg">Entrega não encontrada</Text>
      </SafeAreaView>
    );
  }

  if (confirmed) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <CheckCircle size={80} color="#02de95" />
        <Text className="text-white text-2xl font-bold mt-4">Coleta Confirmada!</Text>
        <Text className="text-[rgba(255,255,255,0.6)] text-base mt-2">
          Redirecionando para entrega...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-4 border-b border-[rgba(255,255,255,0.1)]">
          <Text className="text-white text-2xl font-bold">Confirmação de Coleta</Text>
          <Text className="text-[rgba(255,255,255,0.6)] text-sm mt-1">
            Confirme que você coletou o pacote
          </Text>
        </View>

        {/* Informações do Remetente */}
        <View className="px-4 py-4">
          <View className="p-4 rounded-2xl bg-[rgba(255,255,255,0.05)]">
            <Text className="text-white text-base font-bold mb-3">Remetente</Text>

            <View className="flex-row items-start mb-3">
              <View className="w-2 h-2 rounded-full bg-[#02de95] mt-2 mr-3" />
              <View className="flex-1">
                <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Endereço</Text>
                <Text className="text-white text-sm">{ride.pickup?.address}</Text>
              </View>
            </View>

            {ride.details?.senderName && (
              <View className="flex-row items-center mb-2">
                <Package size={16} color="#02de95" />
                <Text className="text-white text-sm ml-2">{ride.details.senderName}</Text>
              </View>
            )}

            {ride.details?.senderPhone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${ride.details.senderPhone}`)}
                className="flex-row items-center"
              >
                <Phone size={16} color="#02de95" />
                <Text className="text-[#02de95] text-sm ml-2">{ride.details.senderPhone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PIN de Coleta */}
        {ride.details?.pickupPin && (
          <View className="px-4 py-4">
            <View className="p-4 rounded-2xl bg-[rgba(2,222,149,0.1)] border border-[#02de95]">
              <Text className="text-white text-base font-bold mb-3">PIN de Coleta</Text>
              <Text className="text-[rgba(255,255,255,0.6)] text-sm mb-2">
                Solicite o PIN ao remetente e digite abaixo:
              </Text>

              <TextInput
                value={pin}
                onChangeText={setPin}
                placeholder="Digite o PIN"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={6}
                className="bg-[rgba(255,255,255,0.1)] text-white text-center text-2xl font-bold py-3 rounded-xl"
              />

              {pin && pin !== ride.details.pickupPin && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={16} color="#ef4444" />
                  <Text className="text-[#ef4444] text-sm ml-2">PIN incorreto</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Foto do Pacote */}
        <View className="px-4 py-4">
          <View className="p-4 rounded-2xl bg-[rgba(255,255,255,0.05)]">
            <Text className="text-white text-base font-bold mb-3">Foto do Pacote</Text>
            <Text className="text-[rgba(255,255,255,0.6)] text-sm mb-4">
              Tire uma foto do pacote coletado como prova
            </Text>

            {photo ? (
              <View>
                <Image
                  source={{ uri: photo }}
                  className="w-full h-64 rounded-xl mb-3"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={takePhoto}
                  className="flex-row items-center justify-center py-3 rounded-xl bg-[rgba(255,255,255,0.1)]"
                >
                  <Camera size={20} color="#fff" />
                  <Text className="text-white text-sm font-bold ml-2">Tirar nova foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-row items-center justify-center py-8 rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.2)]"
              >
                <Camera size={32} color="#02de95" />
                <Text className="text-[#02de95] text-base font-bold ml-2">Tirar foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Botão de Confirmação */}
      <View className="px-4 py-4 bg-[#091A2F] border-t border-[rgba(255,255,255,0.1)]">
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!photo || uploading || (ride.details?.pickupPin && pin !== ride.details.pickupPin)}
          className={`flex-row items-center justify-center py-4 rounded-xl ${
            !photo || uploading || (ride.details?.pickupPin && pin !== ride.details.pickupPin)
              ? "bg-[rgba(255,255,255,0.1)]"
              : "bg-[#02de95]"
          }`}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle size={20} color={!photo || (ride.details?.pickupPin && pin !== ride.details.pickupPin) ? "#666" : "#091A2F"} />
              <Text
                className={`text-base font-bold ml-2 ${
                  !photo || (ride.details?.pickupPin && pin !== ride.details.pickupPin)
                    ? "text-[#666]"
                    : "text-[#091A2F]"
                }`}
              >
                Confirmar Coleta
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
