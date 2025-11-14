import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type ChatMessage = {
  id: string;
  collaborationId: string;
  content: string;
  type: "text" | "file" | "system";
  authorId: string;
  authorRole: "creator" | "publisher" | "user";
  attachments?: string[];
  replyTo?: string;
  ts?: string;
};

export function useCollaborationChat(
  baseOrigin: string,
  token: string | null,
  collaborationId: string | null
) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseOrigin || !token || !collaborationId) {
      setConnected(false);
      setMessages([]);
      return;
    }

    const socket = io(`${baseOrigin}/ws/collaboration`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      auth: { token, collaborationId },
    });
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      setError(null);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: any) =>
      setError(err?.message || "connect_error");
    const onHistory = (hist: ChatMessage[]) =>
      setMessages(Array.isArray(hist) ? hist : []);
    const onMessage = (msg: ChatMessage) =>
      setMessages((prev) => {
        // Prevent duplicate messages by checking if message ID already exists
        if (prev.some((m) => m.id === msg.id)) {
          console.log("Duplicate message detected, ignoring:", msg.id);
          return prev;
        }
        return [...prev, msg];
      });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("history", onHistory);
    socket.on("message", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("history", onHistory);
      socket.off("message", onMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [baseOrigin, token, collaborationId]);

  const send = (params: {
    content: string;
    type?: "text" | "file" | "system";
    attachments?: string[];
    replyTo?: string;
  }) => {
    const socket = socketRef.current;
    if (!socket || !collaborationId) return;
    socket.emit(
      "send_message",
      { collaborationId, ...params },
      (ack?: { ok: boolean; id?: string; error?: string }) => {
        if (!ack?.ok) {
          console.error("Failed to send message:", ack?.error);
        }
      }
    );
  };

  return { messages, connected, error, send };
}
