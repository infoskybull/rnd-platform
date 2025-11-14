import React from "react";
import { useAdminReports } from "../hooks/useAdminReports";

const AdminReportsPage: React.FC = () => {
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

export default AdminReportsPage;
