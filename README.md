# VideoCodage Tool - OCR Field Editor

A full-stack web application for visualizing and editing OCR-extracted field data with interactive PDF annotation. The tool automatically ingests OCR outputs and PDFs, flags documents with low-confidence fields, and allows users to review and correct flagged documents.

## Features

- 🔐 **Authentication**: Secure user authentication with session management
- 📄 **PDF Viewer**: Display original PDF documents with zoom and page navigation
- 🎯 **Interactive Highlighting**: Click on fields to highlight their bounding boxes in the PDF
- ✏️ **Field Editing**: Inline editing of field values with automatic saving
- 🔍 **Search**: Search fields by name or value
- 🚩 **Auto-Flagging**: Documents with fields below confidence threshold are automatically flagged
- 📊 **Confidence Display**: Visual indicators showing OCR confidence levels
- 🏠 **Home Dashboard**: View and manage flagged documents from a central home page
- ⚙️ **Configurable Settings**: Adjustable confidence threshold for flagging

## Architecture

This is a full-stack application with:
- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Node.js/Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: Session-based authentication

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)

## Installation

### 1. Database Setup

1. Install PostgreSQL if not already installed
2. Create a database:
```sql
CREATE DATABASE videocodage_db;
```
3. Create a user (optional, or use existing `postgres` user):
```sql
CREATE USER videocodage_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE videocodage_db TO videocodage_user;
```

### 2. Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `server/` directory (Docker DB defaults below):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=videocodage_db
DB_USER=videocodage_user
DB_PASSWORD=videocodage_pw
PORT=3001
SESSION_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
DEFAULT_CONFIDENCE_THRESHOLD=0.85
NODE_ENV=development
```

4. Initialize the database (tables will be created automatically on first server start)

### 3. Frontend Setup

1. Navigate back to the root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

Note: We use `--legacy-peer-deps` because `react-pdf` v7 doesn't officially support React 19 yet, but it works fine with the legacy peer deps flag.

## Usage

### Starting the Application

1. **Start the database (Docker)** from project root:
```bash
docker compose up -d db
```
Optional: verify readiness with:
```bash
docker compose exec db pg_isready -U videocodage_user -d videocodage_db
```

2. **Start the backend server** (in `server/` directory):
```bash
cd server
npm run dev
```

The backend will run on [http://localhost:3001](http://localhost:3001)

3. **Start the frontend** (in root directory):
```bash
npm start
```

The frontend will open at [http://localhost:3000](http://localhost:3000)

### Using the Tool

1. **Login**: Use your credentials to access the application
2. **Home Page**: View flagged documents that need review
3. **Open Document**: Click on a flagged document to open the editor
4. **View PDF**: The original PDF is displayed on the left panel
5. **View Fields**: All extracted fields appear in the right panel
6. **Highlight Fields**: Click on any field to see its bounding box highlighted in the PDF
7. **Edit Fields**: Click the edit icon on any field to modify its value (changes are saved automatically)
8. **Complete Review**: Mark documents as completed after review

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

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Documents
- `POST /api/documents` - Create/ingest a new document (PDF + JSON)
- `GET /api/documents` - Get list of documents (with filtering)
- `GET /api/documents/:id` - Get a single document with fields
- `GET /api/documents/:id/pdf` - Get PDF file
- `GET /api/documents/:id/json` - Get JSON data
- `PUT /api/documents/:id/fields/:fieldId` - Update a field value
- `PUT /api/documents/:id/complete` - Mark document as completed

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update a setting (e.g., confidence_threshold)

## Document Ingestion

Documents can be ingested via the API endpoint `POST /api/documents`. The request should include:
- `pdf`: PDF file (multipart/form-data)
- `json`: OCR JSON file (multipart/form-data)

The system will:
1. Store the PDF and JSON files
2. Parse the OCR JSON and extract fields
3. Check each field's confidence against the threshold
4. Flag the document if any field has confidence below the threshold
5. Store all data in the database

## Project Structure

```
videocodage_tool/
├── src/                      # Frontend React application
│   ├── components/
│   │   ├── Auth/             # Authentication components
│   │   ├── DocumentEditor/   # Document editor page
│   │   ├── FieldEditor/      # Field list and editing
│   │   ├── Home/             # Home page with flagged documents
│   │   ├── Layout/           # Main application layout
│   │   ├── PDFViewer/        # PDF rendering and highlighting
│   │   └── FileUpload/       # File upload components
│   ├── services/             # API service layer
│   ├── store/                # Zustand state management
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── server/                   # Backend Express application
│   ├── src/
│   │   ├── __tests__/        # Backend tests
│   │   ├── controllers/      # Business logic controllers
│   │   ├── db/               # Database connection and setup
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   └── utils/            # Utility functions
│   ├── shared/               # Shared types between frontend/backend
│   └── uploads/              # Uploaded files storage
└── public/                   # Static assets
```

## Technologies

### Frontend
- **React** 19.2.0 - UI framework
- **TypeScript** 5.0.0 - Type safety
- **Material-UI** 5.14.0 - Component library
- **react-pdf** 7.5.1 - PDF rendering
- **Zustand** 4.4.0 - State management
- **React Router** - Routing and navigation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **bcrypt** - Password hashing
- **express-session** - Session management
- **multer** - File upload handling

### Testing
- **Jest** - Testing framework
- **Supertest** - API testing

## Available Scripts

### Frontend (root directory)

- `npm start` - Runs the React app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the frontend test runner

### Backend (server directory)

- `npm run dev` - Runs the server in development mode with hot reload
- `npm test` - Runs backend tests
- `npm run build` - Compiles TypeScript to JavaScript

## Testing

### Backend Tests

Backend tests require PostgreSQL to be running. See `TEST_SETUP.md` for detailed setup instructions.

Run backend tests:
```bash
cd server
npm test
```

### Frontend Tests

Run frontend tests:
```bash
npm test
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify database credentials in `server/.env`
- Check that the database exists and user has proper permissions
- Look for connection errors in server logs

### PDF Not Displaying

- Ensure the PDF file is not corrupted
- Check browser console for errors
- Verify PDF.js worker is loading correctly
- Check that the PDF URL from the API is accessible

### Authentication Issues

- Verify session configuration in `server/.env`
- Check that cookies are enabled in your browser
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL

### Field Highlighting Not Working

- Ensure the JSON bounding box coordinates match the PDF coordinate system
- Check that field page numbers match the displayed PDF page
- Verify the PDF and JSON correspond to the same document

## License

This project is private and for internal use only.
