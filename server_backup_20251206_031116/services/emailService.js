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

        const isEs = user.language === 'es';
        const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;

        const subject = isEs ? 'Verifica tu cuenta' : 'Verify your account';
        const title = isEs ? 'Finances App' : 'Finances App';
        const greeting = isEs ? `Hola <strong>${user.username}</strong>,` : `Hello <strong>${user.username}</strong>,`;
        const message = isEs
            ? 'Bienvenido a la nueva era de tus finanzas. Para asegurar tu cuenta y comenzar, necesitamos verificar tu correo electrónico.'
            : 'Welcome to the new era of your finances. To secure your account and get started, we need to verify your email address.';
        const buttonText = isEs ? 'Verificar Cuenta' : 'Verify Account';
        const fallbackText = isEs ? 'Si el botón no funciona, usa este enlace seguro:' : 'If the button doesn\'t work, use this secure link:';
        const footerText = isEs ? 'Recibiste este correo porque te registraste en Finances App.' : 'You received this email because you signed up for Finances App.';
        const copyright = isEs ? `&copy; ${new Date().getFullYear()} tBelt Finances App. Todos los derechos reservados.` : `&copy; ${new Date().getFullYear()} tBelt Finances App. All rights reserved.`;

        try {
            const { data, error } = await resend.emails.send({
                from: `Finances App <${FROM_EMAIL}>`,
                to: user.email,
                subject: subject,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${subject}</title>
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
                                <h1>${title}</h1>
                            </div>
                            <div class="content">
                                <p>${greeting}</p>
                                <p>${message}</p>
                                
                                <div style="text-align: center;">
                                    <a href="${verificationUrl}" class="button">${buttonText}</a>
                                </div>
                                
                                <p style="font-size: 14px; margin-top: 32px; color: #94a3b8;">${fallbackText}</p>
                                <div class="link-text">${verificationUrl}</div>
                            </div>
                            <div class="footer">
                                <p>${footerText}</p>
                                <p>${copyright}</p>
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

        const isEs = user.language === 'es';
        const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

        const subject = isEs ? 'Restablecer contraseña' : 'Reset Password';
        const title = isEs ? 'Finances App' : 'Finances App';
        const greeting = isEs ? `Hola <strong>${user.username}</strong>,` : `Hello <strong>${user.username}</strong>,`;
        const message = isEs
            ? 'Recibimos una solicitud para cambiar tu contraseña. Si fuiste tú, puedes continuar a continuación.'
            : 'We received a request to change your password. If this was you, you can proceed below.';
        const warning = isEs
            ? 'Si no solicitaste este cambio, ignora este mensaje. Tu cuenta sigue segura.'
            : 'If you did not request this change, ignore this message. Your account remains secure.';
        const buttonText = isEs ? 'Restablecer Contraseña' : 'Reset Password';
        const fallbackText = isEs ? 'Enlace directo de recuperación:' : 'Direct recovery link:';
        const expiryText = isEs ? 'Este enlace expira en 1 hora.' : 'This link expires in 1 hour.';
        const footerText = isEs ? 'Este es un mensaje de seguridad automático.' : 'This is an automated security message.';
        const copyright = isEs ? `&copy; ${new Date().getFullYear()} tBelt Finances App. Todos los derechos reservados.` : `&copy; ${new Date().getFullYear()} tBelt Finances App. All rights reserved.`;

        try {
            const { data, error } = await resend.emails.send({
                from: `Finances App <${FROM_EMAIL}>`,
                to: user.email,
                subject: subject,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${subject}</title>
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
                                <h1>${title}</h1>
                            </div>
                            <div class="content">
                                <p>${greeting}</p>
                                <p style="color: #e2e8f0;">${message}</p>
                                
                                <div class="warning">
                                    ${warning}
                                </div>

                                <div style="text-align: center;">
                                    <a href="${resetUrl}" class="button">${buttonText}</a>
                                </div>
                                
                                <p style="font-size: 14px; margin-top: 32px; color: #94a3b8;">${fallbackText}</p>
                                <div class="link-text">${resetUrl}</div>
                                
                                <p style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">${expiryText}</p>
                            </div>
                            <div class="footer">
                                <p>${footerText}</p>
                                <p>${copyright}</p>
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

        const isEs = user.language === 'es';

        const subject = isEs ? '¡Bienvenido a Finances App!' : 'Welcome to Finances App!';
        const title = isEs ? 'Finances App' : 'Finances App';
        const greeting = isEs ? `Hola <strong>${user.username}</strong>,` : `Hello <strong>${user.username}</strong>,`;
        const message = isEs
            ? '¡Tu cuenta está lista! Has dado el primer paso hacia una mejor salud financiera.'
            : 'Your account is ready! You have taken the first step towards better financial health.';
        const buttonText = isEs ? 'Ir a mi Dashboard' : 'Go to Dashboard';
        const footerText = isEs ? 'Gracias por confiar en nosotros.' : 'Thank you for trusting us.';
        const copyright = isEs ? `&copy; ${new Date().getFullYear()} tBelt Finances App. Todos los derechos reservados.` : `&copy; ${new Date().getFullYear()} tBelt Finances App. All rights reserved.`;

        // Features
        const f1Title = isEs ? '📊 Control Total' : '📊 Total Control';
        const f1Desc = isEs ? 'Visualiza tus ingresos y gastos en tiempo real con gráficos detallados.' : 'Visualize your income and expenses in real-time with detailed charts.';

        const f2Title = isEs ? '🎯 Metas Claras' : '🎯 Clear Goals';
        const f2Desc = isEs ? 'Establece objetivos de ahorro y sigue tu progreso día a día.' : 'Set savings goals and track your progress day by day.';

        const f3Title = isEs ? '🔒 Privacidad Primero' : '🔒 Privacy First';
        const f3Desc = isEs ? 'Tus datos están encriptados y seguros. Solo tú tienes acceso.' : 'Your data is encrypted and secure. Only you have access.';

        try {
            const { data, error } = await resend.emails.send({
                from: `Finances App <${FROM_EMAIL}>`,
                to: user.email,
                subject: subject,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${subject}</title>
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
                                <h1>${title}</h1>
                            </div>
                            <div class="content">
                                <p>${greeting}</p>
                                <p>${message}</p>
                                
                                <div style="text-align: center;">
                                    <a href="${FRONTEND_URL}" class="button">${buttonText}</a>
                                </div>
                                
                                <ul class="feature-list">
                                    <li class="feature-item">
                                        <div style="flex: 1;">
                                            <strong style="display: block; margin-bottom: 4px; color: #10b981;">${f1Title}</strong>
                                            <span style="color: #94a3b8; font-size: 14px;">${f1Desc}</span>
                                        </div>
                                    </li>
                                    <li class="feature-item">
                                        <div style="flex: 1;">
                                            <strong style="display: block; margin-bottom: 4px; color: #06b6d4;">${f2Title}</strong>
                                            <span style="color: #94a3b8; font-size: 14px;">${f2Desc}</span>
                                        </div>
                                    </li>
                                    <li class="feature-item">
                                        <div style="flex: 1;">
                                            <strong style="display: block; margin-bottom: 4px; color: #6366f1;">${f3Title}</strong>
                                            <span style="color: #94a3b8; font-size: 14px;">${f3Desc}</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer">
                                <p>${footerText}</p>
                                <p>${copyright}</p>
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
