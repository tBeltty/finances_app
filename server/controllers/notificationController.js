const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const User = require('../models/User');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch unread notifications or last 20 notifications 
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({ where: { id, userId: req.user.id } });

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { userId: req.user.id, isRead: false } }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin only: Create notification
exports.createNotification = async (req, res) => {
    try {
        const { userId, type, title, message, link, broadcast, content } = req.body;
        // Content structure: { en: { title, message }, es: { title, message } }

        if (broadcast === 'all') {
            const users = await User.findAll({ attributes: ['id', 'language'] });

            const notifications = users.map(u => {
                // Determine language
                const lang = u.language || 'en';
                // Fallback to EN if language not in content, or just use provided single title/message if no 'content' obj
                const localized = content && content[lang] ? content[lang] : (content?.en || { title, message });

                return {
                    userId: u.id,
                    type,
                    title: localized.title || title,
                    message: localized.message || message,
                    link
                };
            });

            await Notification.bulkCreate(notifications);
            return res.json({ message: `Sent to ${users.length} users` });

        } else if (broadcast === 'specific' && userId) {
            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const lang = user.language || 'en';
            const localized = content && content[lang] ? content[lang] : (content?.en || { title, message });

            await Notification.create({
                userId,
                type,
                title: localized.title || title,
                message: localized.message || message,
                link
            });
            return res.json({ message: 'Notification sent' });
        } else {
            return res.status(400).json({ message: 'Specify userId or broadcast type' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
