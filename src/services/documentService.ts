import apiClient from './api';
import { OCRDocument } from '../types';

export interface Document {
  id: string;
  filename: string;
  status: string;
  is_flagged: boolean;
  flagged_at: string | null;
  created_at: string;
  updated_at: string;
  totalFields?: number;
  flaggedFieldsCount?: number;
}

export interface DocumentListResponse {
  documents: Document[];
}

export interface DocumentResponse {
  document: Document & {
    ocrData?: OCRDocument;
  };
}

export interface CreateDocumentResponse {
  success: boolean;
  document: Document;
  flagged: boolean;
  lowConfidenceFieldCount: number;
}

export const documentService = {
  getDocuments: async (params?: { flagged?: boolean; status?: string }): Promise<Document[]> => {
    const response = await apiClient.get<DocumentListResponse>('/documents', { params });
    return response.data.documents;
  },

  getDocument: async (id: string): Promise<DocumentResponse['document']> => {
    const response = await apiClient.get<DocumentResponse>(`/documents/${id}`);
    return response.data.document;
  },

  getDocumentPDFUrl: (id: string): string => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/documents/${id}/pdf`;
  },

  getDocumentJSON: async (id: string): Promise<OCRDocument> => {
    const response = await apiClient.get<OCRDocument>(`/documents/${id}/json`);
    return response.data;
  },

  createDocument: async (
    pdfFile: File,
    jsonData: OCRDocument
  ): Promise<CreateDocumentResponse> => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('jsonData', JSON.stringify(jsonData));

    const response = await apiClient.post<CreateDocumentResponse>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateField: async (
    documentId: string,
    fieldId: string,
    value: string
  ): Promise<void> => {
    await apiClient.put(`/documents/${documentId}/fields/${fieldId}`, { value });
  },

  completeDocument: async (documentId: string): Promise<void> => {
    await apiClient.put(`/documents/${documentId}/complete`);
  },
};
