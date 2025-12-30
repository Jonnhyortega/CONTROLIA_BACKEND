import drive from '../src/config/googleDrive.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

(async () => {
  try {
    console.log("DEBUG: Testing Google Drive integration...");
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log("DEBUG: Folder ID:", folderId);

    const fileMetadata = {
      name: 'debug_test_file.txt',
      parents: [folderId],
    };
    const media = {
      mimeType: 'text/plain',
      body: 'Hello World Debug',
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log("DEBUG: File created, ID:", file.data.id);
    process.exit(0);
  } catch (e) {
    console.error("DEBUG ERROR:", e);
    process.exit(1);
  }
})();
