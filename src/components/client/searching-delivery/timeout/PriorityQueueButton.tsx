import React from "react";
import { Text, TouchableOpacity, ActivityIndicator, View, StyleSheet } from "react-native";
import { Zap, Info } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface PriorityQueueButtonProps {
  onPress: () => void;
  loading: boolean;
}

export function PriorityQueueButton({ onPress, loading }: PriorityQueueButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={loading}
        style={styles.buttonShadow}
      >
        <LinearGradient
          colors={["#00E5FF", "#0088FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#091A2F" size="small" />
          ) : (
            <>
              <Zap size={18} color="#091A2F" strokeWidth={2.5} fill="#091A2F" style={styles.icon} />
              <Text style={styles.text}>
                Entrar na Fila Prioritária
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Explanatory context card below */}
      <View style={styles.infoContainer}>
        <Info size={13} color="rgba(255,255,255,0.6)" style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Sua solicitação ficará visível em destaque para um radar ampliado de motoristas da região.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 28,
  },
  buttonShadow: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12,
  },
  gradient: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: "#091A2F",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
    opacity: 0.85,
  },
  infoIcon: {
    marginRight: 6,
    marginTop: 1.5,
  },
  infoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
