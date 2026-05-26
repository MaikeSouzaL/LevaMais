import { View, StyleSheet, Text } from "react-native";
import { Flag } from "lucide-react-native";

interface PremiumMapMarkerProps {
  type: "origin" | "destination";
  letter?: string;
}

export const PremiumMapMarker = ({ type, letter }: PremiumMapMarkerProps) => {
  const isOrigin = type === "origin";
  const markerColor = isOrigin ? "#02de95" : "#ef4444";

  return (
    <View style={styles.container}>
      {/* Core Hub (Apenas a Bandeira Transparente e Colorida) */}
      <View style={styles.coreHub}>
        <Flag size={20} color={markerColor} fill={markerColor} style={{ marginLeft: 13 }} />
        {letter && (
          <View style={{
            position: "absolute",
            top: -2,
            right: -6,
            backgroundColor: "#111827",
            paddingHorizontal: 3,
            minWidth: 13,
            height: 13,
            borderRadius: 6.5,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#ffffff",
            zIndex: 20
          }}>
            <Text style={{ color: "#ffffff", fontSize: 7.5, fontWeight: "900", textAlign: "center" }}>{letter}</Text>
          </View>
        )}
      </View>

      {/* Haste do alfinete */}
      <View
        style={[
          styles.pinStem,
          {
            backgroundColor: markerColor,
          },
        ]}
      />

      {/* Bolinha no pé do alfinete */}
      <View
        style={[
          styles.pinBaseDot,
          {
            backgroundColor: markerColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    position: "relative",
    height: 60, // Mantém a altura de 60px para consistência do ponto central
    width: 34,
    justifyContent: "flex-start",
  },
  coreHub: {
    position: "absolute",
    top: 4, // Alinha verticalmente com o topo
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  pinStem: {
    position: "absolute",
    top: 25,
    width: 3,
    height: 8,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    zIndex: 9,
  },
  pinBaseDot: {
    position: "absolute",
    top: 32,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#ffffff",
    zIndex: 12,
  },
});
