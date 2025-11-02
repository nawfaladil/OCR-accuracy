# VideoCodage Tool - OCR Field Editor

A web-based tool for visualizing and editing OCR-extracted field data with interactive PDF annotation. Users can view the original PDF, click on fields to highlight their source bounding boxes, edit field values, and export the modified JSON.

## Features

- 📄 **PDF Viewer**: Display original PDF documents with zoom and page navigation
- 🎯 **Interactive Highlighting**: Click on fields to highlight their bounding boxes in the PDF
- ✏️ **Field Editing**: Inline editing of field values with visual indication of modifications
- 🔍 **Search**: Search fields by name or value
- 💾 **Export**: Download modified JSON with updated field values
- 📊 **Confidence Display**: Visual indicators showing OCR confidence levels

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

Note: We use `--legacy-peer-deps` because `react-pdf` v7 doesn't officially support React 19 yet, but it works fine with the legacy peer deps flag.

## Usage

### Starting the Application

```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

### Using the Tool

1. **Upload PDF**: Click "Upload PDF" in the header to load the original PDF document
2. **Upload JSON**: Click "Upload JSON" to load the OCR JSON file with field data
3. **View Fields**: All extracted fields appear in the right panel
4. **Highlight Fields**: Click on any field to see its bounding box highlighted in the PDF
5. **Edit Fields**: Click the edit icon on any field to modify its value
6. **Export**: Click "Export JSON" to download the modified JSON file

### OCR JSON Format

The tool expects JSON files with the following structure:

```json
{
  "document": {
    "filename": "document.pdf",
    "pages": [
      {
        "pageNumber": 1,
        "fields": [
          {
            "fieldName": "Invoice Number",
            "fieldValue": "INV-12345",
            "boundingBox": {
              "x": 100,
              "y": 200,
              "width": 150,
              "height": 30
            },
            "confidence": 0.95,
            "pageNumber": 1
          }
        ]
      }
    ]
  }
}
```

**Note**: PDF coordinates use bottom-left origin. The tool automatically transforms these to viewport coordinates for display.

### Sample Data

A sample JSON file is provided at `public/sample.json` for testing.

## Project Structure

```
src/
├── components/
│   ├── PDFViewer/          # PDF rendering and highlighting
│   ├── FieldEditor/         # Field list and editing
│   ├── Layout/              # Main application layout
│   └── FileUpload/          # File upload components
├── store/                   # Zustand state management
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions
```

## Technologies

- **React** 19.2.0 - UI framework
- **TypeScript** 5.0.0 - Type safety
- **Material-UI** 5.14.0 - Component library
- **react-pdf** 7.5.1 - PDF rendering
- **Zustand** 4.4.0 - State management

## Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run build`

Builds the app for production to the `build` folder.

### `npm test`

Launches the test runner in interactive watch mode.

## Troubleshooting

### PDF Not Displaying

- Ensure the PDF file is not corrupted
- Check browser console for errors
- Verify PDF.js worker is loading correctly

### Highlighting Not Working

- Ensure the JSON bounding box coordinates match the PDF coordinate system
- Check that field page numbers match the displayed PDF page
- Verify the PDF and JSON correspond to the same document

### Export Issues

- Ensure at least one field has been modified
- Check browser download permissions

## License

This project is private and for internal use only.
