// A simple script to test the registration API
async function testRegistration() {
  try {
    // Generate a random email to avoid duplicate registration errors
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: randomEmail,
        password: 'Password123', // Valid password (8+ characters)
        full_name: 'Test User',
        phone: '1234567890',
        state: 'Lagos',
        lga: 'Ikeja',
        chapter: 'Test Chapter',
        organization: 'Test Org',
        position: 'Developer'
      }),
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Execute the test
testRegistration();