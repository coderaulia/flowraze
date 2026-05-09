import axios from 'axios';

async function test() {
  try {
    // We need a token. Let's try to login as admin.
    const login = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'admin@flowraze.com',
      password: 'admin123'
    });
    
    const token = login.data.data.token;
    console.log('Login success');
    
    const response = await axios.get('http://localhost:3002/api/dashboard/targets?year=2026', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Response success:', response.data.success);
    console.log('Data keys:', Object.keys(response.data.data));

    console.log('Testing dashboard targets (team scope)...');
    const teamResponse = await axios.get('http://localhost:3002/api/dashboard/targets?year=2026&scope=team&teamId=team-alpha', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Team dashboard success:', teamResponse.data.success);
  } catch (err: any) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

test();
