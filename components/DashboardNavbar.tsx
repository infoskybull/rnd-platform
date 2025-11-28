import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import RoleBadge from "./RoleBadge";

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface DashboardNavbarProps {
  user: User;
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  const defaultLogo = (
    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
      {/* Logo placeholder */}
    </div>
  );

  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 flex-shrink-0">
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
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
              {user.firstName && user.lastName ? (
                <span className="text-white text-sm font-medium">
                  {user.firstName.charAt(0).toUpperCase()}
                  {user.lastName.charAt(0).toUpperCase()}
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
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {user.firstName && user.lastName ? (
                        <span className="text-white text-lg font-medium">
                          {user.firstName.charAt(0).toUpperCase()}
                          {user.lastName.charAt(0).toUpperCase()}
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
                        {user.name || `${user.firstName} ${user.lastName}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {user.email}
                      </p>
                      {user.role && (
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

