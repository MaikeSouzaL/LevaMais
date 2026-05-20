import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, StatusBar, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import { ArrowLeft, CreditCard, CheckCircle, Trash2, Plus, CreditCardIcon, Star, Info } from "lucide-react-native";
import Toast from "react-native-toast-message";

import {
  deletePaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
  type PaymentMethod,
} from "@/services/auth.service";
import { ClientStackParamList } from "../types/navigation";
import { Modal } from "@/components/Modal";

const BRAND_COLORS: Record<string, string> = {
  visa: "#1a1f71",
  mastercard: "#eb001b",
  amex: "#2e77bc",
  elo: "#ffcb05",
  hipercard: "#b5291c",
};

export default function PaymentsCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "PaymentsCenter">>();
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getPaymentMethods();
      setMethods(list || []);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Erro ao carregar pagamentos", text2: error?.message || "Tente novamente" });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadMethods(); }, [loadMethods]));

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deletePaymentMethod(deleteTarget._id);
      Toast.show({ type: "success", text1: "Cartão removido" });
      await loadMethods();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Erro ao remover", text2: error?.message || "Tente novamente" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    setSettingDefault(methodId);
    try {
      await setDefaultPaymentMethod(methodId);
      Toast.show({ type: "success", text1: "Cartão padrão atualizado" });
      await loadMethods();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Erro ao atualizar padrão", text2: error?.message || "Tente novamente" });
    } finally {
      setSettingDefault(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16,
        flexDirection: "row", alignItems: "center",
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginRight: 14 }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Pagamentos</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Gerencie cartões e forma padrão</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Adicionar cartão */}
        <TouchableOpacity
          onPress={() => navigation.navigate("AddPaymentMethod")}
          activeOpacity={0.85}
          style={{
            height: 54, borderRadius: 16, backgroundColor: "#02de95",
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 10, marginBottom: 16,
          }}
        >
          <Plus size={20} color="#091A2F" />
          <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Adicionar Cartão
          </Text>
        </TouchableOpacity>

        {/* Info banner */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            flexDirection: "row", alignItems: "flex-start", gap: 12,
            backgroundColor: "rgba(59,130,246,0.07)",
            borderRadius: 16, padding: 14, borderWidth: 1,
            borderColor: "rgba(59,130,246,0.2)", marginBottom: 20,
          }}
        >
          <Info size={16} color="#60a5fa" style={{ marginTop: 1 }} />
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, flex: 1, lineHeight: 18 }}>
            O app já permite salvar e definir cartão padrão. A captura com gateway de pagamento externo será ativada na próxima fase.
          </Text>
        </MotiView>

        {/* Lista de cartões */}
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
          Seus Cartões
        </Text>

        {loading ? (
          <View style={{ padding: 32, alignItems: "center" }}>
            <ActivityIndicator color="#02de95" />
          </View>
        ) : methods.length === 0 ? (
          <View style={{
            alignItems: "center", padding: 32,
            backgroundColor: "#11253E", borderRadius: 20,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
          }}>
            <CreditCardIcon size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 14 }} />
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: "600" }}>Nenhum cartão cadastrado</Text>
            <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 6 }}>Adicione um cartão para pagar suas corridas</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {methods.map((method, index) => {
              const brand = String(method.brand || "card").toLowerCase();
              const isSettingThisDefault = settingDefault === method._id;
              return (
                <MotiView
                  key={method._id}
                  from={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: index * 60 }}
                  style={{
                    backgroundColor: "#11253E", borderRadius: 20,
                    borderWidth: method.isDefault ? 1.5 : 1,
                    borderColor: method.isDefault ? "rgba(2,222,149,0.4)" : "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 18, gap: 14 }}>
                    <View style={{
                      width: 46, height: 46, borderRadius: 14,
                      backgroundColor: "rgba(59,130,246,0.12)",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <CreditCard size={22} color="#60a5fa" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
                          {String(method.brand || "Card").toUpperCase()} •••• {method.last4}
                        </Text>
                        {method.isDefault && (
                          <View style={{ backgroundColor: "rgba(2,222,149,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(2,222,149,0.3)" }}>
                            <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "800" }}>PADRÃO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 2 }}>{method.holderName}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                        Validade: {String(method.expiryMonth).padStart(2, "0")}/{String(method.expiryYear).padStart(2, "0")}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setDeleteTarget(method)}
                      style={{
                        width: 36, height: 36, borderRadius: 11,
                        backgroundColor: "rgba(239,68,68,0.08)",
                        borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {!method.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(method._id)}
                      disabled={!!settingDefault}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                        paddingVertical: 13, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)",
                        backgroundColor: "rgba(2,222,149,0.04)",
                      }}
                    >
                      {isSettingThisDefault ? (
                        <ActivityIndicator size="small" color="#02de95" />
                      ) : (
                        <>
                          <Star size={15} color="#02de95" />
                          <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 13 }}>Definir como padrão</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </MotiView>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Delete modal */}
      <Modal
        visible={!!deleteTarget}
        title="Remover Cartão?"
        type="error"
        confirmText={isDeleting ? "Removendo..." : "Confirmar"}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      >
        {deleteTarget && (
          <View style={{ width: "100%", marginTop: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              Deseja remover o cartão{" "}
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {String(deleteTarget.brand || "Card").toUpperCase()} •••• {deleteTarget.last4}
              </Text>
              ?
            </Text>
          </View>
        )}
      </Modal>
    </View>
  );
}
