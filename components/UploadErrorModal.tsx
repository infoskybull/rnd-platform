import React from "react";

interface UploadErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
}

const UploadErrorModal: React.FC<UploadErrorModalProps> = ({
  isOpen,
  onClose,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Upload Failed
        </h2>

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-6">{errorMessage}</p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UploadErrorModal;
