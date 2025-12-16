import React, { useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";

export default function PhoneNumberModal({
  visible,
  onConfirm,
  onCancel,
  error,
}: any) {
  const [phone, setPhone] = React.useState("");
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function handleConfirm() {
    if (phone.length < 8) {
      return;
    }
    onConfirm(phone);
  }

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <Animated.View
          className="bg-white rounded-t-3xl p-7 min-h-[270px] shadow-lg"
          style={{
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Insira seu telefone
          </Text>

          <Text className="text-gray-600 mb-6">
            Antes de criar sua conta, precisamos do seu número de telefone para
            verificação.
          </Text>
          {error && <Text className="text-red-500 mb-4 text-sm">{error}</Text>}

          <View className="flex-row items-center mb-5 border border-gray-200 rounded-xl px-3 h-12">
            <Text className="text-gray-500 text-base mr-0.5">+55</Text>
            <TextInput
              ref={inputRef}
              className="flex-1 text-lg text-gray-800"
              keyboardType="phone-pad"
              placeholder="DDD + número"
              placeholderTextColor="#AAA"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          </View>

          <TouchableOpacity
            className={`rounded-xl py-3.5 items-center mb-1.5 ${
              phone.length >= 10 ? "bg-blue-600" : "bg-slate-400"
            }`}
            disabled={phone.length < 10}
            onPress={handleConfirm}
          >
            <Text className="text-white font-bold text-base">Confirmar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} className="items-center py-2.5">
            <Text className="text-blue-600 font-semibold text-[15px]">
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
