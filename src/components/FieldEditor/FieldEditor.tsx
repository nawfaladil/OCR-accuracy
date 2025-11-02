import React, { useMemo, useState } from 'react';
import { Box, Typography, TextField, Button, InputAdornment } from '@mui/material';
import { Download, Search } from '@mui/icons-material';
import { useAppStore } from '../../store/appStore';
import { FieldItem } from './FieldItem';
import { getAllFields } from '../../utils/pdfUtils';
import { exportJSON } from '../../utils/jsonUtils';

export const FieldEditor: React.FC = () => {
  const { ocrDocument, selectedField } = useAppStore();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allFields = useMemo(() => {
    if (!ocrDocument) return [];
    const fields = getAllFields(ocrDocument.document.pages);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return fields.filter(
        (field) =>
          field.fieldName.toLowerCase().includes(query) ||
          field.fieldValue.toLowerCase().includes(query)
      );
    }
    
    return fields;
  }, [ocrDocument, searchQuery]);

  const handleExport = () => {
    if (ocrDocument) {
      exportJSON(ocrDocument, ocrDocument.document.filename.replace('.pdf', '_modified.json'));
    }
  };

  if (!ocrDocument) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #ccc',
          bgcolor: '#f5f5f5',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Upload an OCR JSON file to view fields
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Fields ({allFields.length})</Typography>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={!ocrDocument}
          >
            Export JSON
          </Button>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Fields List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: '#f5f5f5',
        }}
      >
        {allFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No fields found
          </Typography>
        ) : (
          allFields.map((field) => (
            <FieldItem
              key={`${field.fieldName}-${field.pageNumber}`}
              field={field}
              isSelected={
                selectedField?.fieldName === field.fieldName &&
                selectedField?.pageNumber === field.pageNumber
              }
            />
          ))
        )}
      </Box>
    </Box>
  );
};

