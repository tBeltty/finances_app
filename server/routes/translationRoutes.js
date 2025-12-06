const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public: Get translations (used by client on init)
// Depending on auth strategy, this might need to be open or use a client token
// For now, let's keep it open or require basic auth if possible. 
// Given it's static text, open read is usually low risk, but let's see.
// Client loads it before login often.
router.get('/:lang/:ns', translationController.getTranslations);

// Admin: Manage
router.post('/', authMiddleware, adminMiddleware, translationController.updateTranslation);
router.get('/status/summary', authMiddleware, adminMiddleware, translationController.getStatus);

module.exports = router;
