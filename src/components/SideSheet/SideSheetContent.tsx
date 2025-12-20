import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface SideSheetContentProps {
  onClose?: () => void;
  onPressSearch?: () => void;
  onPressRide?: () => void;
  onPressDelivery?: () => void;
}

export function SideSheetContent({
  onClose,
  onPressSearch,
  onPressRide,
  onPressDelivery,
}: SideSheetContentProps) {
  return (
    <View className="flex-1 bg-background-dark">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b border-white/10">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-white">Menu</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5"
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Principal - SearchBar e Services */}
      <View className="px-6 pt-6">
        {/* Barra de busca */}
        <TouchableOpacity
          onPress={onPressSearch}
          className="flex-row items-center gap-3 bg-primary rounded-full px-5 py-4 mb-6 active:opacity-80"
          activeOpacity={0.9}
        >
          <MaterialIcons name="search" size={24} color="#0f231c" />
          <Text className="flex-1 text-base font-semibold text-[#0f231c]">
            Para onde vamos?
          </Text>
        </TouchableOpacity>

        {/* Cards de serviços - 2 colunas */}
        <View className="flex-row gap-4 mb-6">
          {/* Card Corrida */}
          <TouchableOpacity
            onPress={onPressRide}
            className="flex-1 bg-surface-dark/50 border border-white/5 rounded-3xl p-5 active:bg-surface-dark"
            activeOpacity={0.9}
          >
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-3">
              <MaterialIcons name="local-taxi" size={28} color="#02de95" />
            </View>
            <Text className="text-white font-bold text-lg mb-1">Corrida</Text>
            <Text className="text-gray-400 text-sm">Carro ou Moto</Text>
          </TouchableOpacity>

          {/* Card Entrega */}
          <TouchableOpacity
            onPress={onPressDelivery}
            className="flex-1 bg-surface-dark/50 border border-white/5 rounded-3xl p-5 active:bg-surface-dark"
            activeOpacity={0.9}
          >
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-3">
              <MaterialIcons name="local-shipping" size={28} color="#02de95" />
            </View>
            <Text className="text-white font-bold text-lg mb-1">Entrega</Text>
            <Text className="text-gray-400 text-sm">Enviar itens</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ScrollView para opções adicionais */}
      <ScrollView className="flex-1 px-6">
        <View className="border-t border-white/5 pt-4 mb-4">
          <Text className="text-gray-400 text-xs uppercase tracking-wider mb-3">
            Acesso Rápido
          </Text>
        </View>

        {/* Opções de Menu */}
        <View className="space-y-3">
          <OptionItem
            icon="history"
            title="Histórico de Viagens"
            subtitle="Veja suas corridas anteriores"
          />
          <OptionItem
            icon="account-balance-wallet"
            title="Carteira"
            subtitle="Saldo e forma de pagamento"
          />
          <OptionItem
            icon="location-on"
            title="Endereços Salvos"
            subtitle="Casa, trabalho e favoritos"
          />
          <OptionItem
            icon="star"
            title="Favoritos"
            subtitle="Motoristas e rotas favoritas"
          />
          <OptionItem
            icon="notifications"
            title="Notificações"
            subtitle="Gerenciar alertas"
          />
          <OptionItem
            icon="settings"
            title="Configurações"
            subtitle="Preferências do app"
          />
        </View>
      </ScrollView>
    </View>
  );
}

interface OptionItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

function OptionItem({ icon, title, subtitle, onPress }: OptionItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-4 bg-surface-dark/30 border border-white/5 rounded-2xl p-4 active:bg-surface-dark"
    >
      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
        <MaterialIcons name={icon} size={24} color="#02de95" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{title}</Text>
        <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );
}
