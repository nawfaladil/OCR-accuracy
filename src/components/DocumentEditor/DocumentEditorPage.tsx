import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import { PDFViewer } from '../PDFViewer/PDFViewer';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { documentService } from '../../services/documentService';
import { useAppStore } from '../../store/appStore';

export const DocumentEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { setOCRDocument, setPDFUrl } = useAppStore();

  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDocument = async (documentId: string) => {
    try {
      setLoading(true);
      setError('');

      // Load document data
      const document = await documentService.getDocument(documentId);

      if (document.ocrData) {
        setOCRDocument(document.ocrData);
      }

      // Load PDF as blob with credentials, then create blob URL
      const pdfUrl = documentService.getDocumentPDFUrl(documentId);
      const response = await fetch(pdfUrl, {
        credentials: 'include',
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to load PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      // Convert blob to data URL for react-pdf compatibility
      // This avoids PDF.js worker issues with blob URLs
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            resolve(reader.result as string);
          } else {
            reject(new Error('Failed to convert blob to data URL'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      setPDFUrl(dataUrl);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load document');
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;

    try {
      setSaving(true);
      await documentService.completeDocument(id);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete document');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Document Editor
          </Typography>
          <Button
            color="inherit"
            startIcon={<CheckCircle />}
            onClick={handleComplete}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Mark as Complete'}
          </Button>
        </Toolbar>
      </AppBar>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

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
          <FieldEditor documentId={id || ''} />
        </Box>
      </Box>
    </Box>
  );
};
