import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import {
  UserProfileResponse,
  UserProfileUser,
  UserProfileStats,
  UserProfileProject,
} from "../types";
import {
  Star,
  MessageSquare,
  Mail,
  User as UserIcon,
  Calendar,
  FolderKanban,
  ShoppingBag,
  Handshake,
  TrendingUp,
  Eye,
  Heart,
  Code,
  Package,
  Lightbulb,
} from "lucide-react";
import { useAppSelector } from "../store/hooks";
import { useAuth } from "../hooks/useAuth";
import ResponsiveNavbar from "../components/ResponsiveNavbar";

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse["data"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError("User ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get profile data from API
        const profileData = await apiService.getUserProfileWithReviews(userId);

        // Check if response has success field
        if (profileData.success && profileData.data) {
          setProfile(profileData.data);
        } else if (profileData.data) {
          setProfile(profileData.data);
        } else {
          setProfile(profileData as any);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleDirectMessage = () => {
    if (!currentUser || !userId) return;

    // Navigate to a messages/conversation page (to be implemented)
    // For now, you can show an alert or navigate to a placeholder
    alert("Direct messaging feature will be implemented soon!");
  };

  const getProjectTypeIcon = (type: string | string[]) => {
    const types = Array.isArray(type) ? type : [type];
    const firstType = types[0];
    switch (firstType) {
      case "product_sale":
        return <Package className="w-4 h-4" />;
      case "dev_collaboration":
        return <Code className="w-4 h-4" />;
      default:
        return <FolderKanban className="w-4 h-4" />;
    }
  };

  const getProjectTypeLabel = (type: string | string[]) => {
    const types = Array.isArray(type) ? type : [type];
    return types
      .map((t) => {
        switch (t) {
          case "product_sale":
            return "Product";
          case "dev_collaboration":
            return "Collaboration";
          default:
            return String(t);
        }
      })
      .join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {user && (
          <ResponsiveNavbar
            title="User Profile"
            titleColor="text-indigo-400"
            user={user}
            onLogout={handleLogout}
            backButton={{
              text: "Back",
              onClick: () => navigate(-1),
            }}
          />
        )}
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {user && (
          <ResponsiveNavbar
            title="User Profile"
            titleColor="text-indigo-400"
            user={user}
            onLogout={handleLogout}
            backButton={{
              text: "Back",
              onClick: () => navigate(-1),
            }}
          />
        )}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">{error || "Profile not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userName = `${profile.user.firstName} ${profile.user.lastName}`;
  const userRole = profile.user.role;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {user && (
        <ResponsiveNavbar
          title={`${userName}'s Profile`}
          titleColor="text-indigo-400"
          user={user}
          onLogout={handleLogout}
          backButton={{
            text: "Back",
            onClick: () => navigate(-1),
          }}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold">
              {userName.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{userName}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userRole === "publisher"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}
                >
                  {userRole === "publisher" ? "Publisher" : "Creator"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined{" "}
                    {new Date(profile.user.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                      }
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDirectMessage}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
              >
                <MessageSquare className="w-5 h-5" />
                Direct Message
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <FolderKanban className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {profile.stats.createdProjects}
                </div>
                <div className="text-xs text-gray-400">Created Projects</div>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <ShoppingBag className="w-5 h-5 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {profile.stats.purchasedProjects}
                </div>
                <div className="text-xs text-gray-400">Purchased Projects</div>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <Handshake className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {profile.stats.creatorCollaborations}
                </div>
                <div className="text-xs text-gray-400">Creator Collabs</div>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {profile.stats.publisherCollaborations}
                </div>
                <div className="text-xs text-gray-400">Publisher Collabs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Created Projects Section */}
        {profile.createdProjects && profile.createdProjects.length > 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-indigo-400" />
              Created Projects
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.createdProjects.map((project: UserProfileProject) => (
                <div
                  key={project.id}
                  className="bg-gray-700/30 rounded-lg p-6 border border-gray-700/50 hover:border-indigo-500/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/project-detail/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-indigo-400">
                        {getProjectTypeIcon(project.projectType)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {getProjectTypeLabel(project.projectType)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === "published"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {project.shortDescription}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{project.viewCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{project.likeCount}</span>
                      </div>
                    </div>
                    {project.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{project.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-gray-700 text-center">
            <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Created Projects</h3>
            <p className="text-gray-400">
              This user hasn't created any projects yet.
            </p>
          </div>
        )}

        {/* Purchased Projects Section */}
        {userRole === "publisher" &&
          profile.purchasedProjects &&
          profile.purchasedProjects.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-green-400" />
                Purchased Projects
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.purchasedProjects.map(
                  (project: UserProfileProject) => (
                    <div
                      key={project.id}
                      className="bg-gray-700/30 rounded-lg p-6 border border-gray-700/50 hover:border-green-500/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/project-detail/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="text-green-400">
                            {getProjectTypeIcon(project.projectType)}
                          </div>
                          <span className="text-xs text-gray-400">
                            {getProjectTypeLabel(project.projectType)}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-white mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {project.shortDescription}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{project.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{project.likeCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ProfilePage;
