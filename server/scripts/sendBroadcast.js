const { sequelize } = require('../config/db');
const User = require('../models/User');
const Notification = require('../models/Notification');

async function sendBroadcast() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const users = await User.findAll({ attributes: ['id', 'language'] });
        console.log(`Found ${users.length} users.`);

        const content = {
            en: {
                title: 'Notification Center 🔔',
                message: 'Welcome! You will now receive important updates and alerts right here.'
            },
            es: {
                title: 'Centro de Notificaciones 🔔',
                message: '¡Bienvenido! Ahora recibirás actualizaciones y alertas importantes aquí mismo.'
            }
        };

        const notifications = users.map(u => {
            const lang = u.language || 'en';
            // Simple fallback
            const localized = content[lang] || content.en;

            return {
                userId: u.id,
                type: 'info',
                title: localized.title,
                message: localized.message,
                link: '/settings', // Just an example link
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });

        if (notifications.length > 0) {
            await Notification.bulkCreate(notifications);
            console.log(`✅ Broadcast sent to ${notifications.length} users.`);
        } else {
            console.log('No users found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

sendBroadcast();
