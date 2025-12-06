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

const dns = require('dns').promises;

/**
 * Validate email address
 * - Checks format
 * - Checks blocked domains and TLDs
 * - Checks suspicious local parts
 * - Checks MX records (DNS)
 */
async function validateEmail(email) {
    if (typeof email !== 'string') return { valid: false, error: 'Email must be a string' };

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }

    const [localPart, domain] = email.toLowerCase().split('@');

    // Blocked TLDs
    const blockedTLDs = ['test', 'example', 'invalid', 'localhost', 'local'];
    const tld = domain.split('.').pop();
    if (blockedTLDs.includes(tld)) {
        return { valid: false, error: 'Invalid email domain extension' };
    }

    // Blocked Domains (Disposable/Test)
    // Load static list + hardcoded checks
    let disposableDomains = new Set([
        'test.com', 'example.com', 'mailinator.com', 'yopmail.com',
        'tempmail.com', '10minutemail.com', 'guerrillamail.com',
        'test.test'
    ]);

    try {
        const staticList = require('./disposable_domains.json');
        if (Array.isArray(staticList)) {
            staticList.forEach(d => disposableDomains.add(d));
        }
    } catch (e) {
        // Ignore if file missing, fallback to hardcoded
        console.warn('Could not load disposable_domains.json');
    }

    if (disposableDomains.has(domain)) {
        return { valid: false, error: 'Please use a real email address (no disposable emails)' };
    }

    // Suspicious Local Parts
    const suspiciousPatterns = /^(test|admin|user|root|guest|noreply|no-reply|daemon|bot|fake|spam)(_|\.|\d|$)/;
    if (suspiciousPatterns.test(localPart)) {
        return { valid: false, error: 'This email username is not allowed' };
    }

    // MX Record Check
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
            return { valid: false, error: 'Email domain does not exist or cannot receive emails' };
        }
    } catch (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
            return { valid: false, error: 'Email domain does not exist' };
        }
        // Allow other errors (timeouts) to pass to avoid false positives during network issues
        console.warn(`DNS MX check failed for ${domain}: ${err.message}`);
    }

    return { valid: true, value: email.toLowerCase() };
}

module.exports = {
    sanitizeString,
    validateAmount,
    validateDate,
    validateInterestRate,
    validateColor,
    hashToken,
    validatePassword,
    validateEmail
};
