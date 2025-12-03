const HouseholdMember = require('../models/HouseholdMember');

module.exports = async (req, res, next) => {
    const householdId = req.headers['x-household-id'];

    if (!householdId) {
        return res.status(400).json({ message: 'Household ID header is required' });
    }

    try {
        const membership = await HouseholdMember.findOne({
            where: {
                userId: req.user.id,
                householdId: householdId
            }
        });

        if (!membership) {
            return res.status(403).json({ message: 'You are not a member of this household' });
        }

        req.householdId = householdId;
        req.householdRole = membership.role;
        next();
    } catch (error) {
        console.error('Household middleware error:', error);
        return res.status(500).json({ message: 'Error verifying household membership' });
    }
};
