import React, { useState } from "react";
import { GameProject } from "../types";
import { apiService } from "../services/api";
import { ShoppingCart, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await apiService.purchaseGameProject(project._id);
      onPurchaseSuccess?.(result);

      // Show success message (you can replace this with a toast notification)
      console.log("Project purchased successfully!", result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to purchase project";
      onPurchaseError?.(errorMessage);
      console.error("Purchase failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (project.ideaSaleData?.askingPrice) {
      return project.ideaSaleData.askingPrice;
    }
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
    (project.projectType === "idea_sale" ||
      project.projectType === "product_sale") &&
    price !== null;

  if (!isPurchasable) {
    return null;
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className={`
        ${getSizeClasses()}
        bg-green-600 hover:bg-green-700 
        disabled:bg-gray-600 disabled:cursor-not-allowed 
        text-white font-medium rounded-lg 
        transition-colors duration-200 
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className={`${getIconSize()} animate-spin`} />
          <span>Purchasing...</span>
        </>
      ) : (
        <>
          <ShoppingCart className={getIconSize()} />
          <span>
            {showPrice && price
              ? `Purchase - ${formatPrice(price)}`
              : "Purchase"}
          </span>
        </>
      )}
    </button>
  );
};

export default PurchaseButton;
