import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Migration from "../src/models/Migration.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, "migrations");
  }

  async connect() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log("👋 Desconectado de MongoDB");
  }

  async getMigrationFiles() {
    const files = fs.readdirSync(this.migrationsPath);
    const migrations = [];

    for (const file of files) {
      if (file.endsWith(".js")) {
        const filePath = path.join(this.migrationsPath, file);
        const migration = await import(`file://${filePath}`);
        migrations.push(migration.default);
      }
    }

    return migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  async getExecutedMigrations() {
    const executed = await Migration.find({ status: "completed" });
    return new Set(executed.map((m) => m.version));
  }

  async runPendingMigrations() {
    console.log("\n🚀 Iniciando proceso de migraciones...\n");

    const allMigrations = await this.getMigrationFiles();
    const executedVersions = await this.getExecutedMigrations();

    const pendingMigrations = allMigrations.filter(
      (m) => !executedVersions.has(m.version)
    );

    if (pendingMigrations.length === 0) {
      console.log("✅ No hay migraciones pendientes");
      return;
    }

    console.log(`📋 ${pendingMigrations.length} migraciones pendientes:\n`);

    for (const migration of pendingMigrations) {
      console.log(`⏳ Ejecutando: ${migration.name} (v${migration.version})`);

      const migrationRecord = new Migration({
        version: migration.version,
        name: migration.name,
        status: "pending",
      });

      try {
        await migration.up();
        migrationRecord.status = "completed";
        await migrationRecord.save();
        console.log(`✅ Completada: ${migration.name}\n`);
      } catch (error) {
        migrationRecord.status = "failed";
        await migrationRecord.save();
        console.error(`❌ Error en migración ${migration.name}:`, error);
        throw error;
      }
    }

    console.log("\n🎉 Todas las migraciones completadas exitosamente");
  }

  async rollback(version) {
    console.log(`\n⏪ Revirtiendo migración: v${version}\n`);

    const allMigrations = await this.getMigrationFiles();
    const migration = allMigrations.find((m) => m.version === version);

    if (!migration) {
      throw new Error(`Migración v${version} no encontrada`);
    }

    const record = await Migration.findOne({ version, status: "completed" });
    if (!record) {
      throw new Error(`Migración v${version} no ha sido ejecutada`);
    }

    try {
      await migration.down();
      await Migration.deleteOne({ version });
      console.log(`✅ Migración v${version} revertida exitosamente`);
    } catch (error) {
      console.error(`❌ Error revirtiendo migración:`, error);
      throw error;
    }
  }

  async status() {
    console.log("\n📊 Estado de Migraciones:\n");

    const allMigrations = await this.getMigrationFiles();
    const executedMigrations = await Migration.find().sort({ version: 1 });

    console.log("Todas las migraciones:");
    for (const migration of allMigrations) {
      const executed = executedMigrations.find((m) => m.version === migration.version);
      const status = executed
        ? `✅ ${executed.status} (${executed.executedAt.toLocaleString()})`
        : "⏳ pendiente";
      console.log(`  v${migration.version} - ${migration.name}: ${status}`);
    }
    console.log();
  }
}

// CLI
const command = process.argv[2];
const runner = new MigrationRunner();

(async () => {
  try {
    await runner.connect();

    switch (command) {
      case "up":
        await runner.runPendingMigrations();
        break;
      case "down":
        const version = process.argv[3];
        if (!version) {
          console.error("❌ Debes especificar la versión a revertir");
          process.exit(1);
        }
        await runner.rollback(version);
        break;
      case "status":
        await runner.status();
        break;
      default:
        console.log(`
🔧 Sistema de Migraciones de CONTROLIA

Uso:
  node scripts/migrate.js up        - Ejecutar migraciones pendientes
  node scripts/migrate.js down 001  - Revertir migración específica
  node scripts/migrate.js status    - Ver estado de migraciones
        `);
    }

    await runner.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await runner.disconnect();
    process.exit(1);
  }
})();
