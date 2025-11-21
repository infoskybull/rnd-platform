import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import Sidebar from "../components/Sidebar";
import MessagesTab from "../components/dashboard/MessagesTab";
import ResponsiveNavbar from "../components/ResponsiveNavbar";

interface CreatorMessagesPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorMessagesPage: React.FC<CreatorMessagesPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar userRole="creator" activeTab="messages" onTabChange={() => {}} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ResponsiveNavbar
          title="Creator Dashboard"
          titleColor="text-indigo-400"
          user={user}
          onLogout={onLogout}
        />

        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <main className="p-4 sm:p-6">
            <MessagesTab />
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreatorMessagesPage;
