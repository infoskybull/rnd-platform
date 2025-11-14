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
import { useAdminReports } from "../hooks/useAdminReports";
import MessagesTab from "./dashboard/MessagesTab";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type TabType = "account-management" | "messages" | "reports";

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
    updateUser,
    deleteUser,
    refetch: refetchUsers,
  } = useAdminUsers();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    role: "creator" | "publisher";
    isActive: boolean;
  } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
      label: "Accounts",
      icon: Users,
    },
    { id: "chat" as TabType, label: "Messages", icon: MessageCircle },
    { id: "reports" as TabType, label: "Reports", icon: BarChart3 },
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

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Users</h3>
                {usersLoading && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                  </div>
                )}
              </div>

              {usersError ? (
                <div className="p-6 text-red-400 text-sm">{usersError}</div>
              ) : (
                <>
                  {/* Desktop/Tablet Table */}
                  <div className="hidden sm:block overflow-x-scroll w-full xs:max-w-full sm:max-w-[calc(100vw-306px)]">
                    <table className="min-w-full table-fixed divide-y divide-gray-700">
                      <thead className="bg-gray-800/70">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[16rem] md:w-[12rem] lg:w-[16rem]">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[18rem] md:w-[14rem] lg:w-[20rem]">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Active
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                            Auth Providers
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                            2FA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Last Login
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900 divide-y divide-gray-700">
                        {users.map((u) => {
                          const fullName =
                            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                            "-";
                          const providers = Array.isArray(u.authProviders)
                            ? u.authProviders.join(", ")
                            : "-";
                          const created = u.createdAt
                            ? new Date(u.createdAt).toLocaleString()
                            : "-";
                          const lastLogin = u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString()
                            : "-";
                          return (
                            <tr key={u._id} className="hover:bg-gray-800/60">
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-white max-w-[16rem] md:max-w-[12rem] lg:max-w-[16rem] truncate">
                                {fullName}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 max-w-[18rem] md:max-w-[14rem] lg:max-w-[20rem] truncate">
                                {u.email}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm">
                                <RoleBadge role={u.role as any} size="sm" />
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    u.isActive
                                      ? "bg-green-600/30 text-green-300"
                                      : "bg-gray-600/30 text-gray-300"
                                  }`}
                                >
                                  {u.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 hidden lg:table-cell">
                                {providers}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm hidden lg:table-cell">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    u.is2FAEnabled
                                      ? "bg-blue-600/30 text-blue-300"
                                      : "bg-gray-600/30 text-gray-300"
                                  }`}
                                >
                                  {u.is2FAEnabled ? "Enabled" : "Disabled"}
                                </span>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 hidden lg:table-cell">
                                {created}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                {lastLogin}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-right hidden md:table-cell">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingUserId(u._id);
                                      setEditForm({
                                        firstName: u.firstName || "",
                                        lastName: u.lastName || "",
                                        role:
                                          (u.role as any) === "publisher"
                                            ? "publisher"
                                            : "creator",
                                        isActive: !!u.isActive,
                                      });
                                    }}
                                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-white"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setDeletingUserId(u._id);
                                    }}
                                    className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 rounded border border-red-600 text-white"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!usersLoading && users.length === 0 && (
                          <tr>
                            <td
                              className="px-6 py-6 text-center text-sm text-gray-400"
                              colSpan={8}
                            >
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="block sm:hidden divide-y divide-gray-800">
                    {users.map((u) => {
                      const fullName =
                        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                        "-";
                      const providers = Array.isArray(u.authProviders)
                        ? u.authProviders.join(", ")
                        : "-";
                      const created = u.createdAt
                        ? new Date(u.createdAt).toLocaleString()
                        : "-";
                      const lastLogin = u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString()
                        : "-";
                      return (
                        <div key={u._id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-white font-medium">
                              {fullName}
                            </div>
                            <RoleBadge role={u.role as any} size="sm" />
                          </div>
                          <div className="mt-2 text-sm text-gray-300">
                            {u.email}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded ${
                                u.isActive
                                  ? "bg-green-600/30 text-green-300"
                                  : "bg-gray-600/30 text-gray-300"
                              }`}
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                u.is2FAEnabled
                                  ? "bg-blue-600/30 text-blue-300"
                                  : "bg-gray-600/30 text-gray-300"
                              }`}
                            >
                              2FA: {u.is2FAEnabled ? "On" : "Off"}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-400">
                            Providers: {providers}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Created: {created}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Last Login: {lastLogin}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingUserId(u._id);
                                setEditForm({
                                  firstName: u.firstName || "",
                                  lastName: u.lastName || "",
                                  role:
                                    (u.role as any) === "publisher"
                                      ? "publisher"
                                      : "creator",
                                  isActive: !!u.isActive,
                                });
                              }}
                              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                setDeletingUserId(u._id);
                              }}
                              className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 rounded border border-red-600 text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {!usersLoading && users.length === 0 && (
                      <div className="p-6 text-center text-sm text-gray-400">
                        No users found.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case "messages":
        return <MessagesTab useFullHeight />;
      case "reports":
        // Reports management UI for Admin
        return <ReportsManagement />;
      default:
        return null;
    }
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
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
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
          {/* Edit User Modal */}
          {editingUserId && editForm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setEditingUserId(null)}
              />
              <div className="relative z-50 w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Edit User
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      First name
                    </label>
                    <input
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Last name
                    </label>
                    <input
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          role: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                      <option value="creator">Creator</option>
                      <option value="publisher">Publisher</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Active
                    </label>
                    <select
                      value={editForm.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isActive: e.target.value === "true",
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingUserId(null)}
                    className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editForm) return;
                      await updateUser(editingUserId, editForm);
                      await refetchUsers();
                      setEditingUserId(null);
                    }}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded border border-indigo-500 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirm Modal */}
          {deletingUserId && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setDeletingUserId(null)}
              />
              <div className="relative z-50 w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Delete user?
                </h4>
                <p className="text-sm text-gray-300 mb-5">
                  This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDeletingUserId(null)}
                    className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await deleteUser(deletingUserId);
                      await refetchUsers();
                      setDeletingUserId(null);
                    }}
                    className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 rounded border border-red-600 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
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
                {/* Desktop/Tablet: sidebar stays fixed/open; no collapse toggle */}
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
              activeTab === "messages" ? "h-full p-4 sm:p-6" : "p-4 sm:p-6"
            }
          >
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

// ===== Reports Management Sub-component =====
const ReportsManagement: React.FC = () => {
  const {
    reports,
    loading,
    error,
    pagination,
    filters,
    fetchReports,
    updateReport,
    deleteReport,
  } = useAdminReports({ page: 1, limit: 20 });

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              fetchReports({
                status: (e.target.value || undefined) as any,
                page: 1,
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={filters.type || ""}
            onChange={(e) =>
              fetchReports({
                type: (e.target.value || undefined) as any,
                page: 1,
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="">All Types</option>
            <option value="message">Message</option>
            <option value="user">User</option>
            <option value="project">Project</option>
          </select>
          <select
            value={filters.reportedByRole || ""}
            onChange={(e) =>
              fetchReports({
                reportedByRole: (e.target.value || undefined) as any,
                page: 1,
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="">All Reporters</option>
            <option value="creator">Creator</option>
            <option value="publisher">Publisher</option>
          </select>
          <input
            type="text"
            placeholder="Search reason/admin notes..."
            defaultValue={filters.search || ""}
            onChange={(e) => {
              const value = e.target.value;
              // simple debounce via timeout per keystroke is omitted for brevity
              fetchReports({ search: value || undefined, page: 1 });
            }}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          />
        </div>

        <div className="overflow-x-auto border border-gray-700 rounded-lg">
          {error && <div className="p-4 text-red-400 text-sm">{error}</div>}
          <table className="hidden sm:table min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {reports.map((r) => (
                <tr key={r._id} className="hover:bg-gray-800/60">
                  <td className="px-4 py-3 text-sm text-gray-200">{r.type}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusChip status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <PriorityChip priority={r.priority || null} />
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-gray-300 truncate max-w-[280px]"
                    title={r.reason}
                  >
                    {r.reason}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {r.reportedByRole}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {r.type === "message" && r.messageId
                      ? `Collab ${r.collaborationId?.slice(0, 6)}... / Msg ${
                          r.messageId
                        }`
                      : r.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <ReportActions
                      report={r}
                      onUpdate={updateReport}
                      onDelete={deleteReport}
                    />
                  </td>
                </tr>
              ))}
              {!loading && reports.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-gray-400"
                    colSpan={7}
                  >
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {loading && (
            <div className="p-4 text-gray-300 text-sm">Loading...</div>
          )}

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-800">
            {reports.map((r) => (
              <div key={r._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium capitalize">
                    {r.type}
                  </div>
                  <StatusChip status={r.status} />
                </div>
                <div className="mt-1">
                  <PriorityChip priority={r.priority || null} />
                </div>
                <div
                  className="mt-2 text-sm text-gray-300 truncate"
                  title={r.reason}
                >
                  {r.reason}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Reporter: {r.reportedByRole}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Target:{" "}
                  {r.type === "message" && r.messageId
                    ? `Collab ${r.collaborationId?.slice(0, 6)}... / Msg ${
                        r.messageId
                      }`
                    : r.type}
                </div>
                <div className="mt-3">
                  <ReportActions
                    report={r}
                    onUpdate={updateReport}
                    onDelete={deleteReport}
                  />
                </div>
              </div>
            ))}
            {!loading && reports.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">
                No reports found.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-300">
          <div>
            Page {pagination.page} / {pagination.totalPages} —{" "}
            {pagination.total} items
          </div>
          <div className="space-x-2">
            <button
              onClick={() =>
                pagination.page > 1 &&
                fetchReports({ page: (pagination.page - 1) as number })
              }
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600"
              disabled={pagination.page <= 1}
            >
              Prev
            </button>
            <button
              onClick={() =>
                pagination.page < pagination.totalPages &&
                fetchReports({ page: (pagination.page + 1) as number })
              }
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600"
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusChip: React.FC<{
  status: "open" | "in_review" | "resolved" | "dismissed";
}> = ({ status }) => {
  const color =
    status === "open"
      ? "bg-gray-600/30 text-gray-300"
      : status === "in_review"
      ? "bg-blue-600/30 text-blue-300"
      : status === "resolved"
      ? "bg-green-600/30 text-green-300"
      : "bg-red-600/30 text-red-300";
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {status}
    </span>
  );
};

const PriorityChip: React.FC<{
  priority: "low" | "medium" | "high" | null;
}> = ({ priority }) => {
  if (!priority) return <span className="text-xs text-gray-400">-</span>;
  const color =
    priority === "low"
      ? "bg-gray-600/30 text-gray-300"
      : priority === "medium"
      ? "bg-yellow-600/30 text-yellow-300"
      : "bg-red-600/30 text-red-300";
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {priority}
    </span>
  );
};

const ReportActions: React.FC<{
  report: any;
  onUpdate: (
    id: string,
    data: Partial<{
      status: string;
      adminNotes: string;
      assignedAdminId: string;
      priority: any;
    }>
  ) => Promise<any>;
  onDelete: (id: string) => Promise<boolean>;
}> = ({ report, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center justify-end space-x-2">
      <select
        value={report.status}
        onChange={async (e) => {
          await onUpdate(report._id, { status: e.target.value });
        }}
        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white"
      >
        <option value="open">Open</option>
        <option value="in_review">In Review</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
      </select>
      <select
        value={report.priority || ""}
        onChange={async (e) => {
          await onUpdate(report._id, { priority: e.target.value || null });
        }}
        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white"
      >
        <option value="">Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button
        onClick={async () => {
          const notes = window.prompt("Admin notes", report.adminNotes || "");
          if (notes !== null) {
            await onUpdate(report._id, { adminNotes: notes });
          }
        }}
        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-xs"
      >
        Notes
      </button>
      <button
        onClick={async () => {
          if (window.confirm("Delete this report?")) {
            await onDelete(report._id);
          }
        }}
        className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded border border-red-600 text-xs"
      >
        Delete
      </button>
    </div>
  );
};
