import React, { useState, useRef, useEffect, useCallback } from "react";

interface ResizableDividerProps {
  onResize?: (leftWidth: number, rightWidth: number) => void;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  minRightWidth?: number;
  maxRightWidth?: number;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  initialLeftWidth,
  minLeftWidth = 300,
  maxLeftWidth = 1200,
  minRightWidth = 300,
  maxRightWidth = 800,
  containerRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth || 600);
  const dividerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dividerRef.current) return;

      const container =
        containerRef?.current || dividerRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const rawLeftWidth = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;
      const dividerWidth = 8; // Divider width and gap

      // Calculate available space for both sections
      const availableWidth = containerWidth - dividerWidth;

      // Calculate what the right width would be with the raw left width
      const rawRightWidth = availableWidth - rawLeftWidth;

      // Determine direction of drag to prioritize constraints
      const isDraggingLeft = rawLeftWidth < leftWidth;

      let finalLeftWidth = rawLeftWidth;
      let finalRightWidth = rawRightWidth;

      // If dragging left (reducing left section), prioritize left min constraint
      // If dragging right (increasing left section), prioritize right min constraint
      if (isDraggingLeft) {
        // When dragging left, ensure left doesn't go below min
        if (finalLeftWidth < minLeftWidth) {
          finalLeftWidth = minLeftWidth;
          finalRightWidth = availableWidth - finalLeftWidth;
        }
        // Then check if right exceeds max
        if (finalRightWidth > maxRightWidth) {
          finalRightWidth = maxRightWidth;
          finalLeftWidth = availableWidth - finalRightWidth;
        }
        // Ensure right doesn't go below min
        if (finalRightWidth < minRightWidth) {
          finalRightWidth = minRightWidth;
          finalLeftWidth = availableWidth - finalRightWidth;
        }
      } else {
        // When dragging right, ensure right doesn't go below min
        if (finalRightWidth < minRightWidth) {
          finalRightWidth = minRightWidth;
          finalLeftWidth = availableWidth - finalRightWidth;
        }
        // Then check if left exceeds max
        if (finalLeftWidth > maxLeftWidth) {
          finalLeftWidth = maxLeftWidth;
          finalRightWidth = availableWidth - finalLeftWidth;
        }
        // Ensure left doesn't go below min
        if (finalLeftWidth < minLeftWidth) {
          finalLeftWidth = minLeftWidth;
          finalRightWidth = availableWidth - finalLeftWidth;
        }
      }

      // Final validation - both must be within their constraints
      if (
        finalLeftWidth >= minLeftWidth &&
        finalLeftWidth <= maxLeftWidth &&
        finalRightWidth >= minRightWidth &&
        finalRightWidth <= maxRightWidth
      ) {
        setLeftWidth(finalLeftWidth);
        onResize?.(finalLeftWidth, finalRightWidth);
      }
    },
    [
      isDragging,
      leftWidth,
      minLeftWidth,
      maxLeftWidth,
      minRightWidth,
      maxRightWidth,
      onResize,
      containerRef,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update left width when initialLeftWidth changes
  useEffect(() => {
    if (initialLeftWidth !== undefined && initialLeftWidth !== leftWidth) {
      setLeftWidth(initialLeftWidth);
      // Calculate and notify right width
      const container =
        containerRef?.current || dividerRef.current?.parentElement;
      if (container) {
        const containerWidth = container.getBoundingClientRect().width;
        const newRightWidth = containerWidth - initialLeftWidth - 8; // 8px for divider and gap
        if (newRightWidth >= minRightWidth && newRightWidth <= maxRightWidth) {
          onResize?.(initialLeftWidth, newRightWidth);
        }
      }
    }
  }, [
    initialLeftWidth,
    leftWidth,
    minRightWidth,
    maxRightWidth,
    onResize,
    containerRef,
  ]);

  return (
    <div
      ref={dividerRef}
      onMouseDown={handleMouseDown}
      className={`flex-shrink-0 w-2 cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors ${
        isDragging ? "bg-blue-500" : ""
      }`}
      style={{
        touchAction: "none",
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-1 h-8 bg-gray-400 rounded"></div>
      </div>
    </div>
  );
};

export default ResizableDivider;
