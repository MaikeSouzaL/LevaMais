import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { MotiView } from "moti";
import { Car, Bike, MapPin, TrendingUp, DollarSign } from "lucide-react-native";
import { colors } from "../../theme/colors";

const { width } = Dimensions.get("window");
const CENTER_SIZE = 120;

export const DriverHeroIllustration = () => {
  return (
    <View style={styles.container}>
      {/* Background Dynamic Ripples simulating hotspot regions */}
      <MotiView
        from={{ scale: 0.8, opacity: 0.2 }}
        animate={{ scale: 1.4, opacity: 0 }}
        transition={{
          type: "timing",
          duration: 3000,
          loop: true,
          repeatReverse: false,
        }}
        style={[styles.ripple, { borderColor: "rgba(2, 222, 149, 0.3)" }]}
      />
      <MotiView
        from={{ scale: 0.6, opacity: 0.3 }}
        animate={{ scale: 1.2, opacity: 0 }}
        transition={{
          type: "timing",
          duration: 3000,
          delay: 1000,
          loop: true,
          repeatReverse: false,
        }}
        style={[styles.ripple, { borderColor: "rgba(2, 222, 149, 0.2)" }]}
      />

      {/* Core System Circle (Centerpiece) */}
      <MotiView
        from={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 12 }}
        style={styles.centerCircle}
      >
        <MotiView
          animate={{ rotate: "360deg" }}
          transition={{ loop: true, type: "timing", duration: 15000, repeatReverse: false }}
          style={styles.spinningMap}
        >
          <MapPin size={20} color={colors.primary[500]} style={styles.orbitingPin1} />
          <MapPin size={16} color="rgba(255,255,255,0.6)" style={styles.orbitingPin2} />
        </MotiView>
        
        <Car color="#FFF" size={42} strokeWidth={1.5} />
      </MotiView>

      {/* Floating Asset 1: Moto/Delivery (Dynamic Float) */}
      <MotiView
        from={{ translateY: 0, opacity: 0 }}
        animate={{ translateY: -8, opacity: 1 }}
        transition={{
          translateY: { loop: true, type: "timing", duration: 2000, repeatReverse: true },
          opacity: { type: "timing", duration: 800 },
        }}
        style={[styles.floatingAsset, styles.floatMoto]}
      >
        <Bike color={colors.primary[500]} size={24} />
      </MotiView>

      {/* Floating Asset 2: Gains/Trending */}
      <MotiView
        from={{ translateY: 0, translateX: 0, opacity: 0 }}
        animate={{ translateY: 8, translateX: -4, opacity: 1 }}
        transition={{
          translateY: { loop: true, type: "timing", duration: 2400, repeatReverse: true },
          translateX: { loop: true, type: "timing", duration: 2000, repeatReverse: true },
          opacity: { type: "timing", duration: 800, delay: 300 },
        }}
        style={[styles.floatingAsset, styles.floatTrend]}
      >
        <TrendingUp color="#FFF" size={20} style={{ marginRight: 4 }} />
        <DollarSign color="#FFF" size={18} />
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    position: "relative",
  },
  ripple: {
    position: "absolute",
    width: CENTER_SIZE + 40,
    height: CENTER_SIZE + 40,
    borderRadius: (CENTER_SIZE + 40) / 2,
    borderWidth: 1.5,
  },
  centerCircle: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: "rgba(17, 37, 62, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: "relative",
  },
  spinningMap: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: CENTER_SIZE / 2,
  },
  orbitingPin1: {
    position: "absolute",
    top: 10,
    right: 20,
  },
  orbitingPin2: {
    position: "absolute",
    bottom: 15,
    left: 15,
  },
  floatingAsset: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(17, 37, 62, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatMoto: {
    top: 20,
    left: width * 0.15,
  },
  floatTrend: {
    bottom: 25,
    right: width * 0.15,
  },
});
