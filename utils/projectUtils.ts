import { GameProject } from "../types";

/**
 * Get the banner image URL from project thumbnail
 * Always returns thumbnail, no fallback to attachments
 */
export const getProjectBanner = (project: GameProject): string | null => {
  return project.thumbnail || null;
};

/**
 * Get the banner image URL from inventory item thumbnail
 * Always returns thumbnail, no fallback to attachments or screenshots
 */
export const getInventoryItemBanner = (item: any): string | null => {
  return item.thumbnail || null;
};

/**
 * Handle image load error by hiding the image
 * Since we only use thumbnail now, just hide on error
 */
export const handleBannerError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  project: GameProject,
  setImageSrc: (src: string | null) => void
) => {
  const imgElement = e.target as HTMLImageElement;

  // Simply hide the image if it fails to load
  imgElement.style.display = "none";
};
