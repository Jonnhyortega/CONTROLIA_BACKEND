// 🔐 Validar variables de entorno críticas al iniciar
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_HOST',
  'EMAIL_PORT',
];

export const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('\n❌ ERROR: Variables de entorno faltantes:\n');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Asegúrate de configurar estas variables en tu archivo .env\n');
    process.exit(1);
  }

  console.log('✅ Todas las variables de entorno requeridas están configuradas');
};

export default validateEnv;
