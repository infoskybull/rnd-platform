/**
 * Utility functions for handling User data with serializable dates
 */

/**
 * Convert a User object with string createdAt to display format
 */
export const formatUserForDisplay = (user: any) => {
  if (!user) return null;

  return {
    ...user,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
  };
};

/**
 * Convert a User object with Date createdAt to serializable format
 */
export const formatUserForStorage = (user: any) => {
  if (!user) return null;

  return {
    ...user,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt,
  };
};

/**
 * Get formatted date string from User createdAt
 */
export const getUserCreatedDate = (user: any): string => {
  if (!user?.createdAt) return "Unknown";

  try {
    const date = new Date(user.createdAt);
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting user created date:", error);
    return "Invalid Date";
  }
};

/**
 * Get formatted date string with time from User createdAt
 */
export const getUserCreatedDateTime = (user: any): string => {
  if (!user?.createdAt) return "Unknown";

  try {
    const date = new Date(user.createdAt);
    return date.toLocaleString();
  } catch (error) {
    console.error("Error formatting user created datetime:", error);
    return "Invalid Date";
  }
};
