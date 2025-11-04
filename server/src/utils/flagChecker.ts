import { OCRDocument, Field } from '../../shared/types';
import { query } from '../db/connection';

export const getConfidenceThreshold = async (): Promise<number> => {
  try {
    const result = await query(
      'SELECT value FROM settings WHERE key = $1',
      ['confidence_threshold']
    );
    
    if (result.rows.length === 0) {
      return parseFloat(process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.85');
    }
    
    return parseFloat(result.rows[0].value);
  } catch (error) {
    console.error('Error fetching confidence threshold:', error);
    return parseFloat(process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.85');
  }
};

export const checkDocumentForFlagging = async (
  ocrDocument: OCRDocument
): Promise<{ shouldFlag: boolean; lowConfidenceFields: Field[] }> => {
  const threshold = await getConfidenceThreshold();
  const lowConfidenceFields: Field[] = [];
  
  for (const page of ocrDocument.document.pages) {
    for (const field of page.fields) {
      // Only flag fields with confidence strictly less than threshold
      // Fields at threshold (confidence === threshold) are not flagged
      if (field.confidence < threshold) {
        lowConfidenceFields.push(field);
      }
    }
  }
  
  return {
    shouldFlag: lowConfidenceFields.length > 0,
    lowConfidenceFields,
  };
};

export const saveFieldsToDatabase = async (
  documentId: string,
  ocrDocument: OCRDocument,
  threshold: number
): Promise<void> => {
  for (const page of ocrDocument.document.pages) {
    for (const field of page.fields) {
      const isFlagged = field.confidence < threshold;
      
      await query(
        `INSERT INTO fields (
          document_id, field_name, field_value, bounding_box, 
          confidence, page_number, is_flagged
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          documentId,
          field.fieldName,
          field.fieldValue,
          JSON.stringify(field.boundingBox),
          field.confidence,
          field.pageNumber,
          isFlagged,
        ]
      );
    }
  }
};
