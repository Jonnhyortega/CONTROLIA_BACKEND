import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.join(__dirname, '../src/config/serviceAccountKey.json');

console.log("Reading key from:", keyPath);
const creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

try {
  let key = creds.private_key;
  // Fix newlines if they are literal \n
  if (key.includes('\\n')) {
     console.log("Fixing newlines in key...");
     key = key.replace(/\\n/g, '\n');
  }
  
  console.log("Key Header:", key.substring(0, 35));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update('test');
  const sig = sign.sign(key, 'hex');
  console.log("Crypto Sign SUCCESS");
} catch (e) {
  console.error("Crypto Sign FAILED");
  console.error(e);
}
