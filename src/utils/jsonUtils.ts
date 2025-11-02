import { OCRDocument } from '../types';

/**
 * Validate OCR JSON structure
 * @param data - JSON data to validate
 * @returns true if valid, false otherwise
 */
export const validateOCRJSON = (data: any): data is OCRDocument => {
  if (!data || !data.document) return false;
  if (!data.document.pages || !Array.isArray(data.document.pages)) return false;
  
  return data.document.pages.every((page: any) => {
    if (!page.pageNumber || !Array.isArray(page.fields)) return false;
    return page.fields.every((field: any) => {
      return (
        field.fieldName &&
        typeof field.fieldValue === 'string' &&
        field.boundingBox &&
        typeof field.confidence === 'number' &&
        field.pageNumber
      );
    });
  });
};

/**
 * Export modified JSON data
 * @param data - OCR document data
 * @param filename - Output filename
 */
export const exportJSON = (data: OCRDocument, filename: string = 'modified_ocr.json') => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

