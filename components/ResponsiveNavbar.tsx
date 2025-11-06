import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, User, ChevronDown, Menu, X } from "lucide-react";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import { User as UserType } from "../types";

interface ResponsiveNavbarProps {
  title: string;
  titleColor?: string;
  user: UserType | null;
  onLogout: () => void;
  backButton?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = ({
  title,
  titleColor = "text-indigo-400",
  user,
  onLogout,
  backButton,
  className = "",
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header
      className={`bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        {/* Desktop Layout */}
        <div className="hidden lg:flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <RnDLogo size={32} className="sm:w-10 sm:h-10" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              {title.split(" ").map((word, index) => (
                <span key={index}>
                  {index === title.split(" ").length - 1 ? (
                    <span className={titleColor}>{word}</span>
                  ) : (
                    word + " "
                  )}
                </span>
              ))}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-300">
                  Welcome,{" "}
                  <span className="font-medium text-white">{user.name}</span>
                </p>
                <div className="flex items-center justify-end space-x-2 text-xs text-gray-400 flex-wrap">
                  <span>{user.email}</span>
                  <RoleBadge role={user.role} size="sm" />
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              {backButton && (
                <button
                  onClick={backButton.onClick}
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors flex items-center space-x-1 sm:space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{backButton.text}</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
              >
                <span className="hidden sm:inline">Log Out</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tablet Layout - Collapsed buttons */}
        <div className="hidden md:flex lg:hidden justify-between items-center">
          <div className="flex items-center space-x-3">
            <RnDLogo size={32} className="w-10 h-10" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              {title.split(" ").map((word, index) => (
                <span key={index}>
                  {index === title.split(" ").length - 1 ? (
                    <span className={titleColor}>{word}</span>
                  ) : (
                    word + " "
                  )}
                </span>
              ))}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">{user.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-1">
              {backButton && (
                <button
                  onClick={backButton.onClick}
                  className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  title={backButton.text}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden justify-between items-center">
          <div className="flex items-center space-x-3">
            <RnDLogo size={28} className="w-8 h-8" />
            <h1 className="text-lg font-bold tracking-tight text-white">
              {title.split(" ").map((word, index) => (
                <span key={index}>
                  {index === title.split(" ").length - 1 ? (
                    <span className={titleColor}>{word}</span>
                  ) : (
                    word + " "
                  )}
                </span>
              ))}
            </h1>
          </div>

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
            <div className="space-y-4">
              {user && (
                <div className="text-center">
                  <p className="text-sm text-gray-300">
                    Welcome,{" "}
                    <span className="font-medium text-white">{user.name}</span>
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-1">
                    <span>{user.email.split("@")[0]}</span>
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                {backButton && (
                  <button
                    onClick={() => {
                      backButton.onClick();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {backButton.text}
                  </button>
                )}

                <button
                  onClick={() => {
                    onLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ResponsiveNavbar;
