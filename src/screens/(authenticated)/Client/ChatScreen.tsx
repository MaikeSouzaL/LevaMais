import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";

type Msg = { id: string; from: "you" | "driver"; text: string };
type Params = { Chat: { driverName: string } };

export default function ChatScreen() {
  const route = useRoute<RouteProp<Params, "Chat">>();
  const navigation = useNavigation();
  const driverName = route.params?.driverName || "Motorista";
  const [messages, setMessages] = useState<Msg[]>([
    { id: "1", from: "driver", text: "Olá! Estou a caminho." },
  ]);
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: String(Date.now()), from: "you", text }]);
    setText("");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#9abcb0" }}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "800",
            marginTop: 6,
          }}
        >
          Chat com {driverName}
        </Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={{ flex: 1 }}
      >
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                alignItems: item.from === "you" ? "flex-end" : "flex-start",
                marginVertical: 6,
              }}
            >
              <View
                style={{
                  maxWidth: "80%",
                  backgroundColor: item.from === "you" ? "#1e3b32" : "#162e25",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white" }}>{item.text}</Text>
              </View>
            </View>
          )}
        />
        <View
          style={{
            flexDirection: "row",
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.08)",
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escreva uma mensagem"
            placeholderTextColor="#7aa39a"
            style={{
              flex: 1,
              backgroundColor: "#162e25",
              color: "white",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          />
          <TouchableOpacity
            onPress={send}
            style={{
              marginLeft: 8,
              backgroundColor: "#02de95",
              borderRadius: 8,
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#0f231c", fontWeight: "800" }}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
