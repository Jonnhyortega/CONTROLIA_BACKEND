import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET_BACKUP,
  GOOGLE_REFRESH_TOKEN_BACKUP,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET_BACKUP || !GOOGLE_REFRESH_TOKEN_BACKUP) {
  // Solo loguear advertencia, no romper app si faltan credenciales (backup fallará pero app sigue)
  console.warn('[Backup] Advertencia: Credenciales OAuth2 incompletas.');
  console.warn('GOOGLE_CLIENT_ID:', !!GOOGLE_CLIENT_ID);
  console.warn('GOOGLE_CLIENT_SECRET:', !!GOOGLE_CLIENT_SECRET_BACKUP);
  console.warn('GOOGLE_REFRESH_TOKEN:', !!GOOGLE_REFRESH_TOKEN_BACKUP);
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID_BACKUP,
  GOOGLE_CLIENT_SECRET_BACKUP,
  'https://developers.google.com/oauthplayground' // Redirect URI usado
);

oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN_BACKUP });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export default drive;
