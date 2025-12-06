const rateLimit = require('express-rate-limit');
const cloudflareService = require('../services/cloudflareService');

// Track if we already triggered the defense recently to avoid spamming the API
let defenseTriggeredAt = 0;
const DEFENSE_COOLDOWN = 10 * 60 * 1000; // 10 minutes

const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // Limit each IP to 300 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const now = Date.now();
        if (now - defenseTriggeredAt > DEFENSE_COOLDOWN) {
            defenseTriggeredAt = now;
            // Async call, don't wait
            cloudflareService.enableUnderAttackMode();
        }
        res.status(429).json({ message: 'Demasiadas solicitudes, defensa activada.' });
    }
});

module.exports = globalLimiter;
