import React, { useEffect, useMemo, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import rideService from "../../../services/ride.service";
import chatService, { ChatMessage } from "../../../services/chat.service";
import { useAuthStore } from "../../../context/authStore";
import { useChatStore } from "../../../context/chatStore";
import { RideChatView } from "../../../components/chat/RideChatView";

type Params = {
  DriverChat: {
    rideId: string;
    clientName?: string;
  };
};

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

export default function DriverChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverChat">>();
  const rideId = route.params?.rideId;

  const currentUserId = useAuthStore((s) => s.userData?.id);

  useEffect(() => {
    if (rideId) useChatStore.getState().clearUnread(rideId);
  }, [rideId]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>(
    route.params?.clientName || "Cliente",
  );
  const [clientPhoto, setClientPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    if (!rideId) {
      (navigation as any).goBack();
      return;
    }

    (async () => {
      try {
        const [ride, persistedMessages] = await Promise.all([
          rideService.getById(rideId),
          chatService.listRideMessages(rideId),
        ]);
        if (!mounted) return;

        const cid = (ride?.clientId as any)?._id || (ride?.clientId as any)?.id;
        const cname = (ride?.clientId as any)?.name;
        const cphoto = (ride?.clientId as any)?.profilePhoto || (ride?.clientId as any)?.fotoPerfil;
        if (cid) setClientId(String(cid));
        if (cname) setClientName(String(cname));
        if (cphoto) setClientPhoto(String(cphoto));
        setMessages(persistedMessages.map((item) => toChatItem(item, currentUserId)));
      } catch {
        Toast.show({
          type: "info",
          text1: "Chat em modo reconexao",
          text2: "Vamos manter a tela aberta e tentar receber novas mensagens.",
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

    const onNewMessage = (payload: ChatMessage) => {
      if (!mounted) return;
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

    const unsubscribe = chatService.onNewMessage(rideId, onNewMessage);

    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [rideId, currentUserId]);

  const canSend = useMemo(
    () => Boolean(message.trim() && rideId),
    [message, rideId],
  );

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
      subtitle={`Conversando com ${clientName}`}
      peerName={clientName}
      peerIcon="person"
      peerAvatarUrl={clientPhoto}
      messages={messages}
      loading={loading}
      message={message}
      quickReplies={["Cheguei", "Estou a caminho", "Estou no ponto de encontro", "OK!"]}
      canSend={canSend}
      onBack={() => (navigation as any).goBack()}
      onChangeMessage={setMessage}
      onSend={handleSend}
    />
  );
}
