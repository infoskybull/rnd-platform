import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import Sidebar from "../components/Sidebar";
import CollaborationsTab from "../components/dashboard/CollaborationsTab";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { useSidebar } from "../contexts/SidebarContext";

interface PublisherCollaborationsPageProps {
  user: User;
  onLogout: () => void;
}

const PublisherCollaborationsPage: React.FC<
  PublisherCollaborationsPageProps
> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole="publisher"
        activeTab="collaborations"
        onTabChange={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <ResponsiveNavbar
          title="Game Marketplace"
          titleColor="text-indigo-400"
          user={user}
          onLogout={onLogout}
        />

        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <main className="p-4 sm:p-6">
            <CollaborationsTab userRole="publisher" userId={user.id} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default PublisherCollaborationsPage;
