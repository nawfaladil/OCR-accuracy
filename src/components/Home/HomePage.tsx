import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search, Flag, Description, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { documentService, Document } from '../../services/documentService';

export const HomePage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadFlaggedDocuments();
  }, []);

  const loadFlaggedDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentService.getDocuments({ flagged: true });
      setDocuments(docs);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return doc.filename.toLowerCase().includes(query);
  });

  const handleOpenDocument = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Flagged Documents
        </Typography>
        <Chip
          icon={<Flag />}
          label={`${documents.length} flagged`}
          color="error"
          variant="outlined"
        />
      </Box>

      <TextField
        fullWidth
        placeholder="Search documents..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" align="center" color="text.secondary">
              {searchQuery
                ? 'No documents match your search'
                : 'No flagged documents found'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredDocuments.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'start', mb: 1 }}>
                    <Description sx={{ mr: 1, mt: 0.5 }} />
                    <Typography variant="h6" component="h2" noWrap sx={{ flex: 1 }}>
                      {doc.filename}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={doc.status}
                      size="small"
                      color={doc.status === 'completed' ? 'success' : 'default'}
                      icon={doc.status === 'completed' ? <CheckCircle /> : undefined}
                    />
                    {doc.flaggedFieldsCount !== undefined && (
                      <Chip
                        label={`${doc.flaggedFieldsCount} low confidence fields`}
                        size="small"
                        color="error"
                        icon={<Flag />}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(doc.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleOpenDocument(doc.id)}
                  >
                    Review
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
