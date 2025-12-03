import React, { useState } from "react";
import { useAdminProjects } from "../../hooks/useAdminProjects";
import { GameProject, ProjectStatus } from "../../types";
import { Loader2, Trash2 } from "lucide-react";
import ConfirmModal from "../ConfirmModal";

const ProjectsTab: React.FC = () => {
  const {
    projects,
    loading,
    error,
    pagination,
    filters,
    fetchProjects,
    deleteProject,
  } = useAdminProjects({ page: 1, limit: 20 });

  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    projectId: string | null;
    message: string;
  }>({
    isOpen: false,
    projectId: null,
    message: "",
  });

  const handleDeleteClick = (projectId: string) => {
    const project = projects.find((p) => p._id === projectId);
    if (!project) return;

    const confirmMessage =
      project.status === "sold"
        ? "This project has been sold. Are you sure you want to delete it? This action cannot be undone."
        : "Are you sure you want to delete this project? This action cannot be undone.";

    setConfirmModal({
      isOpen: true,
      projectId,
      message: confirmMessage,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.projectId) return;

    setDeletingProjectId(confirmModal.projectId);
    setConfirmModal({ isOpen: false, projectId: null, message: "" });

    try {
      const success = await deleteProject(confirmModal.projectId);
      if (success) {
        // Refetch to update the list
        fetchProjects(filters);
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModal({ isOpen: false, projectId: null, message: "" });
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "published":
        return "bg-green-600/30 text-green-300";
      case "draft":
        return "bg-gray-600/30 text-gray-300";
      case "sold":
        return "bg-blue-600/30 text-blue-300";
      default:
        return "bg-gray-600/30 text-gray-300";
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const getProjectTypeLabel = (types: string[] | undefined) => {
    if (!types || types.length === 0) return "-";
    return types.join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              fetchProjects({
                status: (e.target.value || undefined) as any,
                page: 1,
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="sold">Sold</option>
          </select>
          <select
            value={filters.projectType || ""}
            onChange={(e) =>
              fetchProjects({
                projectType: e.target.value || undefined,
                page: 1,
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="">All Types</option>
            <option value="product_sale">Product Sale</option>
            <option value="dev_collaboration">Dev Collaboration</option>
          </select>
          <input
            type="text"
            placeholder="Search projects..."
            defaultValue={filters.search || ""}
            onChange={(e) => {
              const value = e.target.value;
              fetchProjects({ search: value || undefined, page: 1 });
            }}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          />
          <input
            type="number"
            placeholder="Page"
            min="1"
            value={pagination.page}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page > 0 && page <= pagination.totalPages) {
                fetchProjects({ page });
              }
            }}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          />
        </div>

        <div className="overflow-x-auto border border-gray-700 rounded-lg">
          {error && <div className="p-4 text-red-400 text-sm">{error}</div>}
          {loading && projects.length === 0 && (
            <div className="p-4 text-gray-300 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading projects...
            </div>
          )}
          <table className="hidden sm:table min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Creator
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {projects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-800/60">
                  <td className="px-4 py-3 text-sm text-white">
                    <div className="font-medium">{project.title}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[300px]">
                      {project.shortDescription}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {project.owner
                      ? `${project.owner.firstName || ""} ${
                          project.owner.lastName || ""
                        }`.trim() || project.owner.email
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {getProjectTypeLabel(project.projectType)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {project.viewCount || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatDate(project.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => handleDeleteClick(project._id)}
                      disabled={deletingProjectId === project._id || loading}
                      className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded border border-red-600 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {deletingProjectId === project._id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && projects.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-gray-400"
                    colSpan={7}
                  >
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-800">
            {projects.map((project) => (
              <div key={project._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">{project.title}</div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-300 truncate">
                  {project.shortDescription}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Creator:{" "}
                  {project.owner
                    ? `${project.owner.firstName || ""} ${
                        project.owner.lastName || ""
                      }`.trim() || project.owner.email
                    : "-"}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Type: {getProjectTypeLabel(project.projectType)}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Views: {project.viewCount || 0}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Created: {formatDate(project.createdAt)}
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => handleDeleteClick(project._id)}
                    disabled={deletingProjectId === project._id || loading}
                    className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded border border-red-600 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {deletingProjectId === project._id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
            {!loading && projects.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">
                No projects found.
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
                fetchProjects({ page: (pagination.page - 1) as number })
              }
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page <= 1}
            >
              Prev
            </button>
            <button
              onClick={() =>
                pagination.page < pagination.totalPages &&
                fetchProjects({ page: (pagination.page + 1) as number })
              }
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Project"
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deletingProjectId !== null}
      />
    </div>
  );
};

export default ProjectsTab;
