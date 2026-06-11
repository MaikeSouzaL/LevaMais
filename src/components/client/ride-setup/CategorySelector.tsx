import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { Car, Bike, ShieldCheck } from "lucide-react-native";
import configService from "@/services/config.service";

export type CategoryType = "car" | "motorcycle" | "comfort";

interface Category {
  id: CategoryType;
  label: string;
  description: string;
  icon: any;
}

interface CategorySelectorProps {
  selected: CategoryType;
  onSelect: (id: CategoryType) => void;
}

const ICON_MAP: Record<string, any> = {
  car: Car,
  motorcycle: Bike,
  comfort: ShieldCheck,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "car", label: "LEVA POP", description: "Econômico diário", icon: Car },
  { id: "motorcycle", label: "LEVA MOTO", description: "Rápido & prático", icon: Bike },
  { id: "comfort", label: "LEVA COMFORT", description: "Premium especial", icon: ShieldCheck },
];

export const CategorySelector = ({ selected, onSelect }: CategorySelectorProps) => {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await configService.getRideCategories();
        const formattedCategories: Category[] = data.map((cat: any) => ({
          id: cat.id as CategoryType,
          label: cat.label || cat.name,
          description: cat.description || "",
          icon: ICON_MAP[cat.id] || Car,
        }));
        setCategories(formattedCategories);
      } catch (error) {
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <View className="mb-6 mt-2 items-center py-4">
        <ActivityIndicator size="small" color="#02de95" />
      </View>
    );
  }
  return (
    <View className="mb-6 mt-2">
      <View className="px-6 mb-2.5">
        <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Selecione a Categoria</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
      >
        {categories.map((cat) => {
          const isSelected = selected === cat.id;
          const Icon = cat.icon;
          
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.85}
              onPress={() => onSelect(cat.id)}
            >
              <MotiView
                animate={{
                  scale: isSelected ? 1.03 : 0.97,
                  borderColor: isSelected ? "rgba(2, 222, 149, 0.4)" : "rgba(255,255,255,0.08)",
                  backgroundColor: isSelected ? "rgba(2, 222, 149, 0.08)" : "rgba(255,255,255,0.03)",
                }}
                transition={{ type: "spring", damping: 15 }}
                className="w-32 p-3.5 rounded-2xl border overflow-hidden"
              >
                {/* Active Glow Backdrop inside the card */}
                {isSelected && (
                  <MotiView
                    from={{ opacity: 0.3, scale: 0.5 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    transition={{ type: "timing", duration: 600 }}
                    className="absolute top-0 right-0 w-12 h-12 rounded-full bg-primary/20 blur-xl"
                  />
                )}

                <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 border ${isSelected ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                  <Icon size={20} color={isSelected ? "#02de95" : "#94a3b8"} strokeWidth={isSelected ? 2.5 : 2} />
                </View>

                <Text className={`text-sm font-bold mb-0.5 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {cat.label}
                </Text>
                <Text className="text-[10px] text-slate-500 font-medium leading-tight">
                  {cat.description}
                </Text>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
