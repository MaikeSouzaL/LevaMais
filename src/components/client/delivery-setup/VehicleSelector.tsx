import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from "react-native";
import { MotiView } from "moti";
import { Car, Bike, Truck, Container, Lock, X } from "lucide-react-native";
import configService from "@/services/config.service";
import rideService from "@/services/ride.service";

export type LogisticsVehicleType = "motorcycle" | "car" | "van" | "truck";

interface VehicleTypeConfig {
  id: LogisticsVehicleType;
  label: string;
  desc: string;
  cap: string;
  icon: any;
}

const ICON_MAP: Record<string, any> = {
  motorcycle: Bike,
  car: Car,
  van: Truck,
  truck: Container,
};

const DEFAULT_VEHICLES: VehicleTypeConfig[] = [
  { id: "motorcycle", label: "Moto", desc: "Entregas rápidas", cap: "Até 20kg", icon: Bike },
  { id: "car", label: "Carro", desc: "Pequenos volumes", cap: "Até 100kg", icon: Car },
  { id: "van", label: "Van", desc: "Cargas médias", cap: "Até 800kg", icon: Truck },
  { id: "truck", label: "Frete", desc: "Grandes fretes", cap: "Até 3 ton", icon: Container },
];

interface VehicleSelectorProps {
  selected: LogisticsVehicleType;
  onSelect: (id: LogisticsVehicleType) => void;
  pickupLocation?: { latitude: number; longitude: number };
}

export const VehicleSelector = ({ selected, onSelect, pickupLocation }: VehicleSelectorProps) => {
  const [vehicles, setVehicles] = useState<VehicleTypeConfig[]>(DEFAULT_VEHICLES);
  const [loading, setLoading] = useState(true);
  
  // ⚡ Realtime availability tracking states
  const [onlineTypes, setOnlineTypes] = useState<Set<string>>(new Set());
  const [hasCheckedOnline, setHasCheckedOnline] = useState(false);

  // 🎨 Modern Custom UI Modal replacement for ugly system alerts
  const [errorModal, setErrorModal] = useState<{ visible: boolean; vehicleLabel: string }>({
    visible: false,
    vehicleLabel: "",
  });

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        const res = await configService.getDeliveryVehicles();
        const data = Array.isArray(res) ? res : (res as any)?.data;
        
        if (!Array.isArray(data) || data.length === 0) {
          setVehicles(DEFAULT_VEHICLES);
          return;
        }

        const formattedVehicles: VehicleTypeConfig[] = data.map((v: any) => {
          let rawId = String(v.id || v._id || '').toLowerCase();
          let normalizedId: LogisticsVehicleType = "motorcycle";
          
          if (rawId.includes('moto')) normalizedId = "motorcycle";
          else if (rawId.includes('car')) normalizedId = "car";
          else if (rawId.includes('van')) normalizedId = "van";
          else if (rawId.includes('truck') || rawId.includes('caminh')) normalizedId = "truck";
          else normalizedId = rawId as LogisticsVehicleType;

          const defaultMatch = DEFAULT_VEHICLES.find(d => d.id === normalizedId);

          return {
            id: normalizedId,
            label: normalizedId === "truck" ? "Frete" : (v.label || v.name || defaultMatch?.label || ""),
            desc: v.description || v.desc || defaultMatch?.desc || "",
            cap: v.capacity || v.cap || defaultMatch?.cap || "",
            icon: ICON_MAP[normalizedId] || defaultMatch?.icon || Car,
          };
        });
        
        setVehicles(formattedVehicles.length > 0 ? formattedVehicles : DEFAULT_VEHICLES);
      } catch (error) {
        setVehicles(DEFAULT_VEHICLES);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  // 📡 Pull realtime online drivers from region to verify dynamic category locks
  useEffect(() => {
    const checkOnlineDrivers = async () => {
      if (!pickupLocation?.latitude || !pickupLocation?.longitude) return;
      try {
        const drivers = await rideService.getNearbyDrivers(
          pickupLocation.latitude,
          pickupLocation.longitude,
          15000
        );
        
        const activeTypes = new Set<string>();
        if (Array.isArray(drivers)) {
          drivers.forEach((d: any) => {
            if (d.type) activeTypes.add(d.type);
          });
        }
        setOnlineTypes(activeTypes);
        setHasCheckedOnline(true);
      } catch (err) {
        console.log("[VehicleSelector] Failed syncing nearby drivers:", err);
        setHasCheckedOnline(false);
      }
    };

    checkOnlineDrivers();
  }, [pickupLocation?.latitude, pickupLocation?.longitude]);

  if (loading) {
    return (
      <View className="mb-6 mt-2 items-center py-4">
        <ActivityIndicator size="small" color="#02de95" />
      </View>
    );
  }

  return (
    <View className="mb-6 mt-2">
      <View className="px-6 mb-3 flex-row items-center justify-between">
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Selecione o Veículo</Text>
      </View>
      
      <View className="px-6 py-2 flex-row justify-between">
        {vehicles.map((vehicle, index) => {
          const isSelected = selected === vehicle.id;
          const Icon = vehicle.icon;
          const isAvailable = !hasCheckedOnline ? true : onlineTypes.has(vehicle.id);

          const cleanCap = vehicle.cap.replace(/até\s+/gi, '').trim();
          const capParts = cleanCap.match(/^(\d+)\s*(.*)$/i);
          const capVal = capParts ? capParts[1] : cleanCap;
          const capUnit = capParts ? capParts[2] : "";

          return (
            <TouchableOpacity
              key={vehicle.id}
              activeOpacity={0.85}
              className={`flex-1 ${index !== vehicles.length - 1 ? "mr-1.5" : ""}`}
              onPress={() => {
                if (!isAvailable) {
                  setErrorModal({ visible: true, vehicleLabel: vehicle.label });
                  return;
                }
                onSelect(vehicle.id);
              }}
            >
              <MotiView
                animate={{
                  scale: isSelected ? 1.02 : 0.98,
                }}
                transition={{ type: "spring", damping: 18 }}
                className={`p-2 rounded-2xl border-[1.5px] items-start overflow-hidden relative shadow shadow-black ${
                  isSelected ? "border-[#02de95] bg-[#1E2D3D]" : "border-transparent bg-[#11253E]"
                } ${!isAvailable ? "opacity-50" : "opacity-100"}`}
              >
                {/* 🔒 Robust absolute Lock placement at Top Right */}
                {!isAvailable && (
                  <View 
                    style={{ position: "absolute", top: 5, right: 5, zIndex: 10 }}
                    className="bg-amber-500/20 w-[18px] h-[18px] rounded-full items-center justify-center border border-amber-500/40 shadow-sm"
                  >
                    <MotiView from={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Lock size={8} color="#fbbf24" strokeWidth={3} />
                    </MotiView>
                  </View>
                )}

                {/* 🎨 Drawing Icon framed on Left Side */}
                <View className={`w-7 h-7 rounded-lg items-center justify-center mb-1.5 border ${
                  isSelected ? 'bg-[#02de95]/10 border-[#02de95]/30' : 
                  !isAvailable ? 'bg-white/5 border-white/5' : 'bg-[#1E2D3D] border-white/[0.03]'
                }`}>
                  <Icon 
                    size={14} 
                    color={isSelected ? "#02de95" : !isAvailable ? "#475569" : "#94a3b8"} 
                    strokeWidth={2.5} 
                  />
                </View>

                <Text 
                  numberOfLines={1} 
                  className={`text-[10px] font-extrabold text-left mb-1 ${isSelected ? 'text-white' : !isAvailable ? 'text-slate-400' : 'text-slate-200'}`}
                >
                  {vehicle.label}
                </Text>

                <View className={`px-2 py-1 rounded-lg w-full items-start justify-center ${isSelected ? 'bg-primary/15 border border-primary/20' : !isAvailable ? 'bg-slate-800/40 border border-white/5' : 'bg-white/5 border border-white/[0.03]'}`}>
                  <Text
                    className={`text-[9px] font-black text-left opacity-85 tracking-[0.5px] ${isSelected ? 'text-primary' : !isAvailable ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    Até
                  </Text>
                  
                  <Text 
                    numberOfLines={1} 
                    className={`text-[11.5px] font-black text-left uppercase tracking-tight ${isSelected ? 'text-primary' : !isAvailable ? 'text-slate-500' : 'text-slate-200'}`}
                  >
                    {capVal}{capUnit}
                  </Text>
                </View>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 💎 Custom Glassmorphic Animated Warning Modal */}
      <Modal
        visible={errorModal.visible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setErrorModal({ visible: false, vehicleLabel: "" })}
      >
        <View className="flex-1 justify-center items-center px-6 bg-black/80">
          {/* Background touch area to dismiss */}
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setErrorModal({ visible: false, vehicleLabel: "" })}
            className="absolute inset-0"
          />

          {/* Animated Card Wrapper */}
          <MotiView
            from={{ opacity: 0, scale: 0.85, translateY: 30 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.85, translateY: 30 }}
            transition={{ type: "spring", damping: 16, stiffness: 140 }}
            className="w-full max-w-[340px] bg-[#11253E] border border-white/[0.08] rounded-[32px] p-6 items-center relative overflow-hidden shadow-2xl shadow-black"
          >
            {/* Glowing ambient accent in card top edge */}
            <View className="absolute -top-14 -right-14 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl" />
            <View className="absolute -bottom-14 -left-14 w-36 h-36 bg-[#02de95]/05 rounded-full blur-2xl" />

            {/* Floating Close Button */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setErrorModal({ visible: false, vehicleLabel: "" })}
              className="absolute top-4 right-4 w-8 h-8 bg-white/[0.05] rounded-full items-center justify-center border border-white/[0.05]"
            >
              <X size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* 🔐 Hexagonal/Circle Ambient Shield for Icon */}
            <View className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 rounded-[24px] items-center justify-center mb-5 shadow-lg shadow-amber-500/20 transform rotate-[8deg]">
              <View className="transform -rotate-[8deg]">
                <Lock size={26} color="#f59e0b" strokeWidth={2.5} />
              </View>
            </View>

            <Text className="text-[20px] font-extrabold text-white text-center tracking-tight mb-2.5">
              Veículo Indisponível
            </Text>

            <Text className="text-[13px] font-medium text-slate-400 text-center mb-7 leading-relaxed px-2">
              No momento, não possuímos nenhum motorista parceiro registrado e online para a categoria{" "}
              <Text className="font-bold text-amber-400">"{errorModal.vehicleLabel.toUpperCase()}"</Text> em sua localidade.
              {"\n\n"}
              Por favor, escolha outra modalidade ativa no seletor para iniciar seu envio agora.
            </Text>

            {/* Custom Solid Primary Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setErrorModal({ visible: false, vehicleLabel: "" })}
              className="w-full bg-[#02de95] py-3.5 rounded-2xl items-center shadow-lg shadow-[#02de95]/30"
            >
              <Text className="text-[#091A2F] font-bold text-[13px] uppercase tracking-[1.5px]">
                Entendi, obrigado
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
};
