import React, { useState, useRef, useEffect } from "react";

interface MobileSwiperProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const MobileSwiper: React.FC<MobileSwiperProps> = ({
  children,
  isOpen,
  onClose,
  title,
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(85); // Default height in vh
  const swiperRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    const windowHeight = window.innerHeight;

    // Calculate new height based on drag direction
    const heightChange = -(deltaY / windowHeight) * 100; // Convert to vh percentage
    const newHeight = Math.max(30, Math.min(100, currentHeight + heightChange));

    setCurrentHeight(newHeight);
    setDragY(0); // Reset drag offset since we're changing height
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // If dragged down significantly and height is small, close the swiper
    if (currentHeight < 40) {
      onClose();
      setCurrentHeight(85); // Reset to default
    }

    setDragY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaY = e.clientY - startY;
    const windowHeight = window.innerHeight;

    const heightChange = -(deltaY / windowHeight) * 100;
    const newHeight = Math.max(30, Math.min(100, currentHeight + heightChange));

    setCurrentHeight(newHeight);
    setDragY(0);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (currentHeight < 40) {
      onClose();
      setCurrentHeight(85);
    }

    setDragY(0);
  };

  // Add global mouse events for desktop
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove as any);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, currentHeight, startY]);

  // Reset height when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentHeight(85);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
        onClick={onClose}
      />

      {/* Swiper */}
      <div
        ref={swiperRef}
        className="fixed bottom-0 left-0 right-0 bg-gray-dark rounded-t-xl shadow-2xl z-50 sm:hidden transform transition-all duration-300 ease-out"
        style={{
          transform: `translateY(${Math.max(0, dragY)}px)`,
          height: `${currentHeight}vh`,
          maxHeight: `${currentHeight}vh`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-16 h-1.5 bg-gray-500 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-hidden"
          style={{ height: `calc(${currentHeight}vh - 80px)` }}
        >
          {children}
        </div>
      </div>
    </>
  );
};
