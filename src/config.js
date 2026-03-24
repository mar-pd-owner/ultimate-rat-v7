const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

module.exports = {
    // Admin Configuration
    admin: {
        chatId: parseInt(process.env.ADMIN_CHAT_ID || '6454347745'),
        username: 'admin'
    },
    
    // Telegram Bot
    telegram: {
        token: process.env.BOT_TOKEN
    },
    
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '10000'),
        host: process.env.RENDER_EXTERNAL_URL || 'https://ultimate-rat-v8.onrender.com',
        env: process.env.NODE_ENV || 'development'
    },
    
    // Database
    database: {
        url: process.env.DATABASE_URL || 'sqlite:./database/database.sqlite'
    },
    
    // Paths
    paths: {
        database: path.join(__dirname, '../database/database.sqlite'),
        payloads: path.join(__dirname, '../payloads')
    }
};
