import React, { useEffect, useMemo, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import chatService, { ChatMessage } from "@/services/chat.service";
import webSocketService from "@/services/websocket.service";
import { useAuthStore } from "@/context/authStore";
import { useChatStore } from "@/context/chatStore";
import { RideChatView } from "@/components/chat/RideChatView";
import { ClientStackParamList } from "../../../types/navigation";

type ChatItem = {
  id: string;
  text: string;
  sent: boolean;
  timestamp: number;
};

function toChatItem(item: ChatMessage, currentUserId?: string): ChatItem {
  const senderId = item?.senderId ? String(item.senderId) : "";
  return {
    id: String(item.id || item._id || `${item.createdAt}-${senderId}`),
    text: String(item.message || ""),
    sent: Boolean(currentUserId && senderId === String(currentUserId)),
    timestamp: new Date(item.createdAt || item.timestamp || Date.now()).getTime(),
  };
}

export default function ChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "Chat">>();
  const route = useRoute<RouteProp<ClientStackParamList, "Chat">>();
  const rideId = route.params?.rideId;

  const currentUserId = useAuthStore((s) => s.userData?.id);

  useEffect(() => {
    if (rideId) useChatStore.getState().clearUnread(rideId);
  }, [rideId]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string>(
    route.params?.driverName || "Motorista",
  );
  const [driverPhoto, setDriverPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    if (!rideId) {
      navigation.goBack();
      return;
    }

    (async () => {
      try {
        const [ride, persistedMessages] = await Promise.all([
          rideService.getById(rideId),
          chatService.listRideMessages(rideId),
        ]);
        if (!mounted) return;

        const did =
          typeof ride?.driverId === "string"
            ? ride.driverId
            : ride?.driverId?._id || ride?.driverId?.id;
        const dname = typeof ride?.driverId === "string" ? undefined : ride?.driverId?.name;
        const dphoto = typeof ride?.driverId === "string" ? undefined : (ride?.driverId as any)?.profilePhoto || (ride?.driverId as any)?.fotoPerfil;
        if (did) setDriverId(String(did));
        if (dname) setDriverName(String(dname));
        if (dphoto) setDriverPhoto(String(dphoto));
        setMessages(persistedMessages.map((item) => toChatItem(item, currentUserId)));
      } catch {
        Toast.show({
          type: "info",
          text1: "Chat em modo reconexao",
          text2: "Vamos manter a tela aberta e tentar carregar as mensagens.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentUserId, rideId]);

  useEffect(() => {
    if (!rideId) return;

    let mounted = true;

    const onNewMessage = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;

      const senderId = payload?.senderId ? String(payload.senderId) : "";
      if (currentUserId && senderId === String(currentUserId)) return;

      setMessages((prev) => [
        ...prev,
        {
          id: String(payload?.id || payload?._id || `in-${Date.now()}-${Math.random()}`),
          text: String(payload?.message || ""),
          sent: false,
          timestamp: new Date(payload?.createdAt || payload?.timestamp || Date.now()).getTime(),
        },
      ]);
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.onNewMessage(onNewMessage);
      } catch {
        // fallback: chat local while socket reconnects
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off("new-message", onNewMessage);
    };
  }, [rideId, currentUserId]);

  const canSend = useMemo(
    () => Boolean(message.trim() && rideId),
    [message, rideId],
  );
  const quickReplies = ["Estou a caminho", "Estou descendo", "Já estou saindo", "OK, obrigado!"];

  const handleSend = async (customText?: string) => {
    const txt = typeof customText === "string" ? customText.trim() : message.trim();
    if (!txt || !rideId) return;

    if (!customText) {
      setMessage("");
    }

    try {
      chatService.sendViaSocket(rideId, txt);
      setMessages((prev) => {
        const tempId = `out-${Date.now()}`;
        return [...prev, {
          id: tempId,
          text: txt,
          sent: true,
          timestamp: Date.now(),
        }];
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Mensagem nao enviada",
        text2: e?.message || "Tente novamente.",
      });
      if (!customText) {
        setMessage(txt);
      }
    }
  };

  return (
    <RideChatView
      title="Chat"
      subtitle={`Conversando com ${driverName}`}
      peerName={driverName}
      peerIcon="support-agent"
      peerAvatarUrl={driverPhoto}
      messages={messages}
      loading={loading}
      message={message}
      quickReplies={quickReplies}
      canSend={canSend}
      onBack={() => navigation.goBack()}
      onChangeMessage={setMessage}
      onSend={handleSend}
    />
  );
}
