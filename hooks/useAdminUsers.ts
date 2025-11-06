import { useState, useEffect, useCallback } from "react";
import {
  adminService,
  AdminUser,
  AdminUsersFilters,
  AdminUserStats,
} from "../services/adminService";

export const useAdminUsers = (initialFilters: AdminUsersFilters = {}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userStats, setUserStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  // Load users with filters
  const fetchUsers = useCallback(async (filters: AdminUsersFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getUsers(filters);
      setUsers(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user stats
  const fetchUserStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getUserStats();
      setUserStats(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch user stats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user by ID
  const fetchUserById = useCallback(
    async (userId: string): Promise<AdminUser | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminService.getUserById(userId);
        return response.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update user
  const updateUser = useCallback(
    async (
      userId: string,
      data: {
        firstName?: string;
        lastName?: string;
        role?: "creator" | "publisher";
        isActive?: boolean;
      }
    ): Promise<AdminUser | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminService.updateUser(userId, data);

        // Update local state
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user._id === userId ? response.data : user))
        );

        return response.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update user");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete user
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminService.deleteUser(userId);

      // Remove from local state
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchUsers(initialFilters);
    fetchUserStats();
  }, [fetchUsers, fetchUserStats]);

  return {
    users,
    userStats,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchUserStats,
    fetchUserById,
    updateUser,
    deleteUser,
    refetch: () => fetchUsers(initialFilters),
  };
};
