const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'staff@demo.com',
      password: 'staff123'
    });
    
    console.log('Login Response:', JSON.stringify(response.data, null, 2));
    console.log('\nToken:', response.data.data.token);
    
    // Test using the token
    const testResponse = await axios.get('http://localhost:3000/api/influencers', {
      headers: {
        Authorization: `Bearer ${response.data.data.token}`
      }
    });
    
    console.log('\nInfluencers Response:', JSON.stringify(testResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin();
