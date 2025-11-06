import React, { useState } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
  Eye,
} from "lucide-react";

interface GalleryItem {
  url: string;
  type: "image" | "video";
}

interface ProjectGalleryProps {
  attachments: string[];
  thumbnail?: string;
}

const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  attachments,
  thumbnail,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Combine thumbnail and attachments, filtering out invalid URLs
  const galleryItems: GalleryItem[] = [
    ...(thumbnail ? [{ url: thumbnail, type: "image" as const }] : []),
    ...attachments
      .filter((url) => url && typeof url === "string" && url.startsWith("http"))
      .map((url) => ({
        url,
        type:
          url.includes(".mp4") ||
          url.includes(".avi") ||
          url.includes(".mov") ||
          url.includes(".webm")
            ? ("video" as const)
            : ("image" as const),
      })),
  ];

  // Remove duplicates
  const uniqueItems = galleryItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.url === item.url)
  );

  if (uniqueItems.length === 0) {
    return null;
  }

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsPlaying(false);
  };

  const closeModal = () => {
    setSelectedIndex(null);
    setIsPlaying(false);
  };

  const nextItem = () => {
    if (selectedIndex !== null && selectedIndex < uniqueItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setIsPlaying(false);
    }
  };

  const prevItem = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
        <h2 className="text-xl font-bold text-white mb-4">Project Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uniqueItems.map((item, index) => (
            <div
              key={index}
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border border-gray-600 hover:border-indigo-500 transition-colors"
              onClick={() => openModal(index)}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={`Gallery item ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="relative w-full h-full bg-gray-700 flex items-center justify-center">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    poster={item.url}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.type === "video" ? (
                    <Play className="w-8 h-8 text-white" />
                  ) : (
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {uniqueItems.length > 1 && (
              <>
                <button
                  onClick={prevItem}
                  disabled={selectedIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextItem}
                  disabled={selectedIndex === uniqueItems.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Content */}
            <div className="flex items-center justify-center h-full">
              {uniqueItems[selectedIndex].type === "image" ? (
                <img
                  src={uniqueItems[selectedIndex].url}
                  alt={`Gallery item ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="relative w-full max-w-4xl">
                  <video
                    src={uniqueItems[selectedIndex].url}
                    className="w-full h-auto max-h-[80vh]"
                    controls
                    autoPlay={isPlaying}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              )}
            </div>

            {/* Counter */}
            {uniqueItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {uniqueItems.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectGallery;
