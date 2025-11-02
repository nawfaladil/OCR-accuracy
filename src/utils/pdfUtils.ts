/**
 * Get all fields from all pages
 * @param pages - Array of pages
 * @returns Flattened array of all fields
 */
export const getAllFields = (pages: any[]) => {
  return pages.flatMap((page) => page.fields || []);
};

/**
 * Get fields for a specific page
 * @param pages - Array of pages
 * @param pageNumber - Page number (1-indexed)
 * @returns Fields for the specified page
 */
export const getFieldsByPage = (pages: any[], pageNumber: number) => {
  const page = pages.find((p) => p.pageNumber === pageNumber);
  return page?.fields || [];
};

