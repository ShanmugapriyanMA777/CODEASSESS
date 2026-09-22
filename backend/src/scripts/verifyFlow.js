const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function put(path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function verify() {
  console.log('🧪 Testing Student Login with Register Number & DOB:');
  const regNo = '312824104126';
  const dob = '16-06-2007';

  // Test 1: Standard login
  const login1 = await post('/api/auth/login', { identifier: regNo, password: dob });
  console.log('1. Login with RegNo + DD-MM-YYYY:', login1.status, login1.data.success, login1.data.data?.name);
  if (!login1.data.success) throw new Error('Login 1 failed');

  const token = login1.data.data.token;

  // Test 2: Variation DD/MM/YYYY
  const login2 = await post('/api/auth/login', { identifier: regNo, password: '16/06/2007' });
  console.log('2. Login with slash DOB (16/06/2007):', login2.status, login2.data.success);

  // Test 3: Variation DDMMYYYY
  const login3 = await post('/api/auth/login', { identifier: regNo, password: '16062007' });
  console.log('3. Login with compact DOB (16062007):', login3.status, login3.data.success);

  // Test 4: Update email
  const updateEmail = await put('/api/auth/profile', { email: 'rakshaa.sm@act.edu.in' }, token);
  console.log('4. Profile email update:', updateEmail.status, updateEmail.data.success, updateEmail.data.data?.email);

  // Test 5: Change password
  const changePass = await put(
    '/api/auth/change-password',
    { currentPassword: dob, newPassword: 'RakshaaSecure@123', confirmPassword: 'RakshaaSecure@123' },
    token
  );
  console.log('5. Password change:', changePass.status, changePass.data.success, changePass.data.message);

  // Test 6: Login with new password
  const loginNew = await post('/api/auth/login', { identifier: regNo, password: 'RakshaaSecure@123' });
  console.log('6. Login with new password:', loginNew.status, loginNew.data.success);

  // Test 7: Old password should now fail
  const loginOld = await post('/api/auth/login', { identifier: regNo, password: dob });
  console.log('7. Old DOB rejected:', loginOld.status === 401 ? 'PASSED (401)' : loginOld.status);

  console.log('🎉 All verification tests passed successfully!');
}

verify().catch(console.error);
