const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'staff@demo.com',
      password: 'staff123'
    });
    
    const token = loginRes.data.data.tokens.accessToken;
    
    const influencersRes = await axios.get('http://localhost:3000/api/influencers', {
      headers: { Authorization: `Bearer ${token}` },
      params: { pageSize: 1 }
    });
    
    const influencerId = influencersRes.data.data.data[0].id;
    console.log('Influencer ID:', influencerId);
    
    const historyRes = await axios.get(
      `http://localhost:3000/api/influencers/${influencerId}/collaboration-history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('History Response:', JSON.stringify(historyRes.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
