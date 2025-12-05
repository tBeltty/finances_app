const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otplib = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const Household = require('../models/Household');
const HouseholdMember = require('../models/HouseholdMember');

// Increase window to allow for slight time drift (30s before/after)
otplib.authenticator.options = { window: 1 };

exports.register = async (req, res) => {
    try {
        const { username, email, password, language, theme, mode } = req.body;

        // Validate email is provided
        if (!email) {
            return res.status(400).json({ message: 'El email es obligatorio' });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

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
            mode: mode || 'dark'
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
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'El email ya está verificado' });
        }

        // Generate new token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = emailVerificationToken;
        await user.save();

        await emailService.sendVerificationEmail(user, emailVerificationToken);

        res.json({ message: 'Email de verificación reenviado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { Op } = require('sequelize');

exports.login = async (req, res) => {
    try {
        const { email, username, password, twoFactorToken } = req.body;

        // Determine the identifier provided (frontend sends 'username' but it might be an email)
        const identifier = email || username;

        if (!identifier) {
            return res.status(400).json({ message: 'Usuario o Email requerido' });
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
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        if (!user.emailVerified) {
            return res.status(400).json({ message: 'Por favor verifica tu email primero' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // 2FA Check
        if (user.isTwoFactorEnabled) {
            if (!twoFactorToken) {
                return res.status(200).json({ require2FA: true });
            }

            const isValid = otplib.authenticator.check(twoFactorToken, user.twoFactorSecret);
            if (!isValid) {
                return res.status(400).json({ message: 'Código 2FA inválido' });
            }
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
                mode: user.mode
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
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        await emailService.sendPasswordResetEmail(user, resetToken);

        res.json({ message: 'Email de restablecimiento enviado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

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
            attributes: ['id', 'username', 'email', 'emailVerified', 'isTwoFactorEnabled', 'hasCompletedOnboarding', 'monthlyIncome', 'currency', 'language', 'theme', 'mode'],
            include: [{
                model: Household,
                through: { attributes: ['role', 'isDefault'] }
            }]
        });
        if (user && user.username === 'testuser2') {
            user.hasCompletedOnboarding = false;
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateIncome = async (req, res) => {
    try {
        const { income } = req.body;
        const user = await User.findByPk(req.user.id);
        user.monthlyIncome = parseFloat(income) || 0;
        await user.save();
        res.json({ success: true, income: user.monthlyIncome });
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
        const { theme, mode } = req.body;
        const user = await User.findByPk(req.user.id);
        if (theme) user.theme = theme;
        if (mode) user.mode = mode;
        await user.save();
        res.json({ success: true, theme: user.theme, mode: user.mode });
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

exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

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
