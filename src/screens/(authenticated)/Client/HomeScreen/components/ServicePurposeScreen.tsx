import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

interface PurposeItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const PURPOSES: PurposeItem[] = [
  {
    id: "delivery",
    title: "Entrega de Delivery",
    subtitle: "Entregar pacotes e encomendas",
    icon: "local-shipping",
  },
  {
    id: "documents",
    title: "Documentos",
    subtitle: "Envio e retirada de documentos",
    icon: "description",
  },
  {
    id: "market",
    title: "Compras de Supermercado",
    subtitle: "Itens leves e compras do dia a dia",
    icon: "shopping-cart",
  },
  {
    id: "express",
    title: "Expresso",
    subtitle: "Coleta e entrega rápida",
    icon: "bolt",
  },
  // Extras sugeridos
  {
    id: "pharmacy",
    title: "Farmácia",
    subtitle: "Medicamentos e itens de saúde",
    icon: "local-pharmacy",
  },
  {
    id: "petshop",
    title: "Pet Shop",
    subtitle: "Itens para pets",
    icon: "pets",
  },
  {
    id: "postoffice",
    title: "Correios/Cartório",
    subtitle: "Postagens e autenticações",
    icon: "markunread-mailbox",
  },
  {
    id: "meals",
    title: "Refeições/Restaurantes",
    subtitle: "Retirada de comida pronta",
    icon: "restaurant",
  },
  {
    id: "ecommerce",
    title: "E-commerce/Loja",
    subtitle: "Coleta de pedidos em lojas",
    icon: "store",
  },
  {
    id: "office",
    title: "Material de escritório",
    subtitle: "Papelaria e suprimentos",
    icon: "inventory",
  },
  {
    id: "parts",
    title: "Peças e ferramentas leves",
    subtitle: "Auto/industrial leves",
    icon: "build",
  },
  {
    id: "bank",
    title: "Bancos/Financeiro",
    subtitle: "Documentos bancários",
    icon: "account-balance",
  },
  {
    id: "gifts",
    title: "Presentes/Floricultura",
    subtitle: "Entregas pontuais",
    icon: "redeem",
  },
  {
    id: "scheduled",
    title: "Retirada agendada",
    subtitle: "Coletas com horário",
    icon: "event",
  },
  {
    id: "multiparadas",
    title: "Multi-paradas",
    subtitle: "Roteiro com 2-3 endereços",
    icon: "alt-route",
  },
  {
    id: "urgent",
    title: "Urgente 1h",
    subtitle: "SLA mais curto, taxa diferenciada",
    icon: "speed",
  },
];

export function ServicePurposeScreen({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (purposeId: string) => void;
}) {
  return (
    <SafeAreaView
      style={{
        position: "absolute",
        inset: 0 as any,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#0f231c",
        zIndex: 50,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{ padding: 8, marginRight: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
          Escolha o tipo de serviço
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={PURPOSES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderRadius: 16,
              backgroundColor: "#162e26",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={28}
                  color="#9bbbb0"
                />
              </View>
              <View>
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                >
                  {item.title}
                </Text>
                <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9bbbb0" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
