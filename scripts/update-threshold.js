const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function checkAndUpdateThreshold() {
  try {
    console.log('Checking and updating confidence threshold...\n');

    // Step 1: Login
    const username = process.env.USERNAME || 'admin';
    const password = process.env.PASSWORD || 'admin123';

    console.log('1. Logging in...');
    let loginResponse;
    try {
      loginResponse = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { username, password },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (loginError) {
      if (loginError.response?.status === 401) {
        console.log('   ⚠ Login failed, attempting to register...');
        await axios.post(
          `${API_BASE_URL}/auth/register`,
          { username, password },
          { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
        );
        loginResponse = await axios.post(
          `${API_BASE_URL}/auth/login`,
          { username, password },
          { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        throw loginError;
      }
    }

    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || '';

    console.log(`   ✓ Logged in as: ${loginResponse.data.user.username}\n`);

    // Step 2: Get current threshold
    console.log('2. Checking current threshold...');
    const thresholdResponse = await axios.get(
      `${API_BASE_URL}/settings/threshold`,
      {
        withCredentials: true,
        headers: { Cookie: cookieHeader },
      }
    );

    const currentThreshold = thresholdResponse.data.threshold;
    console.log(`   Current threshold: ${currentThreshold}\n`);

    // Step 3: Update to 0.85 if needed
    if (currentThreshold !== 0.85) {
      console.log(`3. Updating threshold from ${currentThreshold} to 0.85...`);
      await axios.put(
        `${API_BASE_URL}/settings/threshold`,
        { threshold: 0.85 },
        {
          withCredentials: true,
          headers: { Cookie: cookieHeader, 'Content-Type': 'application/json' },
        }
      );
      console.log('   ✓ Threshold updated to 0.85\n');
    } else {
      console.log('3. Threshold is already set to 0.85\n');
    }

    // Step 4: Verify by checking documents
    console.log('4. Checking documents with new threshold...');
    const docsResponse = await axios.get(
      `${API_BASE_URL}/documents?flagged=true`,
      {
        withCredentials: true,
        headers: { Cookie: cookieHeader },
      }
    );

    docsResponse.data.documents.forEach((doc) => {
      console.log(`   - ${doc.filename}: ${doc.flaggedFieldsCount || 0} low confidence fields`);
    });

    console.log('\n✅ Threshold check complete!');
    console.log('\nNote: You may need to refresh the page to see the updated count.');

  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.error || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

checkAndUpdateThreshold();

