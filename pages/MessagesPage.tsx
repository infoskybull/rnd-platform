import React, { useEffect, useMemo, useState } from "react";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";
import adminService from "../services/adminService";
import { MessageSquare, Search, AlertCircle } from "lucide-react";

type ConversationItem =
  | { kind: "admin_support"; id: "admin_support"; title: string }
  | { kind: "collaboration"; id: string; title: string; subtitle?: string }
  | { kind: "admin_report"; id: string; title: string; subtitle?: string };

const MessagesPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConversationItem | null>(null);

  // Chat pane state (for collaboration chats)
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState<string>("");
  const [messageAttachments, setMessageAttachments] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const isCreator = user?.role === "creator";
  const isPublisher = user?.role === "publisher";

  const sortedConversations = useMemo(() => {
    // Ensure Admin Support stays on top for creator/publisher
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
          // Admin: show reports as threads
          const resp = await adminService.getReports({});
          const items: ConversationItem[] = (resp?.data || []).map(
            (r: any) => ({
              kind: "admin_report",
              id: r._id,
              title: `Report: ${r.type?.toUpperCase?.() || r.type} (${
                r.status
              })`,
              subtitle: r.reason,
            })
          );
          setConversations(items);
          setSelected(items[0] || null);
        } else if (isCreator) {
          const list = await apiService.getDeveloperCollaborations();
          const items: ConversationItem[] = (list?.data || list || []).map(
            (c: any) => ({
              kind: "collaboration",
              id: c._id || c.id,
              title: c.project?.title || "Collaboration",
              subtitle: c.status ? `Status: ${c.status}` : undefined,
            })
          );
          setConversations(items);
          setSelected({
            kind: "admin_support",
            id: "admin_support",
            title: "Admin Support",
          });
        } else if (isPublisher) {
          const list = await apiService.getPublisherCollaborations();
          const items: ConversationItem[] = (list?.data || list || []).map(
            (c: any) => ({
              kind: "collaboration",
              id: c._id || c.id,
              title: c.project?.title || "Collaboration",
              subtitle: c.status ? `Status: ${c.status}` : undefined,
            })
          );
          setConversations(items);
          setSelected({
            kind: "admin_support",
            id: "admin_support",
            title: "Admin Support",
          });
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
  }, [isAdmin, isCreator, isPublisher, isAuthenticated, isLoading, user]);

  const loadMessagesForSelected = async (item: ConversationItem | null) => {
    if (!item) return;
    if (item.kind !== "collaboration") {
      setMessages([]);
      setMessagesError(null);
      return;
    }
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      const data = await apiService.getCollaborationMessages(item.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : "Failed to load messages"
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadMessagesForSelected(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.kind]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selected ||
      selected.kind !== "collaboration" ||
      !messageContent.trim()
    )
      return;
    try {
      setSendingMessage(true);
      const attachments = messageAttachments
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await apiService.sendCollaborationMessage(selected.id, {
        content: messageContent.trim(),
        type: "text",
        attachments,
        replyTo: replyTo || undefined,
      });
      setMessageContent("");
      setMessageAttachments("");
      setReplyTo(null);
      await loadMessagesForSelected(selected);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = () => logout();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-300">Please login to view messages</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Pane: Conversations */}
          <div className="lg:col-span-1 bg-gray-800/60 rounded-xl border border-gray-700 shadow-md">
            <div className="p-4 border-b border-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <div className="font-semibold text-white">Conversations</div>
            </div>
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                <Search className="w-4 h-4" />
                <input
                  className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="Search..."
                />
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-2 custom-scrollbar">
              {loadingList && (
                <div className="text-gray-400 text-sm px-2 py-2">
                  Loading list...
                </div>
              )}
              {listError && (
                <div className="text-red-400 text-sm px-2 py-2">
                  {listError}
                </div>
              )}
              {!loadingList && !listError && (
                <div className="space-y-1">
                  {sortedConversations.map((c) => (
                    <button
                      key={`${c.kind}_${c.id}`}
                      onClick={() => setSelected(c)}
                      className={`w-full text-left px-3 py-2 rounded-lg border hover:border-indigo-500/40 hover:bg-gray-700/50 transition-colors ${
                        selected &&
                        selected.kind === c.kind &&
                        selected.id === c.id
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
          <div className="lg:col-span-2 bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
            {!selected ? (
              <div className="h-full min-h-[50vh] flex items-center justify-center text-gray-400">
                Select a conversation to start chatting
              </div>
            ) : selected.kind === "admin_support" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-300">
                  <AlertCircle className="w-4 h-4" />
                  <div className="text-sm">
                    Admin Support chat will be available soon. For now, please
                    use collaboration chats or submit a report on a message if
                    needed.
                  </div>
                </div>
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
            ) : (
              <div className="flex flex-col h-full min-h-[50vh]">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {messagesLoading ? (
                    <div className="text-gray-400 text-sm">
                      Loading messages...
                    </div>
                  ) : messagesError ? (
                    <div className="text-red-400 text-sm">{messagesError}</div>
                  ) : messages.length === 0 ? (
                    <div className="text-gray-400 text-sm">
                      No messages yet.
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMine = user?.role && msg.authorType === user.role;
                      const createdAt = msg.createdAt
                        ? new Date(msg.createdAt).toLocaleString()
                        : "";
                      return (
                        <div
                          key={msg._id || msg.id || idx}
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
                            <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                              {msg.authorType}
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </div>
                            {Array.isArray(msg.attachments) &&
                              msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map(
                                    (url: string, i: number) => (
                                      <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-300 hover:text-indigo-200 underline"
                                      >
                                        Attachment {i + 1}
                                      </a>
                                    )
                                  )}
                                </div>
                              )}
                            <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                              <span>{createdAt}</span>
                              <button
                                onClick={() =>
                                  setReplyTo(msg._id || msg.id || `${idx}`)
                                }
                                className="hover:text-indigo-300"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="mt-4 space-y-2">
                  {replyTo && (
                    <div className="text-xs text-gray-400 flex items-center justify-between">
                      <span>Replying to: {replyTo}</span>
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
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  />
                  <input
                    type="text"
                    value={messageAttachments}
                    onChange={(e) => setMessageAttachments(e.target.value)}
                    placeholder="Attachment URLs (comma-separated)"
                    className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={sendingMessage || !messageContent.trim()}
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
      </div>
    </div>
  );
};

export default MessagesPage;
