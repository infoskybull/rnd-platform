import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, GameProjectResponse } from "../types";
import RoleBadge from "./RoleBadge";
import apiService from "../services/api";

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface DashboardNavbarProps {
  user: User | null;
  onLogout: () => void;
  navigationItems: NavigationItem[];
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  rightIcons?: Array<{
    icon: React.ReactNode;
    badge?: number;
    onClick?: () => void;
  }>;
  logo?: React.ReactNode;
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  user,
  onLogout,
  navigationItems,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  rightIcons = [],
  logo,
}) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Search dropdown state
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<GameProjectResponse[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const genres = [
    "Action",
    "Adventure",
    "Arcade",
    "Board",
    "Card",
    "Casino",
    "Casual",
    "Educational",
    "Music",
    "Puzzle",
    "Racing",
    "Role playing",
    "Simulation",
    "Sports",
    "Strategy",
    "Trivia",
    "Word",
  ];

  const platforms = ["Mobile", "PC", "Console", "Web", "Smart TV"];

  // Search for published prototypes
  const searchPrototypes = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const queryLower = query.toLowerCase();

        // Check if query matches a genre (exact or partial match)
        const matchedGenre = genres.find(
          (genre) =>
            genre.toLowerCase() === queryLower ||
            genre.toLowerCase().includes(queryLower) ||
            queryLower.includes(genre.toLowerCase())
        );

        // Check if query matches a platform (exact or partial match)
        const matchedPlatform = platforms.find(
          (platform) =>
            platform.toLowerCase() === queryLower ||
            platform.toLowerCase().includes(queryLower) ||
            queryLower.includes(platform.toLowerCase())
        );

        const filters: any = {
          status: "published",
          page: 1,
          limit: 20, // Get more results to filter client-side if needed
        };

        // If genre matches, filter by genre via API
        if (matchedGenre) {
          filters.gameGenre = matchedGenre;
        }

        // If platform matches, filter by platform via API
        if (matchedPlatform) {
          filters.targetPlatform = matchedPlatform;
        }

        const response = await apiService.getProjectsForSale(filters);
        const projects = response.data?.projects || response.projects || [];

        // Filter results by query in title/description/genre/platform if not already filtered
        let filteredProjects = projects;
        if (matchedGenre || matchedPlatform) {
          // Already filtered by genre or platform via API
          filteredProjects = projects;
        } else {
          // Filter by title, description, genre, platform, or keywords containing the query
          filteredProjects = projects.filter(
            (project: GameProjectResponse) =>
              project.title?.toLowerCase().includes(queryLower) ||
              project.shortDescription?.toLowerCase().includes(queryLower) ||
              project.gameGenre?.toLowerCase().includes(queryLower) ||
              project.targetPlatform?.toLowerCase().includes(queryLower) ||
              project.searchKeywords?.some((keyword: string) =>
                keyword.toLowerCase().includes(queryLower)
              )
          );
        }

        // Limit to 10 results for dropdown
        filteredProjects = filteredProjects.slice(0, 10);

        setSearchResults(filteredProjects);
        setShowSearchDropdown(filteredProjects.length > 0);
        // Reset broken images when new search results come in
        setBrokenImages(new Set());
      } catch (error) {
        console.error("Error searching prototypes:", error);
        setSearchResults([]);
        setShowSearchDropdown(false);
      } finally {
        setIsSearching(false);
      }
    },
    [genres, platforms]
  );

  // Handle search input with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setInternalSearchValue(value);

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        searchPrototypes(value);
      }, 300);
    },
    [searchPrototypes]
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }

      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    if (showProfileDropdown || showSearchDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [showProfileDropdown, showSearchDropdown]);

  const defaultLogo = (
    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
      {/* Logo placeholder */}
    </div>
  );

  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-6">
          {logo || defaultLogo}
          <div className="flex items-center gap-2">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  item.active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center - Search Bar */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative" ref={searchDropdownRef}>
              <input
                type="text"
                placeholder="Search by genre or platform..."
                value={internalSearchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchDropdown(true);
                  }
                }}
                className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {isSearching && (
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}

              {/* Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-96 overflow-y-auto">
                  {searchResults.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setInternalSearchValue("");
                        navigate(`/prototype-detail/${project._id}`);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {project.thumbnail && !brokenImages.has(project._id) ? (
                          <img
                            src={project.thumbnail}
                            alt={project.title}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                            onError={() => {
                              setBrokenImages((prev) =>
                                new Set(prev).add(project._id)
                              );
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {project.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {project.shortDescription}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.gameGenre && (
                              <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                {project.gameGenre}
                              </span>
                            )}
                            {project.targetPlatform && (
                              <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                {project.targetPlatform}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSearchDropdown &&
                searchResults.length === 0 &&
                internalSearchValue.trim() &&
                !isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] p-4 text-center text-sm text-gray-500">
                    No prototypes found
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Right Side - Icons */}
        <div className="flex items-center gap-4">
          {rightIcons.map((rightIcon, index) => (
            <div key={index} className="relative">
              <button
                onClick={rightIcon.onClick}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {rightIcon.icon}
              </button>
              {rightIcon.badge !== undefined && rightIcon.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {rightIcon.badge}
                </span>
              )}
            </div>
          ))}

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {user?.firstName && user?.lastName ? (
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.charAt(0).toUpperCase()}
                  {user?.lastName?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && user && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[100]">
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {user?.firstName && user?.lastName ? (
                        <span className="text-white text-lg font-medium">
                          {user?.firstName?.charAt(0).toUpperCase()}
                          {user?.lastName?.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name ||
                          (user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : "User")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {user?.email || ""}
                      </p>
                      {user?.role && (
                        <div className="mt-2">
                          <RoleBadge role={user.role} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;
