import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
// Usa un usuario REAL que exista en tu DB local para que el flow funcione
const EMAIL_TEST = 'jonnhyortega@gmail.com'; 
const NEW_PASSWORD = 'passwordNueva123';

const runTest = async () => {
  try {
    console.log(`🚀 Iniciando prueba de recuperación para: ${EMAIL_TEST}`);

    // 1. Solicitar Forgot Password
    console.log('\n📡 Paso 1: Solicitando token de recuperación...');
    
    // OJO: Estás usando rate limiter, si esto falla puede ser por eso.
    const forgotRes = await axios.post(`${API_URL}/users/forgot-password`, {
      email: EMAIL_TEST
    });

    console.log('✅ Respuesta Paso 1:', forgotRes.data);
    const token = forgotRes.data.debugToken;

    if (!token) {
      throw new Error('❌ No se recibió el debugToken (asegúrate de haber editado el controlador)');
    }
    console.log(`🔑 Token recibido: ${token}`);

    // 2. Resetear Password
    console.log('\n📡 Paso 2: Usando token para setear nueva contraseña...');
    const resetRes = await axios.put(`${API_URL}/users/reset-password/${token}`, {
      password: NEW_PASSWORD
    });
    console.log('✅ Respuesta Paso 2:', resetRes.data);


    // 3. Intentar Login
    console.log('\n📡 Paso 3: Intentando login con NUEVA contraseña...');
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: EMAIL_TEST,
      password: NEW_PASSWORD
    });

    if (loginRes.data.token) {
      console.log('🎉 ÉXITO TOTAL: Login correcto con la nueva contraseña.');
      console.log('👤 Usuario:', loginRes.data.name);
    } else {
      console.log('⚠️ Login respondió pero sin token (raro).');
    }

  } catch (error) {
    if (error.response) {
        console.error(`❌ Falló la petición: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
        console.error('❌ Error:', error.message);
    }
  }
};

runTest();
