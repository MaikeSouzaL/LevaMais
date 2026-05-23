import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
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
  KeyRound,
  Package,
  Pill,
  Shirt,
  ShieldCheck,
  Smartphone,
  Soup,
  SquareStack,
  User,
  Wallet,
  X,
} from "lucide-react-native";

import { ClientStackParamList, DeliveryAddressProfile, DeliveryVehicleType } from "../../../types/navigation";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ItemTypeId = "personal" | "food" | "clothing" | "electronics" | "documents" | "keys" | "medicine" | "other";

const vehicleImages: Record<DeliveryVehicleType, ImageSourcePropType> = {
  motorcycle: require("../../../../../../assets/Logo/leva_moto.png"),
  car: require("../../../../../../assets/Logo/leva-carro.png"),
  van: require("../../../../../../assets/Logo/leva_van.png"),
  truck: require("../../../../../../assets/Logo/leva_bau.png"),
};

const vehicleCopy: Record<DeliveryVehicleType, { title: string; subtitle: string; details: string; price: string }> = {
  motorcycle: {
    title: "Entrega Moto",
    subtitle: "Entregas r?pidas",
    details: "40?34?36cm ? 10kg",
    price: "R$16,80",
  },
  car: {
    title: "Entrega Carro",
    subtitle: "Pacotes m?dios",
    details: "Itens m?dios ? porta-malas",
    price: "R$16,80",
  },
  van: {
    title: "Entrega Van",
    subtitle: "Volumes maiores",
    details: "Cargas maiores ? van",
    price: "R$16,80",
  },
  truck: {
    title: "Entrega Truck",
    subtitle: "Cargas grandes",
    details: "Carga pesada ? caminh?o",
    price: "R$16,80",
  },
};

const itemTypes: Array<{ id: ItemTypeId; label: string; icon: React.ComponentType<any> }> = [
  { id: "personal", label: "Itens pessoais", icon: User },
  { id: "food", label: "Alimentação", icon: Soup },
  { id: "clothing", label: "Vestuário", icon: Shirt },
  { id: "electronics", label: "Eletr?nicos", icon: Smartphone },
  { id: "documents", label: "Documentos", icon: Package },
  { id: "keys", label: "Chaves", icon: KeyRound },
  { id: "medicine", label: "Medicamentos", icon: Pill },
  { id: "other", label: "Outros", icon: SquareStack },
];

export default function DeliveryDetailsScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "DeliveryDetails">>();
  const insets = useSafeAreaInsets();
  const { pickupProfile, dropoffProfile, vehicleType } = route.params;
  const [routeProfiles, setRouteProfiles] = useState<{
    pickupProfile: DeliveryAddressProfile;
    dropoffProfile: DeliveryAddressProfile;
  }>({ pickupProfile, dropoffProfile });
  const [usePickupPin, setUsePickupPin] = useState(true);
  const [useDropoffPin, setUseDropoffPin] = useState(true);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<ItemTypeId | null>(null);
  const [customItemType, setCustomItemType] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [savedItemSummary, setSavedItemSummary] = useState<string | null>(null);
  const swapRotation = useRef(new Animated.Value(0)).current;

  const vehicle = useMemo(() => vehicleCopy[vehicleType] || vehicleCopy.motorcycle, [vehicleType]);
  const total = vehicle.price;
  const topInset = Math.max(insets.top, 18);
  const animatedSwapStyle = {
    transform: [
      {
        rotate: swapRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  const selectedItemLabel = itemTypes.find((item) => item.id === selectedItemType)?.label;

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

  const handleSwapAddresses = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    swapRotation.setValue(0);
    Animated.timing(swapRotation, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setRouteProfiles((current) => ({
      pickupProfile: current.dropoffProfile,
      dropoffProfile: current.pickupProfile,
    }));
  };

  const handleSaveItemDetails = () => {
    const typeText = selectedItemType === "other" && customItemType.trim()
      ? customItemType.trim()
      : selectedItemLabel || "Item";
    const valueText = itemValue.trim() ? `R$ ${itemValue.trim()}` : null;
    const noteText = itemNotes.trim() ? itemNotes.trim() : null;
    setSavedItemSummary([typeText, valueText, noteText].filter(Boolean).join(" ? "));
    setShowItemDetails(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f4f4]">
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f4" />

      <View
        className="flex-row items-center justify-between px-5 pb-2.5"
        style={{ paddingTop: topInset, height: 62 + topInset }}
      >
        <TouchableOpacity className="h-[42px] w-[42px] items-center justify-center" onPress={handleBackHome} activeOpacity={0.75}>
          <ChevronLeft size={28} color="#111827" strokeWidth={2.7} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[21px] font-black tracking-[-0.4px] text-[#111827]">
          Detalhes da entrega
        </Text>
        <View className="h-[42px] w-[42px]" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-[18px] pb-[142px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="min-h-[232px] flex-row rounded-[22px] bg-white px-[18px] py-[18px]">
          <View className="relative w-[30px] items-center pb-1 pt-[5px]">
            <Circle size={12} color="#10d79a" strokeWidth={3} />
            <View className="my-[5px] w-[2px] flex-1 bg-[#e4e8ee]" />
            <View className="my-[5px] w-[2px] flex-1 bg-[#e4e8ee]" />
            <Circle size={12} color="#ff7a32" strokeWidth={3} />
            <TouchableOpacity
              className="absolute top-1/2 -mt-[13.5px] h-[27px] w-[27px] items-center justify-center rounded-full bg-[#f5f6f8] shadow-sm"
              onPress={handleSwapAddresses}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Inverter endere?os de coleta e entrega"
            >
              <Animated.View style={animatedSwapStyle}>
                <ArrowDownUp size={14} color="#111827" strokeWidth={3} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View className="flex-1 pl-2.5">
            <TouchableOpacity activeOpacity={0.85} className="min-h-[91px] flex-row items-center">
              <View className="flex-1 pr-2">
                <Text className="text-[18px] font-black leading-6 tracking-[-0.2px] text-[#111827]" numberOfLines={2}>
                  {routeProfiles.pickupProfile.address}
                </Text>
                <Text className="mt-2 text-[15px] font-semibold text-[#6b7280]" numberOfLines={1}>
                  {routeProfiles.pickupProfile.contactName} ? {routeProfiles.pickupProfile.contactPhone}
                </Text>
                {!!routeProfiles.pickupProfile.details && (
                  <Text className="mt-[7px] text-sm font-bold text-[#6b7280]" numberOfLines={1}>
                    {routeProfiles.pickupProfile.details}
                  </Text>
                )}
              </View>
              <ChevronRight size={23} color="#7b7f86" />
            </TouchableOpacity>

            <View className="my-2 h-px bg-[#eef1f5]" />

            <TouchableOpacity activeOpacity={0.85} className="min-h-[91px] flex-row items-center">
              <View className="flex-1 pr-2">
                <Text className="text-[18px] font-black leading-6 tracking-[-0.2px] text-[#111827]" numberOfLines={3}>
                  {routeProfiles.dropoffProfile.address}
                </Text>
                <Text className="mt-2 text-[15px] font-semibold text-[#6b7280]" numberOfLines={1}>
                  {routeProfiles.dropoffProfile.contactName} ? {routeProfiles.dropoffProfile.contactPhone}
                </Text>
                {!!routeProfiles.dropoffProfile.details && (
                  <Text className="mt-[7px] text-sm font-bold text-[#6b7280]" numberOfLines={1}>
                    {routeProfiles.dropoffProfile.details}
                  </Text>
                )}
              </View>
              <ChevronRight size={23} color="#7b7f86" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} className="min-h-[86px] flex-row items-center rounded-[22px] bg-white px-5" onPress={() => setShowItemDetails(true)}>
          <View className="w-9 items-start">
            <Package size={19} color="#667085" />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-black tracking-[-0.2px] text-[#111827]">Inserir detalhes do item</Text>
            <Text className="mt-2 text-[15px] font-semibold text-[#6b7280]" numberOfLines={2}>
              {savedItemSummary || "Adicionar uma observação na entrega"}
            </Text>
          </View>
          <ChevronRight size={23} color="#7b7f86" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} className="min-h-[108px] flex-row items-center rounded-[22px] bg-white px-[18px] py-4">
          <Image source={vehicleImages[vehicleType]} className="mr-3 h-[58px] w-[58px]" resizeMode="contain" />
          <View className="flex-1">
            <View className="flex-row items-center gap-[5px]">
              <Text className="text-[17px] font-black tracking-[-0.2px] text-[#111827]">{vehicle.title}</Text>
              <Info size={14} color="#c2c6cc" />
            </View>
            <Text className="mt-2 text-[15px] font-semibold text-[#6b7280]">{vehicle.subtitle}</Text>
            <Text className="mt-1.5 text-[15px] font-bold text-[#6b7280]">{vehicle.details}</Text>
          </View>
          <View className="ml-2 flex-row items-center gap-2.5">
            <Text className="text-lg font-black text-[#111827]">{vehicle.price}</Text>
            <View className="h-[11px] w-[11px] rounded-full bg-[#111827]" />
          </View>
        </TouchableOpacity>

        <View className="min-h-[168px] rounded-[22px] bg-white px-[22px] pb-5 pt-6">
          <View className="mb-[23px] flex-row items-center gap-1.5">
            <Text className="text-[17px] font-black tracking-[-0.2px] text-[#111827]">Verificar com PIN</Text>
            <Info size={14} color="#c2c6cc" />
          </View>

          <TouchableOpacity className="h-[45px] flex-row items-center justify-between" onPress={() => setUsePickupPin((value) => !value)} activeOpacity={0.8}>
            <Text className="text-base font-semibold text-[#4b5563]">Usar c?digo de coleta</Text>
            <View className={
              usePickupPin
                ? "h-[21px] w-[21px] items-center justify-center rounded-[5px] border-[1.8px] border-[#111827] bg-[#111827]"
                : "h-[21px] w-[21px] items-center justify-center rounded-[5px] border-[1.8px] border-[#d1d5db] bg-white"
            }>
              {usePickupPin && <Check size={16} color="#fff" strokeWidth={3.2} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="h-[45px] flex-row items-center justify-between" onPress={() => setUseDropoffPin((value) => !value)} activeOpacity={0.8}>
            <Text className="text-base font-semibold text-[#4b5563]">Usar c?digo de entrega</Text>
            <View className={
              useDropoffPin
                ? "h-[21px] w-[21px] items-center justify-center rounded-[5px] border-[1.8px] border-[#111827] bg-[#111827]"
                : "h-[21px] w-[21px] items-center justify-center rounded-[5px] border-[1.8px] border-[#d1d5db] bg-white"
            }>
              {useDropoffPin && <Check size={16} color="#fff" strokeWidth={3.2} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-[#eceff3] bg-white px-5 pb-[15px] pt-3.5">
        <TouchableOpacity className="h-9 flex-row items-center" activeOpacity={0.8}>
          <View className="mr-2 h-[19px] w-6 items-center justify-center rounded-[5px] bg-[#ffae00]">
            <Wallet size={15} color="#fff" />
          </View>
          <Text className="text-[15px] font-black text-[#111827]">Dinheiro</Text>
          <View className="flex-1" />
          <Text className="text-sm font-semibold text-[#4b5563]">Use saldo e poupe R$4,00</Text>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[22px] font-black text-[#111827]">{total}</Text>
          <TouchableOpacity className="h-[60px] min-w-[184px] flex-row items-center justify-center gap-2 rounded-[22px] bg-[#ffd400]" onPress={handleConfirm} activeOpacity={0.9}>
            <ShieldCheck size={21} color="#111" />
            <Text className="text-[22px] font-black text-[#111827]">Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showItemDetails && (
        <View className="absolute inset-0 z-50 bg-black/35">
          <View className="mt-[86px] flex-1 rounded-t-[22px] bg-white px-6 pb-6 pt-5">
            <View className="mb-7 flex-row items-center justify-between">
              <Text className="text-[27px] font-black text-[#111827]">Detalhes do item</Text>
              <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-full bg-[#f1f2f4]" onPress={() => setShowItemDetails(false)} activeOpacity={0.8}>
                <X size={22} color="#9ca3af" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
              <Text className="mb-4 text-xl font-black text-[#111827]">Tipo de item</Text>
              <View className="mb-6 flex-row flex-wrap gap-3">
                {itemTypes.map((item) => {
                  const Icon = item.icon;
                  const active = selectedItemType === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className={
                        active
                          ? "flex-row items-center gap-2 rounded-lg bg-[#ff7a32] px-3.5 py-3"
                          : "flex-row items-center gap-2 rounded-lg bg-[#f7f7f9] px-3.5 py-3"
                      }
                      onPress={() => setSelectedItemType(item.id)}
                      activeOpacity={0.85}
                    >
                      <Icon size={19} color={active ? "#fff" : "#9aa0a6"} fill={item.id === "clothing" ? (active ? "#fff" : "#9aa0a6") : "transparent"} />
                      <Text className={active ? "text-base font-semibold text-white" : "text-base font-semibold text-[#333]"}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedItemType === "other" && (
                <View className="mb-6 min-h-[94px] rounded-lg bg-[#f7f7f9] px-4 py-3">
                  <TextInput
                    value={customItemType}
                    onChangeText={(text) => setCustomItemType(text.slice(0, 50))}
                    placeholder="Insira o tipo do item"
                    placeholderTextColor="#9ca3af"
                    multiline
                    className="min-h-[52px] text-base text-[#111827]"
                  />
                  <Text className="self-end text-base text-[#8b929f]">{customItemType.length}/50</Text>
                </View>
              )}

              <Text className="mb-4 text-xl font-black text-[#111827]">Valor do item</Text>
              <View className="mb-3 flex-row items-center">
                <Text className="mr-3 text-base text-[#111827]">R$</Text>
                <TextInput
                  value={itemValue}
                  onChangeText={setItemValue}
                  placeholder="Insira o valor do item"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  className="h-11 flex-1 rounded-lg bg-[#f7f7f9] px-4 text-base text-[#111827]"
                />
              </View>
              <Text className="mb-8 text-[15px] leading-5 text-[#111827]">A 99 n?o sugere envio de itens com valor superior a R$500</Text>

              <Text className="mb-4 text-xl font-black text-[#111827]">Observações da entrega</Text>
              <View className="mb-10 min-h-[126px] rounded-lg bg-[#f7f7f9] px-4 py-3">
                <TextInput
                  value={itemNotes}
                  onChangeText={(text) => setItemNotes(text.slice(0, 100))}
                  placeholder="Adicione uma descrição ou observações"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[84px] text-base text-[#111827]"
                />
                <Text className="self-end text-base text-[#8b929f]">{itemNotes.length}/100</Text>
              </View>
            </ScrollView>

            <TouchableOpacity className="h-[55px] items-center justify-center rounded-[18px] bg-[#ffd400]" onPress={handleSaveItemDetails} activeOpacity={0.9}>
              <Text className="text-[21px] font-black text-[#111827]">Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
