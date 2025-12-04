import React, { useState, useEffect, useRef } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { User, GameProject } from "../types";
import { apiService } from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import {
  getNavigationItems,
  getDefaultRightIcons,
} from "../utils/navbarConfig";
import CustomCheckbox from "../components/CustomCheckbox";
import FileUploadSection from "../components/FileUploadSection";
import PrototypeUploadSection from "../components/PrototypeUploadSection";
import ResizableDivider from "../components/ResizableDivider";
import UploadErrorModal from "../components/UploadErrorModal";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { suggestTags } from "../services/geminiService";
import { setProjectName as setProjectNameAction } from "../store/aiPageSlice";
import {
  setUploadPayload,
  updateUploadPayload,
  setUploadStatus,
} from "../store/uploadSlice";
import { useFileUpload } from "../hooks/useFileUpload";
import { useProjectCreation } from "../hooks/useProjectCreation";
import {
  detectProjectFormat,
  compressFilesToZip,
} from "../utils/projectAnalyzer";

interface UploadPageProps {
  user: User;
  onLogout: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const aiPageState = useAppSelector((state) => state.aiPage);
  const uploadState = useAppSelector((state) => state.upload);

  // Check if type=file query parameter exists
  const isFileUploadType = searchParams.get("type") === "file";
  // Check if scale=devider query parameter exists (for showing resizable divider)
  const isDividerEnabled = searchParams.get("scale") === "devider";

  // Reset prototype files when type=file is not present
  useEffect(() => {
    if (!isFileUploadType) {
      setPrototypeFiles([]);
      setPrototypeFileKey("");
    }
  }, [isFileUploadType]);

  // Use local state for project name to avoid cache issues
  const [localProjectName, setLocalProjectName] = useState<string>("");

  // Get project name: use local state if set, otherwise from Redux store (for AI page navigation)
  const projectNameFromStore = aiPageState.projectName || "";
  const projectName =
    localProjectName ||
    (projectNameFromStore === "Project name" ||
    projectNameFromStore === "Unnamed"
      ? ""
      : projectNameFromStore);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [editProject, setEditProject] = useState<GameProject | null>(null);

  // Get data from navigation state (from AI page)
  const navigationState = location.state as {
    generatedCode?: string;
    projectName?: string;
    source?: string;
    uploadedFileKey?: string;
    uploadedFileUrl?: string;
    detectedFormat?: "react" | "webgl" | "html";
  } | null;
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [platform, setPlatform] = useState("Mobile"); // Default to first platform
  const [selectedGenre, setSelectedGenre] = useState("Action"); // Default to first genre
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<number[]>([1]); // Package 1 (Pay to view) is always available
  const [packagePrices, setPackagePrices] = useState({
    1: "0", // Pay to view - default 0 for free viewing
    2: "", // Pay per Prototype
    3: "", // Collaboration
  });
  const [repoFormat, setRepoFormat] = useState<"react" | "webgl" | "html">(
    "html"
  );
  const [appIconFiles, setAppIconFiles] = useState<File[]>([]);
  const [appIconFileKey, setAppIconFileKey] = useState<string>("");
  const [featureImageFiles, setFeatureImageFiles] = useState<File[]>([]);
  const [featureImageFileKey, setFeatureImageFileKey] = useState<string>("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentFileKeys, setAttachmentFileKeys] = useState<string[]>([]);
  const [prototypeFiles, setPrototypeFiles] = useState<File[]>([]);
  const [prototypeFileKey, setPrototypeFileKey] = useState<string>("");
  const [leftSectionWidth, setLeftSectionWidth] = useState<number | null>(null);
  const [rightSectionWidth, setRightSectionWidth] = useState<number | null>(
    null
  );
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Calculate initial widths based on container size (only when divider is enabled)
  useEffect(() => {
    // Only calculate widths if divider is enabled
    if (!isFileUploadType || !isDividerEnabled) {
      return;
    }

    const calculateInitialWidths = () => {
      if (
        mainContentRef.current &&
        leftSectionWidth === null &&
        rightSectionWidth === null
      ) {
        // Use both offsetWidth and getBoundingClientRect for better accuracy
        const containerElement = mainContentRef.current;
        const containerWidth = Math.max(
          containerElement.offsetWidth,
          containerElement.getBoundingClientRect().width
        );

        // Only calculate if container has valid width (at least 600px to ensure both sections fit)
        if (containerWidth >= 600) {
          // Default: left takes remaining space, right is 384px (w-96)
          const defaultRightWidth = 384;
          const defaultLeftWidth = containerWidth - defaultRightWidth - 8; // 8px for divider and gap

          // Ensure minimum widths
          const finalLeftWidth = Math.max(300, defaultLeftWidth);
          const finalRightWidth = containerWidth - finalLeftWidth - 8;

          setLeftSectionWidth(finalLeftWidth);
          setRightSectionWidth(Math.max(300, finalRightWidth));
        }
      }
    };

    // Use multiple strategies to ensure calculation happens after DOM is ready
    const tryCalculate = () => {
      // Strategy 1: requestAnimationFrame (waits for next paint)
      requestAnimationFrame(() => {
        calculateInitialWidths();

        // Strategy 2: If still not calculated, try after multiple delays
        if (leftSectionWidth === null && rightSectionWidth === null) {
          setTimeout(() => {
            calculateInitialWidths();
            // Strategy 3: One more try after a longer delay
            if (leftSectionWidth === null && rightSectionWidth === null) {
              setTimeout(calculateInitialWidths, 300);
            }
          }, 50);
        }
      });
    };

    // Start calculation
    tryCalculate();

    // Also try on window resize
    const handleResize = () => {
      if (leftSectionWidth === null && rightSectionWidth === null) {
        calculateInitialWidths();
      }
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver to watch for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (mainContentRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            if (leftSectionWidth === null && rightSectionWidth === null) {
              calculateInitialWidths();
            }
          }
        }
      });
      resizeObserver.observe(mainContentRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [leftSectionWidth, rightSectionWidth, isFileUploadType, isDividerEnabled]);
  const [validationErrors, setValidationErrors] = useState({
    projectName: false,
    shortDescription: false,
    longDescription: false,
    tags: false,
    platform: false,
    genre: false,
    sellingPrice: false,
    appIcon: false,
    featureImage: false,
  });
  const [projectNameWarning, setProjectNameWarning] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showUploadErrorModal, setShowUploadErrorModal] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { uploadFile } = useFileUpload();
  const { createProject, creating } = useProjectCreation();

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
      if (validationErrors.tags) {
        setValidationErrors((prev) => ({
          ...prev,
          tags: false,
        }));
      }
    }
  };

  const handleTagRemove = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    // Note: We don't clear validation error here because removing a tag might make it invalid again
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && tags.length < 5) {
        if (!tags.includes(trimmedTag)) {
          setTags([...tags, trimmedTag]);
          setTagInput("");
          setShowTagSuggestions(false);
          if (validationErrors.tags) {
            setValidationErrors((prev) => ({
              ...prev,
              tags: false,
            }));
          }
        } else {
          // Tag đã tồn tại, chỉ clear input
          setTagInput("");
          setShowTagSuggestions(false);
        }
      }
    } else if (e.key === "Escape") {
      setShowTagSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (tags.length < 5 && !tags.includes(suggestion)) {
      setTags([...tags, suggestion]);
      setTagInput("");
      setShowTagSuggestions(false);
      if (validationErrors.tags) {
        setValidationErrors((prev) => ({
          ...prev,
          tags: false,
        }));
      }
    }
  };

  const handlePackageToggle = (packageId: number) => {
    setSelectedPackages((prev) => {
      const wasSelected = prev.includes(packageId);
      const newSelected = wasSelected
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId];

      // Clear validation error when toggling packages if all selected packages have valid prices
      if (validationErrors.sellingPrice) {
        // If no package is selected, keep error
        if (newSelected.length === 0) {
          // Keep error
        } else {
          // Check all selected packages have price > 0
          let allValid = true;
          if (newSelected.includes(1)) {
            const price1 = parseFloat(packagePrices[1] || "0");
            if (price1 <= 0) allValid = false;
          }
          if (newSelected.includes(2)) {
            const price2 = parseFloat(packagePrices[2] || "0");
            if (price2 <= 0) allValid = false;
          }
          if (newSelected.includes(3)) {
            const price3 = parseFloat(packagePrices[3] || "0");
            if (price3 <= 0) allValid = false;
          }
          if (allValid) {
            setValidationErrors((prev) => ({
              ...prev,
              sellingPrice: false,
            }));
          }
        }
      }

      // Auto focus on price input when package is selected (not deselected)
      if (!wasSelected && newSelected.includes(packageId)) {
        setTimeout(() => {
          const priceInputRef =
            packagePriceRefs[packageId as keyof typeof packagePriceRefs];
          if (priceInputRef?.current) {
            priceInputRef.current.focus();
            priceInputRef.current.select(); // Select all text for easy replacement
          }
        }, 100);
      }

      return newSelected;
    });
  };

  const handlePackagePriceChange = (packageId: number, price: string) => {
    // Only allow numbers (digits)
    const numericValue = price.replace(/\D/g, "");
    setPackagePrices((prev) => ({
      ...prev,
      [packageId]: numericValue,
    }));
    // Clear validation error if all selected packages now have valid prices (> 0)
    if (validationErrors.sellingPrice) {
      // Check all selected packages have price > 0
      let allValid = true;
      if (selectedPackages.length === 0) {
        allValid = false;
      } else {
        if (selectedPackages.includes(1)) {
          const price1 = parseFloat(
            packageId === 1 ? numericValue : packagePrices[1] || "0"
          );
          if (price1 <= 0) allValid = false;
        }
        if (selectedPackages.includes(2)) {
          const price2 = parseFloat(
            packageId === 2 ? numericValue : packagePrices[2] || "0"
          );
          if (price2 <= 0) allValid = false;
        }
        if (selectedPackages.includes(3)) {
          const price3 = parseFloat(
            packageId === 3 ? numericValue : packagePrices[3] || "0"
          );
          if (price3 <= 0) allValid = false;
        }
      }
      if (allValid) {
        setValidationErrors((prev) => ({
          ...prev,
          sellingPrice: false,
        }));
      }
    }
  };

  // Close dropdowns when clicking outside
  const platformRef = useRef<HTMLDivElement>(null);
  const genreRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLDivElement>(null);
  // Refs for package price inputs
  const packagePriceRefs = {
    1: useRef<HTMLInputElement>(null),
    2: useRef<HTMLInputElement>(null),
    3: useRef<HTMLInputElement>(null),
  };

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
      if (
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target as Node)
      ) {
        setShowTagSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clear project name when entering page without ID, or when ID changes
  useEffect(() => {
    if (!id) {
      // Always clear project name when entering page without ID
      setIsEditMode(false);
      setLocalProjectName("");
      dispatch(setProjectNameAction(""));
    } else {
      // When ID exists, clear local project name first (will be set from project data)
      setLocalProjectName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load project data for edit mode
  useEffect(() => {
    const loadProjectForEdit = async () => {
      if (!id) {
        setIsEditMode(false);
        return;
      }

      try {
        setLoadingProject(true);
        setIsEditMode(true);
        const projectData = await apiService.getGameProjectById(id);
        setEditProject(projectData);

        // Map project data to form fields
        if (projectData) {
          // Set project name from project data
          if (projectData.title) {
            setLocalProjectName(projectData.title);
            dispatch(setProjectNameAction(projectData.title));
          } else {
            setLocalProjectName("");
          }

          // Set descriptions
          if (projectData.shortDescription) {
            setShortDescription(projectData.shortDescription);
          }
          if (projectData.longDescription) {
            setLongDescription(projectData.longDescription);
          }

          // Set tags
          if (projectData.tags && projectData.tags.length > 0) {
            setTags(projectData.tags);
          }

          // Set platform
          if (projectData.targetPlatform) {
            setPlatform(projectData.targetPlatform);
          }

          // Set genre
          if (projectData.gameGenre) {
            setSelectedGenre(projectData.gameGenre);
          }

          // Set repo format
          if (projectData.repoFormat) {
            setRepoFormat(projectData.repoFormat);
          }

          // Set package prices
          const prices: { 1: string; 2: string; 3: string } = {
            1: projectData.payToViewAmount?.toString() || "0",
            2: projectData.productSalePrice?.toString() || "",
            3: projectData.creatorCollaborationBudget?.toString() || "",
          };
          setPackagePrices(prices);

          // Set selected packages based on what's set
          const selected: number[] = [];
          if (projectData.payToViewAmount !== undefined) {
            selected.push(1);
          }
          if (
            projectData.productSalePrice &&
            projectData.productSalePrice > 0
          ) {
            selected.push(2);
          }
          if (
            projectData.creatorCollaborationBudget &&
            projectData.creatorCollaborationBudget > 0
          ) {
            selected.push(3);
          }
          if (selected.length > 0) {
            setSelectedPackages(selected);
          }

          // Helper function to convert URL to File object
          const urlToFile = async (
            url: string,
            filename: string
          ): Promise<File> => {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
          };

          // Set app icon if available
          if (projectData.appIcon) {
            setAppIconFileKey(projectData.appIcon);
            try {
              // Fetch and convert to File object for display
              const appIconFile = await urlToFile(
                projectData.appIcon,
                "app-icon.jpg"
              );
              setAppIconFiles([appIconFile]);
            } catch (error) {
              console.error("Error loading app icon:", error);
            }
          }

          // Set feature image (thumbnail) if available
          if (projectData.thumbnail) {
            setFeatureImageFileKey(projectData.thumbnail);
            try {
              // Fetch and convert to File object for display
              const featureImageFile = await urlToFile(
                projectData.thumbnail,
                "feature-image.jpg"
              );
              setFeatureImageFiles([featureImageFile]);
            } catch (error) {
              console.error("Error loading feature image:", error);
            }
          }

          // Set attachments if available
          if (projectData.attachments && projectData.attachments.length > 0) {
            setAttachmentFileKeys(projectData.attachments);
            try {
              // Fetch and convert all attachments to File objects for display
              const attachmentFilePromises = projectData.attachments.map(
                (url: string, index: number) =>
                  urlToFile(url, `attachment-${index + 1}.jpg`)
              );
              const attachmentFiles = await Promise.all(attachmentFilePromises);
              setAttachmentFiles(attachmentFiles);
            } catch (error) {
              console.error("Error loading attachments:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading project for edit:", error);
        showToastMessage(
          "Failed to load project data. Please try again.",
          "error"
        );
      } finally {
        setLoadingProject(false);
      }
    };

    loadProjectForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle navigation state from AI page
  useEffect(() => {
    if (navigationState?.source === "ai-generator") {
      // If coming from AI page with uploaded file
      if (navigationState.uploadedFileUrl) {
        // Set detected format if available
        if (navigationState.detectedFormat) {
          setRepoFormat(navigationState.detectedFormat);
        }

        // Show success toast
        showToastMessage("Source code uploaded successfully!", "success");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced tag suggestions
  useEffect(() => {
    if (!tagInput.trim() || tags.length >= 5) {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const suggestions = await suggestTags(tagInput, tags, {
          shortDescription,
          longDescription,
        });
        setTagSuggestions(suggestions);
        setShowTagSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
        setTagSuggestions([]);
        setShowTagSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [tagInput, tags, shortDescription, longDescription]);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  // Validation function for individual fields
  const validateField = (fieldName: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };

      switch (fieldName) {
        case "projectName": {
          const trimmedProjectName = projectName.trim();
          // Empty -> error (required)
          if (trimmedProjectName === "") {
            newErrors.projectName = true;
            setProjectNameWarning(false);
          }
          // Default value -> warning (not error)
          else if (
            trimmedProjectName === "Unnamed" ||
            trimmedProjectName === "Project name"
          ) {
            newErrors.projectName = false;
            setProjectNameWarning(true);
          }
          // Valid value -> no error, no warning
          else {
            newErrors.projectName = false;
            setProjectNameWarning(false);
          }
          break;
        }
        case "shortDescription": {
          newErrors.shortDescription = !shortDescription.trim();
          break;
        }
        case "longDescription": {
          newErrors.longDescription = !longDescription.trim();
          break;
        }
        case "tags": {
          newErrors.tags = tags.length === 0;
          break;
        }
        case "platform": {
          newErrors.platform = !platform || platform.trim() === "";
          break;
        }
        case "genre": {
          newErrors.genre = !selectedGenre || selectedGenre.trim() === "";
          break;
        }
        case "sellingPrice": {
          // If no package is selected, it's an error
          if (selectedPackages.length === 0) {
            newErrors.sellingPrice = true;
            break;
          }

          // Check each selected package - all selected packages must have price > 0
          let hasError = false;
          if (selectedPackages.includes(1)) {
            const price1 = parseFloat(packagePrices[1] || "0");
            if (price1 <= 0) {
              hasError = true;
            }
          }
          if (selectedPackages.includes(2)) {
            const price2 = parseFloat(packagePrices[2] || "0");
            if (price2 <= 0) {
              hasError = true;
            }
          }
          if (selectedPackages.includes(3)) {
            const price3 = parseFloat(packagePrices[3] || "0");
            if (price3 <= 0) {
              hasError = true;
            }
          }
          newErrors.sellingPrice = hasError;
          break;
        }
        case "appIcon": {
          // Check if app icon is uploaded (either file or fileKey exists)
          newErrors.appIcon =
            appIconFiles.length === 0 && appIconFileKey === "";
          break;
        }
        case "featureImage": {
          // Check if feature image is uploaded (either file or fileKey exists)
          newErrors.featureImage =
            featureImageFiles.length === 0 && featureImageFileKey === "";
          break;
        }
      }

      return newErrors;
    });
  };

  const handlePublish = async () => {
    // Reset validation errors
    const errors = {
      projectName: false,
      shortDescription: false,
      longDescription: false,
      tags: false,
      platform: false,
      genre: false,
      sellingPrice: false,
      appIcon: false,
      featureImage: false,
    };

    // Check if project name is still "Unnamed" or "Project name" or empty
    const trimmedProjectName = projectName.trim();
    if (
      trimmedProjectName === "" ||
      trimmedProjectName === "Unnamed" ||
      trimmedProjectName === "Project name"
    ) {
      errors.projectName = true;
    }

    // Check if short description is empty
    if (!shortDescription.trim()) {
      errors.shortDescription = true;
    }

    // Check if long description is empty
    if (!longDescription.trim()) {
      errors.longDescription = true;
    }

    // Validate tags - must have at least 1 tag
    if (tags.length === 0) {
      errors.tags = true;
    }

    // Validate platform - required
    if (!platform || platform.trim() === "") {
      errors.platform = true;
    }

    // Validate genre - required
    if (!selectedGenre || selectedGenre.trim() === "") {
      errors.genre = true;
    }

    // Validate selling price - if a package is selected, its price must be > 0
    // If no package is selected, it's an error
    if (selectedPackages.length === 0) {
      errors.sellingPrice = true;
    } else {
      // Check each selected package - all selected packages must have price > 0
      let hasError = false;
      if (selectedPackages.includes(1)) {
        const price1 = parseFloat(packagePrices[1] || "0");
        if (price1 <= 0) {
          hasError = true;
        }
      }
      if (selectedPackages.includes(2)) {
        const price2 = parseFloat(packagePrices[2] || "0");
        if (price2 <= 0) {
          hasError = true;
        }
      }
      if (selectedPackages.includes(3)) {
        const price3 = parseFloat(packagePrices[3] || "0");
        if (price3 <= 0) {
          hasError = true;
        }
      }
      errors.sellingPrice = hasError;
    }

    // Validate App Icon - required
    if (appIconFiles.length === 0 && appIconFileKey === "") {
      errors.appIcon = true;
    }

    // Validate Feature Image - required
    if (featureImageFiles.length === 0 && featureImageFileKey === "") {
      errors.featureImage = true;
    }

    // If there are any errors, show them directly on the fields
    if (
      errors.projectName ||
      errors.shortDescription ||
      errors.longDescription ||
      errors.tags ||
      errors.platform ||
      errors.genre ||
      errors.sellingPrice ||
      errors.appIcon ||
      errors.featureImage
    ) {
      setValidationErrors(errors);
      // Scroll to first error field
      setTimeout(() => {
        if (errors.projectName) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (errors.shortDescription) {
          const element = document.querySelector(
            'input[placeholder="Write a short description"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.longDescription) {
          const element = document.querySelector(
            'textarea[placeholder="Enter description"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.tags) {
          const element = document.querySelector(
            'input[placeholder="Maximum 5 tags"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.platform) {
          const element = document.querySelector(
            'input[placeholder="Select platform"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.genre) {
          const element = document.querySelector(
            'input[placeholder="Select genre"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.sellingPrice) {
          const sellingPriceSection = document.querySelector(".mb-6.p-2 h2");
          sellingPriceSection?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.appIcon) {
          const appIconSection = document.querySelector('[title="App Icon"]');
          appIconSection?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.featureImage) {
          const featureImageSection = document.querySelector(
            '[title="Feature Image"]'
          );
          featureImageSection?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
      return;
    }

    // Clear validation errors if all valid
    setValidationErrors({
      projectName: false,
      shortDescription: false,
      longDescription: false,
      tags: false,
      platform: false,
      genre: false,
      sellingPrice: false,
      appIcon: false,
      featureImage: false,
    });

    // Upload files if needed
    setUploadingFiles(true);
    try {
      // Use local variables to store fileKeys after upload (to avoid state update delay)
      let finalAppIconFileKey = appIconFileKey;
      let finalFeatureImageFileKey = featureImageFileKey;
      let finalAttachmentFileKeys = [...attachmentFileKeys];

      // Upload app icon if provided (always upload new file if user selected one)
      if (appIconFiles.length > 0) {
        const uploadResult = await uploadFile(appIconFiles[0]);
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        finalAppIconFileKey = uploadResult.fileKey;
        setAppIconFileKey(finalAppIconFileKey);
      }

      // Upload feature image (thumbnail) if provided (always upload new file if user selected one)
      if (featureImageFiles.length > 0) {
        const uploadResult = await uploadFile(featureImageFiles[0]);
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        finalFeatureImageFileKey = uploadResult.fileKey;
        setFeatureImageFileKey(finalFeatureImageFileKey);
      }

      // Upload attachments if provided
      if (attachmentFiles.length > 0) {
        const newAttachmentKeys: string[] = [];
        for (let i = 0; i < attachmentFiles.length; i++) {
          const file = attachmentFiles[i];
          // Check if this file already has a key (by index)
          if (
            i < finalAttachmentFileKeys.length &&
            finalAttachmentFileKeys[i]
          ) {
            // File already has a key, reuse it
            newAttachmentKeys.push(finalAttachmentFileKeys[i]);
          } else {
            // Upload new file
            const uploadResult = await uploadFile(file);
            if (uploadResult.error) {
              throw new Error(uploadResult.error);
            }
            newAttachmentKeys.push(uploadResult.fileKey);
          }
        }
        finalAttachmentFileKeys = newAttachmentKeys;
        setAttachmentFileKeys(finalAttachmentFileKeys);
      }

      // Map packages to project types
      const projectTypes: ("product_sale" | "dev_collaboration")[] = [];
      if (selectedPackages.includes(2)) {
        projectTypes.push("product_sale");
      }
      if (selectedPackages.includes(3)) {
        projectTypes.push("dev_collaboration");
      }

      // Get fileUrls from navigation state (from AI page) or Redux store
      // Priority: navigationState > uploadState
      const sourceFileUrls = navigationState?.uploadedFileUrl
        ? [navigationState.uploadedFileUrl]
        : uploadState.payload?.uploadUrl
        ? [uploadState.payload.uploadUrl]
        : undefined;

      const sourceFileKey =
        navigationState?.uploadedFileKey || uploadState.payload?.fileKey;
      const detectedRepoFormat =
        navigationState?.detectedFormat ||
        uploadState.payload?.repoFormat ||
        repoFormat;

      // Log for debugging
      console.log("Creating project with:", {
        sourceFileUrls,
        sourceFileKey,
        detectedRepoFormat,
        finalAppIconFileKey,
        finalFeatureImageFileKey,
        finalAttachmentFileKeys,
      });

      // Prepare project data
      const projectData: any = {
        title: trimmedProjectName,
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim(),
        projectType: projectTypes,
        repoFormat: detectedRepoFormat,
        status: "published",
        payToViewAmount: parseFloat(packagePrices[1] || "0"),
        gameGenre: selectedGenre || undefined,
        ...(platform && { targetPlatform: platform }),
        ...(tags.length > 0 && { tags: tags }),
        ...(finalFeatureImageFileKey && {
          thumbnail: finalFeatureImageFileKey,
        }),
        ...(finalAppIconFileKey && { appIcon: finalAppIconFileKey }),
        ...(finalAttachmentFileKeys.length > 0 && {
          attachments: finalAttachmentFileKeys,
        }),
        // Always send both fileKeys and fileUrls together when source code is uploaded
        ...(sourceFileKey &&
          sourceFileUrls &&
          sourceFileUrls.length > 0 && {
            fileKeys: [sourceFileKey],
            fileUrls: sourceFileUrls,
          }),
        // Fallback: if only fileKey is available (shouldn't happen, but handle gracefully)
        ...((!sourceFileKey ||
          !sourceFileUrls ||
          sourceFileUrls.length === 0) &&
          sourceFileKey && { fileKeys: [sourceFileKey] }),
      };

      // Add pricing fields based on selected packages
      if (selectedPackages.includes(2)) {
        projectData.productSalePrice = parseFloat(packagePrices[2] || "0");
      }
      if (selectedPackages.includes(3)) {
        projectData.creatorCollaborationBudget = parseFloat(
          packagePrices[3] || "0"
        );
      }

      // Log project data for debugging
      console.log("Project data before create/update (publish):", {
        ...projectData,
        tags: projectData.tags,
        targetPlatform: projectData.targetPlatform,
      });

      // Create or update project
      if (isEditMode && id) {
        // Update existing project
        try {
          await apiService.updateGameProject(id, projectData);
          showToastMessage("Project updated successfully!", "success");
          setTimeout(() => {
            navigate(`/prototype-detail/${id}`);
          }, 2000);
        } catch (error) {
          showToastMessage(
            `Failed to update project: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            "error"
          );
        }
      } else {
        // Create new project
        const result = await createProject(projectData);

        if (result.success) {
          showToastMessage("Project published successfully!", "success");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } else {
          showToastMessage(
            result.error || "Failed to publish project",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Publish error:", error);
      showToastMessage(
        `Failed to publish project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSaveDraft = async () => {
    // Reset validation errors
    const errors = {
      projectName: false,
      shortDescription: false,
      longDescription: false,
      tags: false,
      platform: false,
      genre: false,
      sellingPrice: false,
      appIcon: false,
      featureImage: false,
    };

    // Check if project name is still "Unnamed" or "Project name" or empty
    const trimmedProjectName = projectName.trim();
    if (
      trimmedProjectName === "" ||
      trimmedProjectName === "Unnamed" ||
      trimmedProjectName === "Project name"
    ) {
      errors.projectName = true;
    }

    // Check if short description is empty
    if (!shortDescription.trim()) {
      errors.shortDescription = true;
    }

    // Check if long description is empty
    if (!longDescription.trim()) {
      errors.longDescription = true;
    }

    // Validate tags - must have at least 1 tag
    if (tags.length === 0) {
      errors.tags = true;
    }

    // Validate platform - required
    if (!platform || platform.trim() === "") {
      errors.platform = true;
    }

    // Validate genre - required
    if (!selectedGenre || selectedGenre.trim() === "") {
      errors.genre = true;
    }

    // Validate selling price - if a package is selected, its price must be > 0
    // If no package is selected, it's an error
    if (selectedPackages.length === 0) {
      errors.sellingPrice = true;
    } else {
      // Check each selected package - all selected packages must have price > 0
      let hasError = false;
      if (selectedPackages.includes(1)) {
        const price1 = parseFloat(packagePrices[1] || "0");
        if (price1 <= 0) {
          hasError = true;
        }
      }
      if (selectedPackages.includes(2)) {
        const price2 = parseFloat(packagePrices[2] || "0");
        if (price2 <= 0) {
          hasError = true;
        }
      }
      if (selectedPackages.includes(3)) {
        const price3 = parseFloat(packagePrices[3] || "0");
        if (price3 <= 0) {
          hasError = true;
        }
      }
      errors.sellingPrice = hasError;
    }

    // Validate App Icon - required
    if (appIconFiles.length === 0 && appIconFileKey === "") {
      errors.appIcon = true;
    }

    // Validate Feature Image - required
    if (featureImageFiles.length === 0 && featureImageFileKey === "") {
      errors.featureImage = true;
    }

    // If there are any errors, show them directly on the fields
    if (
      errors.projectName ||
      errors.shortDescription ||
      errors.longDescription ||
      errors.tags ||
      errors.platform ||
      errors.genre ||
      errors.sellingPrice ||
      errors.appIcon ||
      errors.featureImage
    ) {
      setValidationErrors(errors);
      // Scroll to first error field
      setTimeout(() => {
        if (errors.projectName) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (errors.shortDescription) {
          const element = document.querySelector(
            'input[placeholder="Write a short description"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.longDescription) {
          const element = document.querySelector(
            'textarea[placeholder="Enter description"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.tags) {
          const element = document.querySelector(
            'input[placeholder="Maximum 5 tags"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.platform) {
          const element = document.querySelector(
            'input[placeholder="Select platform"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.genre) {
          const element = document.querySelector(
            'input[placeholder="Select genre"]'
          );
          element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.sellingPrice) {
          const sellingPriceSection = document.querySelector(".mb-6.p-2 h2");
          sellingPriceSection?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.appIcon) {
          const appIconSection = document.querySelector('[title="App Icon"]');
          appIconSection?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (errors.featureImage) {
          const featureImageSection = document.querySelector(
            '[title="Feature Image"]'
          );
          featureImageSection?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
      return;
    }

    // Clear validation errors if all valid
    setValidationErrors({
      projectName: false,
      shortDescription: false,
      longDescription: false,
      tags: false,
      platform: false,
      genre: false,
      sellingPrice: false,
      appIcon: false,
      featureImage: false,
    });

    // Upload files if needed
    setUploadingFiles(true);
    try {
      // Use local variables to store fileKeys after upload (to avoid state update delay)
      let finalAppIconFileKey = appIconFileKey;
      let finalFeatureImageFileKey = featureImageFileKey;
      let finalAttachmentFileKeys = [...attachmentFileKeys];

      // Upload app icon if provided (always upload new file if user selected one)
      if (appIconFiles.length > 0) {
        const uploadResult = await uploadFile(appIconFiles[0]);
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        finalAppIconFileKey = uploadResult.fileKey;
        setAppIconFileKey(finalAppIconFileKey);
      }

      // Upload feature image (thumbnail) if provided (always upload new file if user selected one)
      if (featureImageFiles.length > 0) {
        const uploadResult = await uploadFile(featureImageFiles[0]);
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        finalFeatureImageFileKey = uploadResult.fileKey;
        setFeatureImageFileKey(finalFeatureImageFileKey);
      }

      // Upload attachments if provided
      if (attachmentFiles.length > 0) {
        const newAttachmentKeys: string[] = [];
        for (let i = 0; i < attachmentFiles.length; i++) {
          const file = attachmentFiles[i];
          // Check if this file already has a key (by index)
          if (
            i < finalAttachmentFileKeys.length &&
            finalAttachmentFileKeys[i]
          ) {
            // File already has a key, reuse it
            newAttachmentKeys.push(finalAttachmentFileKeys[i]);
          } else {
            // Upload new file
            const uploadResult = await uploadFile(file);
            if (uploadResult.error) {
              throw new Error(uploadResult.error);
            }
            newAttachmentKeys.push(uploadResult.fileKey);
          }
        }
        finalAttachmentFileKeys = newAttachmentKeys;
        setAttachmentFileKeys(finalAttachmentFileKeys);
      }

      // Map packages to project types
      const projectTypes: ("product_sale" | "dev_collaboration")[] = [];
      if (selectedPackages.includes(2)) {
        projectTypes.push("product_sale");
      }
      if (selectedPackages.includes(3)) {
        projectTypes.push("dev_collaboration");
      }

      // Get fileUrls from navigation state (from AI page) or Redux store
      // Priority: navigationState > uploadState
      const sourceFileUrls = navigationState?.uploadedFileUrl
        ? [navigationState.uploadedFileUrl]
        : uploadState.payload?.uploadUrl
        ? [uploadState.payload.uploadUrl]
        : undefined;

      const sourceFileKey =
        navigationState?.uploadedFileKey || uploadState.payload?.fileKey;
      const detectedRepoFormat =
        navigationState?.detectedFormat ||
        uploadState.payload?.repoFormat ||
        repoFormat;

      // Log for debugging
      console.log("Saving draft with:", {
        sourceFileUrls,
        sourceFileKey,
        detectedRepoFormat,
        finalAppIconFileKey,
        finalFeatureImageFileKey,
        finalAttachmentFileKeys,
      });

      // Prepare project data
      const projectData: any = {
        title: trimmedProjectName,
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim(),
        projectType: projectTypes,
        repoFormat: detectedRepoFormat,
        status: "draft",
        payToViewAmount: parseFloat(packagePrices[1] || "0"),
        gameGenre: selectedGenre || undefined,
        ...(platform && { targetPlatform: platform }),
        ...(tags.length > 0 && { tags: tags }),
        ...(finalFeatureImageFileKey && {
          thumbnail: finalFeatureImageFileKey,
        }),
        ...(finalAppIconFileKey && { appIcon: finalAppIconFileKey }),
        ...(finalAttachmentFileKeys.length > 0 && {
          attachments: finalAttachmentFileKeys,
        }),
        // Always send both fileKeys and fileUrls together when source code is uploaded
        ...(sourceFileKey &&
          sourceFileUrls &&
          sourceFileUrls.length > 0 && {
            fileKeys: [sourceFileKey],
            fileUrls: sourceFileUrls,
          }),
        // Fallback: if only fileKey is available (shouldn't happen, but handle gracefully)
        ...((!sourceFileKey ||
          !sourceFileUrls ||
          sourceFileUrls.length === 0) &&
          sourceFileKey && { fileKeys: [sourceFileKey] }),
      };

      // Add pricing fields based on selected packages
      if (selectedPackages.includes(2)) {
        projectData.productSalePrice = parseFloat(packagePrices[2] || "0");
      }
      if (selectedPackages.includes(3)) {
        projectData.creatorCollaborationBudget = parseFloat(
          packagePrices[3] || "0"
        );
      }

      // Log project data for debugging
      console.log("Project data before create (draft):", {
        ...projectData,
        tags: projectData.tags,
        targetPlatform: projectData.targetPlatform,
      });

      // Create project
      const result = await createProject(projectData);

      if (result.success) {
        showToastMessage("Project saved as draft successfully!", "success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        showToastMessage(
          result.error || "Failed to save project as draft",
          "error"
        );
      }
    } catch (error) {
      console.error("Save draft error:", error);
      showToastMessage(
        `Failed to save project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setUploadingFiles(false);
    }
  };

  const navigationItems = getNavigationItems(user?.role, location.pathname);
  const rightIcons = getDefaultRightIcons();

  // Show loading state while loading project for edit
  if (loadingProject) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading project data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        navigationItems={navigationItems}
        rightIcons={rightIcons}
      />

      {/* Main Content */}
      <div
        ref={mainContentRef}
        className="flex-1 overflow-hidden p-2 flex gap-1 bg-[#EEEEEE] w-full"
        style={{ minWidth: 0 }} // Ensure flex child can shrink below content size
      >
        {/* Left Section - Form */}
        <div
          className="overflow-hidden pr-3 bg-white p-8 rounded-lg flex flex-col"
          style={{
            width:
              isFileUploadType && isDividerEnabled && leftSectionWidth !== null
                ? `${leftSectionWidth}px`
                : "auto",
            flex:
              isFileUploadType && isDividerEnabled && leftSectionWidth !== null
                ? "none"
                : "1",
            minWidth: "300px",
          }}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Project Name */}
            <div className="mb-6 p-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Project name <span className="text-red-500">*</span>
              </h2>
              <input
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalProjectName(newValue);
                  dispatch(setProjectNameAction(newValue));
                  const trimmedValue = newValue.trim();
                  // Clear error if field is no longer empty
                  if (validationErrors.projectName && trimmedValue !== "") {
                    setValidationErrors((prev) => ({
                      ...prev,
                      projectName: false,
                    }));
                  }
                  // Clear warning if field is no longer default value
                  if (
                    projectNameWarning &&
                    trimmedValue !== "Unnamed" &&
                    trimmedValue !== "Project name" &&
                    trimmedValue !== ""
                  ) {
                    setProjectNameWarning(false);
                  }
                }}
                onBlur={() => validateField("projectName")}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-black text-2xl font-bold ${
                  validationErrors.projectName
                    ? "border-red-500 focus:ring-red-500"
                    : projectNameWarning
                    ? "border-yellow-500 focus:ring-yellow-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {validationErrors.projectName && (
                <p className="mt-1 text-sm text-red-500">
                  Project name is required
                </p>
              )}
              {projectNameWarning && !validationErrors.projectName && (
                <p className="mt-1 text-sm text-yellow-600">
                  Change the project name to match your game
                </p>
              )}
            </div>

            {/* Short Description */}
            <div className="mb-6 p-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Short description <span className="text-red-500">*</span>
              </h2>
              <input
                type="text"
                placeholder="Write a short description"
                value={shortDescription}
                onChange={(e) => {
                  setShortDescription(e.target.value);
                  if (
                    validationErrors.shortDescription &&
                    e.target.value.trim()
                  ) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      shortDescription: false,
                    }));
                  }
                }}
                onBlur={() => validateField("shortDescription")}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                  validationErrors.shortDescription
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {validationErrors.shortDescription && (
                <p className="mt-1 text-sm text-red-500">
                  Short description is required
                </p>
              )}
            </div>

            {/* Long Description */}
            <div className="mb-6 p-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Long description <span className="text-red-500">*</span>
              </h2>
              <textarea
                placeholder="Enter description"
                value={longDescription}
                onChange={(e) => {
                  setLongDescription(e.target.value);
                  if (
                    validationErrors.longDescription &&
                    e.target.value.trim()
                  ) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      longDescription: false,
                    }));
                  }
                }}
                onBlur={() => validateField("longDescription")}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black ${
                  validationErrors.longDescription
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {validationErrors.longDescription && (
                <p className="mt-1 text-sm text-red-500">
                  Long description is required
                </p>
              )}
            </div>

            <div className="p-2">
              {/* Labels Row - Always on same line */}
              <div className="grid grid-cols-3 gap-4 mb-2">
                <label className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  Tags <span className="text-red-500">*</span>
                </label>
                <label className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  Platform <span className="text-red-500">*</span>
                </label>
                <label className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  Genre <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Content Row - Can scale independently */}
              <div className="grid grid-cols-3 gap-4 items-start">
                {/* Tags */}
                <div
                  className="mb-6 flex flex-col min-h-[42px] relative"
                  ref={tagInputRef}
                >
                  {/* Tags display area - can wrap and scale */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[26px]">
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
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Maximum 5 tags"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        if (e.target.value.trim()) {
                          setShowTagSuggestions(true);
                        }
                        if (validationErrors.tags && tags.length > 0) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            tags: false,
                          }));
                        }
                      }}
                      onKeyDown={handleTagInputKeyPress}
                      onFocus={() => {
                        if (tagSuggestions.length > 0) {
                          setShowTagSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow clicking on suggestions
                        setTimeout(() => {
                          validateField("tags");
                        }, 200);
                      }}
                      className={`w-full py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-gray-600 ${
                        loadingSuggestions ? "px-4 pr-10" : "px-4"
                      } ${
                        validationErrors.tags
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    {/* Loading Indicator */}
                    {loadingSuggestions && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="animate-spin h-5 w-5 text-blue-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    )}
                    {/* AI Suggestions Dropdown */}
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                          AI Suggestions
                        </div>
                        {loadingSuggestions ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Loading suggestions...
                          </div>
                        ) : (
                          tagSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => handleSelectSuggestion(suggestion)}
                              className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-700 text-sm flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span>{suggestion}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {validationErrors.tags && (
                    <p className="mt-1 text-sm text-red-500">
                      Tags are required
                    </p>
                  )}
                </div>

                {/* Platform */}
                <div className="mb-6 flex flex-col">
                  <div className="relative" ref={platformRef}>
                    <input
                      type="text"
                      value={platform}
                      readOnly
                      placeholder="Select platform"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-600 pr-12 cursor-pointer ${
                        validationErrors.platform
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      onClick={() =>
                        setShowPlatformDropdown(!showPlatformDropdown)
                      }
                      onBlur={() => {
                        // Delay to allow clicking on dropdown items
                        setTimeout(() => {
                          validateField("platform");
                        }, 200);
                      }}
                    />
                    {platform && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlatform("");
                          setShowPlatformDropdown(false);
                          if (validationErrors.platform) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              platform: false,
                            }));
                          }
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
                              if (validationErrors.platform) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  platform: false,
                                }));
                              }
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
                  {validationErrors.platform && (
                    <p className="mt-1 text-sm text-red-500">
                      Platform is required
                    </p>
                  )}
                </div>

                {/* Genre */}
                <div className="mb-6 flex flex-col">
                  <div className="relative" ref={genreRef}>
                    <input
                      type="text"
                      value={selectedGenre}
                      readOnly
                      placeholder="Select genre"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-600 pr-12 cursor-pointer ${
                        validationErrors.genre
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                      onBlur={() => {
                        // Delay to allow clicking on dropdown items
                        setTimeout(() => {
                          validateField("genre");
                        }, 200);
                      }}
                    />
                    {selectedGenre && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGenre("");
                          setShowGenreDropdown(false);
                          if (validationErrors.genre) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              genre: false,
                            }));
                          }
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
                    {showGenreDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {genres.map((g) => (
                          <div
                            key={g}
                            onClick={() => {
                              setSelectedGenre(g);
                              setShowGenreDropdown(false);
                              if (validationErrors.genre) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  genre: false,
                                }));
                              }
                            }}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                              selectedGenre === g
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            {g}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.genre && (
                    <p className="mt-1 text-sm text-red-500">
                      Genre is required
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Set Selling Price */}
            <div className="mb-6 p-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Set selling price <span className="text-red-500">*</span>
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
                          ? validationErrors.sellingPrice &&
                            parseFloat(
                              packagePrices[
                                pkg.id as keyof typeof packagePrices
                              ] || "0"
                            ) <= 0
                            ? "border-red-500 bg-red-50"
                            : "border-blue-600 bg-blue-50"
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
                          ref={
                            packagePriceRefs[
                              pkg.id as keyof typeof packagePriceRefs
                            ]
                          }
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
                          onBlur={() => validateField("sellingPrice")}
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
              {validationErrors.sellingPrice && (
                <p className="mt-2 text-sm text-red-500">
                  At least one selling price option must be selected with a
                  value greater than 0
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Resizable Divider - Only show when type=file&scale=devider and widths are initialized */}
        {isFileUploadType &&
          isDividerEnabled &&
          leftSectionWidth !== null &&
          rightSectionWidth !== null && (
            <ResizableDivider
              initialLeftWidth={leftSectionWidth}
              onResize={(leftWidth, rightWidth) => {
                setLeftSectionWidth(leftWidth);
                setRightSectionWidth(rightWidth);
              }}
              minLeftWidth={300}
              maxLeftWidth={1200}
              minRightWidth={300}
              maxRightWidth={800}
              containerRef={mainContentRef}
            />
          )}

        {/* Right Sidebar - Upload */}
        <div
          className="flex flex-col"
          style={{
            width:
              isFileUploadType && isDividerEnabled && rightSectionWidth !== null
                ? `${rightSectionWidth}px`
                : "384px",
            minWidth: "300px",
          }}
        >
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
              onFilesChange={(files) => {
                setAppIconFiles(files);
                // Clear validation error when file is uploaded
                if (validationErrors.appIcon && files.length > 0) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    appIcon: false,
                  }));
                }
              }}
              maxFileSize={5 * 1024 * 1024} // 5MB
              initialFiles={appIconFiles.length > 0 ? appIconFiles : undefined}
              validationError={
                validationErrors.appIcon ? "App Icon is required" : undefined
              }
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
              onFilesChange={(files) => {
                setFeatureImageFiles(files);
                // Clear validation error when file is uploaded
                if (validationErrors.featureImage && files.length > 0) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    featureImage: false,
                  }));
                }
              }}
              maxFileSize={5 * 1024 * 1024} // 5MB
              initialFiles={
                featureImageFiles.length > 0 ? featureImageFiles : undefined
              }
              validationError={
                validationErrors.featureImage
                  ? "Feature Image is required"
                  : undefined
              }
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
              initialFiles={
                attachmentFiles.length > 0 ? attachmentFiles : undefined
              }
            />

            {/* Prototype Upload - Only show when type=file */}
            {isFileUploadType && (
              <PrototypeUploadSection
                title="Upload Prototype"
                required={false}
                onFilesChange={setPrototypeFiles}
                maxFileSize={100 * 1024 * 1024} // 100MB
                initialFiles={
                  prototypeFiles.length > 0 ? prototypeFiles : undefined
                }
                onPreviewDeviceChange={(previewWidth) => {
                  // Auto-adjust right section width based on preview width
                  // Only adjust if widths are already initialized
                  if (
                    leftSectionWidth === null ||
                    rightSectionWidth === null ||
                    !mainContentRef.current
                  ) {
                    return;
                  }

                  // Add padding and margins: phone frame (16px) + container padding (16px) + section padding (16px) + extra space (40px)
                  const requiredWidth = previewWidth + 16 + 16 + 16 + 40; // preview + phone frame + container padding + section padding + extra space
                  const minRightWidth = Math.max(300, requiredWidth);
                  const maxRightWidth = 800;

                  if (minRightWidth <= maxRightWidth) {
                    // Adjust right section width, but keep left section reasonable
                    const containerWidth =
                      mainContentRef.current.getBoundingClientRect().width;
                    const newRightWidth = Math.min(
                      maxRightWidth,
                      Math.max(minRightWidth, rightSectionWidth)
                    );
                    const newLeftWidth = containerWidth - newRightWidth - 8; // 8px for divider and gap

                    if (newLeftWidth >= 300) {
                      setRightSectionWidth(newRightWidth);
                      setLeftSectionWidth(newLeftWidth);
                    }
                  }
                }}
              />
            )}
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="space-y-3 pt-4 flex-shrink-0 border-t border-gray-200 mt-4 px-4">
            <button
              className="w-full px-4 py-3 bg-[#BEBEBE] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => navigate("/prototype/use-ai")}
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
              onClick={handleSaveDraft}
              disabled={creating || uploadingFiles}
              className="w-full px-4 py-3 bg-[#BEBEBE] text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Istok Web",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "20px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              {creating || uploadingFiles ? "Saving..." : "Save as draft"}
            </button>
            <button
              onClick={handlePublish}
              disabled={creating || uploadingFiles}
              className="w-full px-4 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Istok Web",
                fontWeight: 400,
                fontStyle: "normal",
                fontSize: "20px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              {creating || uploadingFiles ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-300 w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Warning</h3>
              </div>
              <div className="text-gray-700 mb-6">
                <p className="mb-2">Please fill in all required information:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.projectName && (
                    <li className="text-red-600">
                      Project name has not been updated. Please update the
                      project name.
                    </li>
                  )}
                  {validationErrors.shortDescription && (
                    <li className="text-red-600">
                      Short description is required
                    </li>
                  )}
                  {validationErrors.longDescription && (
                    <li className="text-red-600">
                      Long description is required
                    </li>
                  )}
                  {validationErrors.tags && (
                    <li className="text-red-600">Tags are required</li>
                  )}
                  {validationErrors.platform && (
                    <li className="text-red-600">Platform is required</li>
                  )}
                  {validationErrors.genre && (
                    <li className="text-red-600">Genre is required</li>
                  )}
                  {validationErrors.sellingPrice && (
                    <li className="text-red-600">
                      At least one selling price option must be selected with a
                      value greater than 0
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    // Scroll to first error field
                    if (validationErrors.projectName) {
                      // Project name is in the header, scroll to top
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else if (validationErrors.shortDescription) {
                      const element = document.querySelector(
                        'input[placeholder="Write a short description"]'
                      );
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    } else if (validationErrors.longDescription) {
                      const element = document.querySelector(
                        'textarea[placeholder="Enter description"]'
                      );
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    } else if (validationErrors.tags) {
                      const element = document.querySelector(
                        'input[placeholder="Maximum 5 tags"]'
                      );
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    } else if (validationErrors.platform) {
                      const element = document.querySelector(
                        'input[placeholder="Select platform"]'
                      );
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    } else if (validationErrors.genre) {
                      const element = document.querySelector(
                        'input[placeholder="Select genre"]'
                      );
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    } else if (validationErrors.sellingPrice) {
                      const element = document.querySelector(
                        'h2:contains("Set selling price")'
                      );
                      if (!element) {
                        // Fallback: scroll to selling price section
                        const sellingPriceSection =
                          document.querySelector(".mb-6.p-2 h2");
                        sellingPriceSection?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      } else {
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }
                  }}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            toastType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Upload Error Modal */}
      <UploadErrorModal
        isOpen={showUploadErrorModal}
        onClose={() => setShowUploadErrorModal(false)}
        errorMessage={uploadError}
      />
    </div>
  );
};

export default UploadPage;
