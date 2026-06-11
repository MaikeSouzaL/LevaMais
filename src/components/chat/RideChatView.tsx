import React, { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { ArrowLeft, Send, MessageCircle, User } from "lucide-react-native";

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
  peerIcon?: string;
  peerAvatarUrl?: string;
  online?: boolean;
  messages: RideChatItem[];
  loading?: boolean;
  message: string;
  quickReplies?: string[];
  canSend: boolean;
  onBack: () => void;
  onChangeMessage: (value: string) => void;
  onSend: (text?: string) => void;
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function dateLabel(timestamp: number) {
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Hoje";
  if (sameDay(d, yesterday)) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function RideChatView({
  peerName,
  peerIcon = "person",
  peerAvatarUrl,
  online = true,
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
  const [imgError, setImgError] = useState(false);
  const hasPhoto = !!peerAvatarUrl && !imgError;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {/* Header compacto estilo WhatsApp/Uber */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>
              {peerName}
            </Text>
            <Text style={[styles.headerStatus, online && styles.headerStatusOnline]} numberOfLines={1}>
              {online ? "Online agora" : "Offline"}
            </Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MessageCircle size={30} color="#02de95" />
              </View>
              <Text style={styles.emptyText}>
                {loading ? "Carregando conversa..." : "Nenhuma mensagem ainda"}
              </Text>
              {!loading && (
                <Text style={styles.emptyHint}>Envie a primeira mensagem abaixo</Text>
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const prev = messages[index - 1];
            const showDate = !prev || dateLabel(prev.timestamp) !== dateLabel(item.timestamp);
            return (
              <>
                {showDate && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>{dateLabel(item.timestamp)}</Text>
                  </View>
                )}
                <View style={[styles.messageRow, item.sent ? styles.rowSent : styles.rowReceived]}>
                  {!item.sent && (
                    <View style={styles.messageAvatar}>
                      {hasPhoto ? (
                        <Image
                          source={{ uri: peerAvatarUrl }}
                          style={styles.messageAvatarImg}
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <User size={14} color="rgba(255,255,255,0.6)" />
                      )}
                    </View>
                  )}
                  <View style={[styles.bubble, item.sent ? styles.bubbleSent : styles.bubbleReceived]}>
                    <Text style={[styles.bubbleText, item.sent && styles.bubbleTextSent]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.bubbleTime, item.sent && styles.bubbleTimeSent]}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                </View>
              </>
            );
          }}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
          {!!quickReplies.length && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickReplies}
              keyboardShouldPersistTaps="handled"
            >
              {quickReplies.map((reply) => (
                <TouchableOpacity
                  key={reply}
                  style={styles.quickReply}
                  onPress={() => onSend(reply)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={onChangeMessage}
              placeholder="Digite uma mensagem..."
              placeholderTextColor="rgba(255,255,255,0.40)"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={() => onSend()}
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              disabled={!canSend}
              activeOpacity={0.85}
            >
              <Send size={20} color={canSend ? "#062318" : "rgba(255,255,255,0.65)"} fill={canSend ? "#062318" : "transparent"} />
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#11253E",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { color: "#062318", fontSize: 17, fontWeight: "900" },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2.5,
    borderColor: "#11253E",
  },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "800" },
  headerStatus: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 1 },
  headerStatusOnline: { color: "#34d399" },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingVertical: 14, flexGrow: 1 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(2,222,149,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: { color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: "700" },
  emptyHint: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 },

  dateSeparator: { alignSelf: "center", marginVertical: 12 },
  dateSeparatorText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 3,
    maxWidth: "100%",
  },
  rowSent: {
    justifyContent: "flex-end",
  },
  rowReceived: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  messageAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: "82%",
    borderRadius: 18,
  },
  bubbleReceived: {
    backgroundColor: "#1E2D3D",
    borderBottomLeftRadius: 4,
  },
  bubbleSent: {
    backgroundColor: "#02de95",
    borderBottomRightRadius: 4,
  },
  bubbleText: { color: "#fff", fontSize: 15.5, lineHeight: 21 },
  bubbleTextSent: { color: "#052016" },
  bubbleTime: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 3,
    alignSelf: "flex-end",
  },
  bubbleTimeSent: { color: "rgba(5,32,22,0.55)" },

  composer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#11253E",
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  quickReplies: { gap: 8, paddingBottom: 10, paddingRight: 4 },
  quickReply: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    backgroundColor: "rgba(2,222,149,0.10)",
  },
  quickReplyText: { color: "#5eead0", fontSize: 13, fontWeight: "700" },

  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: "#1E2D3D",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#02de95",
  },
  sendButtonDisabled: { backgroundColor: "#1E2D3D" },
});
