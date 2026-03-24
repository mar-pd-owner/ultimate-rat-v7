const fs = require('fs-extra');
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../database.json');
        this.data = { sessions: [], commands: [], payloads: [] };
        this.load();
    }
    
    load() {
        try {
            if (fs.existsSync(this.dbPath)) {
                this.data = fs.readJsonSync(this.dbPath);
            }
        } catch(e) {}
    }
    
    save() {
        fs.writeJsonSync(this.dbPath, this.data, { spaces: 2 });
    }
    
    addSession(sessionId, data) {
        this.data.sessions.push({ id: sessionId, ...data, connected: false, firstSeen: new Date() });
        this.save();
    }
    
    updateSession(sessionId, updates) {
        const session = this.data.sessions.find(s => s.id === sessionId);
        if (session) Object.assign(session, updates, { lastSeen: new Date() });
        this.save();
    }
    
    getSessions() { return this.data.sessions; }
    getActiveSessions() { return this.data.sessions.filter(s => s.connected); }
    
    addCommand(sessionId, command, result) {
        this.data.commands.push({ sessionId, command, result, time: new Date() });
        this.save();
    }
    
    addPayload(payloadId, data) {
        this.data.payloads.push({ id: payloadId, ...data, created: new Date() });
        this.save();
    }
    
    getStats() {
        return {
            totalSessions: this.data.sessions.length,
            activeSessions: this.data.sessions.filter(s => s.connected).length,
            totalCommands: this.data.commands.length,
            totalPayloads: this.data.payloads.length
        };
    }
    
    killSession(sessionId) {
        const session = this.data.sessions.find(s => s.id === sessionId);
        if (session) session.connected = false;
        this.save();
    }
}

module.exports = new Database();
