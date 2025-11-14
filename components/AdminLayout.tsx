import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "../types";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import { Menu, X, Users, MessageCircle, BarChart3, Shield } from "lucide-react";

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

type TabType = "accounts" | "messages" | "reports";

const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  onLogout,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from current route
  const getActiveTab = (): TabType => {
    if (location.pathname.includes("/admin/messages")) return "messages";
    if (location.pathname.includes("/admin/reports")) return "reports";
    return "accounts";
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      id: "accounts" as TabType,
      label: "Accounts",
      icon: Users,
      path: "/admin/accounts",
    },
    { id: "messages" as TabType, label: "Messages", icon: MessageCircle, path: "/admin/messages" },
    { id: "reports" as TabType, label: "Reports", icon: BarChart3, path: "/admin/reports" },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar - Desktop/Tablet */}
      <div
        className="hidden md:flex md:flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300"
        style={{ width: 256 }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <RnDLogo size={32} />
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              )}
            </div>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          {!sidebarCollapsed && (
            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <RoleBadge role={user.role || "admin"} size="sm" />
                </div>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
          >
            {!sidebarCollapsed ? "Log Out" : "Out"}
          </button>
        </div>
      </div>

      {/* Sidebar - Mobile Off-canvas */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <RnDLogo size={28} />
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto pt-4">
              <button
                onClick={onLogout}
                className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                  Admin <span className="text-indigo-400">Management</span>
                </h2>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    Welcome,{" "}
                    <span className="font-medium text-white">{user.name}</span>
                  </p>
                  <div className="flex items-center justify-end space-x-2 text-xs text-gray-400">
                    <span>{user.email}</span>
                    <RoleBadge role={user.role || "admin"} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          className={
            activeTab === "messages"
              ? "flex-1 overflow-hidden"
              : "flex-1 overflow-y-auto dark-scrollbar"
          }
        >
          <main
            className={
              activeTab === "messages"
                ? "h-full p-4 sm:p-6"
                : "p-4 sm:p-6"
            }
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

