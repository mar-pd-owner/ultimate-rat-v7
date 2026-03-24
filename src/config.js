const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    admin: { chatId: parseInt(process.env.ADMIN_CHAT_ID || '6454347745') },
    botToken: process.env.BOT_TOKEN,
    port: parseInt(process.env.PORT || '10000'),
    host: process.env.RENDER_EXTERNAL_URL || 'https://ultimate-rat-v9.onrender.com'
};
