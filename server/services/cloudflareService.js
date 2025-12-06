const axios = require('axios');

exports.enableUnderAttackMode = async () => {
    try {
        const zoneId = process.env.CLOUDFLARE_ZONE_ID;
        const token = process.env.CLOUDFLARE_API_TOKEN;

        if (!zoneId || !token) {
            console.error('Cloudflare credentials missing');
            return;
        }

        console.log('🚨 High traffic detected! Enabling Cloudflare Under Attack Mode...');

        const response = await axios.patch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/security_level`,
            { value: 'under_attack' },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            console.log('✅ Cloudflare Under Attack Mode ENABLED');
        } else {
            console.error('❌ Failed to enable Cloudflare defense:', response.data.errors);
        }
    } catch (error) {
        console.error('Cloudflare API Error:', error.response?.data || error.message);
    }
};
