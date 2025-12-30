import cron from 'node-cron';
import backupService from '../services/backupService.js';

const initScheduler = () => {
  // Programar para las 03:00 AM todos los días (Server Time)
  // Ajustar zona horaria si es necesario o confiar en la del servidor
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] Ejecutando tarea programada: Backup Diario');
    try {
      await backupService.performBackup();
    } catch (error) {
      console.error('[Cron] Falló el backup diario:', error);
    }
  });

  console.log('🕒 Scheduler de Backups inicializado (03:00 AM diario).');
};

export default initScheduler;
