import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameProject, ProjectType, ProjectStatus } from "../types";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import RoleBadge from "../components/RoleBadge";
import ProjectPreview from "../components/ProjectPreview";
import ProjectGallery from "../components/ProjectGallery";
import {
  Heart,
  Eye,
  Star,
  Calendar,
  User,
  Tag,
  Building2,
  Code,
  Mail,
  MessageCircle,
  Award,
  Clock,
  MapPin,
} from "lucide-react";
import {
  DocumentTextIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  WarningIcon,
  InfoIcon,
  GamepadIcon,
} from "../components/icons/Icons";

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [project, setProject] = useState<GameProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    // Only load project if we have an ID and auth is not loading
    if (id && !authLoading) {
      loadProject();
    }
  }, [id, authLoading, isAuthenticated]);

  const loadProject = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const projectData = await apiService.getGameProjectById(id);
      setProject(projectData);
    } catch (err) {
      // If it's an auth error and user is not authenticated,
      // we can still try to show the project for public viewing
      if (
        err instanceof Error &&
        err.message.includes("Unauthorized") &&
        !isAuthenticated
      ) {
        setError(
          "This project requires authentication to view. Please log in to continue."
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to load project");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!project || !isAuthenticated) return;

    try {
      setActionLoading("like");
      await apiService.likeGameProject(project._id);
      // Refresh project data to get updated like count
      loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to like project");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurchase = async () => {
    if (!project || !isAuthenticated) return;

    if (
      window.confirm(
        `Are you sure you want to purchase this project for $${getPrice()}?`
      )
    ) {
      try {
        setActionLoading("purchase");
        await apiService.purchaseGameProject(project._id);
        // Refresh project data
        loadProject();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to purchase project"
        );
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleStartCollaboration = async () => {
    if (!project || !isAuthenticated) return;

    if (
      window.confirm(
        "Are you sure you want to start collaboration on this project?"
      )
    ) {
      try {
        setActionLoading("collaborate");
        await apiService.startCollaboration(project._id);
        // Refresh project data
        loadProject();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start collaboration"
        );
      } finally {
        setActionLoading(null);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getPrice = () => {
    if (project?.ideaSaleData?.askingPrice) {
      return project.ideaSaleData.askingPrice;
    }
    if (project?.productSaleData?.askingPrice) {
      return project.productSaleData.askingPrice;
    }
    if (project?.devCollaborationData?.budget) {
      return project.devCollaborationData.budget;
    }
    return 0;
  };

  const getProjectTypeLabel = (type: ProjectType) => {
    switch (type) {
      case "idea_sale":
        return "Idea Sale";
      case "product_sale":
        return "Product Sale";
      case "dev_collaboration":
        return "Dev Collaboration";
      default:
        return type;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "published":
        return "bg-green-100 text-green-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      case "in_collaboration":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case "draft":
        return <DocumentTextIcon className="w-5 h-5 text-blue-400" />;
      case "published":
        return <SparklesIcon className="w-5 h-5 text-green-400" />;
      case "sold":
        return <CurrencyDollarIcon className="w-5 h-5 text-green-400" />;
      case "in_collaboration":
        return <SparklesIcon className="w-5 h-5 text-blue-400" />;
      case "completed":
        return <SparklesIcon className="w-5 h-5 text-yellow-400" />;
      case "cancelled":
        return <WarningIcon className="w-5 h-5 text-red-400" />;
      default:
        return <InfoIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {authLoading ? "Loading user data..." : "Loading project..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            {error || "The project you're looking for doesn't exist."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Go Back
            </button>
            {error && error.includes("authentication") && (
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <ResponsiveNavbar
        title="Project Details"
        titleColor="text-indigo-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back",
          onClick: () => navigate(-1),
        }}
      />

      {/* Main Content */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {project.title}
                  </h1>
                  <p className="text-gray-300 text-lg mb-4">
                    {project.shortDescription}
                  </p>
                </div>
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                  <span className="text-2xl">
                    {getStatusIcon(project.status)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Eye className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">
                    {project.viewCount}
                  </div>
                  <div className="text-xs text-gray-400">Views</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">
                    {project.likeCount}
                  </div>
                  <div className="text-xs text-gray-400">Likes</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">
                    {project.averageRating > 0
                      ? project.averageRating.toFixed(1)
                      : "N/A"}
                  </div>
                  <div className="text-xs text-gray-400">Rating</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <User className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">
                    {project.reviewCount}
                  </div>
                  <div className="text-xs text-gray-400">Reviews</div>
                </div>
              </div>

              {/* Project Type and Price */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm font-medium">
                    {getProjectTypeLabel(project.projectType)}
                  </span>
                  {(project.ideaSaleData?.gameGenre ||
                    project.productSaleData?.gameGenre ||
                    project.devCollaborationData?.gameGenre) && (
                    <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm font-medium">
                      {project.ideaSaleData?.gameGenre ||
                        project.productSaleData?.gameGenre ||
                        project.devCollaborationData?.gameGenre}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {formatPrice(getPrice())}
                </div>
              </div>
            </div>

            {/* Project Preview */}
            {project.fileUrls && project.fileUrls.length > 0 && (
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Project Preview
                </h2>
                <ProjectPreview
                  fileUrls={project.fileUrls}
                  projectTitle={project.title}
                />
              </div>
            )}

            {/* Project Details */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Project Details
              </h2>

              {project.ideaSaleData && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Idea Description
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {project.ideaSaleData.description}
                    </p>
                  </div>

                  {project.ideaSaleData.videoUrl && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Demo Video
                      </h3>
                      <video
                        controls
                        className="w-full h-64 rounded-lg"
                        poster={project.thumbnail}
                      >
                        <source
                          src={project.ideaSaleData.videoUrl}
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {project.ideaSaleData.prototypeImages &&
                    project.ideaSaleData.prototypeImages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Prototype Images
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {project.ideaSaleData.prototypeImages.map(
                            (image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Prototype ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {project.productSaleData && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Product Description
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {project.productSaleData.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400">Playable:</span>
                      <span className="text-white ml-2">
                        {project.productSaleData.isPlayable ? "Yes" : "No"}
                      </span>
                    </div>
                    {project.productSaleData.techStack && (
                      <div>
                        <span className="text-gray-400">Tech Stack:</span>
                        <span className="text-white ml-2">
                          {project.productSaleData.techStack}
                        </span>
                      </div>
                    )}
                  </div>

                  {project.productSaleData.demoUrl && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Demo
                      </h3>
                      <a
                        href={project.productSaleData.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <GamepadIcon className="w-4 h-4 inline mr-1" /> Try Demo
                      </a>
                    </div>
                  )}

                  {project.productSaleData.screenshots &&
                    project.productSaleData.screenshots.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Screenshots
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {project.productSaleData.screenshots.map(
                            (screenshot, index) => (
                              <img
                                key={index}
                                src={screenshot}
                                alt={`Screenshot ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {project.devCollaborationData && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Collaboration Proposal
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {project.devCollaborationData.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Detailed Proposal
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {project.devCollaborationData.proposal}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400">Timeline:</span>
                      <span className="text-white ml-2">
                        {project.devCollaborationData.timeline}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Budget:</span>
                      <span className="text-white ml-2">
                        {formatPrice(project.devCollaborationData.budget)}
                      </span>
                    </div>
                  </div>

                  {project.devCollaborationData.skills &&
                    project.devCollaborationData.skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Required Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {project.devCollaborationData.skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {project.devCollaborationData.prototypeImages &&
                    project.devCollaborationData.prototypeImages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Prototype Images
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {project.devCollaborationData.prototypeImages.map(
                            (image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Prototype ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Tags */}
            {(project.ideaSaleData?.tags ||
              project.productSaleData?.tags ||
              project.devCollaborationData?.tags) &&
              (
                project.ideaSaleData?.tags ||
                project.productSaleData?.tags ||
                project.devCollaborationData?.tags ||
                []
              ).length > 0 && (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Tag className="w-6 h-6 mr-2" />
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {(
                      project.ideaSaleData?.tags ||
                      project.productSaleData?.tags ||
                      project.devCollaborationData?.tags ||
                      []
                    ).map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right Column - Actions and Info */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
              <div className="space-y-3">
                {isAuthenticated && (
                  <button
                    onClick={handleLike}
                    disabled={actionLoading === "like"}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    {actionLoading === "like" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Liking...
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Like Project
                      </>
                    )}
                  </button>
                )}

                {isAuthenticated && project.status === "published" && (
                  <>
                    {(project.projectType === "idea_sale" ||
                      project.projectType === "product_sale") && (
                      <button
                        onClick={handlePurchase}
                        disabled={actionLoading === "purchase"}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        {actionLoading === "purchase" ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Purchasing...
                          </>
                        ) : (
                          <>
                            <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />{" "}
                            Purchase for {formatPrice(getPrice())}
                          </>
                        )}
                      </button>
                    )}

                    {project.projectType === "dev_collaboration" && (
                      <button
                        onClick={handleStartCollaboration}
                        disabled={actionLoading === "collaborate"}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        {actionLoading === "collaborate" ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Starting...
                          </>
                        ) : (
                          <>🤝 Start Collaboration</>
                        )}
                      </button>
                    )}
                  </>
                )}

                {!isAuthenticated && (
                  <div className="text-center">
                    <p className="text-gray-400 mb-3">
                      Please log in to interact with this project
                    </p>
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Project Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">
                    {getProjectTypeLabel(project.projectType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                {(project.ideaSaleData?.targetPlatform ||
                  project.productSaleData?.targetPlatform ||
                  project.devCollaborationData?.targetPlatform) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform:</span>
                    <span className="text-white">
                      {project.ideaSaleData?.targetPlatform ||
                        project.productSaleData?.targetPlatform ||
                        project.devCollaborationData?.targetPlatform}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {project.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Published:</span>
                    <span className="text-white">
                      {new Date(project.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Publisher Information */}
            {project.owner && (
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-green-400" />
                  Owner
                </h2>

                {/* Publisher Profile */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {project.owner.firstName.charAt(0)}
                      {project.owner.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {project.owner.firstName} {project.owner.lastName}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {project.owner.email}
                    </p>
                    <RoleBadge role={project.owner.role} size="sm" />
                  </div>
                </div>

                {/* Contact Actions */}
                {isAuthenticated && user?.id !== project.owner.id && (
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Owner
                    </button>
                  </div>
                )}

                {/* View Profile Button */}
                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/profile/${project.owner.id}`)}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    View Owner Profile
                  </button>
                </div>
              </div>
            )}

            {/* Creator Information */}
            {project.originalDeveloper && (
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-blue-400" />
                  Project Creator
                </h2>

                {/* Creator Profile */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {project.originalDeveloper.firstName.charAt(0)}
                      {project.originalDeveloper.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {project.originalDeveloper.firstName}{" "}
                      {project.originalDeveloper.lastName}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {project.originalDeveloper.email}
                    </p>
                    <RoleBadge
                      role={project.originalDeveloper.role}
                      size="sm"
                    />
                  </div>
                </div>

                {/* View Creator Profile Button */}
                <div className="mt-3">
                  <button
                    onClick={() =>
                      navigate(`/profile/${project.originalDeveloper!.id}`)
                    }
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    View Creator Profile
                  </button>
                </div>

                {/* Contact Actions */}
                {isAuthenticated &&
                  user?.id !== project.originalDeveloper.id && (
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Creator
                      </button>
                    </div>
                  )}

                {/* View Profile Button */}
                <div className="mt-3">
                  <button
                    onClick={() =>
                      navigate(`/profile/${project.originalDeveloper.id}`)
                    }
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    View Creator Profile
                  </button>
                </div>
              </div>
            )}

            {/* Same Person Notice */}
            {project.owner &&
              project.originalDeveloper &&
              project.owner.id === project.originalDeveloper.id && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-blue-300 font-medium">Same Person</h3>
                      <p className="text-blue-400 text-sm">
                        The creator who created this project is also the current
                        publisher
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Project Gallery */}
            <ProjectGallery
              attachments={project.attachments || []}
              thumbnail={project.thumbnail}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailPage;
