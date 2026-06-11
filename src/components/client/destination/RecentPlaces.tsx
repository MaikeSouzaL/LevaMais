import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { Home, Briefcase, Heart } from "lucide-react-native";
import favoriteAddressService from "@/services/favoriteAddress.service";

interface Place {
  id: string;
  type: "home" | "work" | "favorite";
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface RecentPlacesProps {
  onSelect: (place: Place) => void;
}

export const RecentPlaces = ({ onSelect }: RecentPlacesProps) => {
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    const loadFavs = async () => {
      try {
        const list = await favoriteAddressService.list();
        const mapped: Place[] = list.map((f) => ({
          id: f._id,
          type: (f.name.toLowerCase().includes("casa") ? "home" : 
                 f.name.toLowerCase().includes("trabalho") ? "work" : "favorite") as any,
          label: f.name,
          address: f.address,
          latitude: f.latitude,
          longitude: f.longitude
        }));
        setPlaces(mapped.slice(0, 5));
      } catch (e) {
        setPlaces([]);
      }
    };
    loadFavs();
  }, []);

  if (places.length === 0) return null;

  const renderIcon = (type: string) => {
    const size = 14;
    const color = "#94a3b8";
    switch (type) {
      case "home": return <Home size={size} color={color} />;
      case "work": return <Briefcase size={size} color={color} />;
      default: return <Heart size={size} color={color} />;
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", delay: 200 }}
      className="mt-4 z-[80]"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      >
        {places.map((place) => (
          <TouchableOpacity
            key={place.id}
            className="flex-row items-center bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
            onPress={() => onSelect(place)}
            activeOpacity={0.7}
          >
            <View className="mr-1">
              {renderIcon(place.type)}
            </View>
            <Text className="text-slate-800 text-xs font-bold" numberOfLines={1}>
              {place.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </MotiView>
  );
};
