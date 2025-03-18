// A simple script to test the registration API
async function testRegistration() {
  try {
    // Generate a random email to avoid duplicate registration errors
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    
    // Test data that matches your form
    const testData = {
      email: randomEmail,
      password: "NAPPS2025", // The default password you're using
      full_name: "Test User",
      phone: "08012345678", // A properly formatted phone number
      state: "Lagos",
      chapter: "Test Chapter",
      organization: "Test School",
      position: "Principal"
    };
    
    console.log("Sending registration data:", testData);
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.error);
      if (data.details) {
        console.log('Error details:', data.details);
      }
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testRegistration();