import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from '@mui/icons-material';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useAppStore } from '../../store/appStore';
import { BoundingBoxHighlight } from './BoundingBoxHighlight';
import { transformPDFToViewport } from '../../utils/coordinateUtils';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const PDFViewer: React.FC = () => {
  const { pdfFile, ocrDocument, selectedField, currentPage, zoom, setCurrentPage, setZoom } = useAppStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageLoadSuccess = (page: any) => {
    setPageWidth(page.width);
    setPageHeight(page.height);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.2, 0.5));
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Calculate highlight coordinates
  const getHighlightCoordinates = () => {
    if (!selectedField || !ocrDocument || selectedField.pageNumber !== currentPage || !pageWidth || !pageHeight) {
      return null;
    }

    // The page is rendered at (pageWidth * zoom) x (pageHeight * zoom)
    // We need to scale the bounding box coordinates accordingly
    // OCR coordinates are in PDF points, which match pageWidth/pageHeight when scale=1
    const scaleFactor = zoom;
    
    const viewportCoords = transformPDFToViewport(
      selectedField.boundingBox,
      pageHeight, // PDF height in points
      scaleFactor // Zoom applied by react-pdf
    );

    return viewportCoords;
  };

  if (!pdfFile) {
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
          Upload a PDF file to view
        </Typography>
      </Box>
    );
  }

  const highlightCoords = getHighlightCoordinates();

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <Box
        sx={{
          p: 1,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: '#fff',
        }}
      >
        <Button
          size="small"
          startIcon={<ChevronLeft />}
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'center' }}>
          Page {currentPage} of {numPages}
        </Typography>
        <Button
          size="small"
          startIcon={<ChevronRight />}
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
        >
          Next
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<ZoomOut />} onClick={handleZoomOut}>
          Zoom Out
        </Button>
        <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Typography>
        <Button size="small" startIcon={<ZoomIn />} onClick={handleZoomIn}>
          Zoom In
        </Button>
      </Box>

      {/* PDF Viewer */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          bgcolor: '#e0e0e0',
          p: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <Document
            file={pdfFile}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={40} />
                <Typography>Loading PDF...</Typography>
              </Box>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={zoom}
              onLoadSuccess={handlePageLoadSuccess}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>

          {/* Highlight overlays */}
          {highlightCoords && (
            <BoundingBoxHighlight coordinates={highlightCoords} isSelected={true} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

