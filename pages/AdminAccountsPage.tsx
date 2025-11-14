import React, { useState, useEffect, useRef } from "react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import RoleBadge from "../components/RoleBadge";
import { Loader2 } from "lucide-react";

const AdminAccountsPage: React.FC = () => {
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
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [hideHorizontalScrollbar, setHideHorizontalScrollbar] = useState(false);

  // Check if horizontal scrollbar should be hidden
  useEffect(() => {
    const checkScrollbar = () => {
      if (tableContainerRef.current) {
        const element = tableContainerRef.current;
        const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
        setHideHorizontalScrollbar(!hasHorizontalScroll);
      }
    };

    checkScrollbar();
    window.addEventListener("resize", checkScrollbar);
    
    // Also check after a short delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkScrollbar, 100);

    return () => {
      window.removeEventListener("resize", checkScrollbar);
      clearTimeout(timeoutId);
    };
  }, [users]);

  return (
    <div className="w-full">
      {/* Edit User Modal */}
      {editingUserId && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                <label className="block text-xs text-gray-400 mb-1">Role</label>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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

      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            Account Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <div className="text-gray-400 text-sm mb-2">Total Creators</div>
              <div className="text-3xl font-bold text-green-400">
                {usersLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  userStats?.totalCreators || 0
                )}
              </div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <div className="text-gray-400 text-sm mb-2">Total Publishers</div>
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
              <div
                ref={tableContainerRef}
                className={`hidden sm:block w-full xs:max-w-full sm:max-w-[calc(100vw-306px)] ${
                  hideHorizontalScrollbar ? "overflow-x-hidden" : "overflow-x-scroll"
                } overflow-y-auto`}
              >
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
                          colSpan={9}
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
                    `${u.firstName || ""} ${u.lastName || ""}`.trim() || "-";
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
                        <div className="text-white font-medium">{fullName}</div>
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
    </div>
  );
};

export default AdminAccountsPage;

