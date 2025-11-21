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
      
      /* Force custom scrollbar styles with higher specificity - Firefox */
      *, *::before, *::after {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(107, 114, 128, 0.6) rgba(31, 41, 55, 0.3) !important;
        -ms-overflow-style: -ms-autohiding-scrollbar !important;
      }
      
      /* Webkit scrollbar - Chrome, Edge, Safari */
      *::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      *::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.3) !important;
        border-radius: 4px !important;
        box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1) !important;
        -webkit-box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1) !important;
      }
      
      *::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.6) !important;
        border-radius: 4px !important;
        -webkit-border-radius: 4px !important;
        transition: background-color 0.2s ease !important;
        -webkit-transition: background-color 0.2s ease !important;
        border: 1px solid rgba(31, 41, 55, 0.3) !important;
        -webkit-box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.1) !important;
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
      
      /* Edge specific - ensure scrollbar is visible */
      @supports (-ms-ime-align: auto) {
        * {
          -ms-overflow-style: -ms-autohiding-scrollbar !important;
        }
        
        *::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
      }
      
      /* Thin scrollbar variant */
      .scrollbar-thin {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(107, 114, 128, 0.5) rgba(31, 41, 55, 0.2) !important;
        -ms-overflow-style: -ms-autohiding-scrollbar !important;
      }
      
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px !important;
        height: 6px !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      .scrollbar-thin::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.2) !important;
        border-radius: 3px !important;
        -webkit-border-radius: 3px !important;
      }
      
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.5) !important;
        border-radius: 3px !important;
        -webkit-border-radius: 3px !important;
        transition: background-color 0.2s ease !important;
        -webkit-transition: background-color 0.2s ease !important;
      }
      
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.7) !important;
      }
      
      /* Minimal scrollbar variant */
      .scrollbar-minimal {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(107, 114, 128, 0.3) rgba(31, 41, 55, 0.1) !important;
        -ms-overflow-style: -ms-autohiding-scrollbar !important;
      }
      
      .scrollbar-minimal::-webkit-scrollbar {
        width: 4px !important;
        height: 4px !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      .scrollbar-minimal::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.1) !important;
        border-radius: 2px !important;
        -webkit-border-radius: 2px !important;
      }
      
      .scrollbar-minimal::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.3) !important;
        border-radius: 2px !important;
        -webkit-border-radius: 2px !important;
        transition: background-color 0.2s ease !important;
        -webkit-transition: background-color 0.2s ease !important;
      }
      
      .scrollbar-minimal::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5) !important;
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
        scrollbar-width: thin !important;
        scrollbar-color: rgba(75, 85, 99, 0.6) rgba(17, 24, 39, 0.4) !important;
        -ms-overflow-style: -ms-autohiding-scrollbar !important;
      }
      
      .dark-scrollbar::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      .dark-scrollbar::-webkit-scrollbar-track {
        background: rgba(17, 24, 39, 0.4) !important;
        border-radius: 4px !important;
        -webkit-border-radius: 4px !important;
      }
      
      .dark-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(75, 85, 99, 0.6) !important;
        border-radius: 4px !important;
        -webkit-border-radius: 4px !important;
        transition: background-color 0.2s ease !important;
        -webkit-transition: background-color 0.2s ease !important;
      }
      
      .dark-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(107, 114, 128, 0.8) !important;
      }
      
      .dark-scrollbar::-webkit-scrollbar-corner {
        background: rgba(17, 24, 39, 0.4) !important;
      }
      
      /* Custom scrollbar class - specifically for custom-scrollbar elements */
      .custom-scrollbar {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(107, 114, 128, 0.6) rgba(31, 41, 55, 0.3) !important;
        -ms-overflow-style: -ms-autohiding-scrollbar !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
        background: transparent !important;
        -webkit-appearance: none !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.3) !important;
        border-radius: 4px !important;
        -webkit-border-radius: 4px !important;
        box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1) !important;
        -webkit-box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1) !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.6) !important;
        border-radius: 4px !important;
        -webkit-border-radius: 4px !important;
        transition: background-color 0.2s ease !important;
        -webkit-transition: background-color 0.2s ease !important;
        border: 1px solid rgba(31, 41, 55, 0.3) !important;
        -webkit-box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.1) !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.8) !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:active {
        background: rgba(209, 213, 219, 0.9) !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-corner {
        background: rgba(31, 41, 55, 0.3) !important;
      }
      
      /* Mobile responsive for custom-scrollbar */
      @media (max-width: 768px) {
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
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
