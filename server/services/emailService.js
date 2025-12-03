const { Resend } = require('resend');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = 'noreply@finances.tbelt.online';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://finances.tbelt.online';

class EmailService {
    // Send email verification
    async sendVerificationEmail(user, token) {
        if (!resend) {
            console.log('Resend key missing. Mocking verification email.');
            return { id: 'mock-id' };
        }

        try {
            const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;

            const { data, error } = await resend.emails.send({
                from: `Finances App <${FROM_EMAIL}>`,
                to: user.email,
                subject: 'Verifica tu cuenta',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Verifica tu cuenta</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #e2e8f0; }
                            .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #334155; }
                            .header { background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 40px 24px; text-align: center; }
                            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
                            .content { padding: 40px 32px; }
                            .button { display: inline-block; background: #6366f1; color: white !important; text-decoration: none !important; padding: 14px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4); transition: all 0.2s; }
                            .button:hover { background: #4f46e5; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.5); transform: translateY(-1px); }
                            .footer { padding: 32px; text-align: center; color: #94a3b8; font-size: 13px; background: #0f172a; border-top: 1px solid #334155; }
                            .link-text { color: #6366f1; word-break: break-all; font-size: 13px; margin-top: 16px; background: #0f172a; padding: 12px; border-radius: 8px; font-family: monospace; }
                            p { line-height: 1.6; margin-bottom: 16px; }
                            strong { color: #ffffff; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Finances App</h1>
                            </div>
                            <div class="content">
                                <p>Hola <strong>${user.username}</strong>,</p>
                                <p>Bienvenido a la nueva era de tus finanzas. Para asegurar tu cuenta y comenzar, necesitamos verificar tu correo electrónico.</p>
                                
                                <div style="text-align: center;">
                                    <a href="${verificationUrl}" class="button">Verificar Cuenta</a>
                                </div>
                                
                                <p style="font-size: 14px; margin-top: 32px; color: #94a3b8;">Si el botón no funciona, usa este enlace seguro:</p>
                                <div class="link-text">${verificationUrl}</div>
                            </div>
                            <div class="footer">
                                <p>Recibiste este correo porque te registraste en Finances App.</p>
                                <p>&copy; ${new Date().getFullYear()} tBelt Finances App. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Email service error:', error);
            throw error;
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(user, token) {
        if (!resend) {
            console.log('RESEND_API_KEY missing. Mocking password reset email.');
            console.log(`To: ${user.email}, Subject: Reset Password, Link: ${FRONTEND_URL}/reset-password/${token}`);
            return { id: 'mock-id' };
        }

        try {
            const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

            const { data, error } = await resend.emails.send({
                from: `Finances App <${FROM_EMAIL}>`,
                to: user.email,
                subject: 'Restablecer contraseña',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Restablecer contraseña</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #e2e8f0; }
                            .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #334155; }
                            .header { background: linear-gradient(to right, #ef4444, #f97316); padding: 40px 24px; text-align: center; }
                            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
                            .content { padding: 40px 32px; }
                            .button { display: inline-block; background: #ef4444; color: white !important; text-decoration: none !important; padding: 14px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4); transition: all 0.2s; }
                            .button:hover { background: #dc2626; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.5); transform: translateY(-1px); }
                            .footer { padding: 32px; text-align: center; color: #94a3b8; font-size: 13px; background: #0f172a; border-top: 1px solid #334155; }
                            .link-text { color: #ef4444; word-break: break-all; font-size: 13px; margin-top: 16px; background: #0f172a; padding: 12px; border-radius: 8px; font-family: monospace; }
                            .warning { background-color: #451a03; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0; color: #fdba74; font-size: 14px; border-radius: 0 8px 8px 0; }
                            p { line-height: 1.6; margin-bottom: 16px; }
                            strong { color: #ffffff; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Finances App</h1>
                            </div>
                            <div class="content">
                                <p>Hola <strong>${user.username}</strong>,</p>
                                <p style="color: #e2e8f0;">Recibimos una solicitud para cambiar tu contraseña. Si fuiste tú, puedes continuar a continuación.</p>
                                
                                <div class="warning">
                                    Si no solicitaste este cambio, ignora este mensaje. Tu cuenta sigue segura.
                                </div>

                                <div style="text-align: center;">
                                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                                </div>
                                
                                <p style="font-size: 14px; margin-top: 32px; color: #94a3b8;">Enlace directo de recuperación:</p>
                                <div class="link-text">${resetUrl}</div>
                                
                                <p style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">Este enlace expira en 1 hora.</p>
                            </div>
                            <div class="footer">
                                <p>Este es un mensaje de seguridad automático.</p>
                                <p>&copy; ${new Date().getFullYear()} tBelt Finances App. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Email service error:', error);
            throw error;
        }
    }

    // Send welcome email (after verification)
    async sendWelcomeEmail(user) {
        if (!resend) {
            console.log('RESEND_API_KEY missing. Mocking welcome email.');
            return { id: 'mock-id' };
        }

        try {
            const { data, error } = await resend.emails.send({
                from: `Finances App <${FROM_EMAIL}>`,
                to: user.email,
                subject: '¡Bienvenido a Finances App!',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Bienvenido</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #e2e8f0; }
                            .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #334155; }
                            .header { background: linear-gradient(to right, #10b981, #06b6d4); padding: 40px 24px; text-align: center; }
                            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
                            .content { padding: 40px 32px; }
                            .button { display: inline-block; background: #10b981; color: white !important; text-decoration: none !important; padding: 14px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4); transition: all 0.2s; }
                            .button:hover { background: #059669; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.5); transform: translateY(-1px); }
                            .footer { padding: 32px; text-align: center; color: #94a3b8; font-size: 13px; background: #0f172a; border-top: 1px solid #334155; }
                            .feature-list { margin: 32px 0; padding: 0; list-style: none; }
                            .feature-item { padding: 16px 0; border-bottom: 1px solid #334155; display: flex; align-items: start; }
                            .feature-item:last-child { border-bottom: none; }
                            .feature-icon { margin-right: 16px; font-size: 24px; background: #334155; width: 40px; height: 40px; display: flex; items-center: center; justify-content: center; border-radius: 10px; }
                            p { line-height: 1.6; margin-bottom: 16px; }
                            strong { color: #ffffff; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Finances App</h1>
                            </div>
                            <div class="content">
                                <p>Hola <strong>${user.username}</strong>,</p>
                                <p>¡Tu cuenta está lista! Has dado el primer paso hacia una mejor salud financiera.</p>
                                
                                <div style="text-align: center;">
                                    <a href="${FRONTEND_URL}" class="button">Ir a mi Dashboard</a>
                                </div>
                                
                                <ul class="feature-list">
                                    <li class="feature-item">
                                        <div style="flex: 1;">
                                            <strong style="display: block; margin-bottom: 4px; color: #10b981;">📊 Control Total</strong>
                                            <span style="color: #94a3b8; font-size: 14px;">Visualiza tus ingresos y gastos en tiempo real con gráficos detallados.</span>
                                        </div>
                                    </li>
                                    <li class="feature-item">
                                        <div style="flex: 1;">
                                            <strong style="display: block; margin-bottom: 4px; color: #06b6d4;">🎯 Metas Claras</strong>
                                            <span style="color: #94a3b8; font-size: 14px;">Establece objetivos de ahorro y sigue tu progreso día a día.</span>
                                        </div>
                                    </li>
                                    <li class="feature-item">
                                        <div style="flex: 1;">
                                            <strong style="display: block; margin-bottom: 4px; color: #6366f1;">🔒 Privacidad Primero</strong>
                                            <span style="color: #94a3b8; font-size: 14px;">Tus datos están encriptados y seguros. Solo tú tienes acceso.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer">
                                <p>Gracias por confiar en nosotros.</p>
                                <p>&copy; ${new Date().getFullYear()} tBelt Finances App. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Email service error:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();
