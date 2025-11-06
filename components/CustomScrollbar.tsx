import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  scrollbarWidth?: number;
  scrollbarColor?: string;
  scrollbarTrackColor?: string;
  scrollbarThumbColor?: string;
  scrollbarThumbHoverColor?: string;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  className = "",
  scrollbarWidth = 8,
  scrollbarColor = "#374151",
  scrollbarTrackColor = "#1f2937",
  scrollbarThumbColor = "#6b7280",
  scrollbarThumbHoverColor = "#9ca3af",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create custom scrollbar styles
    const style = document.createElement("style");
    style.textContent = `
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: ${scrollbarThumbColor} ${scrollbarTrackColor};
      }
      
      .custom-scrollbar::-webkit-scrollbar {
        width: ${scrollbarWidth}px;
        height: ${scrollbarWidth}px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: ${scrollbarTrackColor};
        border-radius: ${scrollbarWidth / 2}px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: ${scrollbarThumbColor};
        border-radius: ${scrollbarWidth / 2}px;
        border: 1px solid ${scrollbarTrackColor};
        transition: background-color 0.3s ease;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${scrollbarThumbHoverColor};
      }
      
      .custom-scrollbar::-webkit-scrollbar-corner {
        background: ${scrollbarTrackColor};
      }
    `;

    document.head.appendChild(style);

    // GSAP animations for scrollbar
    const handleScroll = () => {
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercent = scrollTop / (scrollHeight - clientHeight);

      // Animate scrollbar thumb position with GSAP
      const scrollbarThumb = container.querySelector(
        "::-webkit-scrollbar-thumb"
      );
      if (scrollbarThumb) {
        gsap.to(scrollbarThumb, {
          duration: 0.1,
          ease: "power2.out",
          scaleY: Math.max(0.3, clientHeight / scrollHeight),
        });
      }
    };

    // Add scroll listener
    container.addEventListener("scroll", handleScroll);

    // GSAP entrance animation
    gsap.fromTo(
      container,
      {
        opacity: 0,
        scale: 0.98,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
      }
    );

    return () => {
      container.removeEventListener("scroll", handleScroll);
      document.head.removeChild(style);
    };
  }, [
    scrollbarWidth,
    scrollbarColor,
    scrollbarTrackColor,
    scrollbarThumbColor,
    scrollbarThumbHoverColor,
  ]);

  return (
    <div ref={containerRef} className={`custom-scrollbar ${className}`}>
      {children}
    </div>
  );
};

export default CustomScrollbar;
