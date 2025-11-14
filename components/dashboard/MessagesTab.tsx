import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../services/api";
import adminService, {
  AdminChat,
  AdminChatsFilters,
} from "../../services/adminService";
import {
  MessageSquare,
  Search,
  AlertCircle,
  Wifi,
  WifiOff,
  User,
  UserPlus,
  X,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  Image,
  File,
} from "lucide-react";
import {
  useCollaborationChat,
  ChatMessage,
} from "../../hooks/useCollaborationChat";
import {
  useAdminSupportChat,
  AdminChatMessage,
} from "../../hooks/useAdminSupportChat";
import { useUserChat, UserChatMessage } from "../../hooks/useUserChat";
import { getApiBaseOrigin } from "../../services/api";

type ConversationItem =
  | { kind: "admin_support"; id: "admin_support"; title: string }
  | { kind: "collaboration"; id: string; title: string; subtitle?: string }
  | { kind: "admin_report"; id: string; title: string; subtitle?: string }
  | {
      kind: "admin_user_chat";
      id: string;
      userId: string;
      title: string;
      subtitle?: string;
    }
  | {
      kind: "admin_support_chat"; // New type for admin viewing all support chats
      id: string;
      adminChatId: string;
      userId: string;
      title: string;
      subtitle?: string;
      unreadCount?: number;
      status?: string;
    }
  | {
      kind: "user_chat";
      id: string;
      otherUserId: string;
      title: string;
      subtitle?: string;
      unreadCount?: number;
    };

interface MessagesTabProps {
  useFullHeight?: boolean;
}

// Helper function to safely format timestamp for display
// Priority: ts (from message.ts) > createdAt
const formatTimestampForDisplay = (timestamp: any): string => {
  if (!timestamp) return "";

  try {
    let date: Date;

    if (typeof timestamp === "number") {
      // Number (milliseconds or seconds)
      date =
        timestamp > 1e12 ? new Date(timestamp) : new Date(timestamp * 1000);
    } else if (typeof timestamp === "string") {
      // String - first try parsing as ISO string (most common for ts field)
      const dateFromISO = new Date(timestamp);
      if (!isNaN(dateFromISO.getTime()) && dateFromISO.getTime() > 0) {
        date = dateFromISO;
      } else {
        // If ISO parsing failed, try parsing as number string
        const parsed = parseFloat(timestamp);
        if (!isNaN(parsed) && parsed > 0) {
          // It's a number string (milliseconds or seconds)
          date = parsed > 1e12 ? new Date(parsed) : new Date(parsed * 1000);
        } else {
          // Try to parse as date string
          date = new Date(timestamp);
        }
      }
    } else {
      // Unknown format, try Date constructor
      date = new Date(timestamp);
    }

    // Check if date is valid and not epoch 0 (Jan 1, 1970)
    if (isNaN(date.getTime()) || date.getTime() <= 0) {
      return "";
    }

    // Format date for display
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn("Failed to format timestamp:", timestamp, error);
    return "";
  }
};

const MessagesTab: React.FC<MessagesTabProps> = ({ useFullHeight = false }) => {
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Chat pane state (for collaboration chats, admin support, and user-to-user chats)
  const [messages, setMessages] = useState<
    (ChatMessage | AdminChatMessage | UserChatMessage)[]
  >([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState<string>("");
  const [messageAttachments, setMessageAttachments] = useState<string>("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Role checks - must be defined before useMemo that uses them
  const isAdmin = user?.role === "admin";
  const isCreator = user?.role === "creator";
  const isPublisher = user?.role === "publisher";

  // Get adminChatId for admin support chat - get from user object (stored in localStorage)
  // Use primitive values only to avoid unnecessary re-computations
  const selectedKind = selected?.kind;
  const selectedId = selected?.id;
  const selectedAdminChatId = (selected as any)?.adminChatId;
  const userId = user?.id;
  const userAdminChatId = (user as any)?.adminChatId;

  const adminChatIdForSupport = useMemo(() => {
    if (selectedKind === "admin_support") {
      // For publisher/creator: get adminChatId from user object
      if (!isAdmin && userId) {
        // Get adminChatId from user object (already stored in localStorage via authSlice)
        return userAdminChatId || null;
      }
      // For admin: need to select a user's adminChatId (for now, return null - admin needs to select a user)
      return null;
    }
    // For admin support chat (when admin selects from list)
    if (selectedKind === "admin_support_chat") {
      return selectedAdminChatId || null;
    }
    return null;
  }, [selectedKind, selectedAdminChatId, isAdmin, userId, userAdminChatId]);

  // Admin support chat hook
  const apiOrigin = getApiBaseOrigin();
  const {
    messages: adminSupportMessages,
    connected: adminSupportConnected,
    error: adminSupportError,
    chatStatus: adminChatStatus,
    send: sendAdminSupport,
    markResolved,
    reopen,
  } = useAdminSupportChat(
    apiOrigin,
    accessToken || null,
    user?.id || null,
    adminChatIdForSupport
  );

  // User-to-user chat hook - get chatId from selected conversation
  const userChatIdForWebSocket = useMemo(() => {
    if (selectedKind === "user_chat" && selectedId) {
      return selectedId;
    }
    return null;
  }, [selectedKind, selectedId]);

  const {
    messages: userChatMessages,
    connected: userChatConnected,
    error: userChatError,
    chatStatus: userChatStatus,
    send: sendUserChat,
    markRead: markUserChatRead,
  } = useUserChat(
    apiOrigin,
    accessToken || null,
    userChatIdForWebSocket,
    user?.id || null
  );

  // Auto-scroll refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Track initial load state for admin support chat
  const initialLoadDoneRef = useRef<boolean>(false);
  const prevAdminChatIdRef = useRef<string | null>(null);

  // Admin user search state
  const [showUserSearch, setShowUserSearch] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Admin support chats filters
  const [adminChatsFilters, setAdminChatsFilters] = useState<AdminChatsFilters>(
    {
      status: undefined,
      search: undefined,
      page: 1,
      limit: 50,
      sortBy: "lastMessageAt",
      sortOrder: "desc",
    }
  );
  const [searchInput, setSearchInput] = useState<string>("");

  // Debounce search input for admin
  useEffect(() => {
    if (!isAdmin) return;

    const timeoutId = setTimeout(() => {
      setAdminChatsFilters((prev) => ({
        ...prev,
        search: searchInput || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, isAdmin]);

  // User chat search state (for creating new chats)
  const [showChatUserSearch, setShowChatUserSearch] = useState<boolean>(false);
  const [chatUserSearchQuery, setChatUserSearchQuery] = useState<string>("");
  const [chatUsersList, setChatUsersList] = useState<any[]>([]);
  const [chatUsersLoading, setChatUsersLoading] = useState<boolean>(false);

  const sortedConversations = useMemo(() => {
    if (!isAdmin) {
      const support: ConversationItem = {
        kind: "admin_support",
        id: "admin_support",
        title: "Admin Support",
      };
      const others = conversations.filter((c) => c.kind !== "admin_support");
      return [support, ...others];
    }
    return conversations;
  }, [conversations, isAdmin]);

  useEffect(() => {
    const loadList = async () => {
      if (isLoading || !isAuthenticated || !user) return;
      try {
        setLoadingList(true);
        setListError(null);

        if (isAdmin) {
          // Load admin support chats using new API
          try {
            const chatsResponse = await adminService.getAllAdminSupportChats(
              adminChatsFilters
            );
            const chatsList = chatsResponse?.data?.chats || [];

            const supportChatItems: ConversationItem[] = chatsList.map(
              (chat: AdminChat) => ({
                kind: "admin_support_chat",
                id: `admin_support_chat_${chat.id}`,
                adminChatId: chat.id,
                userId: chat.user.id,
                title:
                  `${chat.user.firstName} ${chat.user.lastName}`.trim() ||
                  chat.user.email,
                subtitle: chat.lastMessage?.content
                  ? chat.lastMessage.content.substring(0, 50)
                  : `Status: ${chat.status}`,
                unreadCount: chat.unreadCountByAdmin || 0,
                status: chat.status,
              })
            );

            // Load reports
            const resp = await adminService.getReports({});
            const reportsList = Array.isArray(resp?.data) ? resp.data : [];

            const reportItems: ConversationItem[] = reportsList.map(
              (r: any) => ({
                kind: "admin_report",
                id: r._id,
                title: `Report: ${r.type?.toUpperCase?.() || r.type} (${
                  r.status
                })`,
                subtitle: r.reason,
              })
            );

            // Get existing admin-user chats from conversations (for backwards compatibility)
            const userChatItems = conversations.filter(
              (c) => c.kind === "admin_user_chat"
            );

            setConversations([
              ...supportChatItems,
              ...userChatItems,
              ...reportItems,
            ]);
            setSelected(
              supportChatItems[0] || userChatItems[0] || reportItems[0] || null
            );
          } catch (chatErr) {
            console.error("Failed to load admin support chats:", chatErr);
            // Fallback to reports only if chats fail
            const resp = await adminService.getReports({});
            const reportsList = Array.isArray(resp?.data) ? resp.data : [];
            const reportItems: ConversationItem[] = reportsList.map(
              (r: any) => ({
                kind: "admin_report",
                id: r._id,
                title: `Report: ${r.type?.toUpperCase?.() || r.type} (${
                  r.status
                })`,
                subtitle: r.reason,
              })
            );
            setConversations(reportItems);
            setSelected(reportItems[0] || null);
          }
        } else if (isCreator || isPublisher) {
          // Load collaborations
          const list = isCreator
            ? await apiService.getDeveloperCollaborations()
            : await apiService.getPublisherCollaborations();
          const collaborationsList = Array.isArray(list)
            ? list
            : Array.isArray(list?.data)
            ? list.data
            : [];
          const collaborationItems: ConversationItem[] = collaborationsList.map(
            (c: any) => ({
              kind: "collaboration",
              id: c._id || c.id,
              title: c.project?.title || "Collaboration",
              subtitle: c.status ? `Status: ${c.status}` : undefined,
            })
          );

          // Load user-to-user chats
          try {
            const chatsResponse = await apiService.getChats();
            const userChatsList = Array.isArray(chatsResponse?.data)
              ? chatsResponse.data
              : [];
            const currentUserId = user?.id || "";
            const userChatItems: ConversationItem[] = userChatsList
              .map((chat: any) => {
                // Determine the other user correctly
                // API may return otherUser incorrectly, so we need to validate
                let otherUser = chat.otherUser;

                // Check if API returns user1 and user2 (if so, determine which is the other user)
                if ((chat as any).user1 && (chat as any).user2) {
                  const user1 = (chat as any).user1;
                  const user2 = (chat as any).user2;
                  const user1Id = typeof user1 === "string" ? user1 : user1?.id;
                  const user2Id = typeof user2 === "string" ? user2 : user2?.id;
                  const user1Data = typeof user1 === "object" ? user1 : null;
                  const user2Data = typeof user2 === "object" ? user2 : null;

                  // Find which user is NOT the current user
                  if (user1Id === currentUserId && user2Data) {
                    otherUser = user2Data;
                  } else if (user2Id === currentUserId && user1Data) {
                    otherUser = user1Data;
                  } else if (user1Id !== currentUserId && user1Data) {
                    // Fallback: if otherUser is wrong, use user1 if it's different
                    otherUser = user1Data;
                  } else if (user2Id !== currentUserId && user2Data) {
                    // Fallback: use user2 if it's different
                    otherUser = user2Data;
                  }
                }

                // Validate: otherUser should not be the current user
                // If it is, log warning (this indicates an API bug)
                if (otherUser?.id === currentUserId) {
                  console.warn(
                    "API returned current user as otherUser, filtering out invalid chat",
                    {
                      chatId: chat.id,
                      otherUser,
                      currentUserId,
                    }
                  );
                  return null; // Mark for filtering
                }

                return {
                  kind: "user_chat" as const,
                  id: chat.id,
                  otherUserId: otherUser?.id || "",
                  title:
                    `${otherUser?.firstName || ""} ${
                      otherUser?.lastName || ""
                    }`.trim() ||
                    otherUser?.email ||
                    "User",
                  subtitle: chat.lastMessage?.content
                    ? chat.lastMessage.content.substring(0, 50)
                    : "No messages yet",
                  unreadCount: chat.unreadCount || 0,
                };
              })
              .filter(
                (item) =>
                  item !== null &&
                  item.otherUserId &&
                  item.otherUserId !== currentUserId
              ) as ConversationItem[]; // Filter out invalid chats

            setConversations([...collaborationItems, ...userChatItems]);
            setSelected({
              kind: "admin_support",
              id: "admin_support",
              title: "Admin Support",
            });
          } catch (chatErr) {
            console.error("Failed to load user chats:", chatErr);
            // If user chats fail, still show collaborations
            setConversations(collaborationItems);
            setSelected({
              kind: "admin_support",
              id: "admin_support",
              title: "Admin Support",
            });
          }
        } else {
          setConversations([]);
        }
      } catch (err) {
        setListError(
          err instanceof Error ? err.message : "Failed to load messages list"
        );
      } finally {
        setLoadingList(false);
      }
    };
    loadList();
  }, [
    isAdmin,
    isCreator,
    isPublisher,
    isAuthenticated,
    isLoading,
    user,
    adminChatsFilters,
  ]);

  // Handle responsive detection
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Ensure default selection for creator/publisher
  useEffect(() => {
    if (!selected && !loadingList && !isAdmin) {
      // Auto-select admin_support for creator/publisher if no selection
      setSelected({
        kind: "admin_support",
        id: "admin_support",
        title: "Admin Support",
      });
    }
  }, [selected, loadingList, isAdmin]);

  // Realtime chat via Socket.IO for collaboration chats only
  const collabId = selected?.kind === "collaboration" ? selected.id : null;
  const {
    messages: rtMessages,
    connected,
    error: rtError,
    send,
  } = useCollaborationChat(apiOrigin, accessToken || null, collabId);

  // Load initial messages from REST API, then sync with real-time
  // Search users function for admin
  const searchUsers = async (query: string) => {
    if (!isAdmin || !query.trim()) {
      setUsersList([]);
      return;
    }

    try {
      setUsersLoading(true);
      setUsersError(null);
      const response = await adminService.getUsers({
        search: query.trim(),
        limit: 20,
      });
      const users = Array.isArray(response?.data) ? response.data : [];
      setUsersList(users);
    } catch (err) {
      setUsersError(
        err instanceof Error ? err.message : "Failed to search users"
      );
      setUsersList([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Debounced search for admin user search
  useEffect(() => {
    if (!showUserSearch) return;

    const timeoutId = setTimeout(() => {
      if (userSearchQuery.trim()) {
        searchUsers(userSearchQuery);
      } else {
        setUsersList([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, showUserSearch, isAdmin]);

  // Search users for creating new user-to-user chats
  const searchChatUsers = async (query: string) => {
    if (!query.trim()) {
      setChatUsersList([]);
      return;
    }

    try {
      setChatUsersLoading(true);
      const response = await apiService.searchUsers({
        search: query.trim(),
        limit: 20,
      });
      const users = Array.isArray(response?.data) ? response.data : [];
      // Filter out current user
      const filteredUsers = users.filter(
        (u: any) => u._id !== user?.id && u._id !== (user as any)?._id
      );
      setChatUsersList(filteredUsers);
    } catch (err) {
      console.error("Failed to search users:", err);
      setChatUsersList([]);
    } finally {
      setChatUsersLoading(false);
    }
  };

  // Debounced search for chat user search
  useEffect(() => {
    if (!showChatUserSearch) return;

    const timeoutId = setTimeout(() => {
      if (chatUserSearchQuery.trim()) {
        searchChatUsers(chatUserSearchQuery);
      } else {
        setChatUsersList([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [chatUserSearchQuery, showChatUserSearch]);

  // Create or get chat with a user
  const createOrGetUserChat = async (otherUserId: string) => {
    try {
      const response = await apiService.createOrGetChat(otherUserId);
      const chatData = response.data;
      const currentUserId = user?.id || "";

      // Determine the other user correctly
      let otherUser = chatData.otherUser;

      // Check if API returns user1 and user2 (if so, determine which is the other user)
      const chatDataAny = chatData as any;
      if (chatDataAny.user1 && chatDataAny.user2) {
        const user1 = chatDataAny.user1;
        const user2 = chatDataAny.user2;
        const user1Id = typeof user1 === "string" ? user1 : user1?.id;
        const user2Id = typeof user2 === "string" ? user2 : user2?.id;
        const user1Data = typeof user1 === "object" ? user1 : null;
        const user2Data = typeof user2 === "object" ? user2 : null;

        // Find which user is NOT the current user
        if (user1Id === currentUserId && user2Data) {
          otherUser = user2Data;
        } else if (user2Id === currentUserId && user1Data) {
          otherUser = user1Data;
        } else if (user1Id !== currentUserId && user1Data) {
          otherUser = user1Data;
        } else if (user2Id !== currentUserId && user2Data) {
          otherUser = user2Data;
        }
      }

      // Validate: otherUser should not be the current user
      // If otherUser is wrong but we have the requested otherUserId, we know it's correct
      if (otherUser?.id === currentUserId && otherUserId !== currentUserId) {
        console.warn(
          "API returned current user as otherUser for createOrGetChat, using requested otherUserId",
          {
            chatId: chatData.id,
            otherUserFromAPI: otherUser,
            currentUserId,
            requestedOtherUserId: otherUserId,
          }
        );
        // We can't use otherUserId directly because we don't have full user data
        // But we should log this as it indicates a backend bug
        // The chat will still work, just the display name might be wrong
      }

      const newChat: ConversationItem = {
        kind: "user_chat",
        id: chatData.id,
        otherUserId: otherUser?.id || otherUserId,
        title:
          `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() ||
          otherUser?.email ||
          "User",
        subtitle: chatData.lastMessage?.content
          ? chatData.lastMessage.content.substring(0, 50)
          : "No messages yet",
        unreadCount: chatData.unreadCount || 0,
      };

      // Check if chat already exists in conversations
      const existingIndex = conversations.findIndex(
        (c) => c.kind === "user_chat" && c.id === chatData.id
      );

      if (existingIndex >= 0) {
        // Chat exists, just select it
        setSelected(conversations[existingIndex]);
      } else {
        // Add new chat and select it
        setConversations((prev) => [newChat, ...prev]);
        setSelected(newChat);
      }

      // Close search
      setShowChatUserSearch(false);
      setChatUserSearchQuery("");
      setChatUsersList([]);
    } catch (err) {
      console.error("Failed to create/get chat:", err);
      alert(err instanceof Error ? err.message : "Failed to create chat");
    }
  };

  // Create conversation with user
  const createUserConversation = (selectedUser: any) => {
    if (!selectedUser?._id) return;

    const conversationId = `admin_user_${selectedUser._id}`;
    const userName =
      `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() ||
      selectedUser.email;

    const newConversation: ConversationItem = {
      kind: "admin_user_chat",
      id: conversationId,
      userId: selectedUser._id,
      title: userName,
      subtitle: `${selectedUser.role || "User"} • ${selectedUser.email}`,
    };

    // Check if conversation already exists
    const existingIndex = conversations.findIndex(
      (c) => c.kind === "admin_user_chat" && c.userId === selectedUser._id
    );

    if (existingIndex >= 0) {
      // Conversation exists, just select it
      setSelected(conversations[existingIndex]);
    } else {
      // Add new conversation and select it
      setConversations((prev) => [newConversation, ...prev]);
      setSelected(newConversation);
    }

    // Close user search
    setShowUserSearch(false);
    setUserSearchQuery("");
    setUsersList([]);
  };

  const loadMessagesForSelected = async (item: ConversationItem | null) => {
    if (!item) {
      setMessages([]);
      setMessagesError(null);
      return;
    }

    // Handle user-to-user chat messages
    // Load messages from REST API first for faster initial display
    // WebSocket will then sync and update with real-time messages
    if (item.kind === "user_chat") {
      try {
        setMessagesLoading(true);
        setMessagesError(null);

        // Load messages from REST API for fast initial display
        const messagesResponse = await apiService.getChatMessages(item.id);
        const restMessages = Array.isArray(messagesResponse?.data)
          ? messagesResponse.data
          : [];

        // Helper to normalize timestamp to ISO string
        const normalizeTimestampToString = (ts: any): string => {
          if (!ts) return new Date().toISOString();
          if (typeof ts === "number") {
            return new Date(ts).toISOString();
          } else if (typeof ts === "string") {
            const parsed = parseFloat(ts);
            if (!isNaN(parsed) && parsed > 0) {
              return new Date(parsed).toISOString();
            }
            const date = new Date(ts);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
          return new Date().toISOString();
        };

        // Convert REST API messages to ChatMessage format
        const formattedMessages: (ChatMessage & {
          messageStatus?: "sending" | "sent" | "delivered" | "read";
        })[] = restMessages.map((msg: any) => ({
          id: msg.id || `${Date.now()}_${Math.random()}`,
          collaborationId: item.id,
          content: msg.content || "",
          type: (msg.messageType || msg.type || "text") as any,
          authorId: msg.senderId || "",
          authorRole: "user",
          attachments: msg.attachments || [],
          replyTo: msg.replyTo || undefined,
          ts: normalizeTimestampToString(msg.ts || msg.createdAt),
          messageStatus: msg.messageStatus || "sent", // Default to "sent" for REST API messages
        }));

        // Set messages immediately for fast display
        setMessages(formattedMessages);

        // Mark that REST API has loaded messages for this chat
        // This prevents WebSocket from clearing messages before it loads
        prevUserChatIdRef.current = item.id;
        restApiLoadedRef.current = true;

        // Mark messages as read
        try {
          await apiService.markChatAsRead(item.id);
          markUserChatRead();
        } catch (readErr) {
          console.error("Failed to mark as read:", readErr);
        }
      } catch (err) {
        console.error("Failed to load messages from REST API:", err);
        setMessagesError(
          err instanceof Error ? err.message : "Failed to load messages"
        );
        // Don't set messages to empty, let WebSocket try to load
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
      // WebSocket will update messages when connected and history arrives
      return;
    }

    // Handle collaboration chats
    if (item.kind !== "collaboration") {
      setMessages([]);
      setMessagesError(null);
      return;
    }
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      const data = await apiService.getCollaborationMessages(item.id);

      // Helper to normalize timestamp to ISO string
      const normalizeTimestampToString = (ts: any): string => {
        if (!ts) return new Date().toISOString();

        if (typeof ts === "number") {
          // Number (milliseconds) - convert to ISO string
          return new Date(ts).toISOString();
        } else if (typeof ts === "string") {
          // String - check if it's a number string
          const parsed = parseFloat(ts);
          if (!isNaN(parsed) && parsed > 0) {
            // It's a number string (milliseconds), convert to ISO
            return new Date(parsed).toISOString();
          }
          // Try to parse as date string
          const date = new Date(ts);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
        // Fallback to current time
        return new Date().toISOString();
      };

      // Convert REST API messages to ChatMessage format
      const formattedMessages: ChatMessage[] = (
        Array.isArray(data) ? data : []
      ).map((msg: any) => ({
        id: msg._id || msg.id || `${Date.now()}_${Math.random()}`,
        collaborationId: item.id,
        content: msg.content || "",
        type: msg.type || "text",
        authorId: msg.authorId || msg.author?._id || msg.author?.id || "",
        authorRole:
          msg.authorRole || msg.authorType || msg.author?.role || "user",
        attachments: msg.attachments || [],
        replyTo: msg.replyTo || undefined,
        ts: normalizeTimestampToString(msg.ts || msg.createdAt),
      }));
      setMessages(formattedMessages);
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : "Failed to load messages"
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  // Sync real-time messages with local state for collaboration chats
  // Only append messages newer than the last message in current state (based on timestamp)
  useEffect(() => {
    if (selected?.kind === "collaboration") {
      // Socket is only for real-time sync, not initial loading
      // REST API handles initial loading, so we just merge NEW socket messages
      if (rtMessages.length > 0) {
        setMessages((prevMessages) => {
          // If we have REST API messages, merge only NEW socket messages
          if (prevMessages.length > 0) {
            // Helper function to normalize timestamp to milliseconds number
            // Use same logic as normalizeTimestampToMs for consistency
            // Priority: timestamp (number) > ts (string/number) > createdAt (ISO string)
            const normalizeTimestamp = (ts: any, timestamp?: any): number => {
              // Priority 1: Use timestamp field if available (direct number from API)
              if (timestamp !== undefined && timestamp !== null) {
                if (
                  typeof timestamp === "number" &&
                  timestamp > 0 &&
                  !isNaN(timestamp)
                ) {
                  return timestamp;
                }
                if (typeof timestamp === "string") {
                  const parsed = parseFloat(timestamp);
                  if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                  }
                }
              }

              // Priority 2: Use ts field
              if (!ts) return 0;

              if (typeof ts === "number") {
                // Already a number (milliseconds)
                return ts > 0 && !isNaN(ts) ? ts : 0;
              } else if (typeof ts === "string") {
                // String - check if it's a pure number string (milliseconds)
                const isPureNumber = /^-?\d+\.?\d*$/.test(ts.trim());
                if (isPureNumber) {
                  const parsed = parseFloat(ts);
                  if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                  }
                }
                // Try to parse as ISO date string or any date format
                const date = new Date(ts);
                const timeMs = date.getTime();
                if (!isNaN(timeMs) && timeMs > 0) {
                  return timeMs;
                }
              } else {
                // Unknown format, try Date constructor
                const dateTime = new Date(ts).getTime();
                return !isNaN(dateTime) && dateTime > 0 ? dateTime : 0;
              }
              return 0;
            };

            // Get the timestamp of the last message in prevMessages (sorted by time)
            // Try to use _timestampMs if available (from REST API), otherwise normalize from ts/createdAt
            const prevTimestamps = prevMessages
              .map((msg) => {
                // Prefer _timestampMs if available (stored as milliseconds from REST API)
                const storedMs = (msg as any)._timestampMs;
                if (storedMs && typeof storedMs === "number" && storedMs > 0) {
                  return storedMs;
                }

                // Otherwise normalize from ts or createdAt
                const ts = msg.ts || (msg as any).createdAt;
                return normalizeTimestamp(ts);
              })
              .filter((ts) => ts > 0);

            // Get the latest timestamp from prevMessages
            const lastMessageTime =
              prevTimestamps.length > 0 ? Math.max(...prevTimestamps) : 0;

            console.log("[MessagesTab] Timestamp summary:", {
              prevMessagesCount: prevMessages.length,
              validTimestampsCount: prevTimestamps.length,
              lastMessageTime: lastMessageTime,
              lastMessageTimeISO:
                lastMessageTime > 0
                  ? new Date(lastMessageTime).toISOString()
                  : "invalid",
              socketMessagesCount: adminSupportMessages.length,
            });

            // Get messages that are:
            // 1. Not already in prevMessages (by ID)
            // 2. Have timestamp newer than lastMessageTime
            const existingIds = new Set(prevMessages.map((m) => m.id));
            const newMessages = rtMessages.filter((msg) => {
              // Skip if already exists
              if (existingIds.has(msg.id)) {
                return false;
              }

              // Get message timestamp with validation
              const timestamp = msg.ts || (msg as any).createdAt;
              if (!timestamp) {
                // Skip messages without timestamp
                return false;
              }

              // Normalize timestamp to milliseconds number
              const msgTime = normalizeTimestamp(timestamp);

              if (isNaN(msgTime) || msgTime <= 0) {
                // Skip messages with invalid timestamp
                console.warn(
                  "[MessagesTab] Skipping collaboration message with invalid timestamp:",
                  {
                    raw: timestamp,
                    type: typeof timestamp,
                    msgId: msg.id,
                    converted: msgTime,
                  }
                );
                return false;
              }

              // Only include messages with timestamp NEWER than lastMessageTime
              if (lastMessageTime > 0) {
                // We have existing messages, only add NEW messages (after lastMessageTime)
                // Skip if timestamp is less than lastMessageTime
                if (msgTime < lastMessageTime) {
                  console.log(
                    "[MessagesTab] Skipping old collaboration message from socket:",
                    {
                      msgId: msg.id,
                      msgTime: new Date(msgTime).toISOString(),
                      lastMessageTime: new Date(lastMessageTime).toISOString(),
                      isNewer: msgTime > lastMessageTime,
                    }
                  );
                  return false;
                }
                // If timestamp equals lastMessageTime, check if message ID already exists
                // (This prevents duplicates when multiple messages have the same timestamp)
                if (msgTime === lastMessageTime) {
                  // Get IDs of messages with lastMessageTime timestamp
                  const lastMessageTimeIds = new Set(
                    prevMessages
                      .map((prevMsg) => {
                        const storedMs = (prevMsg as any)._timestampMs;
                        const ts = prevMsg.ts || (prevMsg as any).createdAt;
                        const timestamp = (prevMsg as any).timestamp;
                        const prevMsgTime =
                          storedMs &&
                          typeof storedMs === "number" &&
                          storedMs > 0
                            ? storedMs
                            : normalizeTimestamp(ts, timestamp);
                        return prevMsgTime === lastMessageTime
                          ? prevMsg.id
                          : null;
                      })
                      .filter((id): id is string => id !== null)
                  );

                  if (lastMessageTimeIds.has(msg.id)) {
                    console.log(
                      "[MessagesTab] Skipping duplicate collaboration message with same timestamp:",
                      {
                        msgId: msg.id,
                        msgTime: new Date(msgTime).toISOString(),
                        lastMessageTime: new Date(
                          lastMessageTime
                        ).toISOString(),
                      }
                    );
                    return false;
                  }
                }
                // msgTime >= lastMessageTime and not duplicate by ID, so this is a new message
                return true;
              } else {
                // lastMessageTime = 0 means we have no valid timestamps in prevMessages
                // But we still have prevMessages.length > 0, so skip all socket messages
                // to avoid adding old messages (REST API should handle initial load)
                console.log(
                  "[MessagesTab] Skipping collaboration socket message: no valid lastMessageTime (REST API should handle initial load)",
                  {
                    msgId: msg.id,
                    msgTime: new Date(msgTime).toISOString(),
                    prevMessagesCount: prevMessages.length,
                  }
                );
                return false;
              }
            });

            if (newMessages.length > 0) {
              console.log(
                `[MessagesTab] Adding ${newMessages.length} new collaboration messages from socket`,
                {
                  prevMessagesCount: prevMessages.length,
                  socketMessagesCount: rtMessages.length,
                  lastMessageTime:
                    lastMessageTime > 0 && !isNaN(lastMessageTime)
                      ? new Date(lastMessageTime).toISOString()
                      : "none",
                  newMessageTimes: newMessages.map((m) => {
                    const timestamp = m.ts || (m as any).createdAt;
                    const msgTime = normalizeTimestamp(timestamp);
                    return {
                      id: m.id,
                      time:
                        msgTime > 0 && !isNaN(msgTime)
                          ? new Date(msgTime).toISOString()
                          : "invalid",
                    };
                  }),
                }
              );

              // Merge and sort by timestamp
              const allMessages = [...prevMessages, ...newMessages];
              const merged = allMessages.sort((a, b) => {
                const aTs = a.ts || (a as any).createdAt;
                const bTs = b.ts || (b as any).createdAt;
                const aTime = normalizeTimestamp(aTs);
                const bTime = normalizeTimestamp(bTs);
                // Handle invalid timestamps - put them at the end
                if (aTime <= 0) return 1;
                if (bTime <= 0) return -1;
                return aTime - bTime;
              });

              return merged;
            }

            // No new messages to add
            return prevMessages;
          }

          // If no REST API messages yet, use socket messages as fallback
          // (This should rarely happen as REST API should load first)
          return rtMessages;
        });
      }
      setMessagesError(rtError || null);
    }
  }, [rtMessages, rtError, connected, selected?.kind, selected?.id]);

  // Sync admin support messages from socket - only for real-time updates
  // Loading state is handled by REST API, not socket
  // Only append messages newer than the last message in current state (based on timestamp)
  useEffect(() => {
    if (
      (selectedKind === "admin_support" ||
        selectedKind === "admin_support_chat") &&
      adminChatIdForSupport &&
      adminSupportConnected
    ) {
      // Socket is only for real-time sync, not initial loading
      // REST API handles initial loading, so we just merge NEW socket messages
      if (adminSupportMessages.length > 0) {
        setMessages((prevMessages) => {
          // If we have REST API messages, merge only NEW socket messages
          if (prevMessages.length > 0) {
            // Helper function to normalize timestamp to milliseconds number
            // Use same logic as normalizeTimestampToMs for consistency
            // Priority: timestamp (number) > ts (string/number) > createdAt (ISO string)
            const normalizeTimestampForComparison = (
              ts: any,
              timestamp?: any
            ): number => {
              // Priority 1: Use timestamp field if available (direct number from API)
              if (timestamp !== undefined && timestamp !== null) {
                if (
                  typeof timestamp === "number" &&
                  timestamp > 0 &&
                  !isNaN(timestamp)
                ) {
                  return timestamp;
                }
                if (typeof timestamp === "string") {
                  const parsed = parseFloat(timestamp);
                  if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                  }
                }
              }

              // Priority 2: Use ts field
              if (!ts) return 0;

              if (typeof ts === "number") {
                // Already a number (milliseconds)
                return ts > 0 && !isNaN(ts) ? ts : 0;
              } else if (typeof ts === "string") {
                // String - check if it's a pure number string (milliseconds)
                // A pure number string should only contain digits and optionally a decimal point
                // ISO strings like "2025-10-31T09:18:27.613Z" contain non-numeric characters
                const isPureNumber = /^-?\d+\.?\d*$/.test(ts.trim());
                if (isPureNumber) {
                  const parsed = parseFloat(ts);
                  if (!isNaN(parsed) && parsed > 0) {
                    // It's a number string (milliseconds)
                    return parsed;
                  }
                }

                // Try to parse as ISO date string or any date format
                const date = new Date(ts);
                const timeMs = date.getTime();
                if (!isNaN(timeMs) && timeMs > 0) {
                  return timeMs;
                }
              } else {
                // Unknown format, try Date constructor
                const dateTime = new Date(ts).getTime();
                return !isNaN(dateTime) && dateTime > 0 ? dateTime : 0;
              }
              return 0;
            };

            // Get the timestamp of the last message in prevMessages (sorted by time)
            // Try to use _timestampMs if available (from REST API), otherwise normalize from ts/createdAt
            const prevTimestamps = prevMessages
              .map((msg) => {
                // Prefer _timestampMs if available (stored as milliseconds from REST API)
                const storedMs = (msg as any)._timestampMs;
                if (storedMs && typeof storedMs === "number" && storedMs > 0) {
                  return storedMs;
                }
                // Otherwise normalize from ts or createdAt
                const ts = msg.ts || (msg as any).createdAt;
                const timestamp = (msg as any).timestamp;
                return normalizeTimestampForComparison(ts, timestamp);
              })
              .filter((ts) => ts > 0);

            // Get the latest timestamp from prevMessages
            const lastMessageTime =
              prevTimestamps.length > 0 ? Math.max(...prevTimestamps) : 0;

            // Also get set of IDs that have the lastMessageTime (to prevent duplicates with same timestamp)
            const lastMessageTimeIds = new Set(
              prevMessages
                .filter((msg) => {
                  const storedMs = (msg as any)._timestampMs;
                  const ts = msg.ts || (msg as any).createdAt;
                  const timestamp = (msg as any).timestamp;
                  const msgTime =
                    storedMs && typeof storedMs === "number" && storedMs > 0
                      ? storedMs
                      : normalizeTimestampForComparison(ts, timestamp);
                  return msgTime === lastMessageTime && lastMessageTime > 0;
                })
                .map((msg) => msg.id)
            );

            // Get messages that are:
            // 1. Not already in prevMessages (by ID)
            // 2. Not duplicate by content + senderId + similar timestamp (within 10 seconds)
            // 3. Have timestamp newer than lastMessageTime
            const existingIds = new Set(prevMessages.map((m) => m.id));
            const newMessages = adminSupportMessages.filter((msg) => {
              // Skip if already exists by ID
              if (existingIds.has(msg.id)) {
                console.log(
                  "[MessagesTab] Skipping duplicate message by ID:",
                  msg.id
                );
                return false;
              }

              // Check for duplicate by content + senderId + similar timestamp (same message from different sources)
              // Socket messages may have slightly different ID/timestamp but same content
              const timestampField = (msg as any).timestamp;
              const tsField = msg.ts || (msg as any).createdAt;
              const msgTime = normalizeTimestampForComparison(
                tsField,
                timestampField
              );

              if (msgTime > 0) {
                const isDuplicate = prevMessages.some((prevMsg) => {
                  const prevAdminMsg = prevMsg as AdminChatMessage;
                  // Match by content and senderId
                  const contentMatch = prevAdminMsg.content === msg.content;
                  const senderMatch = prevAdminMsg.senderId === msg.senderId;

                  if (contentMatch && senderMatch) {
                    // Check if timestamps are very close (within 10 seconds = same message)
                    const prevStoredMs = (prevAdminMsg as any)._timestampMs;
                    const prevTs = prevAdminMsg.ts || prevAdminMsg.createdAt;
                    const prevTimestamp = (prevAdminMsg as any).timestamp;
                    const prevTime =
                      prevStoredMs &&
                      typeof prevStoredMs === "number" &&
                      prevStoredMs > 0
                        ? prevStoredMs
                        : normalizeTimestampForComparison(
                            prevTs,
                            prevTimestamp
                          );

                    if (prevTime > 0) {
                      const timeDiff = Math.abs(msgTime - prevTime);
                      // If timestamps are within 10 seconds and content/sender match, it's the same message
                      if (timeDiff < 10000) {
                        console.log(
                          "[MessagesTab] Skipping duplicate message by content+sender+timestamp:",
                          {
                            socketMsgId: msg.id,
                            prevMsgId: prevAdminMsg.id,
                            content: msg.content,
                            timeDiff: timeDiff,
                            socketTime: new Date(msgTime).toISOString(),
                            prevTime: new Date(prevTime).toISOString(),
                          }
                        );
                        return true;
                      }
                    }
                  }
                  return false;
                });

                if (isDuplicate) {
                  return false;
                }
              }

              // Continue with timestamp validation using already computed values
              if (!timestampField && !tsField) {
                // Skip messages without any timestamp
                console.log(
                  "[MessagesTab] Skipping message without timestamp:",
                  msg.id
                );
                return false;
              }

              // msgTime already computed above, reuse it

              console.log("[MessagesTab] Checking socket message:", {
                msgId: msg.id,
                rawTimestamp: timestampField || tsField,
                timestampField: timestampField,
                tsField: tsField,
                timestampType: typeof (timestampField || tsField),
                normalizedMsgTime: msgTime,
                lastMessageTime: lastMessageTime,
                isNewer: msgTime > lastMessageTime,
                msgTimeISO:
                  msgTime > 0 ? new Date(msgTime).toISOString() : "invalid",
                lastMessageTimeISO:
                  lastMessageTime > 0
                    ? new Date(lastMessageTime).toISOString()
                    : "invalid",
              });

              if (isNaN(msgTime) || msgTime <= 0) {
                // Skip messages with invalid timestamp
                console.warn(
                  "[MessagesTab] Skipping message with invalid timestamp:",
                  {
                    timestampField: timestampField,
                    tsField: tsField,
                    raw: timestampField || tsField,
                    type: typeof (timestampField || tsField),
                    msgId: msg.id,
                    converted: msgTime,
                  }
                );
                return false;
              }

              // Only include messages with timestamp NEWER than lastMessageTime
              // If lastMessageTime > 0: only include messages after that timestamp
              // If lastMessageTime = 0: only include messages if we have no existing messages
              // (This prevents adding old messages when we already have REST API messages loaded)
              if (msgTime > 0) {
                if (lastMessageTime > 0) {
                  // We have existing messages, only add NEW messages (after lastMessageTime)
                  // Skip if timestamp is less than lastMessageTime
                  if (msgTime < lastMessageTime) {
                    console.log(
                      "[MessagesTab] Skipping old message from socket:",
                      {
                        msgId: msg.id,
                        msgTime: new Date(msgTime).toISOString(),
                        lastMessageTime: new Date(
                          lastMessageTime
                        ).toISOString(),
                        isNewer: msgTime > lastMessageTime,
                      }
                    );
                    return false;
                  }
                  // If timestamp equals lastMessageTime, check if message ID already exists in prevMessages
                  if (msgTime === lastMessageTime) {
                    // Skip if this message ID already exists in messages with lastMessageTime timestamp
                    if (lastMessageTimeIds.has(msg.id)) {
                      console.log(
                        "[MessagesTab] Skipping duplicate message with same timestamp:",
                        {
                          msgId: msg.id,
                          msgTime: new Date(msgTime).toISOString(),
                          lastMessageTime: new Date(
                            lastMessageTime
                          ).toISOString(),
                        }
                      );
                      return false;
                    }
                  }
                  // msgTime >= lastMessageTime and not duplicate by ID, so this is a new message
                  return true;
                } else {
                  // lastMessageTime = 0 means we have no valid timestamps in prevMessages
                  // But we still have prevMessages.length > 0, so skip all socket messages
                  // to avoid adding old messages (REST API should handle initial load)
                  console.log(
                    "[MessagesTab] Skipping socket message: no valid lastMessageTime (REST API should handle initial load)",
                    {
                      msgId: msg.id,
                      msgTime: new Date(msgTime).toISOString(),
                      prevMessagesCount: prevMessages.length,
                    }
                  );
                  return false;
                }
              }

              // Invalid timestamp, skip
              return false;
            });

            // Update optimistic messages: if socket message matches optimistic message (by content + senderId),
            // replace optimistic message with real message and set status to "sent"
            const updatedMessages = prevMessages.map((prevMsg) => {
              const prevAdminMsg = prevMsg as AdminChatMessage;
              // If this is an optimistic message (has tempId and status "sending")
              if (
                prevAdminMsg.tempId &&
                prevAdminMsg.messageStatus === "sending"
              ) {
                // Try to find matching socket message
                const matchingSocketMsg = adminSupportMessages.find(
                  (socketMsg) => {
                    // Match by content, senderId, and approximate timestamp (within 10 seconds)
                    const contentMatch =
                      socketMsg.content === prevAdminMsg.content;
                    const senderMatch =
                      socketMsg.senderId === prevAdminMsg.senderId;

                    // Use _timestampMs if available, otherwise normalize
                    const prevTime =
                      (prevAdminMsg as any)._timestampMs ||
                      normalizeTimestampForComparison(
                        prevAdminMsg.ts || prevAdminMsg.createdAt
                      );
                    const socketTime = normalizeTimestampForComparison(
                      socketMsg.ts || socketMsg.createdAt
                    );
                    const timeMatch =
                      prevTime > 0 && socketTime > 0
                        ? Math.abs(socketTime - prevTime) < 10000 // Within 10 seconds
                        : false;

                    return contentMatch && senderMatch && timeMatch;
                  }
                );

                if (matchingSocketMsg) {
                  // Replace optimistic message with real message
                  // Also store _timestampMs for consistent comparison
                  const socketTimeMs = normalizeTimestampForComparison(
                    matchingSocketMsg.ts || matchingSocketMsg.createdAt,
                    (matchingSocketMsg as any).timestamp
                  );
                  console.log(
                    "[MessagesTab] Replacing optimistic message with socket message:",
                    prevAdminMsg.tempId,
                    "->",
                    matchingSocketMsg.id
                  );
                  return {
                    ...matchingSocketMsg,
                    messageStatus: "sent" as const,
                    _timestampMs: socketTimeMs,
                  };
                }
              }
              return prevMsg;
            });

            if (newMessages.length > 0) {
              console.log(
                `[MessagesTab] Adding ${newMessages.length} new messages from socket`,
                {
                  prevMessagesCount: prevMessages.length,
                  socketMessagesCount: adminSupportMessages.length,
                  lastMessageTime:
                    lastMessageTime > 0 && !isNaN(lastMessageTime)
                      ? new Date(lastMessageTime).toISOString()
                      : "none",
                  newMessageTimes: newMessages.map((m) => {
                    const timestampField = (m as any).timestamp;
                    const tsField = m.ts || (m as any).createdAt;
                    const msgTime = normalizeTimestampForComparison(
                      tsField,
                      timestampField
                    );
                    return {
                      id: m.id,
                      time:
                        msgTime > 0 && !isNaN(msgTime)
                          ? new Date(msgTime).toISOString()
                          : "invalid",
                    };
                  }),
                }
              );

              // Add remaining new messages (not matched to optimistic messages)
              const remainingNewMessages = newMessages.filter((socketMsg) => {
                // Check if this socket message was already used to replace an optimistic message
                return !updatedMessages.some((prevMsg) => {
                  const prevAdminMsg = prevMsg as AdminChatMessage;
                  return (
                    prevAdminMsg.id === socketMsg.id &&
                    prevAdminMsg.messageStatus === "sent"
                  );
                });
              });

              // Merge and sort by timestamp
              // Remove duplicates by ID to ensure no duplicate messages
              const messageMap = new Map<
                string,
                ChatMessage | AdminChatMessage | UserChatMessage
              >();

              // Add all updated messages first (they have priority)
              updatedMessages.forEach((msg) => {
                messageMap.set(msg.id, msg);
              });

              // Add remaining new messages (won't overwrite existing ones)
              remainingNewMessages.forEach((msg) => {
                if (!messageMap.has(msg.id)) {
                  messageMap.set(msg.id, msg);
                }
              });

              // Convert to array and sort by timestamp
              const allMessages = Array.from(messageMap.values());
              const merged = allMessages.sort((a, b) => {
                const aTs = a.ts || (a as any).createdAt;
                const bTs = b.ts || (b as any).createdAt;
                const aTimestamp = (a as any).timestamp;
                const bTimestamp = (b as any).timestamp;
                const aTime = normalizeTimestampForComparison(aTs, aTimestamp);
                const bTime = normalizeTimestampForComparison(bTs, bTimestamp);
                // Handle invalid timestamps - put them at the end
                if (aTime <= 0) return 1;
                if (bTime <= 0) return -1;
                return aTime - bTime;
              });

              return merged;
            }

            // No new messages to add, but return updated messages (with optimistic status updates)
            return updatedMessages;
          }
          // If no REST API messages yet, use socket messages as fallback
          // (This should rarely happen as REST API should load first)
          return adminSupportMessages.map((msg) => ({
            ...msg,
            messageStatus: "sent" as const,
          }));
        });
      }
      setMessagesError(adminSupportError || null);
    }
  }, [
    adminSupportMessages,
    adminSupportError,
    adminSupportConnected,
    selectedKind,
    adminChatIdForSupport,
  ]);

  // Reset messages and loading state when adminChatId changes
  useEffect(() => {
    if (adminChatIdForSupport !== prevAdminChatIdRef.current) {
      if (prevAdminChatIdRef.current !== null) {
        // Chat changed, reset messages and loading state
        setMessages([]);
        setMessagesError(null);
        initialLoadDoneRef.current = false;
        // Set loading when switching chats
        if (
          selectedKind === "admin_support" ||
          selectedKind === "admin_support_chat"
        ) {
          setMessagesLoading(true);
        }
      }
      prevAdminChatIdRef.current = adminChatIdForSupport;
    }
  }, [adminChatIdForSupport, selectedKind]);

  // Update conversation list when chat status changes
  // Only update if the status matches the currently selected conversation
  useEffect(() => {
    if (
      adminChatStatus &&
      selectedKind === "admin_support_chat" &&
      adminChatIdForSupport &&
      selected &&
      selected.kind === "admin_support_chat" &&
      (selected as any).adminChatId === adminChatIdForSupport
    ) {
      // Only update if this status is for the currently selected conversation
      setConversations((prev) =>
        prev.map((conv) => {
          if (
            conv.kind === "admin_support_chat" &&
            (conv as any).adminChatId === adminChatIdForSupport
          ) {
            return {
              ...conv,
              status: adminChatStatus.status,
              unreadCount: adminChatStatus.unreadCountByAdmin || 0,
            };
          }
          return conv;
        })
      );
    }
  }, [adminChatStatus, selectedKind, adminChatIdForSupport, selected]);

  // Reload conversations list when switching between admin support chats
  // This ensures unread counts are accurate for each conversation
  const prevSelectedAdminChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selected && selected.kind === "admin_support_chat" && isAdmin) {
      const currentAdminChatId = (selected as any).adminChatId;
      const prevAdminChatId = prevSelectedAdminChatIdRef.current;

      // If switching between different admin support chats, reload the list
      if (
        prevAdminChatId !== null &&
        currentAdminChatId !== prevAdminChatId &&
        currentAdminChatId
      ) {
        // Reload conversations list to get fresh unread counts
        const reloadList = async () => {
          try {
            const chatsResponse = await adminService.getAllAdminSupportChats(
              adminChatsFilters
            );
            const chatsList = chatsResponse?.data?.chats || [];

            const supportChatItems: ConversationItem[] = chatsList.map(
              (chat: AdminChat) => ({
                kind: "admin_support_chat",
                id: `admin_support_chat_${chat.id}`,
                adminChatId: chat.id,
                userId: chat.user.id,
                title:
                  `${chat.user.firstName} ${chat.user.lastName}`.trim() ||
                  chat.user.email,
                subtitle: chat.lastMessage?.content
                  ? chat.lastMessage.content.substring(0, 50)
                  : `Status: ${chat.status}`,
                unreadCount: chat.unreadCountByAdmin || 0,
                status: chat.status,
              })
            );

            // Update conversations list while preserving other conversation types
            setConversations((prev) => {
              const otherConversations = prev.filter(
                (c) => c.kind !== "admin_support_chat"
              );
              return [...supportChatItems, ...otherConversations];
            });
          } catch (err) {
            console.error("Failed to reload conversations list:", err);
          }
        };

        reloadList();
      }

      prevSelectedAdminChatIdRef.current = currentAdminChatId;
    } else if (
      selected &&
      (selected.kind !== "admin_support_chat" || !isAdmin)
    ) {
      // Reset ref when switching to non-admin-support-chat
      prevSelectedAdminChatIdRef.current = null;
    }
  }, [selected, isAdmin, adminChatsFilters]);

  // Track previous userChatMessages to avoid unnecessary updates
  const prevUserChatMessagesRef = useRef<UserChatMessage[]>([]);
  const prevUserChatIdRef = useRef<string | null>(null);
  const restApiLoadedRef = useRef<boolean>(false);

  // Sync userChatMessages from WebSocket hook into messages state
  useEffect(() => {
    // Only sync if this is a user_chat conversation
    if (
      selectedKind === "user_chat" &&
      selected &&
      selected.kind === "user_chat"
    ) {
      const currentChatId = selected.id;
      const chatIdChanged = prevUserChatIdRef.current !== currentChatId;

      // Reset REST API loaded flag when switching chats
      if (chatIdChanged) {
        restApiLoadedRef.current = false;
      }

      // Check if messages actually changed (by comparing length and IDs)
      const messagesChanged =
        chatIdChanged ||
        userChatMessages.length !== prevUserChatMessagesRef.current.length ||
        userChatMessages.some(
          (msg, idx) => msg.id !== prevUserChatMessagesRef.current[idx]?.id
        );

      // Only update from WebSocket if we have messages from WebSocket and they're different
      // If REST API already loaded messages and WebSocket hasn't loaded yet, keep REST messages
      if (messagesChanged && userChatMessages.length > 0) {
        // Helper to normalize timestamp to ISO string
        const normalizeTimestampToString = (ts: any): string => {
          if (!ts) return new Date().toISOString();
          if (typeof ts === "number") {
            return new Date(ts).toISOString();
          } else if (typeof ts === "string") {
            const parsed = parseFloat(ts);
            if (!isNaN(parsed) && parsed > 0) {
              return new Date(parsed).toISOString();
            }
            const date = new Date(ts);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
          return new Date().toISOString();
        };

        // Convert UserChatMessage to ChatMessage format for display
        const formatted: (ChatMessage & {
          messageStatus?: "sending" | "sent" | "delivered" | "read";
        })[] = userChatMessages.map((msg: UserChatMessage) => ({
          id: msg.id || `${Date.now()}_${Math.random()}`,
          collaborationId: msg.chatId || selected.id,
          content: msg.content || "",
          type: (msg.type || msg.messageType || "text") as any,
          // Use senderId as it's the ID of the user who sent the message
          // userId in UserChatMessage might be one of the two users in the chat, not necessarily the sender
          authorId: msg.senderId || "",
          authorRole: "user",
          attachments: msg.attachments || [],
          replyTo: msg.replyTo || undefined,
          ts: normalizeTimestampToString(msg.ts || msg.createdAt),
          messageStatus: msg.messageStatus || "sent", // Preserve message status from WebSocket
        }));

        // Preserve optimistic messages (with tempId) that haven't been replaced yet
        setMessages((prev) => {
          const optimisticMessages = prev.filter(
            (m) =>
              (m as any).tempId &&
              !formatted.some(
                (f) => f.id === m.id || (f as any).tempId === (m as any).tempId
              )
          );
          // Merge: formatted messages from server + optimistic messages not yet replaced
          const merged = [...formatted, ...optimisticMessages];
          // Sort by timestamp to maintain order
          return merged.sort((a, b) => {
            const tsA = a.ts || (a as any).createdAt || "";
            const tsB = b.ts || (b as any).createdAt || "";
            return tsA.localeCompare(tsB);
          });
        });

        // Update refs
        prevUserChatMessagesRef.current = userChatMessages;
        prevUserChatIdRef.current = currentChatId;

        // Mark that WebSocket has loaded messages (will override REST API messages)
        restApiLoadedRef.current = true;

        // Mark as read when messages are loaded and connected (only once per chat)
        if (userChatConnected && chatIdChanged) {
          markUserChatRead();
        }
      } else if (!userChatMessages || userChatMessages.length === 0) {
        // Only clear messages if REST API also hasn't loaded yet
        // This prevents clearing messages that were loaded from REST API
        if (!restApiLoadedRef.current) {
          setMessages([]);
        }
        if (chatIdChanged) {
          prevUserChatMessagesRef.current = [];
          prevUserChatIdRef.current = currentChatId;
          restApiLoadedRef.current = false;
        }
      }
    } else if (selectedKind !== "user_chat") {
      // Reset refs when switching away from user_chat
      prevUserChatMessagesRef.current = [];
      prevUserChatIdRef.current = null;
    }
    // Don't clear messages for other conversation types - let their own useEffect handle it
  }, [userChatMessages, selectedKind, selected, userChatConnected]);

  // Load initial messages when selection changes
  useEffect(() => {
    if (selectedKind === "collaboration") {
      // Load initial messages for collaboration
      if (selected) {
        loadMessagesForSelected(selected);
      }
    } else if (selectedKind === "user_chat") {
      // For user_chat, messages are loaded via WebSocket (useUserChat hook)
      // Just mark as read via REST API as backup
      if (selected && selected.kind === "user_chat") {
        loadMessagesForSelected(selected); // This will mark as read
      }
    } else if (
      (selectedKind === "admin_support" ||
        selectedKind === "admin_support_chat") &&
      adminChatIdForSupport
    ) {
      // Load admin support messages via REST API
      const loadAdminSupportMessages = async () => {
        try {
          setMessagesLoading(true);
          setMessagesError(null);
          const response = await adminService.getAdminSupportMessages(
            adminChatIdForSupport
          );
          const messagesData = Array.isArray(response?.data)
            ? response.data
            : [];

          // Helper to normalize timestamp to milliseconds number (for consistent comparison)
          // Priority: timestamp (number) > ts (string/number) > createdAt (ISO string)
          const normalizeTimestampToMs = (ts: any, timestamp?: any): number => {
            // Priority 1: Use timestamp field if available (direct number from API)
            if (timestamp !== undefined && timestamp !== null) {
              if (
                typeof timestamp === "number" &&
                timestamp > 0 &&
                !isNaN(timestamp)
              ) {
                return timestamp;
              }
              if (typeof timestamp === "string") {
                const parsed = parseFloat(timestamp);
                if (!isNaN(parsed) && parsed > 0) {
                  return parsed;
                }
              }
            }

            // Priority 2: Use ts field
            if (!ts) return Date.now();

            if (typeof ts === "number") {
              // Already a number (milliseconds)
              return ts > 0 && !isNaN(ts) ? ts : Date.now();
            } else if (typeof ts === "string") {
              // String - check if it's a pure number string (milliseconds)
              // A pure number string should only contain digits and optionally a decimal point
              // ISO strings like "2025-10-31T09:18:27.613Z" contain non-numeric characters
              const isPureNumber = /^-?\d+\.?\d*$/.test(ts.trim());
              if (isPureNumber) {
                const parsed = parseFloat(ts);
                if (!isNaN(parsed) && parsed > 0) {
                  // It's a number string (milliseconds)
                  return parsed;
                }
              }

              // Try to parse as ISO date string or any date format
              const date = new Date(ts);
              const timeMs = date.getTime();
              if (!isNaN(timeMs) && timeMs > 0) {
                return timeMs;
              }
            }
            // Fallback to current time
            return Date.now();
          };

          // Helper to normalize timestamp to ISO string (for display)
          const normalizeTimestampToString = (ts: any): string => {
            const ms = normalizeTimestampToMs(ts);
            return new Date(ms).toISOString();
          };

          // Convert to AdminChatMessage format according to docs
          const formatted: AdminChatMessage[] = messagesData.map((msg: any) => {
            // API now returns: timestamp (number), ts (string), createdAt (ISO string)
            // Priority: timestamp > ts > createdAt
            const timestampMs = normalizeTimestampToMs(
              msg.ts || msg.createdAt,
              msg.timestamp
            );
            const timestampISO = new Date(timestampMs).toISOString();

            return {
              id: msg._id || msg.id || `${Date.now()}_${Math.random()}`,
              adminChatId: adminChatIdForSupport,
              userId: (user as any)?.id || user?.id || "",
              content: msg.content || "",
              type: msg.messageType || msg.type || "text",
              senderId: msg.senderId || msg.adminId || "",
              senderRole: msg.senderRole || "publisher",
              attachments: msg.attachments || [],
              replyTo: msg.replyTo || undefined,
              ts: timestampISO, // Keep ISO string for backward compatibility
              createdAt: timestampISO, // Keep ISO string for backward compatibility
              _timestampMs: timestampMs, // Store milliseconds for comparison (from timestamp field if available)
            };
          });
          setMessages(formatted);

          // Mark initial load as done - REST API has loaded messages
          // We'll compare timestamps directly from prevMessages, no need for ref
          initialLoadDoneRef.current = true;

          if (formatted.length > 0) {
            console.log(
              `[MessagesTab] Loaded ${formatted.length} messages from REST API`,
              {
                firstMessageTime: formatted[0]?.ts || formatted[0]?.createdAt,
                lastMessageTime:
                  formatted[formatted.length - 1]?.ts ||
                  formatted[formatted.length - 1]?.createdAt,
              }
            );
          }
          // Always turn off loading when REST API completes
          // Socket is only for real-time sync, not for initial loading
          setMessagesLoading(false);
        } catch (err) {
          setMessagesError(
            err instanceof Error ? err.message : "Failed to load messages"
          );
          initialLoadDoneRef.current = true;
          // Always turn off loading even on error
          setMessagesLoading(false);
        }
      };
      loadAdminSupportMessages();
    } else {
      setMessages([]);
      setMessagesError(null);
    }
  }, [selected?.id, selected?.kind, adminChatIdForSupport]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100;

      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setAttachmentFiles((prev) => [...prev, ...newFiles]);

    // Convert files to data URLs for preview
    newFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          setAttachmentUrls((prev) => [...prev, url]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle file input click
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle image input click
  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  // Remove attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all attachments
  const handleClearAttachments = () => {
    setAttachmentFiles([]);
    setAttachmentUrls([]);
  };

  // Clear attachments when conversation changes
  useEffect(() => {
    handleClearAttachments();
    setMessageAttachments("");
  }, [selected]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !messageContent.trim()) return;

    // Handle admin_support chat (for both admin_support and admin_support_chat)
    if (
      selected.kind === "admin_support" ||
      selected.kind === "admin_support_chat"
    ) {
      if (!adminChatIdForSupport) {
        alert(
          isAdmin
            ? "Please select a chat from the list to start chatting"
            : "Unable to start chat. Admin chat ID not found. Please refresh and try again."
        );
        return;
      }

      if (!adminSupportConnected) {
        alert("Please wait for connection...");
        return;
      }

      let tempId: string | null = null;
      try {
        setSendingMessage(true);
        const attachments = messageAttachments
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const content = messageContent.trim();
        const now = new Date().toISOString();

        // Create optimistic message with status "sending"
        tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMessage: AdminChatMessage = {
          id: tempId,
          tempId: tempId,
          adminChatId: adminChatIdForSupport,
          userId: (selected as any)?.userId || user?.id || "",
          content: content,
          type: "text",
          senderId: user?.id || "",
          senderRole: (user?.role as any) || "admin",
          attachments: attachments.length > 0 ? attachments : undefined,
          replyTo: replyTo || undefined,
          ts: now,
          createdAt: now,
          messageStatus: "sending",
        };

        // Append optimistic message immediately
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          if (prev.some((m) => (m as AdminChatMessage).tempId === tempId)) {
            return prev;
          }
          return [...prev, optimisticMessage];
        });

        // Clear input immediately
        setMessageContent("");
        setMessageAttachments("");
        handleClearAttachments();
        setReplyTo(null);

        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        // Send via admin support socket
        sendAdminSupport({
          content: content,
          type: "text",
          attachments: attachments.length > 0 ? attachments : undefined,
          replyTo: replyTo || undefined,
        });

        // Optimistic message will be replaced when socket confirms (in onMessage handler)
      } catch (err) {
        console.error("Failed to send message:", err);

        // Remove optimistic message on error
        if (tempId) {
          setMessages((prev) =>
            prev.filter((m) => (m as AdminChatMessage).tempId !== tempId)
          );
        }

        alert(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setSendingMessage(false);
      }
      return;
    }

    // Handle user-to-user chat via WebSocket
    if (selected.kind === "user_chat") {
      if (!userChatConnected) {
        alert("Please wait for connection...");
        return;
      }

      try {
        setSendingMessage(true);

        // Get attachments from files if available, otherwise from text input
        const attachmentUrlsToSend =
          attachmentFiles.length > 0
            ? attachmentUrls.filter((_, idx) => idx < attachmentFiles.length) // Use preview URLs if available
            : messageAttachments
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

        // Create optimistic message
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const now = new Date().toISOString();
        const optimisticMessage: UserChatMessage = {
          id: tempId,
          tempId: tempId,
          chatId: selected.id,
          userId: user?.id || "",
          senderId: user?.id || "",
          content: messageContent.trim(),
          type: "text",
          attachments:
            attachmentUrlsToSend.length > 0 ? attachmentUrlsToSend : undefined,
          replyTo: replyTo || undefined,
          ts: now,
          createdAt: now,
          messageStatus: "sending",
        };

        // Append optimistic message immediately as ChatMessage format for display
        const optimisticChatMessage: ChatMessage & {
          messageStatus?: "sending" | "sent" | "delivered" | "read";
        } = {
          id: tempId,
          collaborationId: selected.id,
          content: optimisticMessage.content,
          type: optimisticMessage.type as any,
          authorId: optimisticMessage.senderId, // Use senderId which is current user's ID
          authorRole: "user",
          attachments: optimisticMessage.attachments || [],
          replyTo: optimisticMessage.replyTo,
          ts:
            optimisticMessage.ts ||
            optimisticMessage.createdAt ||
            new Date().toISOString(),
          messageStatus: optimisticMessage.messageStatus || "sending", // Start with "sending" status
        };

        setMessages((prev) => {
          if (
            prev.some(
              (m) => (m as UserChatMessage).tempId === tempId || m.id === tempId
            )
          ) {
            return prev;
          }
          return [...prev, optimisticChatMessage as any];
        });

        // Clear input immediately
        setMessageContent("");
        setMessageAttachments("");
        handleClearAttachments();
        setReplyTo(null);

        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        // Send via WebSocket
        sendUserChat({
          content: messageContent.trim(),
          type: "text",
          attachments:
            attachmentUrlsToSend.length > 0 ? attachmentUrlsToSend : undefined,
          replyTo: replyTo || undefined,
        });

        // Optimistic message will be replaced when socket confirms
      } catch (err) {
        console.error("Failed to send message:", err);
        alert(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setSendingMessage(false);
      }
      return;
    }

    // Handle collaboration chats
    if (selected.kind !== "collaboration") return;

    if (!connected) {
      alert("Please wait for connection...");
      return;
    }

    try {
      setSendingMessage(true);
      const attachments = messageAttachments
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Send via socket for real-time delivery
      send({
        content: messageContent.trim(),
        type: "text",
        attachments: attachments.length > 0 ? attachments : undefined,
        replyTo: replyTo || undefined,
      });

      // Clear input immediately for better UX
      setMessageContent("");
      setMessageAttachments("");
      handleClearAttachments();
      setReplyTo(null);

      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-300">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div className="text-gray-300">Please login to view messages</div>;
  }

  return (
    <div
      className={`${
        useFullHeight
          ? "h-full max-h-full"
          : "h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)]"
      } flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 overflow-hidden`}
    >
      {/* Mobile toggle */}
      {isMobile && (
        <div className="lg:hidden mb-3 flex-shrink-0">
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-700 w-full">
            <button
              onClick={() => setMobileView("list")}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                mobileView === "list"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Conversations
            </button>
            <button
              onClick={() => setMobileView("chat")}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                mobileView === "chat"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Chat
            </button>
          </div>
        </div>
      )}
      {/* Left Pane: Conversations */}
      <div
        className={`lg:col-span-1 bg-gray-800/60 rounded-xl border border-gray-700 shadow-md flex flex-col ${
          isMobile ? "flex-1 min-h-0" : "h-full max-h-full"
        } overflow-hidden ${isMobile && mobileView !== "list" ? "hidden" : ""}`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <div className="font-semibold text-white">Conversations</div>
          </div>
          {/* Show user search button for all users (to create user-to-user chats) */}
          {(isCreator || isPublisher || isAdmin) && (
            <button
              onClick={() => {
                if (isAdmin) {
                  setShowUserSearch(!showUserSearch);
                } else {
                  setShowChatUserSearch(!showChatUserSearch);
                }
              }}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
              title={
                isAdmin
                  ? "Search users to chat (Admin Support)"
                  : "Start a new chat"
              }
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
            </button>
          )}
        </div>

        {/* User Search Panel for Admin */}
        {isAdmin && showUserSearch && (
          <div className="p-3 border-b border-gray-700 bg-gray-800/80 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowUserSearch(false);
                  setUserSearchQuery("");
                  setUsersList([]);
                }}
                className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Users List */}
            {usersLoading && (
              <div className="text-gray-400 text-xs px-2 py-2">
                Searching users...
              </div>
            )}
            {usersError && (
              <div className="text-red-400 text-xs px-2 py-2">{usersError}</div>
            )}
            {!usersLoading && !usersError && usersList.length > 0 && (
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 mt-2">
                {usersList.map((userItem) => (
                  <button
                    key={userItem._id}
                    onClick={() => createUserConversation(userItem)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-indigo-500/40 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {`${userItem.firstName || ""} ${
                            userItem.lastName || ""
                          }`.trim() || userItem.email}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {userItem.email}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {userItem.role || "User"}
                          {userItem.isActive === false && " • Inactive"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!usersLoading &&
              !usersError &&
              userSearchQuery.trim() &&
              usersList.length === 0 && (
                <div className="text-gray-400 text-xs px-2 py-2">
                  No users found
                </div>
              )}
          </div>
        )}

        {/* User Chat Search Panel for Creator/Publisher */}
        {(isCreator || isPublisher) && showChatUserSearch && (
          <div className="p-3 border-b border-gray-700 bg-gray-800/80 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={chatUserSearchQuery}
                onChange={(e) => setChatUserSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowChatUserSearch(false);
                  setChatUserSearchQuery("");
                  setChatUsersList([]);
                }}
                className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Users List */}
            {chatUsersLoading && (
              <div className="text-gray-400 text-xs px-2 py-2">
                Searching users...
              </div>
            )}
            {!chatUsersLoading && chatUsersList.length > 0 && (
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 mt-2">
                {chatUsersList.map((userItem) => (
                  <button
                    key={userItem._id}
                    onClick={() => createOrGetUserChat(userItem._id)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-indigo-500/40 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {`${userItem.firstName || ""} ${
                            userItem.lastName || ""
                          }`.trim() || userItem.email}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {userItem.email}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {userItem.role || "User"}
                          {userItem.isActive === false && " • Inactive"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!chatUsersLoading &&
              chatUserSearchQuery.trim() &&
              chatUsersList.length === 0 && (
                <div className="text-gray-400 text-xs px-2 py-2">
                  No users found
                </div>
              )}
          </div>
        )}

        <div className="p-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
            <Search className="w-4 h-4" />
            <input
              className="bg-transparent outline-none flex-1 text-sm"
              placeholder={isAdmin ? "Search conversations..." : "Search..."}
              value={isAdmin ? searchInput : ""}
              onChange={(e) => {
                if (isAdmin) {
                  setSearchInput(e.target.value);
                }
              }}
            />
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 mt-2">
              <select
                value={adminChatsFilters.status || ""}
                onChange={(e) => {
                  setAdminChatsFilters((prev) => ({
                    ...prev,
                    status: (e.target.value as any) || undefined,
                    page: 1,
                  }));
                }}
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-0">
          {loadingList && (
            <div className="text-gray-400 text-sm px-2 py-2">
              Loading list...
            </div>
          )}
          {listError && (
            <div className="text-red-400 text-sm px-2 py-2">{listError}</div>
          )}
          {!loadingList && !listError && (
            <div className="space-y-1">
              {sortedConversations.map((c) => (
                <button
                  key={`${c.kind}_${c.id}`}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg border hover:border-indigo-500/40 hover:bg-gray-700/50 transition-colors ${
                    selected && selected.kind === c.kind && selected.id === c.id
                      ? "border-indigo-500/40 bg-gray-700/60"
                      : "border-gray-700"
                  }`}
                >
                  <div className="text-sm font-medium text-white truncate">
                    {c.title}
                  </div>
                  {"subtitle" in c && c.subtitle && (
                    <div className="text-xs text-gray-400 truncate">
                      {c.subtitle}
                    </div>
                  )}
                  {c.kind === "admin_support" && (
                    <div className="text-[10px] text-indigo-300 mt-1">
                      Pinned
                    </div>
                  )}
                  {c.kind === "admin_support_chat" && (
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[10px] text-gray-400">
                        {"status" in c && c.status
                          ? `Status: ${c.status}`
                          : "Support Chat"}
                      </div>
                      {"unreadCount" in c &&
                        c.unreadCount &&
                        c.unreadCount > 0 && (
                          <div className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                            {c.unreadCount}
                          </div>
                        )}
                    </div>
                  )}
                  {c.kind === "user_chat" &&
                    "unreadCount" in c &&
                    c.unreadCount &&
                    c.unreadCount > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-[10px] text-gray-400">
                          User Chat
                        </div>
                        <div className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                          {c.unreadCount}
                        </div>
                      </div>
                    )}
                </button>
              ))}
              {sortedConversations.length === 0 && (
                <div className="text-gray-400 text-sm px-2 py-2">
                  No conversations
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Chat box */}
      <div
        className={`lg:col-span-2 bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6 flex flex-col ${
          isMobile ? "flex-1 min-h-0" : "h-full max-h-full"
        } overflow-hidden ${isMobile && mobileView !== "chat" ? "hidden" : ""}`}
      >
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start chatting
          </div>
        ) : selected.kind === "admin_support" ||
          selected.kind === "admin_support_chat" ? (
          <div className="flex flex-col h-full min-h-0 max-h-full overflow-hidden">
            {/* Connection Status */}
            <div className="mb-3 flex items-center gap-2 text-xs flex-shrink-0">
              {!adminChatIdForSupport ? (
                <>
                  <WifiOff className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">No chat selected</span>
                </>
              ) : adminSupportConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">Connecting...</span>
                </>
              )}
              {adminSupportError && (
                <span className="text-red-400 ml-2">({adminSupportError})</span>
              )}
              {process.env.NODE_ENV === "development" &&
                adminChatIdForSupport && (
                  <span className="text-gray-500 text-[10px] ml-2">
                    Chat ID: {adminChatIdForSupport.substring(0, 8)}...
                  </span>
                )}
              {adminChatStatus &&
                adminChatIdForSupport &&
                selected &&
                selected.kind === "admin_support_chat" &&
                (selected as any).adminChatId === adminChatIdForSupport && (
                  <>
                    <span className="text-gray-400 ml-2 capitalize">
                      Status: {adminChatStatus.status}
                    </span>
                    {!isAdmin && adminChatStatus.unreadCountByUser > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                        {adminChatStatus.unreadCountByUser} unread
                      </span>
                    )}
                    {isAdmin && adminChatStatus.unreadCountByAdmin > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                        {adminChatStatus.unreadCountByAdmin} unread
                      </span>
                    )}
                  </>
                )}
            </div>

            {!adminChatIdForSupport &&
            isAdmin &&
            selected?.kind !== "admin_support_chat" ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Please select a chat from the list to start chatting with a
                user.
              </div>
            ) : !adminChatIdForSupport && !isAdmin ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Unable to load admin support chat. Please refresh the page or
                contact support.
                <div className="text-xs text-red-400 mt-2">
                  Error: Admin Chat ID not found in your account.
                </div>
              </div>
            ) : (
              <>
                {/* Messages Container */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-4 min-h-0"
                >
                  {messagesLoading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                      <div className="text-gray-400 text-sm">
                        Loading messages...
                      </div>
                    </div>
                  ) : messagesError ? (
                    <div className="text-red-400 text-sm">{messagesError}</div>
                  ) : messages.length === 0 ? (
                    <div className="text-gray-400 text-sm">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const adminMsg = msg as AdminChatMessage;
                      const isMine =
                        user?.id &&
                        (adminMsg.senderId === user.id ||
                          (adminMsg.senderRole === user.role &&
                            adminMsg.senderId === user.id));
                      // Priority: ts field first, then createdAt
                      const timestamp =
                        adminMsg.ts ||
                        adminMsg.createdAt ||
                        (adminMsg as any).ts;
                      const createdAt = formatTimestampForDisplay(timestamp);

                      return (
                        <div
                          key={adminMsg.id || idx}
                          className={`flex ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 border ${
                              isMine
                                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-100"
                                : "bg-gray-700/50 border-gray-600 text-gray-100"
                            }`}
                          >
                            {!isMine && (
                              <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                                {adminMsg.senderRole || "User"}
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {adminMsg.content}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="text-[10px] text-gray-400">
                                {createdAt}
                              </div>
                              {isMine && adminMsg.messageStatus && (
                                <div className="flex items-center">
                                  {adminMsg.messageStatus === "sending" && (
                                    <span
                                      className="text-[10px] text-gray-400"
                                      title="Đang gửi"
                                    >
                                      <Clock className="w-3 h-3" />
                                    </span>
                                  )}
                                  {adminMsg.messageStatus === "sent" && (
                                    <span
                                      className="text-[10px] text-gray-400"
                                      title="Đã gửi"
                                    >
                                      <Check className="w-3 h-3" />
                                    </span>
                                  )}
                                  {adminMsg.messageStatus === "delivered" && (
                                    <span
                                      className="text-[10px] text-indigo-400"
                                      title="Đã nhận"
                                    >
                                      <CheckCheck className="w-3 h-3" />
                                    </span>
                                  )}
                                  {adminMsg.messageStatus === "read" && (
                                    <span
                                      className="text-[10px] text-indigo-500"
                                      title="Đã đọc"
                                    >
                                      <CheckCheck className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}

            {/* Message Input Form - Always visible (only if adminChatId available) */}
            {adminChatIdForSupport && (
              <form
                onSubmit={handleSendMessage}
                className="mt-4 space-y-2 flex-shrink-0 w-full min-w-0"
              >
                {replyTo && (
                  <div className="text-xs text-gray-400 flex items-center justify-between bg-gray-700/50 px-2 py-1 rounded">
                    <span>Replying to message</span>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="text-gray-300 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (
                        messageContent.trim() &&
                        !sendingMessage &&
                        adminSupportConnected
                      ) {
                        handleSendMessage(e);
                      }
                    }
                    // Shift+Enter allows new line (default behavior)
                  }}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  disabled={sendingMessage || !adminSupportConnected}
                  className="w-full min-w-0 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:ring-inset disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  rows={3}
                  style={{ boxSizing: "border-box" }}
                />
                {/* Attachment Preview */}
                {attachmentFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachmentFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative inline-flex items-center gap-2 px-2 py-1 bg-gray-700/50 border border-gray-600 rounded-lg text-xs"
                      >
                        {file.type.startsWith("image/") &&
                        attachmentUrls[index] ? (
                          <img
                            src={attachmentUrls[index]}
                            alt={file.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <File className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-gray-300 max-w-[100px] truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                          disabled={sendingMessage || !adminSupportConnected}
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleClearAttachments}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                      disabled={sendingMessage || !adminSupportConnected}
                    >
                      Clear all
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 w-full">
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={sendingMessage || !adminSupportConnected}
                      accept="*/*"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={sendingMessage || !adminSupportConnected}
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={handleFileButtonClick}
                      disabled={sendingMessage || !adminSupportConnected}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Upload file"
                    >
                      <Paperclip className="w-4 h-4 text-gray-400 hover:text-indigo-400" />
                    </button>
                    <button
                      type="button"
                      onClick={handleImageButtonClick}
                      disabled={sendingMessage || !adminSupportConnected}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Upload image"
                    >
                      <Image className="w-4 h-4 text-gray-400 hover:text-indigo-400" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      sendingMessage ||
                      !messageContent.trim() ||
                      !adminSupportConnected
                    }
                    className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? "Sending..." : "Send"}
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (adminChatStatus?.status === "resolved") {
                            reopen("Reopened by admin");
                          } else {
                            markResolved("Resolved by admin");
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          adminChatStatus?.status === "resolved"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-600 hover:bg-gray-700 text-white"
                        }`}
                      >
                        {adminChatStatus?.status === "resolved"
                          ? "Reopen"
                          : "Resolve"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : selected.kind === "admin_report" ? (
          <div className="space-y-3">
            <div className="text-white font-semibold">Report Details</div>
            <div className="text-sm text-gray-300">
              Admin can manage reports in Admin Management. This view lists
              reports as conversations for quick access.
            </div>
            <div className="text-xs text-gray-400">
              Report ID: {selected.id}
            </div>
          </div>
        ) : selected.kind === "user_chat" ? (
          <div className="flex flex-col h-full min-h-0 max-h-full overflow-hidden">
            {/* Connection Status */}
            <div className="mb-3 flex items-center gap-2 text-xs flex-shrink-0">
              {userChatConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">Connecting...</span>
                </>
              )}
              {userChatError && (
                <span className="text-red-400 ml-2">({userChatError})</span>
              )}
            </div>
            {/* Messages Container */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-4 min-h-0 overflow-hidden"
            >
              {messagesLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                  <div className="text-gray-400 text-sm">
                    Loading messages...
                  </div>
                </div>
              ) : messagesError ? (
                <div className="text-red-400 text-sm">{messagesError}</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const chatMsg = msg as ChatMessage;
                  // For user chat, check if senderId matches current user
                  // Also handle UserChatMessage format where senderId is directly available
                  const msgSenderId =
                    (msg as UserChatMessage).senderId || chatMsg.authorId;
                  const isMine =
                    user?.id &&
                    (msgSenderId === user.id || chatMsg.authorId === user.id);
                  // Priority: ts field first, then createdAt
                  const timestamp =
                    chatMsg.ts || (msg as any).createdAt || (msg as any).ts;
                  const createdAt = formatTimestampForDisplay(timestamp);

                  return (
                    <div
                      key={chatMsg.id || idx}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 border ${
                          isMine
                            ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-100"
                            : "bg-gray-700/50 border-gray-600 text-gray-100"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {chatMsg.content}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="text-[10px] text-gray-400">
                            {createdAt}
                          </div>
                          {isMine && (msg as any).messageStatus && (
                            <div className="flex items-center">
                              {(msg as any).messageStatus === "sending" && (
                                <span
                                  className="text-[10px] text-gray-400"
                                  title="Đang gửi"
                                >
                                  <Clock className="w-3 h-3" />
                                </span>
                              )}
                              {(msg as any).messageStatus === "sent" && (
                                <span
                                  className="text-[10px] text-gray-400"
                                  title="Đã gửi"
                                >
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                              {(msg as any).messageStatus === "delivered" && (
                                <span
                                  className="text-[10px] text-indigo-400"
                                  title="Đã nhận"
                                >
                                  <CheckCheck className="w-3 h-3" />
                                </span>
                              )}
                              {(msg as any).messageStatus === "read" && (
                                <span
                                  className="text-[10px] text-indigo-500"
                                  title="Đã đọc"
                                >
                                  <CheckCheck className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="mt-4 space-y-2 flex-shrink-0 px-0"
            >
              {replyTo && (
                <div className="text-xs text-gray-400 flex items-center justify-between bg-gray-700/50 px-2 py-1 rounded">
                  <span>Replying to message</span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (messageContent.trim() && !sendingMessage) {
                      handleSendMessage(e);
                    }
                    // Shift+Enter allows new line (default behavior)
                  }
                }}
                placeholder={
                  userChatConnected
                    ? "Type your message... (Enter to send, Shift+Enter for new line)"
                    : "Connecting..."
                }
                disabled={sendingMessage || !userChatConnected}
                className="w-full min-w-0 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:ring-inset disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                rows={3}
                style={{ boxSizing: "border-box" }}
              />
              {/* Attachment Preview */}
              {attachmentFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachmentFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative inline-flex items-center gap-2 px-2 py-1 bg-gray-700/50 border border-gray-600 rounded-lg text-xs"
                    >
                      {file.type.startsWith("image/") &&
                      attachmentUrls[index] ? (
                        <img
                          src={attachmentUrls[index]}
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <File className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-gray-300 max-w-[100px] truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                        disabled={sendingMessage}
                      >
                        <X className="w-3 h-3 text-gray-400 hover:text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearAttachments}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                    disabled={sendingMessage}
                  >
                    Clear all
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={sendingMessage}
                    accept="*/*"
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={sendingMessage}
                    accept="image/*"
                  />
                  <button
                    type="button"
                    onClick={handleFileButtonClick}
                    disabled={sendingMessage || !userChatConnected}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload file"
                  >
                    <Paperclip className="w-4 h-4 text-gray-400 hover:text-indigo-400" />
                  </button>
                  <button
                    type="button"
                    onClick={handleImageButtonClick}
                    disabled={sendingMessage || !userChatConnected}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload image"
                  >
                    <Image className="w-4 h-4 text-gray-400 hover:text-indigo-400" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={
                    sendingMessage ||
                    !messageContent.trim() ||
                    !userChatConnected
                  }
                  className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-0 max-h-full overflow-hidden">
            {/* Connection Status */}
            {selected?.kind === "collaboration" && (
              <div className="mb-3 flex items-center gap-2 text-xs flex-shrink-0">
                {connected ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400">Connecting...</span>
                  </>
                )}
                {rtError && (
                  <span className="text-red-400 ml-2">({rtError})</span>
                )}
              </div>
            )}

            {/* Messages Container */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-0"
            >
              {messagesLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                  <div className="text-gray-400 text-sm">
                    Loading messages...
                  </div>
                </div>
              ) : messagesError ? (
                <div className="text-red-400 text-sm">{messagesError}</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  // Check if message is from current user
                  // Handle both ChatMessage (authorId, authorRole) and AdminChatMessage (senderId, senderRole)
                  const chatMsg = msg as ChatMessage;
                  const adminMsg = msg as AdminChatMessage;
                  const authorId =
                    "authorId" in chatMsg
                      ? chatMsg.authorId
                      : adminMsg.senderId;
                  const authorRole =
                    "authorRole" in chatMsg
                      ? chatMsg.authorRole
                      : adminMsg.senderRole;

                  const isMine =
                    user?.id &&
                    (authorId === user.id || authorRole === user.role);
                  // Priority: ts field first, then createdAt
                  const timestamp =
                    msg.ts || (msg as any).createdAt || (msg as any).ts;
                  const createdAt = formatTimestampForDisplay(timestamp);

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 border ${
                          isMine
                            ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-100"
                            : "bg-gray-700/50 border-gray-600 text-gray-100"
                        }`}
                      >
                        {!isMine && (
                          <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                            {authorRole || "User"}
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                        {Array.isArray(msg.attachments) &&
                          msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((url: string, i: number) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-300 hover:text-indigo-200 underline"
                                >
                                  Attachment {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                          <span>{createdAt}</span>
                          {selected?.kind === "collaboration" && (
                            <button
                              onClick={() => setReplyTo(msg.id)}
                              className="hover:text-indigo-300"
                            >
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="mt-4 space-y-2 flex-shrink-0 px-0"
            >
              {replyTo && (
                <div className="text-xs text-gray-400 flex items-center justify-between bg-gray-700/50 px-2 py-1 rounded">
                  <span>Replying to message</span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (messageContent.trim() && !sendingMessage && connected) {
                      handleSendMessage(e);
                    }
                    // Shift+Enter allows new line (default behavior)
                  }
                }}
                placeholder={
                  connected
                    ? "Type your message... (Enter to send, Shift+Enter for new line)"
                    : "Connecting..."
                }
                disabled={!connected || sendingMessage}
                className="w-full min-w-0 px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                rows={3}
                style={{ boxSizing: "border-box" }}
              />
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={messageAttachments}
                  onChange={(e) => setMessageAttachments(e.target.value)}
                  placeholder="Attachment URLs (comma-separated)"
                  disabled={!connected || sendingMessage}
                  className="flex-1 px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={
                    sendingMessage || !messageContent.trim() || !connected
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
