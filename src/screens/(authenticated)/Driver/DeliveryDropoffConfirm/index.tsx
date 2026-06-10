import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckCircle, AlertCircle, MapPin, Phone, User } from "lucide-react-native";
import { TextInput } from "react-native";

import { DriverStackParamList } from "../types/navigation";
import rideService from "@/services/ride.service";
import Toast from "react-native-toast-message";

type DeliveryDropoffConfirmRouteProp = RouteProp<DriverStackParamList, "DeliveryDropoffConfirm">;

export default function DeliveryDropoffConfirm() {
  const navigation = useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const route = useRoute<DeliveryDropoffConfirmRouteProp>();
  const { rideId } = route.params;

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const loadRide = async () => {
      try {
        const data = await rideService.getById(rideId);
        setRide(data);
      } catch {
        Toast.show({ type: "error", text1: "Erro ao carregar entrega" });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadRide();
  }, [rideId]);

  const hasPin = Boolean(ride?.details?.deliveryPin);
  const pinCorrect = !hasPin || (pin.length > 0 && pin === ride.details.deliveryPin);
  const canConfirm = (!hasPin || pinCorrect) && !uploading;

  const handlePinChange = (value: string) => {
    setPin(value);
    if (hasPin && value.length >= String(ride.details.deliveryPin).length) {
      setPinError(value !== ride.details.deliveryPin);
    } else {
      setPinError(false);
    }
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setUploading(true);
    try {
      if (ride?.details?.deliveryPin) {
        const pinResult = await rideService.validatePin(rideId, "delivery", pin);
        if (!pinResult?.valid) {
          Toast.show({ type: "error", text1: "PIN incorreto" });
          setUploading(false);
          return;
        }
      }

      await rideService.updateStatus(rideId, "completed", false, {
        deliveryPin: pin,
      });

      Toast.show({ type: "success", text1: "Entrega finalizada!" });

      (navigation as any).replace("DriverRateClient", { rideId });
    } catch (error) {
      console.error("Erro ao finalizar entrega:", error);
      Toast.show({ type: "error", text1: "Erro ao finalizar entrega" });
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

  if (confirmed) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <CheckCircle size={80} color="#02de95" />
        <Text className="text-white text-2xl font-bold mt-4">Entrega Finalizada!</Text>
        <Text className="text-[rgba(255,255,255,0.6)] text-base mt-2">Redirecionando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 border-b border-[rgba(255,255,255,0.1)]">
          <Text className="text-white text-2xl font-bold">Confirmacao de Entrega</Text>
          <Text className="text-[rgba(255,255,255,0.6)] text-sm mt-1">
            Confirme que voce entregou o pacote
          </Text>
        </View>

        {/* Info do Destinatario */}
        <View className="px-4 py-4">
          <View className="p-4 rounded-2xl bg-[rgba(255,255,255,0.05)]">
            <Text className="text-white text-base font-bold mb-3">Destinatario</Text>
            <View className="flex-row items-start mb-3">
              <View className="w-2 h-2 rounded-full bg-[#ef4444] mt-2 mr-3" />
              <View className="flex-1">
                <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Endereco</Text>
                <Text className="text-white text-sm">{ride?.dropoff?.address}</Text>
              </View>
            </View>
            {ride?.details?.recipientName && (
              <View className="flex-row items-center mb-2">
                <User size={16} color="#02de95" />
                <Text className="text-white text-sm ml-2">{ride.details.recipientName}</Text>
              </View>
            )}
            {ride?.details?.recipientPhone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${ride.details.recipientPhone}`)} className="flex-row items-center">
                <Phone size={16} color="#02de95" />
                <Text className="text-[#02de95] text-sm ml-2">{ride.details.recipientPhone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PIN de Entrega */}
        {hasPin && (
          <View className="px-4 py-4">
            <View className="p-4 rounded-2xl bg-[rgba(2,222,149,0.1)] border border-[#02de95]">
              <Text className="text-white text-base font-bold mb-3">PIN de Entrega</Text>
              <Text className="text-[rgba(255,255,255,0.6)] text-sm mb-3">
                Solicite o PIN ao destinatario e digite abaixo:
              </Text>
              <TextInput
                value={pin}
                onChangeText={handlePinChange}
                placeholder="Digite o PIN"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={6}
                className="bg-[rgba(255,255,255,0.1)] text-white text-center text-2xl font-bold py-3 rounded-xl"
              />
              {pinError && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={16} color="#ef4444" />
                  <Text className="text-[#ef4444] text-sm ml-2">PIN incorreto</Text>
                </View>
              )}
              {pinCorrect && !pinError && pin.length > 0 && (
                <View className="flex-row items-center mt-2">
                  <CheckCircle size={16} color="#02de95" />
                  <Text className="text-[#02de95] text-sm ml-2">PIN correto!</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botao */}
      <View className="px-4 py-4 bg-[#091A2F] border-t border-[rgba(255,255,255,0.1)]">
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!canConfirm}
          className={`flex-row items-center justify-center py-4 rounded-xl ${canConfirm ? "bg-[#02de95]" : "bg-[rgba(255,255,255,0.1)]"}`}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle size={20} color={canConfirm ? "#091A2F" : "#666"} />
              <Text className={`text-base font-bold ml-2 ${canConfirm ? "text-[#091A2F]" : "text-[#666]"}`}>
                Confirmar Entrega
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
