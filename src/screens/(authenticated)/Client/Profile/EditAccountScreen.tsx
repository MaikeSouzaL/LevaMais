import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
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
      } catch {
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
      <SafeAreaView style={styles.container}>
        <ClientScreenHeader
          title="Editar conta"
          subtitle="Atualize seus dados pessoais"
        />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Editar conta" subtitle="Dados pessoais" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome completo"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readonlyInput]}
            value={email}
            editable={false}
            selectTextOnFocus={false}
          />
          <Text style={styles.helperText}>
            O email nao pode ser alterado por esta tela.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="(11) 99999-9999"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing["3xl"],
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  readonlyInput: {
    opacity: 0.7,
  },
  helperText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
});
