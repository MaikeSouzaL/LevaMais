import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MapLocationPickerOverlayProps {
  onBack: () => void;
  onConfirm: (location: string) => void;
  currentAddress: string;
  currentLatLng?: { lat: number; lng: number } | null;
  isLoading?: boolean;
}

export function MapLocationPickerOverlay({
  onBack,
  onConfirm,
  currentAddress,
  currentLatLng,
  isLoading = false,
}: MapLocationPickerOverlayProps) {
  const insets = useSafeAreaInsets();
  const [address, setAddress] = useState(currentAddress);

  // Atualizar o endereço local quando o prop mudar (pin movido)
  useEffect(() => {
    setAddress(currentAddress);
  }, [currentAddress]);

  return (
    <View
      style={{ flex: 1, position: "absolute", inset: 0, zIndex: 50 }}
      pointerEvents="box-none"
    >
      {/* TOP NAVIGATION & SEARCH */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: Math.max(insets.top, 20),
          paddingHorizontal: 16,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          zIndex: 20,
        }}
        pointerEvents="box-none"
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={{
            width: 48,
            height: 48,
            borderRadius: 9999,
            backgroundColor: "#1c2727",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Search Bar */}
        <View
          style={{
            flex: 1,
            height: 48,
            borderRadius: 12,
            backgroundColor: "#1c2727",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <MaterialIcons
            name="search"
            size={20}
            color="#9db9b9"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Buscar endereço"
            placeholderTextColor="#9db9b9"
            style={{
              flex: 1,
              color: "#fff",
              fontSize: 16,
              height: "100%",
            }}
          />
          {address.length > 0 && (
            <TouchableOpacity onPress={() => setAddress("")}>
              <MaterialIcons name="close" size={20} color="#9db9b9" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CENTER PIN (FIXED) */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          pointerEvents: "none",
          paddingBottom: 48, // Ajuste visual para a ponta do pino ficar no centro
        }}
      >
        <View style={{ alignItems: "center" }}>
          {/* Pickup Time Label */}
          <View
            style={{
              marginBottom: 8,
              backgroundColor: "#fff",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text
              style={{ color: "#102222", fontSize: 12, fontWeight: "bold" }}
            >
              4 min
            </Text>
          </View>

          {/* Pin Icon */}
          <MaterialIcons
            name="location-on"
            size={48}
            color="#02de95"
            style={{
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: { width: 0, height: 8 },
              textShadowRadius: 16,
            }}
          />

          {/* Pin Shadow */}
          <View
            style={{
              position: "absolute",
              bottom: 2,
              width: 16,
              height: 6,
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: 9999,
              transform: [{ scaleX: 1.5 }], // Efeito blur simulado
            }}
          />
        </View>
      </View>

      {/* FLOATING ACTION BUTTONS */}
      <View
        style={{
          position: "absolute",
          right: 16,
          bottom: 300, // Acima do bottom sheet
          zIndex: 20,
          alignItems: "flex-end",
          gap: 12,
        }}
        pointerEvents="box-none"
      >
        {/* Zoom Controls */}
        <View
          style={{
            borderRadius: 12,
            backgroundColor: "rgba(28, 39, 39, 0.9)",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.1)",
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity
          style={{
            width: 48,
            height: 48,
            borderRadius: 9999,
            backgroundColor: "#1c2727",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="my-location" size={24} color="#02de95" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM SHEET (Fixed) */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          backgroundColor: "#111818",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
          paddingBottom: Math.max(insets.bottom, 24),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.5,
          shadowRadius: 40,
          elevation: 20,
        }}
      >
        {/* Drag Handle */}
        <View
          style={{
            height: 24,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 4,
              borderRadius: 9999,
              backgroundColor: "#3b5454",
            }}
          />
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          <Text
            style={{
              color: "#9db9b9",
              fontSize: 14,
              fontWeight: "500",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Confirmar local de partida
          </Text>

          {/* Dynamic Address */}
          <View style={{ alignItems: "center", gap: 4 }}>
            {isLoading ? (
              // Loading state
              <View
                style={{ alignItems: "center", gap: 8, paddingVertical: 16 }}
              >
                <ActivityIndicator size="small" color="#02de95" />
                <Text
                  style={{
                    color: "#9db9b9",
                    fontSize: 16,
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  Buscando endereço...
                </Text>
              </View>
            ) : (
              // Address loaded
              <>
                {/* Extrair rua e número do endereço formatado */}
                {(() => {
                  // Formato: "Rua, Número - Bairro - Cidade/Estado"
                  const parts = address.split(" - ");
                  const ruaNumero = parts[0] || address; // "Rua, Número"
                  const bairro = parts[1] || ""; // "Bairro"
                  const cidadeEstado = parts[2] || ""; // "Cidade/Estado"

                  return (
                    <>
                      {/* Rua e Número (principal) */}
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 24,
                          fontWeight: "700",
                          textAlign: "center",
                        }}
                        numberOfLines={2}
                      >
                        {ruaNumero}
                      </Text>

                      {/* Bairro - Cidade/Estado */}
                      {(bairro || cidadeEstado) && (
                        <Text
                          style={{
                            color: "#9db9b9",
                            fontSize: 16,
                            fontWeight: "400",
                            textAlign: "center",
                          }}
                        >
                          {[bairro, cidadeEstado].filter(Boolean).join(" - ")}
                        </Text>
                      )}
                    </>
                  );
                })()}

                {/* Coordenadas (debug) */}
                {currentLatLng && (
                  <Text
                    style={{
                      color: "#6b8888",
                      fontSize: 11,
                      fontWeight: "600",
                      textAlign: "center",
                      marginTop: 4,
                    }}
                  >
                    Lat: {currentLatLng.lat.toFixed(6)} | Lng:{" "}
                    {currentLatLng.lng.toFixed(6)}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Reference Point Input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1c2727",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.05)",
              gap: 12,
            }}
          >
            <MaterialIcons name="edit" size={20} color="#02de95" />
            <TextInput
              placeholder="Adicionar ponto de referência (opcional)"
              placeholderTextColor="#9db9b9"
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 14,
                padding: 0,
              }}
            />
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={() => onConfirm(address)}
            activeOpacity={0.9}
            style={{
              width: "100%",
              height: 56,
              backgroundColor: "#02de95",
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: "#02de95",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Text style={{ color: "#111818", fontSize: 16, fontWeight: "700" }}>
              Confirmar Local
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#111818" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
