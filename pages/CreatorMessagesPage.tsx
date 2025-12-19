import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "../types";
import MessagesTab from "../components/dashboard/MessagesTab";
import DashboardNavbar from "../components/DashboardNavbar";
import {
  getDefaultRightIcons,
  getMessagesPathForRole,
  getNavigationItems,
} from "../utils/navbarConfig";

interface CreatorMessagesPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorMessagesPage: React.FC<CreatorMessagesPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationItems = getNavigationItems(user?.role, location.pathname);
  const rightIcons = getDefaultRightIcons({
    onMessagesClick: () => navigate(getMessagesPathForRole(user?.role)),
  });

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        navigationItems={navigationItems}
        rightIcons={rightIcons}
      />
      <div className="flex-1 overflow-hidden">
        <MessagesTab useFullHeight theme="light" />
      </div>
    </div>
  );
};

export default CreatorMessagesPage;
