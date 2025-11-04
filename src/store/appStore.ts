import { create } from 'zustand';
import { OCRDocument, Field } from '../types';

interface AppState {
  ocrDocument: OCRDocument | null;
  pdfUrl: string | null;
  pdfFile: File | null;
  selectedField: Field | null;
  currentPage: number;
  zoom: number;
  
  setOCRDocument: (document: OCRDocument | null) => void;
  setPDFUrl: (url: string | null) => void;
  setPDFFile: (file: File | null) => void;
  setSelectedField: (field: Field | null) => void;
  updateFieldValue: (fieldName: string, pageNumber: number, newValue: string) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ocrDocument: null,
  pdfUrl: null,
  pdfFile: null,
  selectedField: null,
  currentPage: 1,
  zoom: 1,

  setOCRDocument: (document) => set({ ocrDocument: document }),
  setPDFUrl: (url) => set({ pdfUrl: url }),
  setPDFFile: (file) => set({ pdfFile: file }),
  setSelectedField: (field) => set({ selectedField: field }),
  
  updateFieldValue: (fieldName, pageNumber, newValue) =>
    set((state) => {
      if (!state.ocrDocument) return state;
      
      const updatedDocument = { ...state.ocrDocument };
      const page = updatedDocument.document.pages.find(
        (p) => p.pageNumber === pageNumber
      );
      
      if (page) {
        const field = page.fields.find((f) => f.fieldName === fieldName);
        if (field) {
          field.fieldValue = newValue;
        }
      }
      
      return { ocrDocument: updatedDocument };
    }),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  setZoom: (zoom) => set({ zoom }),
}));

