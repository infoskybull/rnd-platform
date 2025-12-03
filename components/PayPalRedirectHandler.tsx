import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Component to handle PayPal redirect URLs that come in hash format
 * Example: domain.com/#https://other-domain.com/payment/complete?token=...&PayerID=...
 */
const PayPalRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const hasHandled = useRef(false);

  useEffect(() => {
    // Only handle once on mount
    if (hasHandled.current) return;
    
    // Check if hash contains a full URL (PayPal redirect case)
    const hash = window.location.hash;
    
    if (hash && hash.startsWith("#http")) {
      hasHandled.current = true;
      
      try {
        // Remove the # and parse the URL
        const urlString = hash.substring(1);
        const url = new URL(urlString);
        
        // Check if it's a payment complete URL
        if (url.pathname === "/payment/complete" || url.pathname.endsWith("/payment/complete")) {
          // Extract query parameters
          const token = url.searchParams.get("token");
          const payerId = url.searchParams.get("PayerID");
          
          // Build new URL with query params
          const queryParams = new URLSearchParams();
          if (token) queryParams.set("token", token);
          if (payerId) queryParams.set("PayerID", payerId);
          
          // Navigate to the correct route with query params
          const newPath = `/payment/complete${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
          navigate(newPath, { replace: true });
          return;
        }
        
        // Check if it's a payment cancel URL
        if (url.pathname === "/payment/cancel" || url.pathname.endsWith("/payment/cancel")) {
          navigate("/payment/cancel", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error parsing PayPal redirect URL:", error);
        // If parsing fails, just clear the hash
        window.location.hash = "";
        hasHandled.current = false;
      }
    }
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default PayPalRedirectHandler;

