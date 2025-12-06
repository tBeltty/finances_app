const crypto = require('crypto');

/**
 * Sanitize a string: trim, limit length, escape HTML entities
 */
function sanitizeString(str, maxLen = 200) {
    if (typeof str !== 'string') return '';

    return str
        .trim()
        .slice(0, maxLen)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Validate a numeric amount
 * @returns {{ valid: boolean, value: number, error?: string }}
 */
function validateAmount(amount, min = 0.01, max = 999999999) {
    const val = parseFloat(amount);

    if (isNaN(val)) {
        return { valid: false, value: 0, error: 'Amount must be a number' };
    }
    if (val < min) {
        return { valid: false, value: val, error: `Amount must be at least ${min}` };
    }
    if (val > max) {
        return { valid: false, value: val, error: `Amount must be at most ${max}` };
    }

    return { valid: true, value: val };
}

/**
 * Validate a date is within reasonable range
 * @param {string|Date} date
 * @param {number} maxPastDays - How many days in the past allowed (default 365)
 * @param {number} maxFutureDays - How many days in future allowed (default 31)
 */
function validateDate(date, maxPastDays = 365, maxFutureDays = 31) {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
        return { valid: false, error: 'Invalid date' };
    }

    const now = new Date();
    const minDate = new Date(now.getTime() - maxPastDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + maxFutureDays * 24 * 60 * 60 * 1000);

    if (d < minDate) {
        return { valid: false, error: 'Date too far in the past' };
    }
    if (d > maxDate) {
        return { valid: false, error: 'Date too far in the future' };
    }

    return { valid: true, value: d };
}

/**
 * Validate interest rate (0-100%)
 */
function validateInterestRate(rate) {
    const val = parseFloat(rate);

    if (isNaN(val)) {
        return { valid: false, error: 'Interest rate must be a number' };
    }
    if (val < 0 || val > 100) {
        return { valid: false, error: 'Interest rate must be between 0 and 100' };
    }

    return { valid: true, value: val };
}

/**
 * Validate hex color
 */
function validateColor(color) {
    if (typeof color !== 'string') return { valid: false, error: 'Color must be a string' };

    // Allow color names or hex colors
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colorNames = ['slate', 'red', 'orange', 'amber', 'yellow', 'lime', 'green',
        'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet',
        'purple', 'fuchsia', 'pink', 'rose'];

    if (hexPattern.test(color) || colorNames.includes(color.toLowerCase())) {
        return { valid: true, value: color };
    }

    return { valid: false, error: 'Invalid color format' };
}

/**
 * Hash a token using SHA256
 */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validate password complexity
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePassword(password) {
    if (typeof password !== 'string') {
        return { valid: false, error: 'Password must be a string' };
    }
    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }

    return { valid: true };
}

module.exports = {
    sanitizeString,
    validateAmount,
    validateDate,
    validateInterestRate,
    validateColor,
    hashToken,
    validatePassword
};
