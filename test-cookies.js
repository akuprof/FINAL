// Test script to verify cookie handling
const testCookies = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Cookie Handling...\n');
  
  // Test 1: Login and check cookies
  try {
    console.log('1. Attempting login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login Successful');
      console.log('   User:', loginData.user.email);
      
      // Check if cookies are set
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        console.log('✅ Cookies set:', cookies);
      } else {
        console.log('❌ No cookies in response');
      }
      
      // Test 2: Verify session immediately
      console.log('\n2. Verifying session...');
      const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
        credentials: 'include',
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok) {
        console.log('✅ Session Verification Successful');
        console.log('   User:', verifyData.user.email);
      } else {
        console.log('❌ Session Verification Failed:', verifyData.message);
      }
      
    } else {
      console.log('❌ Login Failed:', loginData.message);
    }
  } catch (error) {
    console.log('❌ Test Failed:', error.message);
  }
  
  console.log('\n🎉 Cookie test completed!');
};

// Run the test
testCookies();
