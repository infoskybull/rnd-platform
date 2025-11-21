import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import Sidebar from "../components/Sidebar";
import HistoryTab from "../components/dashboard/HistoryTab";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { useSidebar } from "../contexts/SidebarContext";

interface CreatorHistoryPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorHistoryPage: React.FC<CreatorHistoryPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar userRole="creator" activeTab="history" onTabChange={() => {}} />

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
            <HistoryTab userRole="creator" />
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreatorHistoryPage;
