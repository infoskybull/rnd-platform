import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import Sidebar from "../components/Sidebar";
import StatsTab from "../components/dashboard/StatsTab";
import ResponsiveNavbar from "../components/ResponsiveNavbar";

interface CreatorStatsPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorStatsPage: React.FC<CreatorStatsPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar userRole="creator" activeTab="stats" onTabChange={() => {}} />

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
            <StatsTab userRole="creator" />
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreatorStatsPage;
