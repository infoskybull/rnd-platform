import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import apiService from "../services/api";

// Get API base URL for refresh token call
const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_URL || "http://localhost:8080";
};

export type AdminChatMessage = {
  id: string;
  adminChatId: string;
  userId: string;
  content: string;
  type: "text" | "file" | "system";
  senderId: string;
  senderRole: "admin" | "publisher" | "creator";
  attachments?: string[];
  replyTo?: string;
  ts?: string;
  createdAt?: string;
  messageStatus?: "sending" | "sent" | "delivered" | "read"; // Status for message delivery
  tempId?: string; // Temporary ID for optimistic messages
};

export type ChatStatus = {
  status: "pending" | "active" | "resolved" | "closed";
  lastMessageAt?: string;
  unreadCountByUser: number;
  unreadCountByAdmin: number;
  resolvedAt?: string;
  resolvedBy?: string;
};

export function useAdminSupportChat(
  baseUrl: string,
  token: string | null,
  userId: string | null,
  adminChatId: string | null
) {
  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  useEffect(() => {
    // Always get the latest token from apiService (in case it was refreshed)
    const currentToken = token || apiService.getAccessToken();

    // Check if adminChatId actually changed
    const chatIdChanged = activeChatIdRef.current !== adminChatId;

    if (!baseUrl || !currentToken || !userId || !adminChatId) {
      if (chatIdChanged && activeChatIdRef.current !== null) {
        // Changing from valid chat to no chat - cleanup will happen in return function
        setConnected(false);
        setMessages([]);
        setError(null);
        setChatStatus(null);
        activeChatIdRef.current = adminChatId;
      }
      return;
    }

    // If same chat and socket is connected, don't recreate
    if (
      !chatIdChanged &&
      socketRef.current?.connected &&
      activeChatIdRef.current === adminChatId
    ) {
      return;
    }

    // Update active chat ID BEFORE cleanup to ensure cleanup function knows this is no longer active
    activeChatIdRef.current = adminChatId;

    console.log("[useAdminSupportChat] Creating socket connection:", {
      baseUrl,
      userId,
      adminChatId,
      hasToken: !!currentToken,
    });

    const socket = io(`${baseUrl}/ws/admin-support`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      auth: {
        token: currentToken,
        userId,
        adminChatId,
      },
    });
    socketRef.current = socket;

    // Store adminChatId in closure for event handlers
    const adminChatIdForHandlers = adminChatId;

    const onConnect = () => {
      // Only process if this is still the active chat
      if (
        activeChatIdRef.current === adminChatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log(
          "[useAdminSupportChat] Socket connected:",
          adminChatIdForHandlers
        );
        setConnected(true);
        setError(null);
      } else {
        console.log(
          "[useAdminSupportChat] Ignoring connect event - chat is no longer active",
          "chat:",
          adminChatIdForHandlers,
          "active:",
          activeChatIdRef.current
        );
      }
    };
    const onDisconnect = (reason: string) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === adminChatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log(
          "[useAdminSupportChat] Socket disconnected:",
          reason,
          "for chat:",
          adminChatIdForHandlers
        );
        setConnected(false);
      } else {
        console.log(
          "[useAdminSupportChat] Ignoring disconnect event - chat is no longer active",
          "chat:",
          adminChatIdForHandlers,
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
        activeChatIdRef.current === adminChatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.error("[useAdminSupportChat] Connection error:", err);
        setError(err?.message || "connect_error");
        setConnected(false);
      }
    };
    const onHistory = (hist: AdminChatMessage[]) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === adminChatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log(
          "[useAdminSupportChat] Received history:",
          hist.length,
          "messages"
        );
        setMessages(Array.isArray(hist) ? hist : []);
      }
    };
    const onMessage = (msg: AdminChatMessage) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === adminChatIdForHandlers &&
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
    const onStatus = (status: ChatStatus) => {
      // Only update state if this is still the active chat
      if (
        activeChatIdRef.current === adminChatIdForHandlers &&
        socketRef.current === socket
      ) {
        console.log("[useAdminSupportChat] Status updated:", status);
        setChatStatus(status);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("history", onHistory);
    socket.on("message", onMessage);
    socket.on("status", onStatus);

    // Store the socket and adminChatId in closure for cleanup
    const socketToCleanup = socket;
    const adminChatIdForCleanup = adminChatId;

    return () => {
      // Only cleanup if this chat is still active OR if it's being replaced
      // Cleanup if: this socket is the current socket OR the active chat has changed
      const isActiveSocket = socketRef.current === socketToCleanup;
      const isActiveChat = activeChatIdRef.current === adminChatIdForCleanup;

      if (isActiveSocket || isActiveChat) {
        console.log(
          "[useAdminSupportChat] Cleanup function running for socket:",
          adminChatIdForCleanup,
          "isActiveSocket:",
          isActiveSocket,
          "isActiveChat:",
          isActiveChat,
          "activeChatId:",
          activeChatIdRef.current
        );

        // Only cleanup if this socket is still the current one OR chat is no longer active
        if (socketRef.current === socketToCleanup || !isActiveChat) {
          console.log(
            "[useAdminSupportChat] Cleaning up socket:",
            adminChatIdForCleanup
          );
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
          "[useAdminSupportChat] Skipping cleanup - socket and chat are no longer active",
          "cleanup chat:",
          adminChatIdForCleanup,
          "active chat:",
          activeChatIdRef.current
        );
      }
    };
  }, [baseUrl, token, userId, adminChatId, reconnectTrigger]);

  const send = async (params: {
    content: string;
    type?: "text" | "file" | "system";
    attachments?: string[];
    replyTo?: string;
  }) => {
    const socket = socketRef.current;
    if (!socket || !adminChatId || !userId) return;

    socket.emit(
      "send_message",
      {
        adminChatId,
        userId,
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
                "[useAdminSupportChat] JWT expired, attempting to refresh token..."
              );

              // Trigger refresh by making a request to a protected endpoint
              // The API interceptor will handle the refresh automatically
              // Use a lightweight endpoint - we can call any protected endpoint
              // For now, we'll call the refresh token endpoint directly via fetch
              // since apiService methods may not be suitable
              try {
                // Trigger refresh by making a request to any protected endpoint
                // The apiService will automatically handle token refresh
                // We can use a lightweight endpoint or just trigger refresh directly
                // Since apiService handles refresh internally, we just need to trigger it
                // by making a request that will fail and trigger refresh
                try {
                  // Make a lightweight request to trigger refresh if needed
                  await apiService.request("/users/me", { method: "GET" });
                  console.log(
                    "[useAdminSupportChat] Token refresh triggered successfully via apiService"
                  );
                } catch (refreshTriggerError) {
                  // If refresh fails, it will be handled by apiService
                  console.log(
                    "[useAdminSupportChat] Token refresh attempt completed"
                  );
                }

                // Get new token after refresh
                const newToken = apiService.getAccessToken();

                if (newToken) {
                  console.log(
                    "[useAdminSupportChat] Token refreshed, reconnecting socket..."
                  );

                  // Disconnect current socket
                  if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                  }

                  // Clear state
                  setConnected(false);
                  setError(null);

                  // Trigger reconnection by incrementing reconnectTrigger
                  // This will cause useEffect to run again with the new token from apiService
                  setReconnectTrigger((prev) => prev + 1);

                  console.log(
                    "[useAdminSupportChat] Socket will reconnect with new token"
                  );
                } else {
                  console.error(
                    "[useAdminSupportChat] Failed to refresh token - no new token"
                  );
                  setError("Session expired. Please refresh the page.");
                }
              } catch (refreshRequestError) {
                // If the refresh request itself fails, token refresh may have failed
                console.error(
                  "[useAdminSupportChat] Error during token refresh:",
                  refreshRequestError
                );
                setError("Session expired. Please refresh the page.");
              }
            } catch (refreshError) {
              console.error(
                "[useAdminSupportChat] Error refreshing token:",
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

  const markResolved = (note?: string) => {
    const socket = socketRef.current;
    if (!socket || !adminChatId) return;
    socket.emit(
      "mark_resolved",
      { adminChatId, note },
      (ack?: { ok: boolean; error?: string }) => {
        if (!ack?.ok) {
          console.error("Failed to mark as resolved:", ack?.error);
          setError(ack?.error || "Failed to mark as resolved");
        }
      }
    );
  };

  const reopen = (reason?: string) => {
    const socket = socketRef.current;
    if (!socket || !adminChatId) return;
    socket.emit(
      "reopen",
      { adminChatId, reason },
      (ack?: { ok: boolean; error?: string }) => {
        if (!ack?.ok) {
          console.error("Failed to reopen chat:", ack?.error);
          setError(ack?.error || "Failed to reopen chat");
        }
      }
    );
  };

  return { messages, connected, error, chatStatus, send, markResolved, reopen };
}
