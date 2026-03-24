const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

module.exports = {
    admin: {
        chatId: parseInt(process.env.ADMIN_CHAT_ID || '6454347745'),
    },
    telegram: {
        token: process.env.BOT_TOKEN
    },
    server: {
        port: parseInt(process.env.PORT || '10000'),  // ✅ Must be 10000 for Render
        host: process.env.RENDER_EXTERNAL_URL || 'https://ultimate-rat-v8.onrender.com',
        env: process.env.NODE_ENV || 'production'
    },
    database: {
        url: process.env.DATABASE_URL || 'sqlite:./database/database.sqlite'
    },
    paths: {
        database: path.join(__dirname, '../database/database.sqlite'),
        payloads: path.join(__dirname, '../payloads')
    }
};
