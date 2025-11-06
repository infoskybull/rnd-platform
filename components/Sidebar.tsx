import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";
import {
  Gamepad2,
  Package,
  FileText,
  BarChart3,
  Settings,
  History,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

export type TabType =
  | "browse-games"
  | "inventory"
  | "collaborations"
  | "contracts"
  | "stats"
  | "settings"
  | "your-projects"
  | "history";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface SidebarProps {
  userRole: "publisher" | "creator";
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  // Handle tab change with navigation
  const handleTabChange = (tab: TabType) => {
    const basePath =
      userRole === "publisher" ? "/dashboard/publisher" : "/dashboard/creator";
    navigate(`${basePath}/${tab}`);
    onTabChange(tab);
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Force collapsed state on mobile, and use context state on desktop
  const effectiveCollapsed = isMobile || sidebarCollapsed;
  // Add custom scrollbar styles for sidebar
  useEffect(() => {
    const styleId = "sidebar-scrollbar-styles";
    const existingStyle = document.getElementById(styleId);

    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .sidebar-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(107, 114, 128, 0.3) rgba(31, 41, 55, 0.1);
      }
      
      .sidebar-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      
      .sidebar-scrollbar::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.1);
        border-radius: 2px;
      }
      
      .sidebar-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.3);
        border-radius: 2px;
        transition: background-color 0.2s ease;
      }
      
      .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
      }
      
      .sidebar-scrollbar::-webkit-scrollbar-corner {
        background: rgba(31, 41, 55, 0.1);
      }
    `;

    document.head.appendChild(style);

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  const publisherTabs: TabConfig[] = [
    {
      id: "browse-games",
      label: "Browse Games",
      icon: <Gamepad2 className="w-5 h-5" />,
      description: "Discover and purchase games",
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: <Package className="w-5 h-5" />,
      description: "Manage your purchased games",
    },
    {
      id: "collaborations",
      label: "Collaborations",
      icon: <Users className="w-5 h-5" />,
      description: "Manage creator collaborations",
    },
    {
      id: "contracts",
      label: "Contracts",
      icon: <FileText className="w-5 h-5" />,
      description: "View and manage contracts",
    },
    {
      id: "stats",
      label: "Stats",
      icon: <BarChart3 className="w-5 h-5" />,
      description: "Analytics and performance",
    },
    {
      id: "history",
      label: "History",
      icon: <History className="w-5 h-5" />,
      description: "View your activity history",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      description: "Account and preferences",
    },
  ];

  const developerTabs: TabConfig[] = [
    {
      id: "your-projects",
      label: "Your Projects",
      icon: <FolderOpen className="w-5 h-5" />,
      description: "Manage your game projects",
    },
    {
      id: "collaborations",
      label: "Collaborations",
      icon: <Users className="w-5 h-5" />,
      description: "Manage publisher collaborations",
    },
    {
      id: "contracts",
      label: "Contracts",
      icon: <FileText className="w-5 h-5" />,
      description: "View and manage contracts",
    },
    {
      id: "stats",
      label: "Stats",
      icon: <BarChart3 className="w-5 h-5" />,
      description: "Analytics and performance",
    },
    {
      id: "history",
      label: "History",
      icon: <History className="w-5 h-5" />,
      description: "View your activity history",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      description: "Account and preferences",
    },
  ];

  const tabs = userRole === "publisher" ? publisherTabs : developerTabs;

  return (
    <div
      className={`bg-gray-800 border-r border-gray-700 h-full flex flex-col transition-all duration-300 ${
        effectiveCollapsed ? "w-16" : "w-64"
      }`}
      style={{
        minWidth: effectiveCollapsed ? "64px" : "256px",
        maxWidth: effectiveCollapsed ? "64px" : "256px",
        width: effectiveCollapsed ? "64px" : "256px",
      }}
    >
      {/* Header */}
      <div className={`p-4 ${effectiveCollapsed ? "flex justify-center" : ""}`}>
        {!effectiveCollapsed ? (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">
              {userRole === "publisher" ? "Publisher" : "Creator"} Dashboard
            </h2>
            <p className="text-sm text-gray-400">
              {userRole === "publisher"
                ? "Manage your game marketplace"
                : "Manage your game projects"}
            </p>
          </div>
        ) : (
          // Placeholder avatar/gift for collapsed state
          <div className="flex justify-center items-center">
            <div className="relative">
              {/* Animated gift icon */}
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white text-sm font-bold">
                  {userRole === "publisher" ? "P" : "D"}
                </span>
              </div>
              {/* Sparkle animation */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              <div
                className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        className={`flex-1 ${
          !effectiveCollapsed ? "overflow-y-auto sidebar-scrollbar" : ""
        } px-2`}
      >
        <nav className="pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center ${
                effectiveCollapsed
                  ? "justify-center px-3 py-3 mb-1"
                  : "px-3 py-3 mb-1 text-left"
              } rounded-lg transition-all duration-200 group relative ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              title={
                effectiveCollapsed
                  ? `${tab.label} - ${tab.description}`
                  : undefined
              }
            >
              <div
                className={`transition-colors ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-400 group-hover:text-white"
                } ${effectiveCollapsed ? "" : "mr-3"}`}
              >
                {tab.icon}
              </div>
              {!effectiveCollapsed && (
                <div className="flex-1">
                  <div className="font-medium">{tab.label}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      activeTab === tab.id
                        ? "text-indigo-100"
                        : "text-gray-500 group-hover:text-gray-300"
                    }`}
                  >
                    {tab.description}
                  </div>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {effectiveCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-300">{tab.description}</div>
                  {/* Arrow */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Toggle Button at Bottom - Only show on desktop */}
      {!isMobile && (
        <div
          className={`p-4 border-t border-gray-700 ${
            effectiveCollapsed ? "flex justify-center" : ""
          }`}
        >
          <button
            onClick={toggleSidebar}
            className={`p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200 ${
              effectiveCollapsed ? "w-full" : "w-full"
            }`}
            title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveCollapsed ? (
              <ChevronRight className="w-4 h-4 mx-auto" />
            ) : (
              <ChevronLeft className="w-4 h-4 mx-auto" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
