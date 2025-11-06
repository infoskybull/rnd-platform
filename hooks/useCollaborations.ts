import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import {
  Collaboration,
  CollaborationFilters,
  CollaborationResponse,
  CollaborationStats,
  CreateCollaborationRequest,
  UpdateCollaborationRequest,
  AddUpdateRequest,
} from "../types";

export const useCollaborations = () => {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [collaborationStats, setCollaborationStats] =
    useState<CollaborationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load collaborations with filters
  const loadCollaborations = useCallback(
    async (filters: CollaborationFilters = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response: CollaborationResponse =
          await apiService.getCollaborations(filters);

        // Fetch project details for each collaboration if not populated
        const collaborationsWithProjects = await Promise.all(
          (response.collaborations || []).map(async (collab) => {
            if (!collab.project && collab.projectId) {
              try {
                const project = await apiService.getGameProjectById(
                  collab.projectId
                );
                return {
                  ...collab,
                  project: {
                    _id: project._id || project.id,
                    title: project.title || "Unknown Project",
                    shortDescription: project.shortDescription || "",
                    projectType: project.projectType,
                    status: project.status,
                  },
                };
              } catch (err) {
                console.error(
                  `Failed to load project ${collab.projectId}:`,
                  err
                );
                return collab;
              }
            }
            return collab;
          })
        );

        setCollaborations(collaborationsWithProjects);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load collaborations"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load publisher collaborations
  const loadPublisherCollaborations = useCallback(
    async (filters: CollaborationFilters = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response: CollaborationResponse =
          await apiService.getPublisherCollaborations(filters);

        // Fetch project details for each collaboration if not populated
        const collaborationsWithProjects = await Promise.all(
          (response.collaborations || []).map(async (collab) => {
            if (!collab.project && collab.projectId) {
              try {
                const project = await apiService.getGameProjectById(
                  collab.projectId
                );
                return {
                  ...collab,
                  project: {
                    _id: project._id || project.id,
                    title: project.title || "Unknown Project",
                    shortDescription: project.shortDescription || "",
                    projectType: project.projectType,
                    status: project.status,
                  },
                };
              } catch (err) {
                console.error(
                  `Failed to load project ${collab.projectId}:`,
                  err
                );
                return collab;
              }
            }
            return collab;
          })
        );

        setCollaborations(collaborationsWithProjects);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load publisher collaborations"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load creator collaborations
  const loadDeveloperCollaborations = useCallback(
    async (filters: CollaborationFilters = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response: CollaborationResponse =
          await apiService.getDeveloperCollaborations(filters);

        // Fetch project details for each collaboration if not populated
        const collaborationsWithProjects = await Promise.all(
          (response.collaborations || []).map(async (collab) => {
            if (!collab.project && collab.projectId) {
              try {
                const project = await apiService.getGameProjectById(
                  collab.projectId
                );
                return {
                  ...collab,
                  project: {
                    _id: project._id || project.id,
                    title: project.title || "Unknown Project",
                    shortDescription: project.shortDescription || "",
                    projectType: project.projectType,
                    status: project.status,
                  },
                };
              } catch (err) {
                console.error(
                  `Failed to load project ${collab.projectId}:`,
                  err
                );
                return collab;
              }
            }
            return collab;
          })
        );

        setCollaborations(collaborationsWithProjects);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load creator collaborations"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load pending collaborations (for developers)
  const loadPendingCollaborations = useCallback(
    async (filters: CollaborationFilters = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response: CollaborationResponse =
          await apiService.getPendingCollaborations(filters);

        // Fetch project details for each collaboration if not populated
        const collaborationsWithProjects = await Promise.all(
          (response.collaborations || []).map(async (collab) => {
            if (!collab.project && collab.projectId) {
              try {
                const project = await apiService.getGameProjectById(
                  collab.projectId
                );
                return {
                  ...collab,
                  project: {
                    _id: project._id || project.id,
                    title: project.title || "Unknown Project",
                    shortDescription: project.shortDescription || "",
                    projectType: project.projectType,
                    status: project.status,
                  },
                };
              } catch (err) {
                console.error(
                  `Failed to load project ${collab.projectId}:`,
                  err
                );
                return collab;
              }
            }
            return collab;
          })
        );

        setCollaborations(collaborationsWithProjects);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load pending collaborations"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load collaboration statistics
  const loadCollaborationStats = useCallback(async () => {
    try {
      const response = await apiService.getCollaborationStats();
      console.log("Collaboration stats response:", response);
      setCollaborationStats(response.data || response);
    } catch (err) {
      console.error("Failed to load collaboration stats:", err);
    }
  }, []);

  // Load publisher collaboration statistics
  const loadPublisherCollaborationStats = useCallback(async () => {
    try {
      const response = await apiService.getPublisherCollaborationStats();
      console.log("Publisher collaboration stats response:", response);
      setCollaborationStats(response.data || response);
    } catch (err) {
      console.error("Failed to load publisher collaboration stats:", err);
    }
  }, []);

  // Load creator collaboration statistics
  const loadDeveloperCollaborationStats = useCallback(async () => {
    try {
      const response = await apiService.getDeveloperCollaborationStats();
      console.log("Creator collaboration stats response:", response);
      setCollaborationStats(response.data || response);
    } catch (err) {
      console.error("Failed to load creator collaboration stats:", err);
    }
  }, []);

  // Get single collaboration
  const getCollaborationById = useCallback(async (collaborationId: string) => {
    try {
      const response = await apiService.getCollaborationById(collaborationId);
      let collaboration = response.data || response;

      // Fetch project details if not populated
      if (!collaboration.project && collaboration.projectId) {
        try {
          const project = await apiService.getGameProjectById(
            collaboration.projectId
          );
          collaboration = {
            ...collaboration,
            project: {
              _id: project._id || project.id,
              title: project.title || "Unknown Project",
              shortDescription: project.shortDescription || "",
              projectType: project.projectType,
              status: project.status,
            },
          };
        } catch (err) {
          console.error(
            `Failed to load project ${collaboration.projectId}:`,
            err
          );
        }
      }

      return collaboration;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load collaboration"
      );
      return null;
    }
  }, []);

  // Create collaboration
  const createCollaboration = useCallback(
    async (collaborationData: CreateCollaborationRequest) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.createCollaboration(
          collaborationData
        );
        return response.data || response;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create collaboration"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update collaboration
  const updateCollaboration = useCallback(
    async (collaborationId: string, updateData: UpdateCollaborationRequest) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.updateCollaboration(
          collaborationId,
          updateData
        );

        // Update local state
        setCollaborations((prev) =>
          prev.map((collab) =>
            collab._id === collaborationId
              ? { ...collab, ...updateData }
              : collab
          )
        );

        return response.data || response;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update collaboration"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Add collaboration update
  const addCollaborationUpdate = useCallback(
    async (collaborationId: string, updateData: AddUpdateRequest) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.addCollaborationUpdate(
          collaborationId,
          updateData
        );

        // Refresh the specific collaboration
        const updatedCollaboration = await getCollaborationById(
          collaborationId
        );
        if (updatedCollaboration) {
          setCollaborations((prev) =>
            prev.map((collab) =>
              collab._id === collaborationId ? updatedCollaboration : collab
            )
          );
        }

        return response.data || response;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to add collaboration update"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getCollaborationById]
  );

  // Accept collaboration
  const acceptCollaboration = useCallback(async (collaborationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.acceptCollaboration(collaborationId);

      // Update local state
      setCollaborations((prev) =>
        prev.map((collab) =>
          collab._id === collaborationId
            ? { ...collab, status: "active" as const }
            : collab
        )
      );

      return response.data || response;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept collaboration"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reject collaboration
  const rejectCollaboration = useCallback(async (collaborationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.rejectCollaboration(collaborationId);

      // Update local state
      setCollaborations((prev) =>
        prev.map((collab) =>
          collab._id === collaborationId
            ? { ...collab, status: "cancelled" as const }
            : collab
        )
      );

      return response.data || response;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject collaboration"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([loadCollaborations(), loadCollaborationStats()]);
  }, [loadCollaborations, loadCollaborationStats]);

  // Refresh publisher data
  const refreshPublisherData = useCallback(async () => {
    await Promise.all([
      loadPublisherCollaborations(),
      loadPublisherCollaborationStats(),
    ]);
  }, [loadPublisherCollaborations, loadPublisherCollaborationStats]);

  // Refresh creator data
  const refreshDeveloperData = useCallback(async () => {
    await Promise.all([
      loadDeveloperCollaborations(),
      loadDeveloperCollaborationStats(),
    ]);
  }, [loadDeveloperCollaborations, loadDeveloperCollaborationStats]);

  return {
    // State
    collaborations,
    collaborationStats,
    loading,
    error,

    // Actions
    loadCollaborations,
    loadPublisherCollaborations,
    loadDeveloperCollaborations,
    loadPendingCollaborations,
    loadCollaborationStats,
    loadPublisherCollaborationStats,
    loadDeveloperCollaborationStats,
    getCollaborationById,
    createCollaboration,
    updateCollaboration,
    addCollaborationUpdate,
    acceptCollaboration,
    rejectCollaboration,
    refreshAll,
    refreshPublisherData,
    refreshDeveloperData,

    // Utilities
    clearError: () => setError(null),
  };
};
