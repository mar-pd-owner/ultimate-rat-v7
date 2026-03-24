import secrets
from datetime import datetime
from database import db

class SessionManager:
    def __init__(self):
        self.sessions = {}  # session_id -> session data
        self.user_sessions = {}  # user_id -> session_id
    
    def create_session(self, device_info):
        session_id = secrets.token_hex(8)
        session = {
            'id': session_id,
            'device_info': device_info,
            'connected': True,
            'first_seen': datetime.now(),
            'last_seen': datetime.now()
        }
        self.sessions[session_id] = session
        db.add_session(session_id, device_info)
        return session
    
    def get_session(self, session_id):
        return self.sessions.get(session_id)
    
    def get_active_sessions(self):
        return [s for s in self.sessions.values() if s.get('connected')]
    
    def update_heartbeat(self, session_id):
        if session_id in self.sessions:
            self.sessions[session_id]['last_seen'] = datetime.now()
    
    def kill_session(self, session_id):
        if session_id in self.sessions:
            self.sessions[session_id]['connected'] = False
            db.kill_session(session_id)
    
    def select_session(self, user_id, session_id):
        if session_id in self.sessions:
            self.user_sessions[user_id] = session_id
            return True
        return False
    
    def get_selected_session(self, user_id):
        session_id = self.user_sessions.get(user_id)
        return self.sessions.get(session_id) if session_id else None
    
    def get_session_count(self):
        return {
            'total': len(self.sessions),
            'active': len([s for s in self.sessions.values() if s.get('connected')])
        }

session_manager = SessionManager()
