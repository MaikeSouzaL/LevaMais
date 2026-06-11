import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { 
  Camera, 
  Image as ImageIcon, 
  CheckCircle2, 
  FileText, 
  X, 
  LucideIcon 
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

interface UploadDocumentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  uri?: string | null;
  loading?: boolean;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onClear: () => void;
  delay?: number;
}

export const UploadDocumentCard = ({
  title,
  description,
  icon: Icon,
  uri,
  loading = false,
  onCameraPress,
  onGalleryPress,
  onClear,
  delay = 0,
}: UploadDocumentCardProps) => {
  const hasFile = !!uri;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay }}
      style={styles.outer}
    >
      <MotiView
        animate={{
          borderColor: hasFile ? colors.primary[500] : "rgba(255,255,255,0.06)",
          backgroundColor: hasFile ? "rgba(17, 37, 62, 0.8)" : "rgba(17, 37, 62, 0.4)",
        }}
        style={styles.container}
      >
        {/* 📷 Loading Overlay */}
        {loading && (
          <View style={styles.loaderCover}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loaderTxt}>Enviando...</Text>
          </View>
        )}

        {/* Content Top: Info area */}
        <View style={styles.infoRow}>
          <View style={[
            styles.iconHold, 
            { backgroundColor: hasFile ? "rgba(2, 222, 149, 0.1)" : "rgba(255,255,255,0.03)" }
          ]}>
            <Icon size={24} color={hasFile ? colors.primary[500] : "rgba(255,255,255,0.6)"} />
          </View>

          <View style={styles.txtArea}>
            <View style={styles.titleInline}>
              <Text style={styles.titleLabel}>{title}</Text>
              {hasFile && !loading && (
                <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: 6 }}>
                  <CheckCircle2 size={16} color={colors.primary[500]} />
                </MotiView>
              )}
            </View>
            <Text style={styles.descLabel}>{description}</Text>
          </View>
        </View>

        {/* Conditional Render: IF FILE PRESENT vs EMPTY */}
        {!hasFile ? (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onCameraPress}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Camera size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Câmera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={onGalleryPress}
              activeOpacity={0.8}
              disabled={loading}
            >
              <ImageIcon size={18} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
              <Text style={[styles.btnText, { color: "rgba(255,255,255,0.7)" }]}>Galeria</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 🖼️ PREVIEW IMAGE AREA */
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 160 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.previewContainer}
          >
            <Image 
              source={{ uri }} 
              style={styles.previewImg} 
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity 
              style={styles.removeBtn}
              onPress={onClear}
            >
              <X size={16} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.uploadedBadge}>
              <Text style={styles.upText}>Documento Anexado</Text>
            </View>
          </MotiView>
        )}
      </MotiView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  container: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
  },
  loaderCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 26, 47, 0.85)",
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderTxt: {
    fontFamily: fonts.bold,
    color: colors.primary[500],
    marginTop: 10,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    padding: spacing.lg,
    alignItems: "center",
  },
  iconHold: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  txtArea: {
    flex: 1,
  },
  titleInline: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  titleLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: "700",
  },
  descLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs + 1,
    color: colors.text.tertiary,
  },
  actionButtonsRow: {
    flexDirection: "row",
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: "#FFF",
    fontWeight: "600",
  },
  previewContainer: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  previewImg: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(220,38,38,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadedBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.background.primary,
    fontWeight: "800",
  },
});
