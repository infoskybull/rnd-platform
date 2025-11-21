import React from "react";
import { useNavigate } from "react-router-dom";
import { GameProject } from "../types";
import { ShoppingCart } from "lucide-react";

interface PurchaseButtonProps {
  project: GameProject;
  onPurchaseSuccess?: (result: any) => void;
  onPurchaseError?: (error: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showPrice?: boolean;
}

const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  project,
  onPurchaseSuccess,
  onPurchaseError,
  className = "",
  size = "md",
  showPrice = true,
}) => {
  const navigate = useNavigate();

  const handlePurchase = () => {
    // Navigate to payment page with projectId and paymentType
    navigate(`/payment?projectId=${project._id}&paymentType=project_purchase`);
  };

  const getPrice = () => {
    if (project.productSaleData?.askingPrice) {
      return project.productSaleData.askingPrice;
    }
    return null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-xs";
      case "lg":
        return "px-6 py-3 text-base";
      default:
        return "px-4 py-2 text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  };

  const price = getPrice();
  const isPurchasable =
    project.status === "published" &&
    (() => {
      const types = Array.isArray(project.projectType)
        ? project.projectType
        : [project.projectType];
      return types.includes("product_sale");
    })() &&
    price !== null;

  if (!isPurchasable) {
    return null;
  }

  return (
    <button
      onClick={handlePurchase}
      className={`
        ${getSizeClasses()}
        bg-green-600 hover:bg-green-700 
        text-white font-medium rounded-lg 
        transition-colors duration-200 
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      <ShoppingCart className={getIconSize()} />
      <span>
        {showPrice && price ? `Purchase - ${formatPrice(price)}` : "Purchase"}
      </span>
    </button>
  );
};

export default PurchaseButton;
