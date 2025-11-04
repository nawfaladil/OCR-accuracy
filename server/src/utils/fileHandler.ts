import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OCRDocument } from '../../shared/types';

export const ensureUploadDir = async (documentId: string): Promise<string> => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads/documents';
  const documentDir = path.join(uploadDir, documentId);
  
  try {
    await fs.mkdir(documentDir, { recursive: true });
    return documentDir;
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Failed to create upload directory');
  }
};

export const saveFile = async (
  file: Express.Multer.File,
  documentId: string,
  filename: string
): Promise<string> => {
  const documentDir = await ensureUploadDir(documentId);
  const filePath = path.join(documentDir, filename);
  
  await fs.writeFile(filePath, file.buffer);
  return filePath;
};

export const saveJSON = async (
  data: OCRDocument,
  documentId: string
): Promise<string> => {
  const documentDir = await ensureUploadDir(documentId);
  const jsonPath = path.join(documentDir, 'ocr_data.json');
  
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
  return jsonPath;
};

export const readJSONFile = async (jsonPath: string): Promise<OCRDocument> => {
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(content) as OCRDocument;
  } catch (error) {
    console.error('Error reading JSON file:', error);
    throw new Error('Failed to read JSON file');
  }
};

export const getFilePath = (filePath: string): string => {
  return path.resolve(filePath);
};
