import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import RnDLogo from "../components/icons/RnDLogo";
import RoleBadge from "../components/RoleBadge";
import Sidebar from "../components/Sidebar";
import HistoryTab from "../components/dashboard/HistoryTab";
import { Menu, X } from "lucide-react";
import { useSidebar } from "../contexts/SidebarContext";

interface PublisherHistoryPageProps {
  user: User;
  onLogout: () => void;
}

const PublisherHistoryPage: React.FC<PublisherHistoryPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole="publisher"
        activeTab="history"
        onTabChange={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <RnDLogo size={32} className="sm:w-10 sm:h-10" />
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                  Game <span className="text-indigo-400">Marketplace</span>
                </h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    Welcome,{" "}
                    <span className="font-medium text-white">{user.name}</span>
                  </p>
                  <div className="flex items-center justify-end space-x-2 text-xs text-gray-400">
                    <span>{user.email}</span>
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                >
                  Log Out
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="sm:hidden mt-4 pt-4 border-t border-gray-700">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-300">
                      Welcome,{" "}
                      <span className="font-medium text-white">
                        {user.name}
                      </span>
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-1">
                      <span>{user.email.split("@")[0]}</span>
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <main className="p-4 sm:p-6">
            <HistoryTab userRole="publisher" />
          </main>
        </div>
      </div>
    </div>
  );
};

export default PublisherHistoryPage;
