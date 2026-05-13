import React, { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { ClientScreenHeader, EmptyState } from "../Shared/components";
import { getNotifications } from "@/services/auth.service";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: "ride" | "promo" | "system" | "payment";
  createdAt: string;
  read: boolean;
};

const NOTIF_ICONS: Record<string, string> = {
  ride: "local-shipping",
  promo: "local-offer",
  system: "notifications",
  payment: "payment",
};

export default function NotificationsCenterScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const items = await getNotifications();
      setNotifications((items || []) as NotificationItem[]);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  function handlePress(item: NotificationItem) {
    if (item.type === "ride") {
      navigation.navigate("History");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Notificacoes" subtitle="Historico de alertas e mensagens" />

      {loading && !refreshing ? null : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off"
          title="Nenhuma notificacao"
          description="Suas notificacoes aparecerao aqui"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor={colors.primary[500]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`flex-row items-start rounded-lg border mb-2 p-4 ${
                !item.read
                  ? "border-[rgba(2,222,149,0.25)] bg-[rgba(2,222,149,0.03)]"
                  : "border-gray-700 bg-[#0d2838]"
              }`}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View className={`w-11 h-11 rounded-lg items-center justify-center mr-3 ${
                !item.read ? "bg-[rgba(2,222,149,0.1)]" : "bg-white/5"
              }`}>
                <MaterialIcons
                  name={NOTIF_ICONS[item.type] as any}
                  size={22}
                  color={!item.read ? colors.primary[500] : "#666"}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between">
                  <Text className={`text-sm font-semibold flex-1 ${
                    !item.read ? "text-white font-bold" : "text-gray-300"
                  }`}>
                    {item.title}
                  </Text>
                  {!item.read && <View className="w-2 h-2 rounded-full bg-[#02de95] ml-2 mt-1.5" />}
                </View>
                <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>{item.body}</Text>
                <Text className="text-gray-500 text-xs mt-1.5">
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

