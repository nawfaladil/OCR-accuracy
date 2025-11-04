# Test Setup and Status

## Test Status Summary

### Backend Tests
- **Status**: Tests written, TypeScript errors fixed
- **Requirement**: PostgreSQL database must be running
- **Location**: `server/src/__tests__/`

### Frontend Tests
- **Status**: Tests written
- **Location**: `src/services/__tests__/`

## Running Backend Tests

### Prerequisites
1. **PostgreSQL Database**
   - Install PostgreSQL if not already installed
   - Create a test database (or use the same database with different credentials)
   - Update `.env` file in `server/` directory with database credentials

### Environment Setup
Create `server/.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=videocodage_db_test
DB_USER=postgres
DB_PASSWORD=your_password
NODE_ENV=test
SESSION_SECRET=test-secret-key
```

### Run Tests
```bash
cd server
npm test
```

### Test Files
- `server/src/__tests__/auth.test.ts` - Authentication API tests
- `server/src/__tests__/documents.test.ts` - Document API tests
- `server/src/__tests__/settings.test.ts` - Settings API tests

## Running Frontend Tests

### Run Tests
```bash
npm test
```

### Test Files
- `src/services/__tests__/authService.test.ts` - Auth service tests
- `src/services/__tests__/documentService.test.ts` - Document service tests

## Current Test Issues

1. **Database Connection**: Backend tests require PostgreSQL to be running and accessible
2. **Test Database**: Tests should ideally use a separate test database to avoid conflicts

## Test Coverage

### Backend
- ✅ Authentication (login, logout, session management)
- ✅ Document ingestion with flagging
- ✅ Document retrieval and filtering
- ✅ Field updates
- ✅ Settings (confidence threshold)

### Frontend
- ✅ API service layer (mocked)
- ✅ Authentication service
- ✅ Document service

## Next Steps

1. Set up PostgreSQL database
2. Configure test database credentials
3. Run backend tests: `cd server && npm test`
4. Run frontend tests: `npm test`
5. Fix any failing tests
