const xss = require('xss');

const sanitizePayload = (data) => {
    if (typeof data === 'string') {
        return xss(data);
    }
    if (Array.isArray(data)) {
        return data.map(item => sanitizePayload(item));
    }
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(key => {
            data[key] = sanitizePayload(data[key]);
        });
    }
    return data;
};

const sanitizer = (req, res, next) => {
    if (req.body) req.body = sanitizePayload(req.body);
    if (req.query) req.query = sanitizePayload(req.query);
    if (req.params) req.params = sanitizePayload(req.params);
    next();
};

module.exports = sanitizer;
