import React from "react";

interface SimpleScrollbarProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "thin" | "minimal";
}

const SimpleScrollbar: React.FC<SimpleScrollbarProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "thin":
        return "scrollbar-thin";
      case "minimal":
        return "scrollbar-minimal";
      default:
        return ""; // Default styles are applied globally via *
    }
  };

  return <div className={`${getVariantClass()} ${className}`}>{children}</div>;
};

export default SimpleScrollbar;
