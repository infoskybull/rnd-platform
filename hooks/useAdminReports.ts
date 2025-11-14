import { useState, useCallback, useEffect } from "react";
import {
  adminService,
  AdminReport,
  AdminReportsFilters,
  AdminReportsResponse,
} from "../services/adminService";

export const useAdminReports = (initialFilters: AdminReportsFilters = {}) => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters] = useState<AdminReportsFilters>(initialFilters);

  const fetchReports = useCallback(
    async (override: Partial<AdminReportsFilters> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const merged = { ...filters, ...override };
        const res: AdminReportsResponse = await adminService.getReports(merged);
        setReports(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
        setFilters(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const updateReport = useCallback(
    async (
      reportId: string,
      data: Partial<
        Pick<
          AdminReport,
          "status" | "adminNotes" | "assignedAdminId" | "priority"
        >
      >
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.updateReport(reportId, data);
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? res.data : r))
        );
        return res.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update report"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteReport = useCallback(async (reportId: string) => {
    setLoading(true);
    setError(null);
    try {
      await adminService.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    reports,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    fetchReports,
    updateReport,
    deleteReport,
  };
};

export default useAdminReports;
