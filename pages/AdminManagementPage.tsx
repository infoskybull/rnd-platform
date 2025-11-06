import React from "react";
import { User } from "../types";
import AdminDashboard from "../components/AdminDashboard";

interface AdminManagementPageProps {
  user: User;
  onLogout: () => void;
}

const AdminManagementPage: React.FC<AdminManagementPageProps> = ({
  user,
  onLogout,
}) => {
  return <AdminDashboard user={user} onLogout={onLogout} />;
};

export default AdminManagementPage;
