# ⚠️ IMPORTANTE: Configuración de Email para CONTROLIA

Para que el sistema de verificación de email funcione correctamente, necesitas agregar las siguientes variables al archivo `.env` en la carpeta `backend`:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=astralvisionestudio@gmail.com
EMAIL_PASSWORD=tu-app-password-aqui
EMAIL_FROM="CONTROLIA" <astralvisionestudio@gmail.com>
```

## 📧 Cómo obtener tu App Password de Gmail:

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, selecciona "Seguridad"
3. En "Cómo inicias sesión en Google", activa la "Verificación en dos pasos" (si no la tienes activada)
4. Una vez activada, busca "Contraseñas de aplicaciones"
5. Selecciona "Correo" y "Otro (nombre personalizado)"
6. Escribe "CONTROLIA" como nombre
7. Copia la contraseña de 16 caracteres que te genera
8. Pégala en `EMAIL_PASSWORD` en tu archivo `.env`

## 🔐 Ejemplo de configuración completa:

```env
# Configuración existente
MONGO_URI=mongodb://localhost:27017/controlia
JWT_SECRET=tu_secreto_jwt
PORT=5000

# Nueva configuración de Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=astralvisionestudio@gmail.com
EMAIL_PASSWORD=slwm euus nxmn ptbx
EMAIL_FROM="CONTROLIA" <astralvisionestudio@gmail.com>
```

## ✅ Verificación

Una vez configurado, reinicia el servidor backend y deberías ver este mensaje en la consola:

```
✅ Servidor de email listo para enviar mensajes
```

Si ves un error, revisa que:
- La contraseña de aplicación esté correcta (sin espacios)
- Tengas la verificación en dos pasos activada
- El email sea correcto
