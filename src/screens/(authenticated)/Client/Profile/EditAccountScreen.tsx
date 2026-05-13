import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { colors } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../Shared/components";
import userService from "@/services/user.service";
import { useAuthStore } from "@/context/authStore";

export default function EditAccountScreen() {
  const updateUserData = useAuthStore((state) => state.updateUserData);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const profile = await userService.getProfile();
        if (!mounted) return;

        setName(profile.name || "");
        setPhone(profile.phone || "");
        setCity(profile.city || "");
        setEmail(profile.email || "");
      } catch (error) {
        console.error("Error loading profile:", error);
        if (!mounted) return;
        Toast.show({
          type: "error",
          text1: "Falha ao carregar dados da conta",
        });
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const normalizedPhone = phone.replace(/\D/g, "");
    const trimmedCity = city.trim();

    if (!trimmedName) {
      Toast.show({
        type: "error",
        text1: "Nome obrigatorio",
      });
      return;
    }

    if (normalizedPhone && (normalizedPhone.length < 10 || normalizedPhone.length > 11)) {
      Toast.show({
        type: "error",
        text1: "Telefone invalido",
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        name: trimmedName,
        phone: normalizedPhone,
        city: trimmedCity,
      });

      updateUserData({
        name: updated.name || trimmedName,
        nome: updated.name || trimmedName,
        telefone: updated.phone || normalizedPhone,
        cidade: updated.city || trimmedCity,
      });

      Toast.show({
        type: "success",
        text1: "Conta atualizada com sucesso",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar dados",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F]">
        <ClientScreenHeader
          title="Editar conta"
          subtitle="Atualize seus dados pessoais"
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Editar conta" subtitle="Dados pessoais" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
        <View className="gap-1">
          <Text className="text-white text-sm font-semibold">Nome</Text>
          <TextInput
            className="bg-[#0d2838] border border-gray-700 rounded-lg px-4 py-3 text-white text-base"
            value={name}
            onChangeText={setName}
            placeholder="Seu nome completo"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View className="gap-1">
          <Text className="text-white text-sm font-semibold">Email</Text>
          <TextInput
            className="bg-[#0d2838] border border-gray-700 rounded-lg px-4 py-3 text-white text-base opacity-70"
            value={email}
            editable={false}
            selectTextOnFocus={false}
          />
          <Text className="text-gray-500 text-xs">
            O email nao pode ser alterado por esta tela.
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-white text-sm font-semibold">Telefone</Text>
          <TextInput
            className="bg-[#0d2838] border border-gray-700 rounded-lg px-4 py-3 text-white text-base"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="(11) 99999-9999"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View className="gap-1">
          <Text className="text-white text-sm font-semibold">Cidade</Text>
          <TextInput
            className="bg-[#0d2838] border border-gray-700 rounded-lg px-4 py-3 text-white text-base"
            value={city}
            onChangeText={setCity}
            placeholder="Sua cidade"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <LoadingButton
          title={saving ? "Salvando..." : "Salvar alteracoes"}
          onPress={handleSave}
          loading={saving}
          variant="primary"
          disabled={saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

