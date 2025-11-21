import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import Sidebar from "../components/Sidebar";
import MessagesTab from "../components/dashboard/MessagesTab";
import ResponsiveNavbar from "../components/ResponsiveNavbar";

interface PublisherMessagesPageProps {
  user: User;
  onLogout: () => void;
}

const PublisherMessagesPage: React.FC<PublisherMessagesPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole="publisher"
        activeTab="messages"
        onTabChange={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ResponsiveNavbar
          title="Game Marketplace"
          titleColor="text-indigo-400"
          user={user}
          onLogout={onLogout}
        />

        <div className="flex-1 h-full">
          <main className="p-4 sm:p-6">
            <MessagesTab />
          </main>
        </div>
      </div>
    </div>
  );
};

export default PublisherMessagesPage;
