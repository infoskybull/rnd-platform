import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Briefcase, Code, Shield } from "lucide-react";

interface RoleBadgeProps {
  role: "publisher" | "creator" | "admin";
  size?: "sm" | "md" | "lg";
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = "md" }) => {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (badgeRef.current) {
      // Entrance animation
      gsap.fromTo(
        badgeRef.current,
        {
          scale: 0.8,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        }
      );
    }

    if (iconRef.current) {
      // Icon pulse animation
      gsap.to(iconRef.current, {
        scale: 1.1,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, [role]);

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const config = {
    publisher: {
      bgColor: "bg-purple-900/30",
      textColor: "text-purple-300",
      borderColor: "border-purple-500/30",
      icon: Briefcase,
      label: "Publisher",
      gradient: "from-purple-600 to-pink-600",
    },
    creator: {
      bgColor: "bg-blue-900/30",
      textColor: "text-blue-300",
      borderColor: "border-blue-500/30",
      icon: Code,
      label: "Creator",
      gradient: "from-blue-600 to-cyan-600",
    },
    admin: {
      bgColor: "bg-red-900/30",
      textColor: "text-red-300",
      borderColor: "border-red-500/30",
      icon: Shield,
      label: "Admin",
      gradient: "from-red-600 to-orange-600",
    },
  };

  const roleConfig = config?.[role];
  if (!roleConfig) {
    return null;
  }
  const Icon = roleConfig?.icon;

  return (
    <span
      ref={badgeRef}
      className={`inline-flex items-center space-x-1.5 rounded-full font-medium border ${roleConfig?.bgColor} ${roleConfig?.textColor} ${roleConfig?.borderColor} ${sizeClasses[size]} backdrop-blur-sm shadow-lg`}
    >
      <span ref={iconRef} className="inline-flex">
        <Icon size={iconSizes[size]} />
      </span>
      <span className="font-semibold">{roleConfig?.label}</span>
      <span
        className={`absolute inset-0 rounded-full bg-gradient-to-r ${roleConfig?.gradient} opacity-0 blur-sm -z-10 animate-pulse`}
      />
    </span>
  );
};

export default RoleBadge;
