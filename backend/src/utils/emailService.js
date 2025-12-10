import nodemailer from "nodemailer";

// 📧 Configurar transporter de Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ✅ Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error en configuración de email:", error);
  } else {
    console.log("✅ Servidor de email listo para enviar mensajes");
  }
});

/**
 * 📨 Enviar email de verificación con código
 * @param {string} email - Email del destinatario
 * @param {string} code - Código de verificación de 6 dígitos
 * @param {string} name - Nombre del usuario
 */
export const sendVerificationEmail = async (email, code, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"CONTROLIA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifica tu cuenta en CONTROLIA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificación de Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 15px;">
                            <img src="https://res.cloudinary.com/do87isqjr/image/upload/v1765112813/logo-controlia_wn3fcj.png" alt="CONTROLIA Logo" width="150" height="auto" style="display: block; margin: 0 auto; max-width: 150px; height: auto;" />
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">
                        CONTROLIA
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                        Sistema de Gestión Empresarial
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 24px; font-weight: 600;">
                        ¡Hola ${name}! 👋
                      </h2>
                      <p style="margin: 0 0 20px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Gracias por registrarte en <strong>CONTROLIA</strong>. Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de email.
                      </p>
                      <p style="margin: 0 0 30px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Tu código de verificación es:
                      </p>
                      
                      <!-- Verification Code -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #2563eb; border-radius: 12px; padding: 20px 40px;">
                              <span style="font-size: 36px; font-weight: 700; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                ${code}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 20px 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        <strong>⏱️ Este código expira en 15 minutos.</strong>
                      </p>
                      <p style="margin: 0 0 20px 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        Si no solicitaste este código, puedes ignorar este email de forma segura.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0 0 10px 0; color: #a1a1aa; font-size: 13px;">
                        © ${new Date().getFullYear()} CONTROLIA. Todos los derechos reservados.
                      </p>
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                        Este es un email automático, por favor no respondas a este mensaje.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Hola ${name},
        
        Gracias por registrarte en CONTROLIA.
        
        Tu código de verificación es: ${code}
        
        Este código expira en 15 minutos.
        
        Si no solicitaste este código, puedes ignorar este email.
        
        Saludos,
        El equipo de CONTROLIA
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw new Error("No se pudo enviar el email de verificación");
  }
};

// ... (previous function: sendVerificationEmail)

/**
 * 🔐 Enviar email de recuperación de contraseña
 * @param {string} email - Email del destinatario
 * @param {string} resetUrl - URL para resetear la contraseña
 * @param {string} name - Nombre del usuario
 */
export const sendResetPasswordEmail = async (email, resetUrl, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"CONTROLIA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperación de Contraseña - CONTROLIA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 15px;">
                            <img src="https://res.cloudinary.com/do87isqjr/image/upload/v1765112813/logo-controlia_wn3fcj.png" alt="CONTROLIA Logo" width="150" height="auto" style="display: block; margin: 0 auto; max-width: 150px; height: auto;" />
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">
                        CONTROLIA
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                        Recuperación de Acceso
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 24px; font-weight: 600;">
                        Hola ${name},
                      </h2>
                      <p style="margin: 0 0 20px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>CONTROLIA</strong>.
                      </p>
                      <p style="margin: 0 0 30px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Haz clic en el siguiente botón para crear una nueva contraseña:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 10px 0 30px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                              Restablecer Contraseña
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Este enlace expirará en 10 minutos.</strong>
                      </p>
                      <p style="margin: 10px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0 0 10px 0; color: #a1a1aa; font-size: 13px;">
                        © ${new Date().getFullYear()} CONTROLIA. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Hola ${name},
        
        Hemos recibido una solicitud para restablecer tu contraseña.
        
        Haz clic en el siguiente enlace para continuar:
        ${resetUrl}
        
        Este enlace expira en 10 minutos.
        
        Si no solicitaste este cambio, ignora este mensaje.
        
        Saludos,
        El equipo de CONTROLIA
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de recuperación enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error enviando email de recuperación:", error);
    throw new Error("No se pudo enviar el email de recuperación");
  }
};

export default { sendVerificationEmail, sendResetPasswordEmail };
