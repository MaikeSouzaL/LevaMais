import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
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
    } catch {
      // silent
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
    <SafeAreaView style={styles.container}>
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
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor={colors.primary[500]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBg, !item.read && styles.iconBgUnread]}>
                <MaterialIcons
                  name={NOTIF_ICONS[item.type] as any}
                  size={22}
                  color={!item.read ? colors.primary[500] : "#666"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.cardTime}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  list: { padding: spacing.lg },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardUnread: {
    borderColor: "rgba(2,222,149,0.25)",
    backgroundColor: "rgba(2,222,149,0.03)",
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBgUnread: {
    backgroundColor: "rgba(2,222,149,0.1)",
  },
  cardTitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  cardTitleUnread: {
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing.sm,
    marginTop: 6,
  },
  cardBody: { color: colors.text.tertiary, fontSize: fontSize.sm, marginTop: 4 },
  cardTime: { color: "#555", fontSize: fontSize.xs, marginTop: 6 },
});
