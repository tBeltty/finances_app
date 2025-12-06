module.exports = (req, res, next) => {
    // req.user is set by authMiddleware
    if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere nivel de Administrador.' });
    }

    next();
};
