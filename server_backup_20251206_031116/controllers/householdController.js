const Household = require('../models/Household');
const HouseholdMember = require('../models/HouseholdMember');
const HouseholdInvite = require('../models/HouseholdInvite');
const User = require('../models/User');
const crypto = require('crypto');
const { Op } = require('sequelize');

exports.createInvite = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find user's default household (or the one they are admin of)
        // Find user's default household (or the one they are admin of)
        // Assume the default household
        const member = await HouseholdMember.findOne({
            where: { userId, isDefault: true }
        });

        if (!member) {
            return res.status(404).json({ message: 'No tienes un hogar asignado.' });
        }

        if (member.role !== 'owner' && member.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permisos para invitar.' });
        }

        const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const invite = await HouseholdInvite.create({
            code,
            householdId: member.householdId,
            invitedBy: userId,
            expiresAt
        });

        res.json({ code, expiresAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.joinHousehold = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        const invite = await HouseholdInvite.findOne({
            where: {
                code,
                isUsed: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!invite) {
            return res.status(400).json({ message: 'Código inválido o expirado.' });
        }

        // Check if user is already a member
        const existingMember = await HouseholdMember.findOne({
            where: { userId, householdId: invite.householdId }
        });

        if (existingMember) {
            return res.status(400).json({ message: 'Ya eres miembro de este hogar.' });
        }

        // Add user to household
        await HouseholdMember.create({
            userId,
            householdId: invite.householdId,
            role: 'member',
            isDefault: false // User keeps their current default unless they change it
        });

        // Mark invite as used (optional)
        // Keeping it reusable allows multiple family members to join with one code in the 24h window.

        res.json({ success: true, message: 'Te has unido al hogar exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMembers = async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await HouseholdMember.findOne({
            where: { userId, isDefault: true }
        });

        if (!member) {
            return res.status(404).json({ message: 'Hogar no encontrado' });
        }

        const members = await HouseholdMember.findAll({
            where: { householdId: member.householdId },
            include: [{
                model: User,
                attributes: ['id', 'username', 'email']
            }]
        });

        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.renameHousehold = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name) return res.status(400).json({ message: 'El nombre es obligatorio' });

        const member = await HouseholdMember.findOne({
            where: { userId, isDefault: true }
        });

        if (!member) {
            return res.status(404).json({ message: 'Hogar no encontrado' });
        }

        if (member.role !== 'owner' && member.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permisos para renombrar el hogar.' });
        }

        const household = await Household.findByPk(member.householdId);
        household.name = name;
        await household.save();

        res.json({ message: 'Hogar renombrado exitosamente', name });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { savingsGoalType, savingsGoalValue } = req.body;
        const userId = req.user.id;

        const member = await HouseholdMember.findOne({
            where: { userId, isDefault: true }
        });

        if (!member) return res.status(404).json({ message: 'Hogar no encontrado' });
        if (member.role !== 'owner' && member.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permisos.' });
        }

        const household = await Household.findByPk(member.householdId);

        if (savingsGoalType !== undefined) household.savingsGoalType = savingsGoalType;
        if (savingsGoalValue !== undefined) household.savingsGoalValue = savingsGoalValue;

        await household.save();
        res.json(household);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHousehold = async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await HouseholdMember.findOne({
            where: { userId, isDefault: true }
        });

        if (!member) return res.status(404).json({ message: 'Hogar no encontrado' });

        const household = await Household.findByPk(member.householdId);
        res.json(household);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
