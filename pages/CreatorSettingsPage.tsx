import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import Sidebar from "../components/Sidebar";
import SettingsTab from "../components/dashboard/SettingsTab";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { useSidebar } from "../contexts/SidebarContext";

interface CreatorSettingsPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorSettingsPage: React.FC<CreatorSettingsPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar userRole="creator" activeTab="settings" onTabChange={() => {}} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <ResponsiveNavbar
          title="Creator Dashboard"
          titleColor="text-indigo-400"
          user={user}
          onLogout={onLogout}
        />

        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <main className="p-4 sm:p-6">
            <SettingsTab user={user} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreatorSettingsPage;
