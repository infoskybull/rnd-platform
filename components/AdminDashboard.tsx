import React, { useState } from "react";
import { User } from "../types";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import {
  Menu,
  X,
  Users,
  MessageCircle,
  BarChart3,
  Shield,
  Loader2,
} from "lucide-react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminAnalytics } from "../hooks/useAdminAnalytics";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type TabType = "account-management" | "chat" | "reports";

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>("account-management");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load admin data
  const {
    users,
    userStats,
    loading: usersLoading,
    error: usersError,
  } = useAdminUsers();

  const {
    dashboardData,
    systemOverview,
    projectsStats,
    collaborationsStats,
    revenueStats,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAdminAnalytics();

  const tabs = [
    {
      id: "account-management" as TabType,
      label: "Account Management",
      icon: Users,
    },
    { id: "chat" as TabType, label: "Chat with Users", icon: MessageCircle },
    { id: "reports" as TabType, label: "System Reports", icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "account-management":
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                Account Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <div className="text-gray-400 text-sm mb-2">
                    Total Creators
                  </div>
                  <div className="text-3xl font-bold text-green-400">
                    {usersLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      userStats?.totalCreators || 0
                    )}
                  </div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <div className="text-gray-400 text-sm mb-2">
                    Total Publishers
                  </div>
                  <div className="text-3xl font-bold text-blue-400">
                    {usersLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      userStats?.totalPublishers || 0
                    )}
                  </div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <div className="text-gray-400 text-sm mb-2">Total Users</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {usersLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      userStats?.totalUsers || 0
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-400">
                View and manage all Creator and Publisher accounts here.
              </p>
            </div>
          </div>
        );
      case "chat":
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                Chat with Users
              </h2>
              <p className="text-gray-400">
                Communicate with Creators and Publishers directly.
              </p>
            </div>
          </div>
        );
      case "reports":
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                System Reports
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Platform Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Projects</span>
                      <span className="text-white font-medium">
                        {analyticsLoading
                          ? "-"
                          : systemOverview?.totalProjects || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        Active Collaborations
                      </span>
                      <span className="text-white font-medium">
                        {analyticsLoading
                          ? "-"
                          : systemOverview?.activeCollaborations || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Users</span>
                      <span className="text-white font-medium">
                        {analyticsLoading
                          ? "-"
                          : systemOverview?.totalUsers || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Revenue Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Revenue</span>
                      <span className="text-white font-medium">
                        $
                        {analyticsLoading
                          ? "0"
                          : (
                              systemOverview?.totalRevenue ||
                              revenueStats?.totalRevenue ||
                              0
                            ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Transaction</span>
                      <span className="text-white font-medium">
                        $
                        {analyticsLoading
                          ? "0"
                          : (
                              revenueStats?.averageTransactionValue || 0
                            ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
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
                  onClick={() => setActiveTab(tab.id)}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="sm:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
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
        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <main className="p-4 sm:p-6">{renderTabContent()}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
