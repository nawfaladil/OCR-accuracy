import { documentService } from '../documentService';
import apiClient from '../api';
import { OCRDocument } from '../../types';

jest.mock('../api');

describe('documentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocuments', () => {
    it('should fetch documents list', async () => {
      const mockDocuments = [
        {
          id: '1',
          filename: 'test.pdf',
          status: 'pending',
          is_flagged: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { documents: mockDocuments },
      });

      const result = await documentService.getDocuments();

      expect(apiClient.get).toHaveBeenCalledWith('/documents', { params: undefined });
      expect(result).toEqual(mockDocuments);
    });

    it('should filter flagged documents', async () => {
      const mockDocuments: any[] = [];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { documents: mockDocuments },
      });

      await documentService.getDocuments({ flagged: true });

      expect(apiClient.get).toHaveBeenCalledWith('/documents', { params: { flagged: true } });
    });
  });

  describe('getDocument', () => {
    it('should fetch a single document', async () => {
      const mockDocument = {
        id: '1',
        filename: 'test.pdf',
        status: 'pending',
        ocrData: {
          document: {
            filename: 'test.pdf',
            pages: [],
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { document: mockDocument },
      });

      const result = await documentService.getDocument('1');

      expect(apiClient.get).toHaveBeenCalledWith('/documents/1');
      expect(result).toEqual(mockDocument);
    });
  });

  describe('getDocumentPDFUrl', () => {
    it('should return PDF URL', () => {
      const url = documentService.getDocumentPDFUrl('1');
      const expectedUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/documents/1/pdf`;
      expect(url).toBe(expectedUrl);
    });
  });

  describe('updateField', () => {
    it('should update a field value', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });

      await documentService.updateField('doc1', 'field1', 'new value');

      expect(apiClient.put).toHaveBeenCalledWith('/documents/doc1/fields/field1', {
        value: 'new value',
      });
    });
  });

  describe('completeDocument', () => {
    it('should mark document as completed', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });

      await documentService.completeDocument('doc1');

      expect(apiClient.put).toHaveBeenCalledWith('/documents/doc1/complete');
    });
  });
});
