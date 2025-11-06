import React from "react";
import ForgotPassword from "../components/ForgotPassword";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return <ForgotPassword onBackToLogin={handleBackToLogin} />;
};

export default ForgotPasswordPage;
