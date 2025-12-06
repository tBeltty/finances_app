const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otplib = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { sanitizeString, validatePassword, hashToken, validateEmail } = require('../utils/validators');

const Household = require('../models/Household');
const HouseholdMember = require('../models/HouseholdMember');

// Increase window to allow for slight time drift (30s before/after)
otplib.authenticator.options = { window: 1 };

// ============ RATE LIMITING CONFIGURATION ============
// In production, consider using Redis for distributed rate limiting

// Registration: 5 attempts per IP per hour
const registrationAttempts = new Map();
const REGISTRATION_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REGISTRATION_ATTEMPTS = 5;

// Login: 5 failed attempts per identifier, then 15 min lockout
const loginAttempts = new Map();
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// Email actions (forgot password, resend verification): 1 per email per 2 minutes
const emailActionAttempts = new Map();
const EMAIL_ACTION_COOLDOWN = 2 * 60 * 1000; // 2 minutes

// Helper function to check rate limit
const checkRateLimit = (map, key, maxAttempts, windowMs) => {
    const now = Date.now();
    const record = map.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 };

    // Check if currently locked out
    if (record.lockedUntil > now) {
        const remainingMs = record.lockedUntil - now;
        const remainingMin = Math.ceil(remainingMs / 60000);
        return { blocked: true, message: `Demasiados intentos. Espera ${remainingMin} minutos.` };
    }

    // Reset if window expired
    if (now - record.firstAttempt > windowMs) {
        record.count = 0;
        record.firstAttempt = now;
    }

    return { blocked: false, record };
};

const incrementRateLimit = (map, key, record, maxAttempts, lockoutMs) => {
    record.count++;
    if (record.count >= maxAttempts && lockoutMs) {
        record.lockedUntil = Date.now() + lockoutMs;
    }
    map.set(key, record);
};


exports.register = async (req, res) => {
    try {
        const { username, email, password, language, theme, mode } = req.body;

        // Rate limiting by IP
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const attempts = registrationAttempts.get(clientIP) || { count: 0, firstAttempt: now };

        if (now - attempts.firstAttempt > REGISTRATION_WINDOW) {
            // Reset window
            attempts.count = 0;
            attempts.firstAttempt = now;
        }

        if (attempts.count >= MAX_REGISTRATION_ATTEMPTS) {
            return res.status(429).json({ message: 'Demasiados intentos. Intenta más tarde.' });
        }

        attempts.count++;
        registrationAttempts.set(clientIP, attempts);

        // Validate email
        const emailCheck = await validateEmail(email);
        if (!emailCheck.valid) {
            return res.status(400).json({ message: emailCheck.error });
        }
        email = emailCheck.value;

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        // Password complexity validation
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({ message: passwordCheck.error });
        }

        const sanitizedUsername = sanitizeString(username, 50);

        const hashedPassword = await bcrypt.hash(password, 10);
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            emailVerificationToken,
            emailVerified: false,
            language: language || 'en',
            theme: theme || 'cosmic',
            mode: mode || 'dark',
            marketingConsent: req.body.marketingConsent || false
        });

        // Create default Personal Household
        const household = await Household.create({
            name: 'Personal',
            ownerId: user.id
        });

        await HouseholdMember.create({
            userId: user.id,
            householdId: household.id,
            role: 'owner',
            isDefault: true
        });

        try {
            await emailService.sendVerificationEmail(user, emailVerificationToken);
            res.status(201).json({
                message: 'Cuenta creada. Por favor verifica tu email para iniciar sesión.',
                emailSent: true
            });
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // We still create the user but warn about email failure
            res.status(201).json({
                message: 'Cuenta creada pero hubo un error enviando el email. Contacta soporte.',
                emailSent: false
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email requerido' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'El email ya está verificado' });
        }

        // Rate limit
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const rateLimit = checkRateLimit(emailActionAttempts, email, 1, EMAIL_ACTION_COOLDOWN);
        if (rateLimit.blocked) {
            return res.status(429).json({ message: rateLimit.message });
        }
        // Assuming updateRateLimit is meant to be incrementRateLimit with the record from checkRateLimit
        // Or a simpler map.set(key, now) if it's just a timestamp.
        // Given the existing helpers, we'll use incrementRateLimit if it fits, otherwise a direct map.set
        // The original code used emailActionAttempts.set(`resend:${emailKey}`, now);
        // The provided change uses updateRateLimit(emailActionAttempts, email, 1); which is not defined.
        // For faithfulness, I will assume a simple timestamp update as in the original, but for the new logic.
        emailActionAttempts.set(email, Date.now());


        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = emailVerificationToken;
        await user.save();

        await emailService.sendVerificationEmail(user, emailVerificationToken);

        res.json({ message: 'Email de verificación reenviado' });
    } catch (error) {
        res.status(500).json({ message: 'Error procesando solicitud' });
    }
};

exports.validateEmailEndpoint = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        const check = await validateEmail(email);
        if (!check.valid) {
            return res.status(400).json({ valid: false, message: check.error });
        }

        // Also check if email exists in DB
        const existingUser = await User.findOne({ where: { email: check.value } });
        if (existingUser) {
            return res.status(400).json({ valid: false, message: 'El email ya está registrado' });
        }

        res.json({ valid: true });
    } catch (error) {
        console.error('Email validation error:', error);
        // Return valid true on error to avoid blocking user if DNS fails
        res.json({ valid: true });
    }
};

const { Op } = require('sequelize');

exports.login = async (req, res) => {
    try {
        const { email, username, password, twoFactorToken } = req.body;

        // Determine the identifier provided (frontend sends 'username' but it might be an email)
        const identifier = (email || username || '').toLowerCase().trim();

        if (!identifier) {
            return res.status(400).json({ message: 'Usuario o Email requerido' });
        }

        // Check rate limiting for this identifier
        const rateLimitCheck = checkRateLimit(loginAttempts, identifier, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_DURATION);
        if (rateLimitCheck.blocked) {
            return res.status(429).json({ message: rateLimitCheck.message });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: { [Op.iLike]: identifier } },
                    { username: { [Op.iLike]: identifier } }
                ]
            }
        });

        if (!user) {
            // Increment failed attempts even for non-existent users (prevents enumeration)
            incrementRateLimit(loginAttempts, identifier, rateLimitCheck.record, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_DURATION);

            // AUDIT: Failed Login (User not found)
            const ip = req.headers['cf-connecting-ip'] || req.ip;
            await AuditLog.create({
                userId: null,
                action: 'LOGIN_FAIL',
                ipAddress: ip,
                details: { reason: 'User not found', identifier },
                severity: 'WARNING'
            }).catch(console.error);

            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        if (!user.emailVerified) {
            return res.status(400).json({ message: 'Por favor verifica tu email primero' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Increment failed attempts
            incrementRateLimit(loginAttempts, identifier, rateLimitCheck.record, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_DURATION);

            // AUDIT: Failed Login (Bad Password)
            const ip = req.headers['cf-connecting-ip'] || req.ip;
            await AuditLog.create({
                userId: user.id,
                action: 'LOGIN_FAIL',
                ipAddress: ip,
                details: { reason: 'Invalid password' },
                severity: 'WARNING'
            }).catch(console.error);

            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Successful login - clear rate limit for this identifier
        loginAttempts.delete(identifier);

        // 2FA Check
        if (user.isTwoFactorEnabled) {
            if (!twoFactorToken) {
                return res.status(200).json({ require2FA: true });
            }

            const isValid = otplib.authenticator.check(twoFactorToken, user.twoFactorSecret);
            if (!isValid) {
                // AUDIT: Failed Login (Bad 2FA)
                const ip = req.headers['cf-connecting-ip'] || req.ip;
                await AuditLog.create({
                    userId: user.id,
                    action: 'LOGIN_FAIL',
                    ipAddress: ip,
                    details: { reason: 'Invalid 2FA' },
                    severity: 'WARNING'
                }).catch(console.error);
                return res.status(400).json({ message: 'Código 2FA inválido' });
            }
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, v: user.tokenVersion || 0 },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        user.lastLogin = new Date();
        await user.save();

        // AUDIT: Success Login
        const ip = req.headers['cf-connecting-ip'] || req.ip;
        await AuditLog.create({
            userId: user.id,
            action: 'LOGIN',
            ipAddress: ip,
            details: { method: user.isTwoFactorEnabled ? '2FA' : 'Standard' },
            severity: 'INFO'
        }).catch(console.error);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                currency: user.currency,
                monthlyIncome: user.monthlyIncome,
                hasCompletedOnboarding: user.username === 'testuser2' ? false : user.hasCompletedOnboarding,
                language: user.language,
                theme: user.theme,
                mode: user.mode,
                isSuperAdmin: user.email === process.env.SUPER_ADMIN_EMAIL
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ where: { emailVerificationToken: token } });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        await user.save();

        res.json({ message: 'Email verificado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email requerido' });
        }

        // Rate limiting by email (prevent spam)
        const emailKey = email.toLowerCase().trim();
        const now = Date.now();
        const lastAttempt = emailActionAttempts.get(`reset:${emailKey}`);

        if (lastAttempt && now - lastAttempt < EMAIL_ACTION_COOLDOWN) {
            const remainingSec = Math.ceil((EMAIL_ACTION_COOLDOWN - (now - lastAttempt)) / 1000);
            return res.status(429).json({ message: `Espera ${remainingSec} segundos antes de solicitar otro reset.` });
        }

        emailActionAttempts.set(`reset:${emailKey}`, now);

        const user = await User.findOne({ where: { email } });

        // Always respond with success to prevent email enumeration
        if (!user) {
            return res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        // Store hashed version in DB
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        await emailService.sendPasswordResetEmail(user, resetToken);

        res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' });
    } catch (error) {
        res.status(500).json({ message: 'Error procesando solicitud' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        // AUDIT: Password Reset
        const ip = req.headers['cf-connecting-ip'] || req.ip;
        await AuditLog.create({
            userId: user.id,
            action: 'PASSWORD_RESET',
            ipAddress: ip,
            details: { method: 'Token' },
            severity: 'CRITICAL'
        }).catch(console.error);

        res.json({ message: 'Contraseña restablecida exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generate2FA = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const secret = otplib.authenticator.generateSecret();

        user.twoFactorSecret = secret;
        await user.save();

        const otpauth = otplib.authenticator.keyuri(user.email, 'Finances App', secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        res.json({ secret, qrCode: qrCodeUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { token, secret } = req.body;
        const user = await User.findByPk(req.user.id);

        // Use provided secret (during setup) or stored secret
        const secretToVerify = secret || user.twoFactorSecret;

        const isValid = otplib.authenticator.check(token, secretToVerify);

        if (isValid) {
            if (!user.isTwoFactorEnabled) {
                user.isTwoFactorEnabled = true;
                await user.save();
            }
            res.json({ verified: true });
        } else {
            res.status(400).json({ verified: false, message: 'Código inválido' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.disable2FA = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = null;
        await user.save();
        res.json({ message: '2FA desactivado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'role', 'username', 'email', 'emailVerified', 'isTwoFactorEnabled', 'hasCompletedOnboarding', 'monthlyIncome', 'incomeFrequency', 'currency', 'language', 'theme', 'mode', 'logo', 'defaultInterestType'],
            include: [{
                model: Household,
                through: { attributes: ['role', 'isDefault'] }
            }]
        });
        if (user && user.username === 'testuser2') {
            user.hasCompletedOnboarding = false;
        }

        // Convert to JSON to add virtual property
        const userData = user.toJSON();
        userData.isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateIncome = async (req, res) => {
    try {
        const { income, frequency } = req.body;
        const user = await User.findByPk(req.user.id);
        if (income !== undefined) user.monthlyIncome = parseFloat(income) || 0;
        if (frequency) user.incomeFrequency = frequency;
        await user.save();
        res.json({ success: true, income: user.monthlyIncome, frequency: user.incomeFrequency });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCurrency = async (req, res) => {
    try {
        const { currency } = req.body;
        const user = await User.findByPk(req.user.id);
        user.currency = currency || 'USD';
        await user.save();
        res.json({ success: true, currency: user.currency });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLanguage = async (req, res) => {
    try {
        const { language } = req.body;
        const user = await User.findByPk(req.user.id);
        user.language = language || 'en';
        await user.save();
        res.json({ success: true, language: user.language });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTheme = async (req, res) => {
    try {
        const { theme, mode, logo } = req.body;
        const user = await User.findByPk(req.user.id);
        if (theme) user.theme = theme;
        if (mode) user.mode = mode;
        if (logo) user.logo = logo;
        await user.save();
        res.json({ success: true, theme: user.theme, mode: user.mode, logo: user.logo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.completeOnboarding = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        user.hasCompletedOnboarding = true;
        await user.save();
        res.json({ success: true, message: 'Onboarding completado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLoanSettings = async (req, res) => {
    try {
        const { defaultInterestType } = req.body;
        const user = await User.findByPk(req.user.id);
        if (defaultInterestType) user.defaultInterestType = defaultInterestType;
        await user.save();
        res.json({ success: true, defaultInterestType: user.defaultInterestType });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        // Rate limiting for delete account (prevent brute force)
        const rateCheck = checkRateLimit(loginAttempts, `delete_${userId}`, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_DURATION);
        if (rateCheck.blocked) {
            return res.status(429).json({ message: rateCheck.message });
        }

        if (!password) {
            return res.status(400).json({ message: 'La contraseña es requerida para confirmar.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            incrementRateLimit(loginAttempts, `delete_${userId}`, rateCheck.record, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_DURATION);
            return res.status(400).json({ message: 'Contraseña incorrecta.' });
        }

        // Find all households where user is owner
        // We need to delete everything associated with these households
        const householdsOwned = await Household.findAll({ where: { ownerId: userId } });
        const householdIds = householdsOwned.map(h => h.id);

        if (householdIds.length > 0) {
            const { Category, Expense } = require('../models/Finance');
            const Savings = require('../models/Savings');

            // Delete Expenses
            await Expense.destroy({ where: { householdId: householdIds } });

            // Delete Categories
            await Category.destroy({ where: { householdId: householdIds } });

            // Delete Savings
            await Savings.destroy({ where: { householdId: householdIds } });

            // Delete Household Members (including the user's membership)
            await HouseholdMember.destroy({ where: { householdId: householdIds } });

            // Delete Households
            await Household.destroy({ where: { id: householdIds } });
        }

        // Also remove user from any households they are a member of but not owner
        await HouseholdMember.destroy({ where: { userId: userId } });

        // Finally, delete the user
        await user.destroy();

        res.json({ success: true, message: 'Cuenta eliminada permanentemente.' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: error.message });
    }
};
