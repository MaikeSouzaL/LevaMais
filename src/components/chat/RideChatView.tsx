import React from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export type RideChatItem = {
  id: string;
  text: string;
  sent: boolean;
  timestamp: number;
};

type RideChatViewProps = {
  title: string;
  subtitle?: string;
  peerName: string;
  peerIcon?: keyof typeof MaterialIcons.glyphMap;
  messages: RideChatItem[];
  loading?: boolean;
  message: string;
  quickReplies?: string[];
  canSend: boolean;
  onBack: () => void;
  onChangeMessage: (value: string) => void;
  onSend: () => void;
};

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RideChatView({
  title,
  subtitle,
  peerName,
  peerIcon = "support-agent",
  messages,
  loading,
  message,
  quickReplies = [],
  canSend,
  onBack,
  onChangeMessage,
  onSend,
}: RideChatViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.peerRow}>
          <MaterialIcons name={peerIcon} size={18} color="#02de95" />
          <Text style={styles.peerText} numberOfLines={1}>
            {peerName}
          </Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {loading ? "Carregando chat..." : "Envie uma mensagem"}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sent && styles.bubbleSent]}>
              <Text style={[styles.bubbleText, item.sent && styles.bubbleTextSent]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, item.sent && styles.bubbleTimeSent]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          )}
        />

        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, 8) + 8 },
          ]}
        >
          {!!quickReplies.length && (
            <View style={styles.quickReplies}>
              {quickReplies.map((reply) => (
                <TouchableOpacity
                  key={reply}
                  style={styles.quickReply}
                  onPress={() => onChangeMessage(reply)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={onChangeMessage}
              placeholder="Digite uma mensagem..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={onSend}
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              disabled={!canSend}
              activeOpacity={0.85}
            >
              <MaterialIcons name="send" size={24} color="#02de95" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#091A2F" },
  keyboard: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.68)",
    marginTop: 4,
    fontSize: 14,
  },
  peerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(19,44,74,0.82)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  peerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyText: {
    color: "rgba(255,255,255,0.62)",
    textAlign: "center",
    marginTop: 28,
  },
  bubble: {
    backgroundColor: "rgba(19,44,74,0.86)",
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginVertical: 5,
    borderRadius: 14,
    borderBottomLeftRadius: 5,
    maxWidth: "82%",
    alignSelf: "flex-start",
  },
  bubbleSent: {
    alignSelf: "flex-end",
    backgroundColor: "#02de95",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 5,
  },
  bubbleText: { color: "#fff", fontSize: 16, lineHeight: 21 },
  bubbleTextSent: { color: "#062318" },
  bubbleTime: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    marginTop: 5,
  },
  bubbleTimeSent: {
    color: "rgba(6,35,24,0.58)",
    textAlign: "right",
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#091A2F",
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  quickReplies: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  quickReply: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(19,44,74,0.78)",
  },
  quickReplyText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 118,
    backgroundColor: "rgba(19,44,74,0.88)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    color: "#fff",
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,222,149,0.10)",
  },
  sendButtonDisabled: { opacity: 0.42 },
});
