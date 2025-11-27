import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import CustomCheckbox from "../components/CustomCheckbox";
import FileUploadSection from "../components/FileUploadSection";

interface CreatorUploadPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorUploadPage: React.FC<CreatorUploadPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [platform, setPlatform] = useState("Mobile");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<number[]>([1, 2, 3]);
  const [packagePrices, setPackagePrices] = useState({
    1: "100",
    2: "500",
    3: "5000",
  });
  const [videoUploadProgress, setVideoUploadProgress] = useState(30);
  const [videoFileName, setVideoFileName] = useState("Name.mp4");
  const [videoFileSize, setVideoFileSize] = useState("1.2MB/1.2MB");
  const [appIconFiles, setAppIconFiles] = useState<File[]>([]);
  const [featureImageFiles, setFeatureImageFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const availableTags = ["Puzzle", "RPG", "Hyper casual", "Casual"];
  const platforms = ["Mobile", "PC", "Console", "Web", "Smart TV"];
  const genres = [
    "Action",
    "Adventure",
    "Arcade",
    "Board",
    "Card",
    "Casino",
    "Casual",
    "Educational",
    "Music",
    "Puzzle",
    "Racing",
    "Role playing",
    "Simulation",
    "Sports",
    "Strategy",
    "Trivia",
    "Word",
  ];

  const packages = [
    {
      id: 1,
      name: "Pay to view",
      contents: [
        "Publisher will pay to view the app",
        "No ownership of the Idea is granted to the Publisher.",
      ],
    },
    {
      id: 2,
      name: "Pay per Prototype",
      contents: [
        "100% of the copyright is transferred to the Publisher",
        "The Creator is not permitted to reproduce or duplicate the work in any form",
      ],
    },
    {
      id: 3,
      name: "Collaboration",
      contents: [
        "70% ownership is transferred to the Publisher",
        "The Creator will receive this payment for Prototype development",
      ],
    },
  ];

  const handleTagAdd = (tag: string) => {
    if (tags.length < 5 && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && tags.length < 5) {
        if (!tags.includes(trimmedTag)) {
          setTags([...tags, trimmedTag]);
          setTagInput("");
        } else {
          // Tag đã tồn tại, chỉ clear input
          setTagInput("");
        }
      }
    }
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleGenreRemove = (genre: string) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== genre));
  };

  const handlePackageToggle = (packageId: number) => {
    setSelectedPackages((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handlePackagePriceChange = (packageId: number, price: string) => {
    // Only allow numbers (digits)
    const numericValue = price.replace(/\D/g, "");
    setPackagePrices((prev) => ({
      ...prev,
      [packageId]: numericValue,
    }));
  };

  // Close dropdowns when clicking outside
  const platformRef = useRef<HTMLDivElement>(null);
  const genreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        platformRef.current &&
        !platformRef.current.contains(event.target as Node)
      ) {
        setShowPlatformDropdown(false);
      }
      if (
        genreRef.current &&
        !genreRef.current.contains(event.target as Node)
      ) {
        setShowGenreDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="w-full bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              {/* Logo placeholder */}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/dashboard/creator/dashboard")}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => navigate("/dashboard/creator/use-ai")}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Use A.I
              </button>
              <button
                onClick={() => navigate("/dashboard/creator/upload")}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium flex items-center gap-2"
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload
              </button>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Right Side - Icons */}
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
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                150
              </span>
            </div>
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                150
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer">
              {/* User profile placeholder */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-2 flex gap-1 bg-[#EEEEEE]">
        {/* Left Section - Form */}
        <div className="flex-1 overflow-hidden pr-3 bg-white p-8 rounded-lg flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Unnamed</h1>

            {/* Short Description */}
            <div className="mb-6 p-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short description
              </label>
              <input
                type="text"
                placeholder="Write a short description"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* Long Description */}
            <div className="mb-6 p-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Long description
              </label>
              <textarea
                placeholder="Enter description"
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 p-2">
              {/* Tags */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-semibold text-gray-900 relative flex-shrink-0">
                    Tags
                  </label>
                  {tags.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto flex-1 min-w-0 px-4">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-[10%] bg-gray-100 border border-gray-300 text-gray-700 text-sm whitespace-nowrap flex-shrink-0"
                        >
                          #{tag}
                          <button
                            onClick={() => handleTagRemove(tag)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Maximum 5 tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyPress}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
                />
              </div>

              {/* Platform */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Platform
                </label>
                <div className="relative" ref={platformRef}>
                  <input
                    type="text"
                    value={platform}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-600 pr-12 cursor-pointer"
                    onClick={() =>
                      setShowPlatformDropdown(!showPlatformDropdown)
                    }
                  />
                  {platform && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlatform("");
                        setShowPlatformDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                    >
                      <svg
                        className="w-3 h-3 text-gray-600"
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
                  )}
                  {showPlatformDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {platforms.map((p) => (
                        <div
                          key={p}
                          onClick={() => {
                            setPlatform(p);
                            setShowPlatformDropdown(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            platform === p
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Genre */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Genre
                </label>
                <div className="relative" ref={genreRef}>
                  <div
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white text-gray-600 min-h-[42px] cursor-pointer flex items-center flex-wrap gap-2"
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  >
                    {selectedGenres.length > 0 ? (
                      selectedGenres.map((g) => (
                        <span
                          key={g}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-700 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenreRemove(g);
                          }}
                        >
                          {g}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenreRemove(g);
                            }}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">Select genres</span>
                    )}
                  </div>
                  {showGenreDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {genres.map((g) => (
                        <div
                          key={g}
                          onClick={() => handleGenreToggle(g)}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${
                            selectedGenres.includes(g)
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedGenres.includes(g)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {selectedGenres.includes(g) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Set Selling Price */}
            <div className="mb-6 p-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Set selling price
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select the following sales package:
              </p>

              <div className="grid grid-cols-3 gap-4 items-stretch">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex flex-col relative h-full">
                    <div
                      onClick={() => handlePackageToggle(pkg.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors flex flex-col flex-1 ${
                        selectedPackages.includes(pkg.id)
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {/* Checkbox in top right */}
                      <div className="absolute top-3 right-3 z-10">
                        <CustomCheckbox
                          checked={selectedPackages.includes(pkg.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handlePackageToggle(pkg.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="font-semibold text-gray-900 mb-3 pr-6 relative">
                        {pkg.name}
                      </div>
                      <div className="space-y-1 mb-4 flex-1">
                        {pkg.contents.map((content, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            <span style={{ color: "#1C8EF9" }}>•</span>{" "}
                            {content}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Price Display - Separate box below */}
                    <div
                      className={`border-2 rounded-lg p-4 mt-2 transition-colors ${
                        selectedPackages.includes(pkg.id)
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-2 justify-between">
                        <span
                          className="text-gray-600"
                          style={{
                            fontFamily: "Istok Web",
                            fontWeight: 700,
                            fontSize: "20px",
                            lineHeight: "100%",
                            letterSpacing: "0%",
                          }}
                        >
                          USD
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={
                            packagePrices[pkg.id as keyof typeof packagePrices]
                          }
                          onChange={(e) =>
                            handlePackagePriceChange(pkg.id, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          className={`flex-1 text-2xl font-bold bg-transparent border-none outline-none focus:outline-none p-0 w-auto min-w-[60px] max-w-[120px] text-right rounded ${
                            selectedPackages.includes(pkg.id)
                              ? "text-gray-900 focus:ring-1 focus:ring-blue-500"
                              : "text-gray-900 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Upload */}
        <div className="w-96 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-2 pr-3 px-4 rounded-lg">
            {/* App Icon */}
            <FileUploadSection
              title="App Icon"
              required={true}
              format="JPEG; JPG; PNG;"
              size="512x512 pixels"
              maxFiles={1}
              currentFiles={appIconFiles.length}
              acceptedFileTypes="image/jpeg,image/jpg,image/png"
              onFilesChange={setAppIconFiles}
              maxFileSize={5 * 1024 * 1024} // 5MB
            />

            {/* Feature Image */}
            <FileUploadSection
              title="Feature Image"
              required={true}
              format="JPEG; JPG; PNG;"
              size="512x512 pixels"
              maxFiles={1}
              currentFiles={featureImageFiles.length}
              acceptedFileTypes="image/jpeg,image/jpg,image/png"
              onFilesChange={setFeatureImageFiles}
              maxFileSize={5 * 1024 * 1024} // 5MB
            />

            {/* Attachment */}
            <FileUploadSection
              title="Attachment"
              required={false}
              format="JPEG; JPG; PNG;"
              size="512x512 pixels"
              maxFiles={5}
              currentFiles={attachmentFiles.length}
              acceptedFileTypes="image/jpeg,image/jpg,image/png"
              onFilesChange={setAttachmentFiles}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="space-y-3 pt-4 flex-shrink-0 border-t border-gray-200 mt-4 px-4">
            <button
              className="w-full px-4 py-3 bg-[#BEBEBE] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => navigate("/dashboard/creator/use-ai")}
              style={{
                fontFamily: "Istok Web",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "20px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              Cancel
            </button>
            <button
              className="w-full px-4 py-3 bg-[#BEBEBE] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              style={{
                fontFamily: "Istok Web",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "20px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              Save as draft
            </button>
            <button
              onClick={() => navigate("/dashboard/creator/upload-success")}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              style={{
                fontFamily: "Istok Web",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "20px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorUploadPage;
