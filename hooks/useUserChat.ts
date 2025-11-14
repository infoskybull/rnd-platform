import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import apiService from "../services/api";
import { getApiBaseOrigin } from "../services/api";

export type UserChatMessage = {
  id: string;
  chatId: string;
  userId: string;
  senderId: string;
  content: string;
  type: "text" | "file" | "system";
  attachments?: string[];
  replyTo?: string;
  ts?: string;
  createdAt?: string;
  messageType?: "text" | "file" | "system";
  messageStatus?: "sending" | "sent" | "delivered" | "read";
  tempId?: string;
};

export type UserChatStatus = {
  lastMessageAt?: string;
  unreadCountByUser1: number;
  unreadCountByUser2: number;
  unreadCount: number;
};

export function useUserChat(
  baseUrl: string,
  token: string | null,
  chatId: string | null,
  userId: string | null
) {
  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<UserChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<UserChatStatus | null>(null);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  useEffect(() => {
    // Always get the latest token from apiService (in case it was refreshed)
    const currentToken = token || apiService.getAccessToken();

    // Check if chatId actually changed
    const chatIdChanged = activeChatIdRef.current !== chatId;

    if (!baseUrl || !currentToken || !userId || !chatId) {
      if (chatIdChanged && activeChatIdRef.current !== null) {
        // Changing from valid chat to no chat - cleanup will happen in return function
        setConnected(false);
        setMessages([]);
        setError(null);
        setChatStatus(null);
        activeChatIdRef.current = chatId;
      }
      return;
    }

    // If same chat and socket is connected, don't recreate
    if (
      !chatIdChanged &&
      socketRef.current?.connected &&
      activeChatIdRef.current === chatId
    ) {
      return;
    }

    // Update active chat ID BEFORE cleanup to ensure cleanup function knows this is no longer active
    activeChatIdRef.current = chatId;

    console.log("[useUserChat] Creating socket connection:", {
      baseUrl,
      userId,
      chatId,
      hasToken: !!currentToken,
    });

    const socket = io(`${baseUrl}/ws/user-chat`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      auth: {
        token: currentToken,
        chatId,
        userId,
      },
    });
    socketRef.current = socket;

    // Store chatId in closure for event handlers
    const chatIdForHandlers = chatId;

    const onConnect = () => {
      // Only process if this is still the active chat
      if (
        activeChatIdRef.current === chatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log("[useUserChat] Socket connected:", chatIdForHandlers);
        setConnected(true);
        setError(null);
      } else {
        console.log(
          "[useUserChat] Ignoring connect event - chat is no longer active",
          "chat:",
          chatIdForHandlers,
          "active:",
          activeChatIdRef.current
        );
      }
    };

    const onDisconnect = (reason: string) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === chatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log(
          "[useUserChat] Socket disconnected:",
          reason,
          "for chat:",
          chatIdForHandlers
        );
        setConnected(false);
      } else {
        console.log(
          "[useUserChat] Ignoring disconnect event - chat is no longer active",
          "chat:",
          chatIdForHandlers,
          "active:",
          activeChatIdRef.current,
          "reason:",
          reason
        );
      }
    };

    const onConnectError = (err: any) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === chatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.error("[useUserChat] Connection error:", err);
        setError(err?.message || "connect_error");
        setConnected(false);
      }
    };

    const onHistory = (hist: UserChatMessage[]) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === chatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log("[useUserChat] Received history:", hist.length, "messages");
        setMessages(Array.isArray(hist) ? hist : []);
      }
    };

    const onMessage = (msg: UserChatMessage) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === chatIdForHandlers &&
        socketRef.current === socket
      ) {
        setMessages((prev) => {
          // Prevent duplicate messages by checking if message ID already exists
          if (prev.some((m) => m.id === msg.id)) {
            console.log("Duplicate message detected, ignoring:", msg.id);
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    const onStatus = (status: UserChatStatus) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === chatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log("[useUserChat] Status updated:", status);
        setChatStatus(status);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("history", onHistory);
    socket.on("message", onMessage);
    socket.on("status", onStatus);

    // Store the socket and chatId in closure for cleanup
    const socketToCleanup = socket;
    const chatIdForCleanup = chatId;

    return () => {
      // Only cleanup if this chat is still active OR if it's being replaced
      const isActiveSocket = socketRef.current === socketToCleanup;
      const isActiveChat = activeChatIdRef.current === chatIdForCleanup;

      if (isActiveSocket || isActiveChat) {
        console.log(
          "[useUserChat] Cleanup function running for socket:",
          chatIdForCleanup,
          "isActiveSocket:",
          isActiveSocket,
          "isActiveChat:",
          isActiveChat,
          "activeChatId:",
          activeChatIdRef.current
        );

        // Only cleanup if this socket is still the current one OR chat is no longer active
        if (socketRef.current === socketToCleanup || !isActiveChat) {
          console.log("[useUserChat] Cleaning up socket:", chatIdForCleanup);
          socketToCleanup.off("connect", onConnect);
          socketToCleanup.off("disconnect", onDisconnect);
          socketToCleanup.off("connect_error", onConnectError);
          socketToCleanup.off("history", onHistory);
          socketToCleanup.off("message", onMessage);
          socketToCleanup.off("status", onStatus);
          socketToCleanup.disconnect();
          // Only clear ref if this is still the current socket
          if (socketRef.current === socketToCleanup) {
            socketRef.current = null;
          }
        }
      } else {
        console.log(
          "[useUserChat] Skipping cleanup - socket and chat are no longer active",
          "cleanup chat:",
          chatIdForCleanup,
          "active chat:",
          activeChatIdRef.current
        );
      }
    };
  }, [baseUrl, token, userId, chatId, reconnectTrigger]);

  const send = async (params: {
    content: string;
    type?: "text" | "file" | "system";
    attachments?: string[];
    replyTo?: string;
  }) => {
    const socket = socketRef.current;
    if (!socket || !chatId || !userId) return;

    socket.emit(
      "send_message",
      {
        chatId,
        ...params,
      },
      async (ack?: { ok: boolean; id?: string; error?: string }) => {
        if (!ack?.ok) {
          const errorMsg = ack?.error || "Failed to send message";
          console.error("Failed to send message:", errorMsg);

          // Check if error is due to expired JWT
          if (
            errorMsg.toLowerCase().includes("jwt expired") ||
            errorMsg.toLowerCase().includes("token expired") ||
            errorMsg.toLowerCase().includes("unauthorized")
          ) {
            try {
              console.log(
                "[useUserChat] JWT expired, attempting to refresh token..."
              );

              try {
                await apiService.request("/users/me", { method: "GET" });
                console.log(
                  "[useUserChat] Token refresh triggered successfully via apiService"
                );
              } catch (refreshTriggerError) {
                console.log("[useUserChat] Token refresh attempt completed");
              }

              const newToken = apiService.getAccessToken();

              if (newToken) {
                console.log(
                  "[useUserChat] Token refreshed, reconnecting socket..."
                );

                if (socketRef.current) {
                  socketRef.current.disconnect();
                  socketRef.current = null;
                }

                setConnected(false);
                setError(null);

                setReconnectTrigger((prev) => prev + 1);

                console.log(
                  "[useUserChat] Socket will reconnect with new token"
                );
              } else {
                console.error(
                  "[useUserChat] Failed to refresh token - no new token"
                );
                setError("Session expired. Please refresh the page.");
              }
            } catch (refreshError) {
              console.error(
                "[useUserChat] Error refreshing token:",
                refreshError
              );
              setError("Session expired. Please refresh the page.");
            }
          } else {
            setError(errorMsg);
          }
        }
      }
    );
  };

  const markRead = () => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;
    socket.emit(
      "mark_read",
      { chatId },
      (ack?: { ok: boolean; error?: string }) => {
        if (!ack?.ok) {
          console.error("Failed to mark as read:", ack?.error);
          setError(ack?.error || "Failed to mark as read");
        }
      }
    );
  };

  return { messages, connected, error, chatStatus, send, markRead };
}
