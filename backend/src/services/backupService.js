import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { exec } from 'child_process';
import drive from '../config/googleDrive.js';
import dayjs from 'dayjs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db_temp.js'; // Importar conexión

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajustar rutas relativas a la raíz del proyecto backend
const BACKEND_ROOT = path.join(__dirname, '../../');
const BACKUP_DIR = path.join(BACKEND_ROOT, 'backups');
const TEMP_DIR = path.join(BACKEND_ROOT, 'temp');

// Asegurar que existan directorios
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const performBackup = async () => {
  const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
  const backupName = `backup_controlia_${timestamp}`;
  const dumpPath = path.join(TEMP_DIR, backupName);
  const zipPath = path.join(BACKUP_DIR, `${backupName}.zip`);

  console.log(`[Backup] Iniciando proceso: ${backupName}`);

  try {
    // 1. Exportar datos (Nativo Node.js sin mongodump)
    console.log('[Backup] Exportando colecciones a JSON...');
    await exportCollectionsToJSON(dumpPath);
    
    // 2. Comprimir a ZIP
    console.log('[Backup] Comprimiendo archivos...');
    await zipDirectory(dumpPath, zipPath);

    // 3. Subir a Drive
    console.log('[Backup] Subiendo a Google Drive...');
    const fileId = await uploadToDrive(zipPath, `${backupName}.zip`);
    console.log(`[Backup] Subida exitosa. File ID: ${fileId}`);

    // 4. Limpieza
    console.log('[Backup] Limpiando archivos temporales...');
    fs.rmSync(dumpPath, { recursive: true, force: true });
    // Opcional: eliminar el zip local también
    // fs.unlinkSync(zipPath); 

    return { success: true, fileId, timestamp };

  } catch (error) {
    console.error('[Backup] Error crítico:', error);
    throw error;
  }
};

// Función auxiliar para exportar colecciones
const exportCollectionsToJSON = async (outDir) => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Asegurar conexión
  if (mongoose.connection.readyState !== 1) {
    console.log('[Backup] Conectando a MongoDB...');
    await connectDB();
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const col of collections) {
    console.log(`[Backup] Exportando colección: ${col.name}`);
    const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
    fs.writeFileSync(
      path.join(outDir, `${col.name}.json`), 
      JSON.stringify(data, null, 2)
    );
  }
};

const zipDirectory = (sourceDir, outPath) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
};

const uploadToDrive = async (filePath, fileName) => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID no configurado');

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
    supportsAllDrives: true,
  });

  return file.data.id;
};

export default { performBackup };
