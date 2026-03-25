import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:5000/api/auth/login';

async function testLogin() {
  try {
    console.log(`Testing login for Early Emerald Tapir at ${API_URL}...`);
    const res = await axios.post(API_URL, {
      anonymousName: 'Early Emerald Tapir',
      password: 'password123'
    });
    
    console.log('Login Response Status:', res.status);
    console.log('User Object in Response:', JSON.stringify(res.data.user, null, 2));
    
    if (res.data.user.role === 'super_admin') {
      console.log('SUCCESS: Role is super_admin');
    } else {
      console.log('FAILURE: Role is', res.data.user.role || 'MISSING');
    }
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
  }
}

testLogin();
