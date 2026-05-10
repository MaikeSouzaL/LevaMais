import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { MotiView } from "moti";
import { ShieldCheck, FileCheck, ScanFace, Lock } from "lucide-react-native";
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors } from "../../../theme/colors";

const { width } = Dimensions.get("window");
const BOX_SIZE = width * 0.65;

export const AnalysisIllustration = () => {
  return (
    <View style={styles.container}>
      {/* 🌀 Technical Rotation Rings Background */}
      <MotiView
        from={{ rotate: "0deg" }}
        animate={{ rotate: "360deg" }}
        transition={{ loop: true, repeatReverse: false, duration: 20000, type: "timing" }}
        style={styles.absoluteCenter}
      >
        <Svg width={BOX_SIZE + 60} height={BOX_SIZE + 60} viewBox="0 0 300 300">
          <Circle 
            cx="150" cy="150" r="130" 
            stroke="rgba(2, 222, 149, 0.08)" 
            strokeWidth="1.5" 
            strokeDasharray="10, 5" 
            fill="none" 
          />
          <Circle 
            cx="150" cy="150" r="100" 
            stroke="rgba(2, 222, 149, 0.15)" 
            strokeWidth="1" 
            strokeDasharray="5, 15" 
            fill="none" 
          />
        </Svg>
      </MotiView>

      <MotiView
        from={{ rotate: "360deg" }}
        animate={{ rotate: "0deg" }}
        transition={{ loop: true, repeatReverse: false, duration: 15000, type: "timing" }}
        style={styles.absoluteCenter}
      >
        <Svg width={BOX_SIZE + 60} height={BOX_SIZE + 60} viewBox="0 0 300 300">
          <Circle 
            cx="150" cy="150" r="115" 
            stroke="rgba(2, 222, 149, 0.05)" 
            strokeWidth="2" 
            strokeDasharray="40, 20" 
            fill="none" 
          />
        </Svg>
      </MotiView>

      {/* 🛡️ Central Glowing Shield Core */}
      <MotiView
        from={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: 1.05, opacity: 1 }}
        transition={{ loop: true, type: "timing", duration: 2500, repeatReverse: true }}
        style={styles.glowWrapper}
      >
        <View style={styles.glowBg} />
      </MotiView>

      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: -8 }}
        transition={{ loop: true, type: "timing", duration: 3000, repeatReverse: true }}
        style={styles.mainAsset}
      >
        <View style={styles.shieldCircle}>
          <ShieldCheck size={56} color={colors.primary[500]} strokeWidth={1.5} />
        </View>

        {/* 🛰️ Orbiting Satellite Indicators (Documents & Selfie) */}
        <MotiView
          from={{ opacity: 0, scale: 0.5, translateX: -40 }}
          animate={{ opacity: 1, scale: 1, translateX: 0 }}
          transition={{ type: "spring", delay: 300 }}
          style={[styles.miniBadge, { top: -5, left: -15 }]}
        >
          <FileCheck size={16} color={colors.primary[500]} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.5, translateX: 40 }}
          animate={{ opacity: 1, scale: 1, translateX: 0 }}
          transition={{ type: "spring", delay: 600 }}
          style={[styles.miniBadge, { bottom: 15, right: -20 }]}
        >
          <ScanFace size={16} color={colors.primary[500]} />
        </MotiView>
        
        {/* 🔒 Bottom static validation lock */}
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 900 }}
          style={[styles.miniBadge, { top: 20, right: -10, backgroundColor: "rgba(255,255,255,0.05)" }]}
        >
          <Lock size={14} color="rgba(255,255,255,0.4)" />
        </MotiView>
      </MotiView>

      {/* ⚡ Sweeping Laser Scan Bar */}
      <MotiView
        from={{ translateY: -80, opacity: 0 }}
        animate={{ translateY: 80, opacity: [0, 1, 1, 0] }}
        transition={{ loop: true, type: "timing", duration: 2500, repeatReverse: false }}
        style={styles.scanLine}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BOX_SIZE,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginVertical: 20,
  },
  absoluteCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  glowWrapper: {
    position: "absolute",
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  glowBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(2, 222, 149, 0.15)",
    // Filter blur equivalence implicitly thru opacity stack
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.3)",
  },
  mainAsset: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 5,
  },
  shieldCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(9, 26, 47, 0.8)",
    borderWidth: 2,
    borderColor: colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  miniBadge: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(2, 222, 149, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  scanLine: {
    position: "absolute",
    width: 160,
    height: 2,
    backgroundColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 8,
  },
});
