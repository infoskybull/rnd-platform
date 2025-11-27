import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import { generateGameCodeStream } from "../services/geminiService";

interface CreatorUseAIPageProps {
  user: User;
  onLogout: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isGenerating?: boolean;
}

const INITIAL_HTML_PLACEHOLDER = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Preview</title>
    <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #ffffff; color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; text-align: center; }
        .container { padding: 2rem; }
        h1 { color: #111827; font-size: 1.8rem; margin-bottom: 1rem; }
        p { font-size: 1rem; max-width: 400px; margin: 0 auto; line-height: 1.5; color: #6b7280; }
        .logo { font-size: 2.5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
          <svg class="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h1>AI Game Generator</h1>
        <p>Describe the game you want to create in the chat, and watch it come to life here!</p>
    </div>
</body>
</html>`;

const CreatorUseAIPage: React.FC<CreatorUseAIPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "fullscreen">(
    "preview"
  );
  const [projectName, setProjectName] = useState("Project name");
  const [isEditingName, setIsEditingName] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant. Describe a game you'd like to create, and I'll generate the code for you!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [generatedCode, setGeneratedCode] = useState<string>(
    INITIAL_HTML_PLACEHOLDER
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerationComplete, setIsGenerationComplete] =
    useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [originalText, setOriginalText] = useState<string>("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const shouldCancelGenerationRef = useRef<boolean>(false);
  const justCancelledRef = useRef<boolean>(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessageId]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const messageText = textToSend || inputValue.trim();
      if (!messageText || isLoading) return;

      // Cancel any ongoing generation
      shouldCancelGenerationRef.current = true;
      isGeneratingRef.current = false;

      // Wait a bit for the previous generation to stop
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Reset cancel flag for new generation
      shouldCancelGenerationRef.current = false;
      isGeneratingRef.current = true;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      if (!textToSend) {
        setInputValue("");
      }
      // Reset code and preview to initial state
      setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
      setIsLoading(true);
      setError(null);
      setIsGenerationComplete(false);

      // Add a loading message for AI response
      const loadingMessageId = (Date.now() + 1).toString();
      const loadingMessage: ChatMessage = {
        id: loadingMessageId,
        text: "",
        isUser: false,
        timestamp: new Date(),
        isGenerating: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      try {
        // Clear code before starting new generation
        setGeneratedCode("");
        let fullResponse = "";
        // Use the streaming service
        await generateGameCodeStream(userMessage.text, (chunk) => {
          // Check if generation should be cancelled
          if (shouldCancelGenerationRef.current) {
            return;
          }

          // Append chunks as they arrive
          fullResponse += chunk;
          setGeneratedCode((prevCode) => prevCode + chunk);

          // Update the loading message with progress
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessageId
                ? {
                    ...msg,
                    text: `Generating code... (${fullResponse.length} characters)`,
                    isGenerating: true,
                  }
                : msg
            )
          );
        });

        // Check if generation was cancelled
        if (shouldCancelGenerationRef.current) {
          // Remove the loading message and reset to placeholder
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== loadingMessageId)
          );
          setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
          setIsLoading(false);
          isGeneratingRef.current = false;
          return;
        }

        // Mark generation as complete
        setIsGenerationComplete(true);
        isGeneratingRef.current = false;

        // Update the loading message with final response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  text: "I've generated the game code for you! Check the preview panel to see it in action.",
                  isGenerating: false,
                }
              : msg
          )
        );

        // Switch to preview tab to show the generated game
        setActiveTab("preview");
      } catch (e) {
        // Check if generation was cancelled
        if (shouldCancelGenerationRef.current) {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== loadingMessageId)
          );
          setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
          setIsLoading(false);
          isGeneratingRef.current = false;
          return;
        }

        const errorMessage =
          e instanceof Error ? e.message : "An unknown error occurred.";
        setError(
          `Failed to generate game. ${errorMessage}. Please check your API key and try again.`
        );

        // Update the loading message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  text: `Sorry, I encountered an error: ${errorMessage}`,
                  isGenerating: false,
                }
              : msg
          )
        );

        // Reset to placeholder
        setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
        console.error(e);
        isGeneratingRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading]
  );

  const handleEditMessage = (messageId: string, currentText: string) => {
    // Cancel any ongoing generation when starting to edit
    if (isGeneratingRef.current) {
      shouldCancelGenerationRef.current = true;
      // Remove any loading messages
      setMessages((prev) => prev.filter((msg) => !msg.isGenerating));
      setIsLoading(false);
      isGeneratingRef.current = false;
    }

    setEditingMessageId(messageId);
    setEditingText(currentText);
    setOriginalText(currentText); // Save original text for cancel
  };

  const handleCancelEdit = () => {
    // Set flag to prevent immediate re-edit
    justCancelledRef.current = true;

    // Restore original text if message exists
    if (editingMessageId) {
      // Always restore to original text, even if originalText is empty
      const textToRestore = originalText || "";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessageId ? { ...msg, text: textToRestore } : msg
        )
      );
    }
    // Reset editing state
    setEditingMessageId(null);
    setEditingText("");
    setOriginalText("");

    // Reset flag after a short delay to allow click event to complete
    // This prevents the Edit button from being triggered immediately after Cancel
    setTimeout(() => {
      justCancelledRef.current = false;
    }, 200);
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editingText.trim() || !editingMessageId) return;

    // Cancel any ongoing generation
    shouldCancelGenerationRef.current = true;
    isGeneratingRef.current = false;

    // Wait a bit for the previous generation to stop
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Reset cancel flag for new generation
    shouldCancelGenerationRef.current = false;
    isGeneratingRef.current = true;

    // Find the index of the message being edited
    const editIndex = messages.findIndex((msg) => msg.id === editingMessageId);
    if (editIndex === -1) return;

    // Update the message text
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === editingMessageId ? { ...msg, text: editingText.trim() } : msg
      )
    );

    // Remove all messages after the edited message (including AI responses)
    setMessages((prev) => prev.slice(0, editIndex + 1));

    // Reset editing state
    setEditingMessageId(null);
    const textToResubmit = editingText.trim();
    setEditingText("");

    // Resubmit the edited message
    // Reset code and preview to initial state first
    setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
    setIsLoading(true);
    setError(null);
    setIsGenerationComplete(false);

    // Add a loading message for AI response
    const loadingMessageId = (Date.now() + 1).toString();
    const loadingMessage: ChatMessage = {
      id: loadingMessageId,
      text: "",
      isUser: false,
      timestamp: new Date(),
      isGenerating: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Clear code before starting new generation
      setGeneratedCode("");
      let fullResponse = "";
      // Use the streaming service
      await generateGameCodeStream(textToResubmit, (chunk) => {
        // Check if generation should be cancelled
        if (shouldCancelGenerationRef.current) {
          return;
        }

        // Append chunks as they arrive
        fullResponse += chunk;
        setGeneratedCode((prevCode) => prevCode + chunk);

        // Update the loading message with progress
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  text: `Generating code... (${fullResponse.length} characters)`,
                  isGenerating: true,
                }
              : msg
          )
        );
      });

      // Check if generation was cancelled
      if (shouldCancelGenerationRef.current) {
        // Remove the loading message and reset to placeholder
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== loadingMessageId)
        );
        setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
        setIsLoading(false);
        isGeneratingRef.current = false;
        return;
      }

      // Mark generation as complete
      setIsGenerationComplete(true);
      isGeneratingRef.current = false;

      // Update the loading message with final response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                text: "I've generated the game code for you! Check the preview panel to see it in action.",
                isGenerating: false,
              }
            : msg
        )
      );

      // Switch to preview tab to show the generated game
      setActiveTab("preview");
    } catch (e) {
      // Check if generation was cancelled
      if (shouldCancelGenerationRef.current) {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== loadingMessageId)
        );
        setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
        setIsLoading(false);
        isGeneratingRef.current = false;
        return;
      }

      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(
        `Failed to generate game. ${errorMessage}. Please check your API key and try again.`
      );

      // Update the loading message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                text: `Sorry, I encountered an error: ${errorMessage}`,
                isGenerating: false,
              }
            : msg
        )
      );

      // Reset to placeholder
      setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
      console.error(e);
      isGeneratingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [editingText, editingMessageId, messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToStart = () => {
    setMessages([
      {
        id: "1",
        text: "Hello! I'm your AI assistant. Describe a game you'd like to create, and I'll generate the code for you!",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setGeneratedCode(INITIAL_HTML_PLACEHOLDER);
    setInputValue("");
    setError(null);
    setIsGenerationComplete(false);
    setUploadedFiles([]);
    setActiveTab("preview");
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...fileArray]);

      // Show preview or notification
      const fileNames = fileArray.map((f) => f.name).join(", ");
      const fileMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `Uploaded: ${fileNames}`,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fileMessage]);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="w-full bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              {/* Logo placeholder */}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/dashboard/creator/dashboard")}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => navigate("/dashboard/creator/use-ai")}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Use A.I
              </button>
              <button
                onClick={() => navigate("/create-project")}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload
              </button>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Right Side - Icons */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                150
              </span>
            </div>
            <div className="relative">
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                150
              </span>
            </div>
            <div className="relative">
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                150
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer">
              {/* User profile placeholder */}
            </div>
          </div>
        </div>
      </div>

      {/* Project Name Header - Above both panels */}
      <div className="w-full px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <button
          onClick={handleBackToStart}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to start
        </button>

        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingName(false);
              }}
              className="text-base font-semibold text-gray-900 border-b border-blue-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <>
              <h2 className="text-base font-semibold text-gray-900">
                {projectName}
              </h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 21C3.71667 21 3.47933 20.904 3.288 20.712C3.09667 20.52 3.00067 20.2827 3 20V17.575C3 17.3083 3.05 17.054 3.15 16.812C3.25 16.57 3.39167 16.3577 3.575 16.175L16.2 3.575C16.4 3.39167 16.621 3.25 16.863 3.15C17.105 3.05 17.359 3 17.625 3C17.891 3 18.1493 3.05 18.4 3.15C18.6507 3.25 18.8673 3.4 19.05 3.6L20.425 5C20.625 5.18333 20.7707 5.4 20.862 5.65C20.9533 5.9 20.9993 6.15 21 6.4C21 6.66667 20.954 6.921 20.862 7.163C20.77 7.405 20.6243 7.62567 20.425 7.825L7.825 20.425C7.64167 20.6083 7.429 20.75 7.187 20.85C6.945 20.95 6.691 21 6.425 21H4ZM17.6 7.8L19 6.4L17.6 5L16.2 6.4L17.6 7.8Z"
                    fill="#757575"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.83333 24.5C5.19167 24.5 4.64256 24.2717 4.186 23.8152C3.72944 23.3586 3.50078 22.8091 3.5 22.1667V5.83333C3.5 5.19167 3.72867 4.64256 4.186 4.186C4.64333 3.72944 5.19244 3.50078 5.83333 3.5H18.8708C19.1819 3.5 19.4787 3.55833 19.761 3.675C20.0433 3.79167 20.2911 3.95694 20.5042 4.17083L23.8292 7.49583C24.0431 7.70972 24.2083 7.95783 24.325 8.24017C24.4417 8.5225 24.5 8.81883 24.5 9.12917V22.1667C24.5 22.8083 24.2717 23.3578 23.8152 23.8152C23.3586 24.2725 22.8091 24.5008 22.1667 24.5H5.83333ZM22.1667 9.15833L18.8417 5.83333H5.83333V22.1667H22.1667V9.15833ZM14 21C14.9722 21 15.7986 20.6597 16.4792 19.9792C17.1597 19.2986 17.5 18.4722 17.5 17.5C17.5 16.5278 17.1597 15.7014 16.4792 15.0208C15.7986 14.3403 14.9722 14 14 14C13.0278 14 12.2014 14.3403 11.5208 15.0208C10.8403 15.7014 10.5 16.5278 10.5 17.5C10.5 18.4722 10.8403 19.2986 11.5208 19.9792C12.2014 20.6597 13.0278 21 14 21ZM8.16667 11.6667H16.3333C16.6639 11.6667 16.9412 11.5547 17.1652 11.3307C17.3892 11.1067 17.5008 10.8298 17.5 10.5V8.16667C17.5 7.83611 17.388 7.55922 17.164 7.336C16.94 7.11278 16.6631 7.00078 16.3333 7H8.16667C7.83611 7 7.55922 7.112 7.336 7.336C7.11278 7.56 7.00078 7.83689 7 8.16667V10.5C7 10.8306 7.112 11.1078 7.336 11.3318C7.56 11.5558 7.83689 11.6674 8.16667 11.6667ZM5.83333 9.15833V22.1667V5.83333V9.15833Z"
                fill="#757575"
              />
            </svg>
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg
              width="31"
              height="31"
              viewBox="0 0 31 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.4998 20.1178C15.3276 20.1178 15.1662 20.0911 15.0155 20.0377C14.8648 19.9843 14.7248 19.8926 14.5957 19.7626L9.94567 15.1126C9.68734 14.8543 9.56334 14.5529 9.57367 14.2084C9.584 13.864 9.708 13.5626 9.94567 13.3043C10.204 13.0459 10.511 12.9116 10.8666 12.9013C11.2223 12.8909 11.5288 13.0145 11.7863 13.272L14.2082 15.6938V6.45842C14.2082 6.09245 14.3322 5.78589 14.5802 5.53875C14.8282 5.29161 15.1347 5.16761 15.4998 5.16675C15.8649 5.16589 16.1719 5.28989 16.4208 5.53875C16.6697 5.78761 16.7932 6.09417 16.7915 6.45842V15.6938L19.2134 13.272C19.4717 13.0136 19.7787 12.8896 20.1343 12.9C20.49 12.9103 20.7965 13.0451 21.054 13.3043C21.2908 13.5626 21.4148 13.864 21.426 14.2084C21.4372 14.5529 21.3132 14.8543 21.054 15.1126L16.404 19.7626C16.2748 19.8918 16.1349 19.9835 15.9842 20.0377C15.8335 20.092 15.6721 20.1187 15.4998 20.1178ZM7.74984 25.8334C7.03942 25.8334 6.43148 25.5807 5.926 25.0752C5.42053 24.5697 5.16737 23.9614 5.1665 23.2501V20.6668C5.1665 20.3008 5.2905 19.9942 5.5385 19.7471C5.7865 19.4999 6.09306 19.3759 6.45817 19.3751C6.82328 19.3742 7.13027 19.4982 7.37913 19.7471C7.62799 19.9959 7.75156 20.3025 7.74984 20.6668V23.2501H23.2498V20.6668C23.2498 20.3008 23.3738 19.9942 23.6218 19.7471C23.8698 19.4999 24.1764 19.3759 24.5415 19.3751C24.9066 19.3742 25.2136 19.4982 25.4625 19.7471C25.7113 19.9959 25.8349 20.3025 25.8332 20.6668V23.2501C25.8332 23.9605 25.5804 24.5689 25.075 25.0752C24.5695 25.5815 23.9611 25.8343 23.2498 25.8334H7.74984Z"
                fill="#757575"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Section - AI Chat */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.isUser ? "justify-end" : ""
                }`}
              >
                {!message.isUser && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(message.text);
                        // Show success feedback
                        setCopiedMessageId(message.id);
                        // Reset after 2 seconds
                        setTimeout(() => {
                          setCopiedMessageId(null);
                        }, 2000);
                      } catch (err) {
                        console.error("Failed to copy:", err);
                      }
                    }}
                    className={`p-1 rounded flex-shrink-0 transition-all duration-200 ${
                      copiedMessageId === message.id
                        ? "text-green-600 bg-green-50"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title={copiedMessageId === message.id ? "Copied!" : "Copy"}
                  >
                    {copiedMessageId === message.id ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M0 8.66709C0 7.76535 0.358213 6.90055 0.995837 6.26293C1.63346 5.6253 2.49826 5.26709 3.4 5.26709H5.605V7.26709H3.4C3.0287 7.26709 2.6726 7.41459 2.41005 7.67714C2.1475 7.93969 2 8.29579 2 8.66709V15.8671C2 16.2384 2.1475 16.5945 2.41005 16.857C2.6726 17.1196 3.0287 17.2671 3.4 17.2671H10.6C10.9713 17.2671 11.3274 17.1196 11.5899 16.857C11.8525 16.5945 12 16.2384 12 15.8671V14.0671H14V15.8671C14 16.7688 13.6418 17.6336 13.0042 18.2713C12.3665 18.9089 11.5017 19.2671 10.6 19.2671H3.4C2.49826 19.2671 1.63346 18.9089 0.995837 18.2713C0.358213 17.6336 0 16.7688 0 15.8671V8.66709Z"
                          fill="currentColor"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M8 0H16C17.0609 0 18.0783 0.421427 18.8284 1.17157C19.5786 1.92172 20 2.93913 20 4V12C20 13.0609 19.5786 14.0783 18.8284 14.8284C18.0783 15.5786 17.0609 16 16 16H8C6.93913 16 5.92172 15.5786 5.17157 14.8284C4.42143 14.0783 4 13.0609 4 12V4C4 2.93913 4.42143 1.92172 5.17157 1.17157C5.92172 0.421427 6.93913 0 8 0ZM8 2C7.46957 2 6.96086 2.21071 6.58579 2.58579C6.21071 2.96086 6 3.46957 6 4V12C6 12.5304 6.21071 13.0391 6.58579 13.4142C6.96086 13.7893 7.46957 14 8 14H16C16.5304 14 17.0391 13.7893 17.4142 13.4142C17.7893 13.0391 18 12.5304 18 12V4C18 3.46957 17.7893 2.96086 17.4142 2.58579C17.0391 2.21071 16.5304 2 16 2H8Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                )}
                <div
                  className={`flex-1 ${
                    message.isUser ? "flex justify-end" : ""
                  }`}
                >
                  <div className="max-w-md">
                    {!message.isUser && (
                      <div className="text-xs text-gray-500 mb-1">
                        A.I reply
                      </div>
                    )}
                    {message.isUser && (
                      <div className="text-xs text-gray-500 mb-1 text-right">
                        Prompt{" "}
                        {messages.filter((m) => m.isUser).indexOf(message) + 1}
                      </div>
                    )}
                    {message.isUser && editingMessageId === message.id ? (
                      <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              handleCancelEdit();
                            }
                          }}
                          className="w-full bg-transparent border-none outline-none text-gray-800"
                        />
                      </div>
                    ) : (
                      <div
                        className={`rounded-lg p-3 ${
                          message.isUser
                            ? "bg-gray-200 text-gray-800"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        {message.isGenerating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>{message.text || "Generating..."}</span>
                          </div>
                        ) : (
                          <div>{message.text}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {message.isUser && (
                  <div className="flex items-center gap-1">
                    {editingMessageId === message.id ? (
                      <>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSaveEdit();
                          }}
                          className="p-1 text-green-600 hover:text-green-700 rounded flex-shrink-0"
                          title="Save"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCancelEdit();
                          }}
                          className="p-1 text-red-600 hover:text-red-700 rounded flex-shrink-0"
                          title="Cancel"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(message.text);
                              // Show success feedback
                              setCopiedMessageId(message.id);
                              // Reset after 2 seconds
                              setTimeout(() => {
                                setCopiedMessageId(null);
                              }, 2000);
                            } catch (err) {
                              console.error("Failed to copy:", err);
                            }
                          }}
                          className={`p-1 rounded flex-shrink-0 transition-all duration-200 ${
                            copiedMessageId === message.id
                              ? "text-green-600 bg-green-50"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title={
                            copiedMessageId === message.id ? "Copied!" : "Copy"
                          }
                        >
                          {copiedMessageId === message.id ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clipRule="evenodd"
                                d="M0 8.66709C0 7.76535 0.358213 6.90055 0.995837 6.26293C1.63346 5.6253 2.49826 5.26709 3.4 5.26709H5.605V7.26709H3.4C3.0287 7.26709 2.6726 7.41459 2.41005 7.67714C2.1475 7.93969 2 8.29579 2 8.66709V15.8671C2 16.2384 2.1475 16.5945 2.41005 16.857C2.6726 17.1196 3.0287 17.2671 3.4 17.2671H10.6C10.9713 17.2671 11.3274 17.1196 11.5899 16.857C11.8525 16.5945 12 16.2384 12 15.8671V14.0671H14V15.8671C14 16.7688 13.6418 17.6336 13.0042 18.2713C12.3665 18.9089 11.5017 19.2671 10.6 19.2671H3.4C2.49826 19.2671 1.63346 18.9089 0.995837 18.2713C0.358213 17.6336 0 16.7688 0 15.8671V8.66709Z"
                                fill="currentColor"
                              />
                              <path
                                fill-rule="evenodd"
                                clipRule="evenodd"
                                d="M8 0H16C17.0609 0 18.0783 0.421427 18.8284 1.17157C19.5786 1.92172 20 2.93913 20 4V12C20 13.0609 19.5786 14.0783 18.8284 14.8284C18.0783 15.5786 17.0609 16 16 16H8C6.93913 16 5.92172 15.5786 5.17157 14.8284C4.42143 14.0783 4 13.0609 4 12V4C4 2.93913 4.42143 1.92172 5.17157 1.17157C5.92172 0.421427 6.93913 0 8 0ZM8 2C7.46957 2 6.96086 2.21071 6.58579 2.58579C6.21071 2.96086 6 3.46957 6 4V12C6 12.5304 6.21071 13.0391 6.58579 13.4142C6.96086 13.7893 7.46957 14 8 14H16C16.5304 14 17.0391 13.7893 17.4142 13.4142C17.7893 13.0391 18 12.5304 18 12V4C18 3.46957 17.7893 2.96086 17.4142 2.58579C17.0391 2.21071 16.5304 2 16 2H8Z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            // Prevent edit if we just cancelled (to avoid accidental re-edit)
                            if (justCancelledRef.current) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            handleEditMessage(message.id, message.text);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0"
                          title="Edit"
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4 21C3.71667 21 3.47933 20.904 3.288 20.712C3.09667 20.52 3.00067 20.2827 3 20V17.575C3 17.3083 3.05 17.054 3.15 16.812C3.25 16.57 3.39167 16.3577 3.575 16.175L16.2 3.575C16.4 3.39167 16.621 3.25 16.863 3.15C17.105 3.05 17.359 3 17.625 3C17.891 3 18.1493 3.05 18.4 3.15C18.6507 3.25 18.8673 3.4 19.05 3.6L20.425 5C20.625 5.18333 20.7707 5.4 20.862 5.65C20.9533 5.9 20.9993 6.15 21 6.4C21 6.66667 20.954 6.921 20.862 7.163C20.77 7.405 20.6243 7.62567 20.425 7.825L7.825 20.425C7.64167 20.6083 7.429 20.75 7.187 20.85C6.945 20.95 6.691 21 6.425 21H4ZM17.6 7.8L19 6.4L17.6 5L16.2 6.4L17.6 7.8Z"
                              fill="black"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,*/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleFileButtonClick}
                disabled={isLoading}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                type="button"
                title="Upload file or image"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <input
                type="text"
                placeholder="+ Ask anything"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400"
              />
              <button
                onClick={() => inputValue.trim() && handleSendMessage()}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : inputValue.trim() ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => {
                        setUploadedFiles((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-blue-700 hover:text-blue-900"
                      type="button"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Preview */}
        <div className="w-1/2 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "preview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "code"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab("fullscreen")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "fullscreen"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Full screen
            </button>
          </div>

          {/* Preview Area */}
          <div className="flex-1 p-6 bg-white overflow-auto">
            {activeTab === "preview" && (
              <div className="w-full h-full">
                {isLoading && !generatedCode ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 font-semibold">
                        Generating your game...
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        This might take a moment.
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                      <h3 className="font-bold text-red-800 mb-2">
                        Generation Failed
                      </h3>
                      <p className="text-red-600 text-sm break-words">
                        {error}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-white rounded-lg border border-gray-300 shadow-sm aspect-[9/16] overflow-hidden">
                      <iframe
                        srcDoc={generatedCode || INITIAL_HTML_PLACEHOLDER}
                        title="Game Preview"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "code" && (
              <div className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      Generated Code
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>HTML/CSS/JS</span>
                      <span>{generatedCode.length} chars</span>
                      <span>{generatedCode.split("\n").length} lines</span>
                    </div>
                  </div>
                </div>
                <div className="flex-grow overflow-auto p-6 bg-white">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                    <code>{generatedCode || INITIAL_HTML_PLACEHOLDER}</code>
                  </pre>
                </div>
              </div>
            )}
            {activeTab === "fullscreen" && (
              <div className="w-full h-full">
                <iframe
                  srcDoc={generatedCode || INITIAL_HTML_PLACEHOLDER}
                  title="Game Preview Fullscreen"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorUseAIPage;
