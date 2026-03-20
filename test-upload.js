// Quick test script for upload endpoint with Gemini moderation
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const LOGIN_ENDPOINT = '/api/auth/login';
const UPLOAD_ENDPOINT = '/api/posts';

// Test credentials
const testUser = {
  email: 'user@mangotree.com',
  password: 'User123!@#'
};

async function testUpload() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}${LOGIN_ENDPOINT}`, testUser);
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully');

    // Test 1: Safe text-only post
    console.log('\n📝 Test 1: Uploading safe text-only post...');
    const safePost = {
      title: 'Beautiful sunset photo',
      content: 'This is a lovely photo of a sunset I took yesterday. The colors were amazing!',
      category: '645ef8a2c3d4f51234567890', // Change this to a real category ID from your DB
      tags: [],
      image: []
    };

    try {
      const res1 = await axios.post(`${API_URL}${UPLOAD_ENDPOINT}`, safePost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Test 1 PASSED: Safe post uploaded successfully', res1.status);
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('❌ Test 1 FAILED: Post was flagged by moderation:', err.response.data.message);
      } else {
        console.error('❌ Test 1 ERROR:', err.response?.status, err.response?.data);
      }
    }

    // Test 2: Inappropriate text post (should be flagged)
    console.log('\n⚠️ Test 2: Uploading inappropriate text post...');
    const flaggedPost = {
      title: 'This is violent content',
      content: 'I want to harm someone and engage in illegal activities. This is a test of the moderation system.',
      category: '645ef8a2c3d4f51234567890',
      tags: [],
      image: []
    };

    try {
      const res2 = await axios.post(`${API_URL}${UPLOAD_ENDPOINT}`, flaggedPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Test 2 FAILED: Inappropriate post was NOT flagged (should have been rejected)');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Test 2 PASSED: Inappropriate post correctly flagged:', err.response.data.message);
      } else {
        console.error('❌ Test 2 ERROR:', err.response?.status, err.response?.data);
      }
    }

    // Test 3: Check backend logs for Gemini API details
    console.log('\n📊 Check backend console for Gemini API call logs to verify image moderation');

  } catch (err) {
    console.error('Test failed with error:', err.response?.data || err.message);
  }
}

// Get categories first to use a real category ID
async function getCategories(token) {
  try {
    const res = await axios.get(`${API_URL}/api/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err) {
    console.log('Could not fetch categories, using placeholder ID');
    return [{ _id: '645ef8a2c3d4f51234567890' }];
  }
}

// Override testUpload to fetch categories first
testUpload();
