import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { colors, spacing, fontSize, fontWeight } from "@/theme";
import { ClientStackParamList } from "../../types/navigation";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export default function ClientScreenHeader({
  title,
  subtitle,
  showBack = false,
}: Props) {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backButton} onPress={() => {
            try {
              if ("openDrawer" in navigation && typeof navigation.openDrawer === "function") {
                navigation.openDrawer();
                return;
              }
              navigation.navigate("Home");
            } catch {
              navigation.navigate("Home");
            }
          }}>
            <Icon name="menu" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.secondary,
  },
  backPlaceholder: {
    width: 34,
    height: 34,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
