import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal as RNModal,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  type?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  children?: React.ReactNode;
}

const { width } = Dimensions.get("window");

export function Modal({
  visible,
  title,
  message,
  type = "info",
  onClose,
  onConfirm,
  confirmText,
  children,
}: ModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
      });
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "check-circle";
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "#02de95";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#3b82f6";
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
            {!children && (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${getColor()}20` },
                ]}
              >
                <MaterialIcons name={getIcon()} size={32} color={getColor()} />
              </View>
            )}

            {!!title && <Text style={styles.title}>{title}</Text>}
            {!!message && <Text style={styles.message}>{message}</Text>}

            {children ? (
              <View style={{ flexShrink: 1, width: "100%" }}>
                {children}
              </View>
            ) : null}

            <View style={styles.actionsContainer}>
              {onConfirm ? (
                <View style={styles.rowButtons}>
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.8}
                    style={[styles.button, styles.cancelButton]}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={onConfirm}
                    activeOpacity={0.8}
                    style={[styles.button, { backgroundColor: getColor(), flex: 1.5 }]}
                  >
                    <Text style={styles.buttonText}>{confirmText || "Confirmar"}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.8}
                  style={[styles.button, { backgroundColor: getColor(), width: "100%" }]}
                >
                  <Text style={styles.buttonText}>{confirmText || "OK"}</Text>
                </TouchableOpacity>
              )}
            </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  container: {
    width: width * 0.85,
    maxHeight: "85%",
    backgroundColor: "#1c2727",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  content: {
    padding: 24,
    alignItems: "center",
    maxHeight: "100%",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: "#9db9b9",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  actionsContainer: {
    width: "100%",
    marginTop: 24,
  },
  rowButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    flex: 1,
  },
  buttonText: {
    color: "#111818",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#9db9b9",
    fontSize: 16,
    fontWeight: "600",
  },
});
