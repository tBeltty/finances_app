const Translation = require('../models/Translation');
const { Op } = require('sequelize');

const fs = require('fs');
const path = require('path');

// Helper to load and parse file-based translations
const loadFileTranslations = (lang, ns) => {
    try {
        // Try Production Path first (../../src/locales) - relative to server/controllers
        let filePath = path.join(__dirname, '../../src/locales', lang, `${ns || 'translation'}.json`);

        // If not found, try Development Path (../../client/src/locales)
        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, '../../client/src/locales', lang, `${ns || 'translation'}.json`);
        }

        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        }
    } catch (err) {
        console.warn(`Could not load translation file for ${lang}:`, err.message);
    }
    return {};
};

// Helper to flatten object
const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
};

exports.getTranslations = async (req, res) => {
    try {
        const { lang, ns } = req.params;

        // 1. Load File-based translations
        const fileTranslations = loadFileTranslations(lang, ns);

        // 2. Load DB-based translations
        const dbTranslations = await Translation.findAll({
            where: { lang, namespace: ns || 'translation' },
            attributes: ['key', 'value']
        });

        // 3. Merge (DB overrides File)
        const flatFile = flattenObject(fileTranslations);

        dbTranslations.forEach(t => {
            flatFile[t.key] = t.value;
        });

        res.json(flatFile);
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
exports.getStatus = async (req, res) => {
    try {
        // En (Master)
        const enFile = flattenObject(loadFileTranslations('en'));
        const enDB = await Translation.findAll({ where: { lang: 'en' }, attributes: ['key'] });
        const enKeys = new Set([...Object.keys(enFile), ...enDB.map(t => t.key)]);
        const enCount = enKeys.size;

        // Es (Target)
        const esFile = flattenObject(loadFileTranslations('es'));
        const esDB = await Translation.findAll({ where: { lang: 'es' }, attributes: ['key'] });
        const esKeys = new Set([...Object.keys(esFile), ...esDB.map(t => t.key)]);
        const esCount = esKeys.size;

        res.json({
            en: enCount,
            es: esCount,
            coverage: enCount > 0 ? Math.round((esCount / enCount) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
