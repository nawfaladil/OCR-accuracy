const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function ingestDocument() {
  try {
    console.log('Starting document ingestion test...\n');

    // Step 1: Register or Login to get session
    const username = process.env.USERNAME || 'admin';
    const password = process.env.PASSWORD || 'admin123';

    console.log('1. Registering/Logging in...');
    
    let loginResponse;
    try {
      // Try to login first
      loginResponse = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { username, password },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (loginError) {
      // If login fails, try to register
      if (loginError.response?.status === 401) {
        console.log('   ⚠ Login failed, attempting to register new user...');
        try {
          const registerResponse = await axios.post(
            `${API_BASE_URL}/auth/register`,
            { username, password },
            {
              withCredentials: true,
              headers: { 'Content-Type': 'application/json' },
            }
          );
          console.log(`   ✓ Registered new user: ${registerResponse.data.user.username}`);
          
          // Now login with the new account
          loginResponse = await axios.post(
            `${API_BASE_URL}/auth/login`,
            { username, password },
            {
              withCredentials: true,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (registerError) {
          throw new Error(`Registration failed: ${registerError.response?.data?.error || registerError.message}`);
        }
      } else {
        throw loginError;
      }
    }

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    console.log(`   ✓ Logged in as: ${loginResponse.data.user.username}\n`);

    // Get cookies from response - handle both string and array formats
    const cookies = loginResponse.headers['set-cookie'];
    let cookieHeader = '';
    if (Array.isArray(cookies)) {
      cookieHeader = cookies.join('; ');
    } else if (cookies) {
      cookieHeader = cookies;
    }

    // Step 2: Read sample files
    console.log('2. Reading sample files...');
    const sampleJsonPath = path.join(__dirname, '../public/sample.json');
    const samplePdfPath = path.join(__dirname, '../public/sample_pdf.pdf');

    if (!fs.existsSync(sampleJsonPath)) {
      throw new Error(`Sample JSON file not found: ${sampleJsonPath}`);
    }
    if (!fs.existsSync(samplePdfPath)) {
      throw new Error(`Sample PDF file not found: ${samplePdfPath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(sampleJsonPath, 'utf-8'));
    const pdfBuffer = fs.readFileSync(samplePdfPath);

    console.log(`   ✓ Read JSON: ${sampleJsonPath}`);
    console.log(`   ✓ Read PDF: ${samplePdfPath}\n`);

    // Step 3: Create FormData for document ingestion
    console.log('3. Preparing document for ingestion...');
    const formData = new FormData();
    formData.append('pdf', pdfBuffer, {
      filename: 'sample_pdf.pdf',
      contentType: 'application/pdf',
    });
    formData.append('jsonData', JSON.stringify(jsonData));

    console.log(`   ✓ PDF file: sample_pdf.pdf`);
    console.log(`   ✓ JSON data: ${Object.keys(jsonData.document.pages[0].fields).length} fields on page 1\n`);

    // Step 4: Ingest document
    console.log('4. Ingesting document via API...');
    const ingestResponse = await axios.post(
      `${API_BASE_URL}/documents`,
      formData,
      {
        withCredentials: true,
        headers: {
          ...formData.getHeaders(),
          Cookie: cookieHeader,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (!ingestResponse.data.success) {
      throw new Error('Document ingestion failed');
    }

    const document = ingestResponse.data.document;
    console.log(`   ✓ Document ingested successfully!`);
    console.log(`   - Document ID: ${document.id}`);
    console.log(`   - Filename: ${document.filename}`);
    console.log(`   - Status: ${document.status}`);
    console.log(`   - Flagged: ${document.is_flagged ? 'YES' : 'NO'}`);
    console.log(`   - Low confidence fields: ${ingestResponse.data.lowConfidenceFieldCount}\n`);

    // Step 5: Verify document appears in flagged documents (if flagged)
    if (document.is_flagged) {
      console.log('5. Verifying document appears in flagged documents...');
      const flaggedResponse = await axios.get(
        `${API_BASE_URL}/documents?flagged=true`,
        {
          withCredentials: true,
          headers: {
            Cookie: cookieHeader,
          },
        }
      );

      const flaggedDocs = flaggedResponse.data.documents;
      const found = flaggedDocs.find((doc) => doc.id === document.id);

      if (found) {
        console.log(`   ✓ Document found in flagged documents list!\n`);
      } else {
        console.log(`   ⚠ Document not found in flagged documents list\n`);
      }
    } else {
      console.log('5. Document is not flagged (no low confidence fields)\n');
    }

    console.log('✅ Document ingestion test completed successfully!');
    console.log(`\nYou can now view the document in the application at:`);
    console.log(`   http://localhost:3000/document/${document.id}`);
    console.log(`\nOr view all flagged documents at:`);
    console.log(`   http://localhost:3000/`);

    return document;
  } catch (error) {
    console.error('\n❌ Error during document ingestion test:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.error || JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('   No response received. Is the server running?');
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the test
ingestDocument();

