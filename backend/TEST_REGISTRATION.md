# 🧪 Test de Registro con Verificación de Email

## 📝 Endpoint de Registro

```bash
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "name": "Usuario Prueba",
  "email": "test@example.com",
  "password": "123456"
}
```

## ✅ Respuesta Esperada

```json
{
  "message": "Usuario registrado. Por favor, verifica tu email con el código enviado.",
  "email": "test@example.com"
}
```

## 📧 Email Esperado

Deberías recibir un email en `test@example.com` con:
- Asunto: "Verifica tu cuenta en CONTROLIA"
- Código de 6 dígitos
- Diseño profesional con gradientes azules

## 🔍 Verificar Email

```bash
POST http://localhost:5000/api/users/verify-email
Content-Type: application/json

{
  "email": "test@example.com",
  "code": "123456"
}
```

## ✅ Respuesta Esperada (Verificación)

```json
{
  "message": "Email verificado correctamente",
  "_id": "...",
  "name": "Usuario Prueba",
  "email": "test@example.com",
  "role": "empleado",
  "membershipTier": "basic",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔐 Login Después de Verificar

```bash
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

---

## 🛠️ Usando cURL (Windows PowerShell)

### Registro:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" -Method POST -ContentType "application/json" -Body '{"name":"Usuario Prueba","email":"test@example.com","password":"123456"}'
```

### Verificar:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/users/verify-email" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","code":"TU_CODIGO_AQUI"}'
```

### Login:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/users/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"123456"}'
```

---

## ❌ Errores Comunes

### Error: "Usuario ya existe"
- El email ya está registrado
- Usa otro email o elimina el usuario de MongoDB

### Error: "Error al enviar el email de verificación"
- Revisa que el EMAIL_PASSWORD esté correcto en .env
- Verifica que la verificación en 2 pasos esté activa en Gmail
- Revisa la consola del backend para ver el error específico

### Error: "Código de verificación inválido"
- El código no coincide
- Revisa el email recibido

### Error: "El código ha expirado"
- Han pasado más de 15 minutos
- Usa el endpoint `/resend-verification` para obtener un nuevo código
