import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  IconButton,
} from '@mui/material';
import { Edit, Check, Close } from '@mui/icons-material';
import { Field } from '../../types';
import { useAppStore } from '../../store/appStore';
import { documentService } from '../../services/documentService';

interface FieldItemProps {
  field: Field & { id?: string };
  documentId: string;
  isSelected: boolean;
}

export const FieldItem: React.FC<FieldItemProps> = ({ field, documentId, isSelected }) => {
  const { updateFieldValue, setSelectedField, ocrDocument } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.fieldValue);
  const [saving, setSaving] = useState(false);

  // Check if field has been modified
  const originalField = ocrDocument?.document.pages
    .find((p) => p.pageNumber === field.pageNumber)
    ?.fields.find((f) => f.fieldName === field.fieldName);

  const isModified = originalField && originalField.fieldValue !== field.fieldValue;

  const handleClick = () => {
    setSelectedField(field);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(field.fieldValue);
  };

  const handleSave = async () => {
    if (field.id) {
      try {
        setSaving(true);
        await documentService.updateField(documentId, field.id, editValue);
        updateFieldValue(field.fieldName, field.pageNumber, editValue);
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating field:', error);
        // Still update local state for UI responsiveness
        updateFieldValue(field.fieldName, field.pageNumber, editValue);
        setIsEditing(false);
      } finally {
        setSaving(false);
      }
    } else {
      updateFieldValue(field.fieldName, field.pageNumber, editValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(field.fieldValue);
    setIsEditing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'error';
  };

  return (
    <Card
      sx={{
        mb: 1,
        cursor: 'pointer',
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        bgcolor: isSelected ? '#e3f2fd' : '#fff',
        '&:hover': {
          boxShadow: 2,
        },
      }}
      onClick={handleClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {field.fieldName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`${Math.round(field.confidence * 100)}%`}
              size="small"
              color={getConfidenceColor(field.confidence)}
            />
            {isModified && (
              <Chip label="Modified" size="small" color="info" />
            )}
          </Box>
        </Box>

        {isEditing ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={saving}
            >
              <Check />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
            >
              <Close />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                wordBreak: 'break-word',
                color: isModified ? '#1976d2' : 'text.primary',
                fontWeight: isModified ? 600 : 400,
              }}
            >
              {field.fieldValue || '(empty)'}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Page {field.pageNumber}
        </Typography>
      </CardContent>
    </Card>
  );
};

