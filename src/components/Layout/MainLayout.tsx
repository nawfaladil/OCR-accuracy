import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { PDFViewer } from '../PDFViewer/PDFViewer';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { FileUpload } from '../FileUpload/FileUpload';

export const MainLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VideoCodage Tool - OCR Field Editor
          </Typography>
          <FileUpload />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - PDF Viewer */}
        <Box
          sx={{
            width: '50%',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <PDFViewer />
        </Box>

        {/* Right Panel - Field Editor */}
        <Box
          sx={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <FieldEditor />
        </Box>
      </Box>
    </Box>
  );
};

