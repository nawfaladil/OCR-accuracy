import React, { useRef } from 'react';
import { Button, Box } from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';
import { useAppStore } from '../../store/appStore';
import { OCRDocument } from '../../types';
import { validateOCRJSON as validateJSON } from '../../utils/jsonUtils';

export const FileUpload: React.FC = () => {
  const { setPDFFile, setOCRDocument } = useAppStore();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPDFFile(file);
    } else {
      alert('Please upload a valid PDF file');
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const handleJSONUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          if (validateJSON(jsonData)) {
            setOCRDocument(jsonData as OCRDocument);
          } else {
            alert('Invalid OCR JSON structure. Please check the file format.');
          }
        } catch (error) {
          alert('Error parsing JSON file: ' + error);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid JSON file');
    }
    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const handlePDFClick = () => {
    pdfInputRef.current?.click();
  };

  const handleJSONClick = () => {
    jsonInputRef.current?.click();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        onChange={handlePDFUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json"
        onChange={handleJSONUpload}
        style={{ display: 'none' }}
      />
      <Button
        variant="outlined"
        startIcon={<InsertDriveFile />}
        onClick={handlePDFClick}
        sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
      >
        Upload PDF
      </Button>
      <Button
        variant="outlined"
        startIcon={<CloudUpload />}
        onClick={handleJSONClick}
        sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
      >
        Upload JSON
      </Button>
    </Box>
  );
};

