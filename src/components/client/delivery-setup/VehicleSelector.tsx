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
  { id: "truck", label: "Caminhão", desc: "Grandes fretes", cap: "Até 3 ton", icon: Container },
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
            label: v.label || v.name || defaultMatch?.label || "",
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
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 10 }}
      >
        {vehicles.map((vehicle) => {
          const isSelected = selected === vehicle.id;
          const Icon = vehicle.icon;
          const isAvailable = !hasCheckedOnline ? true : onlineTypes.has(vehicle.id);

          return (
            <TouchableOpacity
              key={vehicle.id}
              activeOpacity={0.85}
              onPress={() => {
                if (!isAvailable) {
                  // Instantly populates and triggers dynamic rich-aesthetic UI modal!
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
                className={`w-[108px] p-3 rounded-2xl border-[1.5px] overflow-hidden relative shadow-lg shadow-black ${
                  isSelected ? "border-[#02de95] bg-[#1E2D3D]" : "border-transparent bg-[#11253E]"
                } ${!isAvailable ? "opacity-50" : "opacity-100"}`}
              >
                {/* 🔒 Premium Frosted Amber Lock Badge */}
                {!isAvailable && (
                  <MotiView 
                    from={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-amber-500/20 w-5 h-5 rounded-full items-center justify-center border border-amber-500/40 shadow-sm"
                  >
                    <Lock size={9} color="#fbbf24" strokeWidth={3} />
                  </MotiView>
                )}

                <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 border ${
                  isSelected ? 'bg-[#02de95]/10 border-[#02de95]/30' : 
                  !isAvailable ? 'bg-white/5 border-white/5' : 'bg-[#1E2D3D] border-white/[0.03]'
                }`}>
                  <Icon 
                    size={20} 
                    color={isSelected ? "#02de95" : !isAvailable ? "#475569" : "#94a3b8"} 
                    strokeWidth={isSelected ? 2.5 : 2} 
                  />
                </View>

                <Text className={`text-sm font-bold ${isSelected ? 'text-white' : !isAvailable ? 'text-slate-400' : 'text-slate-200'}`}>
                  {vehicle.label}
                </Text>
                <Text className="text-[9px] text-slate-500 font-medium mb-1.5 leading-tight" numberOfLines={1}>
                  {vehicle.desc}
                </Text>

                <View className={`self-start px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-primary/20' : !isAvailable ? 'bg-slate-800/50' : 'bg-white/10'}`}>
                  <Text className={`text-[8.5px] font-bold ${isSelected ? 'text-primary' : !isAvailable ? 'text-slate-500' : 'text-slate-400'}`}>
                    {vehicle.cap}
                  </Text>
                </View>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
