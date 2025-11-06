import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Send, Bot, X, Minimize2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatBubbleProps {
  className?: string;
}

const AIChatBubble: React.FC<AIChatBubbleProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant for the RnD Game Marketplace. I can help you discover amazing games, answer questions about our platform, or guide you through the marketplace. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI responses for different queries
  const aiResponses = [
    "That's a great question! Our marketplace features games from indie developers to AAA studios. What type of games are you most interested in?",
    "I'd be happy to help you find the perfect game! Are you looking for action, adventure, puzzle, or strategy games?",
    "Our platform offers a wide variety of games. You can browse by genre, price, or popularity. What catches your interest?",
    "Great choice! Many of our games offer free demos so you can try before you buy. Would you like me to show you some popular options?",
    "I can help you discover games based on your preferences. Are you looking for single-player experiences or multiplayer games?",
    "Our marketplace is constantly updated with new releases. Would you like to see the latest additions or trending games?",
    "That sounds exciting! Our community of developers creates amazing content. What platform are you planning to play on?",
    "I'm here to help you navigate our marketplace. You can also check out our featured games section for curated recommendations!",
    "Looking for something specific? I can help you find games by genre, price range, or even by the type of experience you're seeking!",
    "Our top-rated games are always a great place to start! Would you like to know about our most popular titles?",
  ];

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Animation for opening/closing chat
  useEffect(() => {
    if (chatRef.current) {
      if (isOpen) {
        gsap.fromTo(
          chatRef.current,
          { scale: 0, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" }
        );
      } else {
        gsap.to(chatRef.current, {
          scale: 0,
          opacity: 0,
          y: 20,
          duration: 0.2,
          ease: "power2.in",
        });
      }
    }
  }, [isOpen]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("game") || lowerMessage.includes("play")) {
      return aiResponses[0];
    } else if (lowerMessage.includes("help") || lowerMessage.includes("what")) {
      return aiResponses[1];
    } else if (
      lowerMessage.includes("browse") ||
      lowerMessage.includes("find")
    ) {
      return aiResponses[2];
    } else if (lowerMessage.includes("demo") || lowerMessage.includes("try")) {
      return aiResponses[3];
    } else if (
      lowerMessage.includes("multiplayer") ||
      lowerMessage.includes("single")
    ) {
      return aiResponses[4];
    } else if (
      lowerMessage.includes("new") ||
      lowerMessage.includes("latest")
    ) {
      return aiResponses[5];
    } else if (
      lowerMessage.includes("creator") ||
      lowerMessage.includes("create")
    ) {
      return aiResponses[6];
    } else {
      return aiResponses[Math.floor(Math.random() * aiResponses.length)];
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(userMessage.text),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${className}`}
    >
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 hover-effect"
        >
          <Bot className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          className={`bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isMinimized ? "w-72 sm:w-80 h-16" : "w-72 sm:w-80 h-96 sm:h-[28rem]"
          }`}
        >
          {/* Chat Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  AI Assistant
                </h3>
                <p className="text-indigo-200 text-xs">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={minimizeChat}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={closeChat}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 h-60 sm:h-80 overflow-y-auto space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.isUser
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-100"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-100 p-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-4 py-2 border-t border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setInputValue("What are the best games?")}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors"
                  >
                    Best Games
                  </button>
                  <button
                    onClick={() => setInputValue("Show me free games")}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors"
                  >
                    Free Games
                  </button>
                  <button
                    onClick={() => setInputValue("New releases")}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors"
                  >
                    New Releases
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about games..."
                    className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors hover-effect"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIChatBubble;
