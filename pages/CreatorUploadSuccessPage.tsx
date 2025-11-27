import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";

interface CreatorUploadSuccessPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorUploadSuccessPage: React.FC<CreatorUploadSuccessPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<number>(2);
  const [packagePrices, setPackagePrices] = useState({
    1: "100",
    2: "500",
    3: "5000",
  });

  const packages = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ];

  const handlePackageSelect = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handlePackagePriceChange = (packageId: number, price: string) => {
    setPackagePrices((prev) => ({
      ...prev,
      [packageId]: price,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">Web name</div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                150
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Upload successful
          </h1>
          <p className="text-lg text-gray-700">
            Select the following sales package:
          </p>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => handlePackageSelect(pkg.id)}
              className={`bg-white rounded-lg p-6 cursor-pointer transition-all ${
                selectedPackage === pkg.id
                  ? "border-2 border-blue-600 shadow-lg"
                  : "border border-gray-300 hover:border-gray-400"
              }`}
            >
              {/* Package Icon */}
              <div className="flex justify-center mb-4">
                <svg
                  className={`w-16 h-16 ${
                    selectedPackage === pkg.id ? "text-blue-600" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>

              {/* Package Title */}
              <div
                className={`text-xl font-semibold text-center mb-4 ${
                  selectedPackage === pkg.id ? "text-blue-600" : "text-gray-700"
                }`}
              >
                Package {pkg.id}
              </div>

              {/* Package Description */}
              <div className="space-y-2 mb-6">
                <div className="text-sm text-gray-500">Package description content</div>
                <div className="text-sm text-gray-500">Package description content</div>
                <div className="text-sm text-gray-500">Package description content</div>
              </div>

              {/* Set Selling Price */}
              <div
                className={`mb-4 ${
                  selectedPackage === pkg.id
                    ? "bg-blue-600 text-white rounded-lg p-3"
                    : ""
                }`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    selectedPackage === pkg.id ? "text-white" : "text-gray-900"
                  }`}
                >
                  Set selling price
                </div>
              </div>

              {/* Price Input */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">USD</span>
                <input
                  type="text"
                  value={packagePrices[pkg.id as keyof typeof packagePrices]}
                  onChange={(e) =>
                    handlePackagePriceChange(pkg.id, e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 relative">
          <button
            onClick={() => navigate("/dashboard/creator/upload")}
            className="absolute left-0 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => navigate("/dashboard/creator/dashboard")}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatorUploadSuccessPage;

