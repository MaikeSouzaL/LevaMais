import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { User, FileText, Hash, RefreshCw, AlertCircle } from "lucide-react-native";

interface DeliveryDataFormProps {
  pickupComplement: string;
  dropoffComplement: string;
  recipientName: string;
  recipientPhone: string;
  recipientInstructions: string;
  deliveryPin: string;
  onPickupComplementChange: (txt: string) => void;
  onDropoffComplementChange: (txt: string) => void;
  onRecipientNameChange: (txt: string) => void;
  onRecipientPhoneChange: (txt: string) => void;
  onRecipientInstructionsChange: (txt: string) => void;
  onDeliveryPinChange: (txt: string) => void;
  onRegeneratePin: () => void;
  nameError?: string;
  phoneError?: string;
}

export const DeliveryDataForm = ({
  pickupComplement,
  dropoffComplement,
  recipientName,
  recipientPhone,
  recipientInstructions,
  deliveryPin,
  onPickupComplementChange,
  onDropoffComplementChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  onRecipientInstructionsChange,
  onDeliveryPinChange,
  onRegeneratePin,
  nameError,
  phoneError,
}: DeliveryDataFormProps) => {
  return (
    <View className="mx-6 mb-6 rounded-2xl border border-white/[0.06] bg-[#11253E] p-5">
      <Text className="text-white/90 text-xs font-bold uppercase mb-4 tracking-wider">Dados da entrega</Text>

      {/* Complementos */}
      <View className="flex-row items-center gap-2 mb-3">
        <FileText size={12} color="#64748b" />
        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Complementos</Text>
      </View>

      <TextInput
        value={pickupComplement}
        onChangeText={onPickupComplementChange}
        placeholder="Complemento da coleta (opcional)"
        placeholderTextColor="rgba(255,255,255,0.30)"
        className="h-11 rounded-xl border border-white/[0.06] bg-[#0E1D31] px-4 text-white text-xs mb-2"
      />
      <TextInput
        value={dropoffComplement}
        onChangeText={onDropoffComplementChange}
        placeholder="Complemento da entrega (opcional)"
        placeholderTextColor="rgba(255,255,255,0.30)"
        className="h-11 rounded-xl border border-white/[0.06] bg-[#0E1D31] px-4 text-white text-xs mb-4"
      />

      <View className="h-[1px] bg-white/[0.04] mb-4" />

      {/* Recebedor */}
      <View className="flex-row items-center gap-2 mb-3">
        <User size={12} color="#64748b" />
        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Recebedor</Text>
      </View>

      <View className="relative mb-2">
        <TextInput
          value={recipientName}
          onChangeText={onRecipientNameChange}
          placeholder="Nome do recebedor *"
          placeholderTextColor="rgba(255,255,255,0.30)"
          className={`h-11 rounded-xl border bg-[#0E1D31] px-4 pr-10 text-white text-xs ${nameError ? "border-red-500/50" : "border-white/[0.06]"}`}
        />
        {nameError ? (
          <MotiView from={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-3 top-3">
            <AlertCircle size={14} color="#ef4444" />
          </MotiView>
        ) : null}
      </View>
      {nameError ? (
        <MotiView from={{ opacity: 0, translateY: -4 }} animate={{ opacity: 1, translateY: 0 }} className="mb-2">
          <Text className="text-red-400 text-[10px] font-medium ml-1">{nameError}</Text>
        </MotiView>
      ) : null}

      <View className="relative mb-2">
        <TextInput
          value={recipientPhone}
          onChangeText={onRecipientPhoneChange}
          placeholder="Telefone do recebedor *"
          placeholderTextColor="rgba(255,255,255,0.30)"
          keyboardType="phone-pad"
          className={`h-11 rounded-xl border bg-[#0E1D31] px-4 pr-10 text-white text-xs ${phoneError ? "border-red-500/50" : "border-white/[0.06]"}`}
        />
        {phoneError ? (
          <MotiView from={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-3 top-3">
            <AlertCircle size={14} color="#ef4444" />
          </MotiView>
        ) : null}
      </View>
      {phoneError ? (
        <MotiView from={{ opacity: 0, translateY: -4 }} animate={{ opacity: 1, translateY: 0 }} className="-mt-1 mb-3">
          <Text className="text-red-400 text-[10px] font-medium ml-1">{phoneError}</Text>
        </MotiView>
      ) : null}

      <View className="h-[1px] bg-white/[0.04] mb-4" />

      {/* Instruções */}
      <View className="flex-row items-center gap-2 mb-3">
        <FileText size={12} color="#64748b" />
        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Instruções</Text>
      </View>

      <TextInput
        value={recipientInstructions}
        onChangeText={onRecipientInstructionsChange}
        placeholder="Instruções para entrega (opcional)"
        placeholderTextColor="rgba(255,255,255,0.30)"
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        className="h-16 rounded-xl border border-white/[0.06] bg-[#0E1D31] px-4 py-3 text-white text-xs mb-4"
      />

      <View className="h-[1px] bg-white/[0.04] mb-4" />

      {/* PIN */}
      <View className="flex-row items-center gap-2 mb-3">
        <Hash size={12} color="#64748b" />
        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Código de confirmação</Text>
      </View>

      <View className="flex-row gap-2">
        <TextInput
          value={deliveryPin}
          onChangeText={onDeliveryPinChange}
          placeholder="PIN de entrega"
          placeholderTextColor="rgba(255,255,255,0.30)"
          keyboardType="number-pad"
          maxLength={6}
          className="flex-1 h-11 rounded-xl border border-white/[0.06] bg-[#0E1D31] px-4 text-white text-sm font-bold tracking-[4px] text-center"
        />
        <TouchableOpacity
          onPress={onRegeneratePin}
          activeOpacity={0.7}
          className="w-11 h-11 rounded-xl bg-[#1E2D3D] border border-white/[0.08] items-center justify-center"
        >
          <RefreshCw size={16} color="#02de95" />
        </TouchableOpacity>
      </View>
      <Text className="text-slate-500 text-[9px] font-medium mt-2 text-center">
        Compartilhe este PIN com o recebedor para confirmar a entrega
      </Text>
    </View>
  );
};
