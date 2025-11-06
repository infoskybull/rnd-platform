import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Upload,
  ArrowRight,
  Video,
  Image,
  Lightbulb,
} from "lucide-react";
import { RocketLaunchIcon } from "../components/icons/Icons";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { useAuth } from "../hooks/useAuth";

const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <ResponsiveNavbar
        title="Create Project"
        titleColor="text-indigo-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back to Dashboard",
          onClick: () => navigate("/dashboard"),
        }}
      />

      <main className="container mx-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">
              <RocketLaunchIcon className="w-16 h-16 mx-auto text-blue-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Create New Project
            </h2>
            <p className="text-gray-400 text-base sm:text-lg">
              Choose how you want to create your game project
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* AI Studio Option */}
            <div
              className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6 sm:p-8 hover:border-purple-400/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate("/create-project/ai")}
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  AI Studio
                </h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Create prototypes with AI assistance
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      Smart Prototyping
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Generate game concepts and basic prototypes using AI
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      Subscription Plans
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Choose from different AI generation limits and features
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      Quick Start
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Get started in minutes with AI-generated content
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Plans Preview */}
              <div className="bg-gray-800/40 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h5 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                  Available Plans:
                </h5>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Starter</span>
                    <span className="text-purple-400">
                      <span className="hidden sm:inline">
                        3 AI generations/month
                      </span>
                      <span className="sm:hidden">3/month</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Pro</span>
                    <span className="text-indigo-400">
                      <span className="hidden sm:inline">
                        20 AI generations/month
                      </span>
                      <span className="sm:hidden">20/month</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Enterprise</span>
                    <span className="text-green-400">
                      <span className="hidden sm:inline">
                        Unlimited generations
                      </span>
                      <span className="sm:hidden">Unlimited</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <span className="font-medium mr-2 text-sm sm:text-base">
                  Try AI Studio
                </span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Manual Upload Option */}
            <div
              className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-2xl p-6 sm:p-8 hover:border-blue-400/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate("/create-project/upload/preview")}
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Upload Project
                </h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Upload your existing game files
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      File Upload
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Upload HTML5, Unity WebGL, or other web-compatible games
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      Full Control
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Complete control over your project files and assets
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      No Limits
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Upload projects of any size without generation limits
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported Formats */}
              <div className="bg-gray-800/40 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h5 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                  Supported Formats:
                </h5>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                    HTML5
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                    Unity WebGL
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                    JavaScript
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                    WebGL
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                    Canvas
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-colors">
                <span className="font-medium mr-2 text-sm sm:text-base">
                  Upload Files
                </span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Idea/Concept Option */}
            <div
              className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-6 sm:p-8 hover:border-green-400/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate("/create-project/create")}
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Idea & Concept
                </h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Create with video, images, and ideas
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      Video & Images
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Upload concept videos, screenshots, or mockups
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      Idea Description
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Describe your game concept and vision in detail
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">
                      No Prototype Required
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Perfect for early-stage concepts and ideas
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported Media */}
              <div className="bg-gray-800/40 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h5 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                  Supported Media:
                </h5>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs flex items-center">
                    <Video className="w-3 h-3 mr-1" />
                    MP4
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs flex items-center">
                    <Image className="w-3 h-3 mr-1" />
                    PNG
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs flex items-center">
                    <Image className="w-3 h-3 mr-1" />
                    JPG
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs flex items-center">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Ideas
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center text-green-400 group-hover:text-green-300 transition-colors">
                <span className="font-medium mr-2 text-sm sm:text-base">
                  Start with Ideas
                </span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateProjectPage;
