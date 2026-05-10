import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../theme/colors";

const CIRCLE_SIZE = 240;

export const ScannerOverlay = ({ active }: { active: boolean }) => {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      {/* 🌐 Pulse / Breather Frame */}
      <MotiView
        from={{ scale: 1, opacity: 0.4 }}
        animate={{ scale: active ? 1.05 : 1.02, opacity: active ? 0.8 : 0.2 }}
        transition={{
          type: "timing",
          duration: 1500,
          loop: true,
          repeatReverse: true,
        }}
        style={[
          styles.pulseRing,
          { borderColor: active ? colors.primary[500] : "rgba(255,255,255,0.3)" }
        ]}
      />

      {/* 📏 Vertical Scanning Line Bar */}
      {active && (
        <MotiView
          from={{ translateY: 0, opacity: 0 }}
          animate={{ translateY: CIRCLE_SIZE - 4, opacity: 1 }}
          transition={{
            type: "timing",
            duration: 2000,
            loop: true,
            repeatReverse: false,
          }}
          style={styles.scanLine}
        >
          <LinearGradient
            colors={["rgba(2, 222, 149, 0.0)", "rgba(2, 222, 149, 0.8)", "rgba(2, 222, 149, 0.0)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </MotiView>
      )}

      {/* 🛰️ Futuristic Dots / Points simulates realtime IA Mapping */}
      {active && (
        <>
          <MotiView
            from={{ opacity: 0.2 }} animate={{ opacity: 1 }}
            transition={{ loop: true, type: "timing", duration: 500, repeatReverse: true }}
            style={[styles.dot, { top: "20%", left: "45%" }]} 
          />
          <MotiView
            from={{ opacity: 0.2 }} animate={{ opacity: 1 }}
            transition={{ loop: true, delay: 200, type: "timing", duration: 600, repeatReverse: true }}
            style={[styles.dot, { top: "45%", left: "25%" }]} 
          />
          <MotiView
            from={{ opacity: 0.2 }} animate={{ opacity: 1 }}
            transition={{ loop: true, delay: 400, type: "timing", duration: 550, repeatReverse: true }}
            style={[styles.dot, { top: "45%", right: "25%" }]} 
          />
          <MotiView
            from={{ opacity: 0.2 }} animate={{ opacity: 1 }}
            transition={{ loop: true, delay: 600, type: "timing", duration: 700, repeatReverse: true }}
            style={[styles.dot, { bottom: "25%", left: "50%" }]} 
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden",
    zIndex: 10,
  },
  pulseRing: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
  },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: 4,
    top: 0,
    zIndex: 20,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  dot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
});
