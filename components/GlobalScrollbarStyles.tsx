import React, { useEffect } from "react";

const GlobalScrollbarStyles: React.FC = () => {
  useEffect(() => {
    // Create global scrollbar styles
    const styleId = "global-custom-scrollbar-styles";
    const existingStyle = document.getElementById(styleId);

    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = styleId;

    style.textContent = `
      /* Global smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      /* Force custom scrollbar styles with higher specificity */
      *, *::before, *::after {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(107, 114, 128, 0.6) rgba(31, 41, 55, 0.3) !important;
      }
      
      *::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
        background: transparent !important;
      }
      
      *::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.3) !important;
        border-radius: 4px !important;
        box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1) !important;
      }
      
      *::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.6) !important;
        border-radius: 4px !important;
        transition: background-color 0.2s ease !important;
        border: 1px solid rgba(31, 41, 55, 0.3) !important;
      }
      
      *::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.8) !important;
      }
      
      *::-webkit-scrollbar-thumb:active {
        background: rgba(209, 213, 219, 0.9) !important;
      }
      
      *::-webkit-scrollbar-corner {
        background: rgba(31, 41, 55, 0.3) !important;
      }
      
      /* Thin scrollbar variant */
      .scrollbar-thin {
        scrollbar-width: thin;
        scrollbar-color: rgba(107, 114, 128, 0.5) rgba(31, 41, 55, 0.2);
      }
      
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      .scrollbar-thin::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.2);
        border-radius: 3px;
      }
      
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.5);
        border-radius: 3px;
        transition: background-color 0.2s ease;
      }
      
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.7);
      }
      
      /* Minimal scrollbar variant */
      .scrollbar-minimal {
        scrollbar-width: thin;
        scrollbar-color: rgba(107, 114, 128, 0.3) rgba(31, 41, 55, 0.1);
      }
      
      .scrollbar-minimal::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      
      .scrollbar-minimal::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.1);
        border-radius: 2px;
      }
      
      .scrollbar-minimal::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.3);
        border-radius: 2px;
        transition: background-color 0.2s ease;
      }
      
      .scrollbar-minimal::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
      }
      
      /* Hide scrollbar on mobile devices */
      @media (max-width: 768px) {
        *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 3px;
          height: 3px;
        }
        
        .scrollbar-minimal::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }
      }
      
      /* Dark theme scrollbar */
      .dark-scrollbar {
        scrollbar-color: rgba(75, 85, 99, 0.6) rgba(17, 24, 39, 0.4);
      }
      
      .dark-scrollbar::-webkit-scrollbar-track {
        background: rgba(17, 24, 39, 0.4);
      }
      
      .dark-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(75, 85, 99, 0.6);
      }
      
      .dark-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(107, 114, 128, 0.8);
      }
      
      .dark-scrollbar::-webkit-scrollbar-corner {
        background: rgba(17, 24, 39, 0.4);
      }
    `;

    document.head.appendChild(style);

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default GlobalScrollbarStyles;
