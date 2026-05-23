import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CommonActions, NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowDownUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Info,
  Package,
  ShieldCheck,
  Wallet,
} from "lucide-react-native";

import { ClientStackParamList, DeliveryVehicleType } from "../../../types/navigation";

const vehicleImages: Record<DeliveryVehicleType, ImageSourcePropType> = {
  motorcycle: require("../../../../../../assets/Logo/leva_moto.png"),
  car: require("../../../../../../assets/Logo/leva-carro.png"),
  van: require("../../../../../../assets/Logo/leva_van.png"),
  truck: require("../../../../../../assets/Logo/leva_bau.png"),
};

const vehicleCopy: Record<DeliveryVehicleType, { title: string; subtitle: string; details: string; price: string }> = {
  motorcycle: {
    title: "Entrega Moto",
    subtitle: "Entregas rápidas",
    details: "40×34×36cm • 10kg",
    price: "R$16,80",
  },
  car: {
    title: "Entrega Carro",
    subtitle: "Pacotes médios",
    details: "Itens médios • porta-malas",
    price: "R$16,80",
  },
  van: {
    title: "Entrega Van",
    subtitle: "Volumes maiores",
    details: "Cargas maiores • van",
    price: "R$16,80",
  },
  truck: {
    title: "Entrega Truck",
    subtitle: "Cargas grandes",
    details: "Carga pesada • caminhão",
    price: "R$16,80",
  },
};

export default function DeliveryDetailsScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "DeliveryDetails">>();
  const insets = useSafeAreaInsets();
  const { pickupProfile, dropoffProfile, vehicleType } = route.params;
  const [usePickupPin, setUsePickupPin] = useState(true);
  const [useDropoffPin, setUseDropoffPin] = useState(true);

  const vehicle = useMemo(() => vehicleCopy[vehicleType] || vehicleCopy.motorcycle, [vehicleType]);
  const total = vehicle.price;

  const handleBackHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Home" }],
      }),
    );
  };

  const handleConfirm = () => {
    Alert.alert(
      "Entrega pronta",
      "Payload montado com coleta, entrega e tipo de veículo. A criação real do pedido será ligada na próxima etapa.",
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f4" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 18), height: 62 + Math.max(insets.top, 18) }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBackHome} activeOpacity={0.75}>
          <ChevronLeft size={28} color="#111827" strokeWidth={2.7} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da entrega</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routeCard}>
          <View style={styles.routeRail}>
            <Circle size={12} color="#10d79a" strokeWidth={3} />
            <View style={styles.routeLine} />
            <View style={styles.routeLine} />
            <Circle size={12} color="#ff7a32" strokeWidth={3} />
            <View style={styles.routeSwapBadge}>
              <ArrowDownUp size={14} color="#111827" strokeWidth={3} />
            </View>
          </View>

          <View style={styles.routeBody}>
            <TouchableOpacity activeOpacity={0.85} style={styles.routeRow}>
              <View style={styles.routeTextWrap}>
                <Text style={styles.addressText} numberOfLines={2}>{pickupProfile.address}</Text>
                <Text style={styles.contactText} numberOfLines={1}>
                  {pickupProfile.contactName} • {pickupProfile.contactPhone}
                </Text>
                {!!pickupProfile.details && <Text style={styles.detailsText} numberOfLines={1}>{pickupProfile.details}</Text>}
              </View>
              <ChevronRight size={23} color="#7b7f86" />
            </TouchableOpacity>

            <View style={styles.routeDivider} />

            <TouchableOpacity activeOpacity={0.85} style={styles.routeRow}>
              <View style={styles.routeTextWrap}>
                <Text style={styles.addressText} numberOfLines={3}>{dropoffProfile.address}</Text>
                <Text style={styles.contactText} numberOfLines={1}>
                  {dropoffProfile.contactName} • {dropoffProfile.contactPhone}
                </Text>
                {!!dropoffProfile.details && <Text style={styles.detailsText} numberOfLines={1}>{dropoffProfile.details}</Text>}
              </View>
              <ChevronRight size={23} color="#7b7f86" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.cardRow}>
          <View style={styles.iconSlot}>
            <Package size={19} color="#667085" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Inserir detalhes do item</Text>
            <Text style={styles.cardSubtitle}>Adicionar uma observação na entrega</Text>
          </View>
          <ChevronRight size={23} color="#7b7f86" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} style={styles.vehicleCard}>
          <Image source={vehicleImages[vehicleType]} style={styles.vehicleImage} resizeMode="contain" />
          <View style={styles.vehicleTextWrap}>
            <View style={styles.vehicleTitleRow}>
              <Text style={styles.cardTitle}>{vehicle.title}</Text>
              <Info size={14} color="#c2c6cc" />
            </View>
            <Text style={styles.cardSubtitle}>{vehicle.subtitle}</Text>
            <Text style={styles.vehicleDetails}>{vehicle.details}</Text>
          </View>
          <View style={styles.vehiclePriceWrap}>
            <Text style={styles.priceText}>{vehicle.price}</Text>
            <View style={styles.radioDot} />
          </View>
        </TouchableOpacity>

        <View style={styles.pinCard}>
          <View style={styles.pinHeader}>
            <Text style={styles.cardTitle}>Verificar com PIN</Text>
            <Info size={14} color="#c2c6cc" />
          </View>

          <TouchableOpacity style={styles.pinOption} onPress={() => setUsePickupPin((value) => !value)} activeOpacity={0.8}>
            <Text style={styles.pinText}>Usar código de coleta</Text>
            <View style={[styles.checkbox, usePickupPin && styles.checkboxActive]}>
              {usePickupPin && <Check size={16} color="#fff" strokeWidth={3.2} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pinOption} onPress={() => setUseDropoffPin((value) => !value)} activeOpacity={0.8}>
            <Text style={styles.pinText}>Usar código de entrega</Text>
            <View style={[styles.checkbox, useDropoffPin && styles.checkboxActive]}>
              {useDropoffPin && <Check size={16} color="#fff" strokeWidth={3.2} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.paymentRow} activeOpacity={0.8}>
          <View style={styles.cashBadge}>
            <Wallet size={15} color="#fff" />
          </View>
          <Text style={styles.paymentLabel}>Dinheiro</Text>
          <View style={styles.paymentSpacer} />
          <Text style={styles.discountText}>Use saldo e poupe R$4,00</Text>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>

        <View style={styles.footerBottom}>
          <Text style={styles.totalText}>{total}</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.9}>
            <ShieldCheck size={21} color="#111" />
            <Text style={styles.confirmText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#111827",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 142,
    gap: 12,
  },
  routeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 214,
  },
  routeRail: {
    width: 30,
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 4,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e4e8ee",
    marginVertical: 5,
  },
  routeSwapBadge: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f6f8",
    marginTop: 3,
    marginBottom: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routeBody: {
    flex: 1,
    paddingLeft: 10,
  },
  routeRow: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
  },
  routeTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  addressText: {
    color: "#111827",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  contactText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
  detailsText: {
    marginTop: 7,
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "700",
  },
  routeDivider: {
    height: 1,
    backgroundColor: "#eef1f5",
    marginVertical: 5,
  },
  cardRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 20,
  },
  iconSlot: {
    width: 36,
    alignItems: "flex-start",
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
  vehicleCard: {
    minHeight: 108,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  vehicleImage: {
    width: 58,
    height: 58,
    marginRight: 12,
  },
  vehicleTextWrap: {
    flex: 1,
  },
  vehicleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  vehicleDetails: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "700",
  },
  vehiclePriceWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },
  priceText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#111827",
  },
  pinCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    minHeight: 168,
  },
  pinHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 23,
  },
  pinOption: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pinText: {
    color: "#4b5563",
    fontSize: 16,
    fontWeight: "600",
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.8,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "#eceff3",
  },
  paymentRow: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
  },
  cashBadge: {
    width: 24,
    height: 19,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffae00",
    marginRight: 8,
  },
  paymentLabel: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
  },
  paymentSpacer: {
    flex: 1,
  },
  discountText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
  },
  footerBottom: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalText: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
  confirmButton: {
    height: 60,
    minWidth: 184,
    borderRadius: 22,
    backgroundColor: "#ffd400",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
});
