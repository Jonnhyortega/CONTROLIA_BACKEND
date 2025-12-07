# 🔧 Sistema de Migraciones de Base de Datos

Sistema profesional de migraciones para CONTROLIA que permite versionar y controlar cambios en la base de datos.

## 📋 Comandos Disponibles

### Ver estado de migraciones
```bash
node scripts/migrate.js status
```

### Ejecutar migraciones pendientes
```bash
node scripts/migrate.js up
```

### Revertir una migración específica
```bash
node scripts/migrate.js down 001
```

---

## 🎯 Uso Recomendado

### Primera vez (migrar usuarios existentes)
```bash
# 1. Ver qué migraciones hay
node scripts/migrate.js status

# 2. Ejecutar migraciones pendientes
node scripts/migrate.js up
```

### Crear una nueva migración

1. Crear archivo en `scripts/migrations/` con formato: `XXX_nombre_descriptivo.js`
2. Usar la siguiente estructura:

```javascript
import User from "../../src/models/User.js";

export default {
  version: "002", // Incrementar número
  name: "nombre_descriptivo",
  description: "Descripción de qué hace esta migración",

  async up() {
    // Código para aplicar la migración
    console.log("📦 Ejecutando migración...");
    
    const result = await User.updateMany(
      { /* condiciones */ },
      { $set: { /* cambios */ } }
    );
    
    console.log(`✅ ${result.modifiedCount} documentos actualizados`);
    return result;
  },

  async down() {
    // Código para revertir la migración
    console.log("⏪ Revirtiendo migración...");
    
    const result = await User.updateMany(
      {},
      { $unset: { /* campos a eliminar */ } }
    );
    
    console.log(`✅ ${result.modifiedCount} documentos revertidos`);
    return result;
  },
};
```

---

## 🔍 Migraciones Existentes

### 001 - add_membership_and_verification_fields
**Descripción:** Agrega campos de membresía y verificación de email a usuarios existentes

**Campos agregados:**
- `membershipTier`: "basic"
- `membershipStartDate`: fecha actual
- `membershipEndDate`: null
- `isEmailVerified`: true (usuarios existentes)
- `verificationCode`: null
- `verificationCodeExpires`: null
- `active`: true (usuarios existentes)

**Ejecutar:**
```bash
node scripts/migrate.js up
```

**Revertir:**
```bash
node scripts/migrate.js down 001
```

---

## ⚠️ Notas Importantes

1. **Siempre hacer backup** antes de ejecutar migraciones en producción
2. **Probar en desarrollo** antes de aplicar en producción
3. Las migraciones se ejecutan **en orden** por versión
4. El sistema registra qué migraciones se han ejecutado en la colección `migrations`
5. No se pueden ejecutar dos veces la misma migración

---

## 🚀 Integración con Deployment

Para ejecutar migraciones automáticamente al hacer deploy:

### package.json
```json
{
  "scripts": {
    "migrate": "node scripts/migrate.js up",
    "migrate:status": "node scripts/migrate.js status",
    "start": "npm run migrate && node src/server.js"
  }
}
```

Esto ejecutará las migraciones pendientes antes de iniciar el servidor.
