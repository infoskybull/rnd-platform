import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface GSAPScrollbarProps {
  children: React.ReactNode;
  className?: string;
  trackColor?: string;
  thumbColor?: string;
  thumbHoverColor?: string;
  cornerColor?: string;
  width?: number;
  borderRadius?: number;
  showOnHover?: boolean;
  smoothScrolling?: boolean;
}

const GSAPScrollbar: React.FC<GSAPScrollbarProps> = ({
  children,
  className = "",
  trackColor = "rgba(31, 41, 55, 0.8)",
  thumbColor = "rgba(107, 114, 128, 0.6)",
  thumbHoverColor = "rgba(156, 163, 175, 0.8)",
  cornerColor = "rgba(31, 41, 55, 0.8)",
  width = 8,
  borderRadius = 4,
  showOnHover = true,
  smoothScrolling = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create dynamic style element
    const styleId = `gsap-scrollbar-${Date.now()}`;
    const style = document.createElement("style");
    style.id = styleId;

    style.textContent = `
      .gsap-scrollbar-container {
        scrollbar-width: thin;
        scrollbar-color: ${thumbColor} ${trackColor};
        overflow: auto;
        position: relative;
      }
      
      .gsap-scrollbar-container::-webkit-scrollbar {
        width: ${width}px;
        height: ${width}px;
        transition: all 0.3s ease;
      }
      
      .gsap-scrollbar-container::-webkit-scrollbar-track {
        background: ${trackColor};
        border-radius: ${borderRadius}px;
        box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1);
      }
      
      .gsap-scrollbar-container::-webkit-scrollbar-thumb {
        background: ${thumbColor};
        border-radius: ${borderRadius}px;
        border: 1px solid transparent;
        background-clip: content-box;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .gsap-scrollbar-container::-webkit-scrollbar-thumb:hover {
        background: ${thumbHoverColor};
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      
      .gsap-scrollbar-container::-webkit-scrollbar-corner {
        background: ${cornerColor};
      }
      
      ${
        showOnHover
          ? `
        .gsap-scrollbar-container:not(:hover)::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .gsap-scrollbar-container:not(:hover)::-webkit-scrollbar-thumb {
          background: transparent;
        }
      `
          : ""
      }
    `;

    document.head.appendChild(style);

    // GSAP scroll animations
    const handleScroll = () => {
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

      setScrollProgress(progress);

      // GSAP animation for scroll indicator
      gsap.to(container, {
        duration: 0.1,
        ease: "power2.out",
        // Add subtle parallax effect
        transform: `translateY(${progress * 2}px)`,
      });
    };

    // Smooth scroll behavior
    if (smoothScrolling) {
      container.style.scrollBehavior = "smooth";
    }

    // Add event listeners
    container.addEventListener("scroll", handleScroll);
    container.addEventListener("mouseenter", () => setIsHovered(true));
    container.addEventListener("mouseleave", () => setIsHovered(false));

    // GSAP entrance animation
    const tl = gsap.timeline();
    tl.fromTo(
      container,
      {
        opacity: 0,
        y: 20,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
      }
    );

    // Animate scrollbar appearance
    if (showOnHover) {
      tl.to(
        container,
        {
          duration: 0.3,
          ease: "power2.out",
          "--scrollbar-opacity": isHovered ? 1 : 0.3,
        },
        "-=0.3"
      );
    }

    // Cleanup
    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("mouseenter", () => setIsHovered(true));
      container.removeEventListener("mouseleave", () => setIsHovered(false));
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [
    trackColor,
    thumbColor,
    thumbHoverColor,
    cornerColor,
    width,
    borderRadius,
    showOnHover,
    smoothScrolling,
    isHovered,
  ]);

  return (
    <div
      ref={containerRef}
      className={`gsap-scrollbar-container ${className}`}
      style={
        {
          "--scrollbar-opacity": isHovered ? 1 : 0.7,
        } as React.CSSProperties
      }
    >
      {children}

      {/* Scroll progress indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-50 transition-opacity duration-300 z-50"
        style={{
          width: `${scrollProgress * 100}%`,
          opacity: isHovered ? 0.8 : 0.3,
        }}
      />
    </div>
  );
};

export default GSAPScrollbar;
