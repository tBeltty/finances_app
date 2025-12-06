const jwt = require('jsonwebtoken');
const User = require('../models/User'); // We need to check DB

module.exports = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // If the token has a version 'v', we MUST verify it against the DB
        // If it doesn't have 'v' (old token), we might want to invalidate it or treat as v=0
        // For security, we'll fetch the user anyway.

        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'tokenVersion', 'username', 'email'] // Fetch minimal fields
        });

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado.' });
        }

        const tokenVersion = decoded.v || 0;
        const currentVersion = user.tokenVersion || 0;

        if (tokenVersion !== currentVersion) {
            return res.status(401).json({
                message: 'Sesión expirada.',
                code: 'SESSION_REVOKED'
            });
        }

        req.user = decoded; // Keep the decoded token in req.user
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(400).json({ message: 'Token inválido' });
    }
};
