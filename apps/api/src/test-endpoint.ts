async function test() {
  try {
    // We need a token. Let's try to login as admin.
    const loginRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@flowraze.com',
        password: 'admin123'
      })
    });
    const login = (await loginRes.json()) as { data: { token: string } };
    
    const token = login.data.token;
    console.log('Login success');
    
    const responseRes = await fetch('http://localhost:3002/api/dashboard/targets?year=2026', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const response = (await responseRes.json()) as { success: boolean; data: Record<string, unknown> };
    
    console.log('Response success:', response.success);
    console.log('Data keys:', Object.keys(response.data));

    console.log('Testing dashboard targets (team scope)...');
    const teamRes = await fetch('http://localhost:3002/api/dashboard/targets?year=2026&scope=team&teamId=team-alpha', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teamResponse = (await teamRes.json()) as { success: boolean };
    console.log('Team dashboard success:', teamResponse.success);
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('Error:', error.message);
  }
}

test();
