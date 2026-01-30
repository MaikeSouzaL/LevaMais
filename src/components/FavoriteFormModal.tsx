import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal as RNModal,
  Animated,
  Dimensions,
  StyleSheet,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ICON_OPTIONS = [
  { id: "home", label: "Casa", icon: "home" },
  { id: "work", label: "Trabalho", icon: "work" },
  { id: "favorite", label: "Favorito", icon: "favorite" },
  { id: "shopping-cart", label: "Compras", icon: "shopping-cart" },
  { id: "school", label: "Escola", icon: "school" },
  { id: "restaurant", label: "Restaurante", icon: "restaurant" },
  { id: "local-hospital", label: "Hospital", icon: "local-hospital" },
  { id: "fitness-center", label: "Academia", icon: "fitness-center" },
] as const;

type FavoriteIconId = (typeof ICON_OPTIONS)[number]["id"];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: FavoriteIconId }) => Promise<void> | void;
};

export default function FavoriteFormModal({ visible, onClose, onSave }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<FavoriteIconId>("home");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => name.trim().length > 0 && !!icon, [name, icon]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        scaleAnim.setValue(0);
        setName("");
        setIcon("home");
        setSaving(false);
      });
    }
  }, [visible]);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), icon });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <RNModal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Adicionar favorito</Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
                <MaterialIcons name="close" size={22} color="#9db9b9" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome do favorito</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Casa, Trabalho..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Escolha um ícone</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((opt) => {
                const selected = opt.id === icon;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setIcon(opt.id)}
                    style={[styles.iconItem, selected && styles.iconItemSelected]}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={opt.icon as any}
                      size={24}
                      color={selected ? "#02de95" : "#9abcb0"}
                    />
                    <Text style={[styles.iconLabel, selected && { color: "#02de95" }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave || saving}
              activeOpacity={0.9}
              style={[
                styles.saveBtn,
                (!canSave || saving) && { backgroundColor: "rgba(2,222,149,0.3)" },
              ]}
            >
              <Text style={styles.saveText}>{saving ? "Salvando..." : "Salvar"}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  container: {
    width: width * 0.9,
    backgroundColor: "#1c2727",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    color: "#9abcb0",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#162e25",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: "#fff",
    fontSize: 15,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconItem: {
    width: 86,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#162e25",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconItemSelected: {
    backgroundColor: "rgba(2,222,149,0.12)",
    borderColor: "#02de95",
  },
  iconLabel: {
    marginTop: 6,
    fontSize: 10,
    color: "#9abcb0",
  },
  saveBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: "#111818",
    fontSize: 16,
    fontWeight: "800",
  },
});
