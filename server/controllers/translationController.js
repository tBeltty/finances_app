const Translation = require('../models/Translation');
const { Op } = require('sequelize');

exports.getTranslations = async (req, res) => {
    try {
        const { lang, ns } = req.params;
        const translations = await Translation.findAll({
            where: { lang, namespace: ns || 'translation' },
            attributes: ['key', 'value']
        });

        const result = {};
        translations.forEach(t => {
            result[t.key] = t.value;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTranslation = async (req, res) => {
    try {
        const { lang, key, value, namespace } = req.body;

        const [translation, created] = await Translation.findOrCreate({
            where: { lang, key, namespace: namespace || 'translation' },
            defaults: { value }
        });

        if (!created) {
            translation.value = value;
            await translation.save();
        }

        res.json({ message: 'Translation updated', translation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get status (missing keys, percentage)
// This requires comparing against a 'master' language (EN) or the file-based source
exports.getStatus = async (req, res) => {
    try {
        // Simple count for now
        const enCount = await Translation.count({ where: { lang: 'en' } });
        const esCount = await Translation.count({ where: { lang: 'es' } });

        res.json({
            en: enCount,
            es: esCount,
            coverage: enCount > 0 ? Math.round((esCount / enCount) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
