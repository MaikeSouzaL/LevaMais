import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, ChevronRight, User } from "lucide-react-native";
import { ClientStackParamList } from "../../../types/navigation";
import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import Toast from "react-native-toast-message";

export default function EditDeliveryAddressScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "EditDeliveryAddress">>();

  const addressId = route.params?.addressId;

  // Form fields
  const [address, setAddress] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (addressId) {
      loadAddress();
    }
  }, [addressId]);

  useEffect(() => {
    if (route.params?.mapPickedAddress) {
      setAddress(route.params.mapPickedAddress);
    }
  }, [route.params?.mapPickedAddress]);

  const loadAddress = async () => {
    try {
      if (route.params?.addressData) {
        const fav = route.params.addressData;
        setAddress(fav.formattedAddress || fav.address || "");
        setAddressDetails(fav.details || "");
        setContactName(fav.contactName || fav.name || "");
        setContactPhone(fav.contactPhone || fav.contactPhone === "" ? fav.contactPhone : "");
        return;
      }
      const favs = await favoriteAddressService.list();
      const fav = favs.find(f => f._id === addressId || f.id === addressId);
      if (fav) {
        setAddress(fav.formattedAddress || fav.address || "");
        setAddressDetails(fav.details || "");
        setContactName(fav.contactName || fav.name || "");
        setContactPhone(fav.contactPhone || "");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleSave = async () => {
    if (!addressId) return;
    setIsLoading(true);
    try {
      if (addressId.toString().startsWith("hist_")) {
        await favoriteAddressService.create({
          name: contactName || "Favorito recente",
          address,
          formattedAddress: address,
          details: addressDetails,
          contactPhone,
          latitude: route.params?.addressData?.latitude || 0,
          longitude: route.params?.addressData?.longitude || 0,
        });
      } else {
        await favoriteAddressService.update(addressId, {
          address,
          details: addressDetails,
          contactName,
          contactPhone,
        });
      }
      Toast.show({ type: "success", text1: "Endereço atualizado com sucesso!" });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao atualizar endereço" });
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!addressId) return;
    setIsLoading(true);
    try {
      if (!addressId.toString().startsWith("hist_")) {
        await favoriteAddressService.delete(addressId);
      }
      Toast.show({ type: "success", text1: "Endereço removido!" });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao remover endereço" });
    }
    setIsLoading(false);
  };

  const isFormValid = address.trim().length > 0 && contactName.trim().length > 0 && contactPhone.trim().length > 0;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 44 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#111" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[18px] font-bold text-gray-900 -ml-8">
          Editar endereço
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-5">
            {/* Address Field */}
            <View className="mb-6">
              <Text className="text-gray-500 text-[13px] font-bold mb-2">
                Endereço<Text className="text-[#02de95]">*</Text>
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  navigation.navigate("FavoriteAddressFlow", {
                    selectionMode: true,
                    initialSearchMode: "favoritesList",
                    returnScreen: "EditDeliveryAddress",
                  });
                }}
                className="flex-row items-center py-2 border-b border-gray-200"
              >
                <Text
                  className="flex-1 text-[16px] font-medium text-gray-900"
                  numberOfLines={2}
                >
                  {address || "Selecionar endereço"}
                </Text>
                <ChevronRight size={18} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Address Details */}
            <View className="mb-6">
              <Text className="text-gray-500 text-[13px] font-bold mb-2">Detalhes do endereço</Text>
              <TextInput
                value={addressDetails}
                onChangeText={setAddressDetails}
                placeholder="Ex.: bloco A, apartamento 201"
                placeholderTextColor="#bbb"
                className="py-2 border-b border-gray-200 text-[16px] text-gray-900 font-medium"
              />
            </View>

            {/* Contact Name */}
            <View className="mb-6">
              <Text className="text-gray-500 text-[13px] font-bold mb-2">
                Nome para contato<Text className="text-[#02de95]">*</Text>
              </Text>
              <View className="flex-row items-center border-b border-gray-200">
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  className="flex-1 py-2 text-[16px] text-gray-900 font-bold"
                />
                <TouchableOpacity className="p-2">
                  <User size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone */}
            <View className="mb-8">
              <Text className="text-gray-500 text-[13px] font-bold mb-2">
                Número de telefone<Text className="text-[#02de95]">*</Text>
              </Text>
              <View className="flex-row items-center border-b border-gray-200 py-2">
                <View className="flex-row items-center mr-3">
                  <Text className="text-[16px]">🇧🇷</Text>
                  <Text className="text-[16px] text-gray-900 font-medium ml-1">+55 ▾</Text>
                </View>
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  className="flex-1 text-[16px] text-gray-900 font-bold"
                />
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isFormValid || isLoading}
              className={`w-full h-[52px] rounded-full items-center justify-center mb-4 ${
                isFormValid && !isLoading ? "bg-[#FFC107]" : "bg-gray-200"
              }`}
            >
              <Text className={`text-[16px] font-bold ${isFormValid && !isLoading ? "text-gray-900" : "text-gray-400"}`}>
                Confirmar
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isLoading}
              className="w-full h-[52px] rounded-full items-center justify-center bg-gray-50"
            >
              <Text className="text-[16px] font-bold text-gray-800">
                Deletar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
