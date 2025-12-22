import axios from 'axios';

const loginUrl = 'http://localhost:5000/api/users/login';
const createSubUrl = 'http://localhost:5000/api/subscriptions/create';

const credentials = {
  email: 'jonathan@controlia.com',
  password: '123456'
};

const runTest = async () => {
  try {
    // 1. Login
    console.log(`🔑 Logging in as ${credentials.email}...`);
    const loginRes = await axios.post(loginUrl, credentials);
    const token = loginRes.data.token;
    console.log('✅ Login successful. Token received.');

    // 2. Create Subscription
    console.log('💳 Creating BASIC subscription...');
    const subRes = await axios.post(
      createSubUrl,
      { plan: 'basic' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Subscription preference created!');
    console.log('---------------------------------------------------');
    console.log('🔗 Link de Pago (init_point):');
    console.log(subRes.data.init_point);
    console.log('---------------------------------------------------');
    console.log('🆔 ID de Pre-approval:', subRes.data.id);

  } catch (error) {
    console.error('❌ Error in test:', error.response ? error.response.data : error.message);
  }
};

runTest();
