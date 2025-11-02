import { BoundingBox, ViewportCoordinates } from '../types';

/**
 * Transform PDF coordinates (bottom-left origin) to viewport coordinates (top-left origin)
 * @param boundingBox - PDF bounding box coordinates
 * @param pageHeight - Height of the PDF page
 * @param scale - Current zoom scale of the viewport
 * @returns Viewport coordinates for rendering
 */
export const transformPDFToViewport = (
  boundingBox: BoundingBox,
  pageHeight: number,
  scale: number = 1
): ViewportCoordinates => {
  // PDF uses bottom-left origin, web uses top-left origin
  const x = boundingBox.x * scale;
  const y = (pageHeight - boundingBox.y - boundingBox.height) * scale;
  const width = boundingBox.width * scale;
  const height = boundingBox.height * scale;

  return { x, y, width, height };
};

/**
 * Calculate the scale factor between PDF dimensions and viewport dimensions
 * @param pdfWidth - Width of PDF page
 * @param pdfHeight - Height of PDF page
 * @param viewportWidth - Width of viewport
 * @param viewportHeight - Height of viewport
 * @returns Scale factor
 */
export const calculateScale = (
  pdfWidth: number,
  pdfHeight: number,
  viewportWidth: number,
  viewportHeight: number
): number => {
  const widthScale = viewportWidth / pdfWidth;
  const heightScale = viewportHeight / pdfHeight;
  return Math.min(widthScale, heightScale);
};

