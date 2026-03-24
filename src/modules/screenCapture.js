/**
 * Screen Capture Module - Complete Screen Control System
 * Features: Screenshot, Screen Recording, Live Streaming, Screen Control, Remote Viewing
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const config = require('../config');

class ScreenCaptureModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.activeSessions = new Map(); // sessionId -> capture state
        this.recordingSessions = new Map(); // sessionId -> recording state
        this.streamingSessions = new Map(); // sessionId -> streaming state
        this.screenshotHistory = new Map(); // sessionId -> screenshot history
        this.videoHistory = new Map(); // sessionId -> video history
        
        // Capture options
        this.captureOptions = {
            quality: 85,
            format: 'jpeg',
            maxWidth: 1920,
            maxHeight: 1080,
            thumbnail: true
        };
        
        // Recording options
        this.recordingOptions = {
            quality: 'high',
            framerate: 30,
            bitrate: 5000000,
            format: 'mp4',
            audio: true
        };
        
        // Initialize directories
        this.initDirectories();
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    initDirectories() {
        this.screenshotsDir = path.join(__dirname, '../../screenshots');
        this.recordingsDir = path.join(__dirname, '../../recordings');
        this.streamsDir = path.join(__dirname, '../../streams');
        this.thumbnailsDir = path.join(this.screenshotsDir, 'thumbnails');
        
        fs.ensureDirSync(this.screenshotsDir);
        fs.ensureDirSync(this.recordingsDir);
        fs.ensureDirSync(this.streamsDir);
        fs.ensureDirSync(this.thumbnailsDir);
    }
    
    // ==================== SCREENSHOT CAPTURE ====================
    
    async captureScreenshot(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const captureId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const filename = `screenshot_${sessionId}_${timestamp}.jpg`;
        const filePath = path.join(this.screenshotsDir, filename);
        const thumbPath = path.join(this.thumbnailsDir, `thumb_${filename}`);
        
        const captureOptions = {
            ...this.captureOptions,
            ...options,
            quality: options.quality || this.captureOptions.quality,
            format: options.format || this.captureOptions.format
        };
        
        try {
            // Send capture command
            const result = await this.sessionManager.executeCommand(sessionId, 'capture_screenshot', captureOptions, 30000);
            
            if (result && result.imageData) {
                // Save image
                const imageBuffer = Buffer.from(result.imageData, 'base64');
                await fs.writeFile(filePath, imageBuffer);
                
                // Generate thumbnail
                let thumbnail = null;
                if (captureOptions.thumbnail) {
                    thumbnail = await this.generateThumbnail(imageBuffer);
                    await fs.writeFile(thumbPath, thumbnail);
                }
                
                // Create capture record
                const capture = {
                    id: captureId,
                    sessionId: sessionId,
                    filename: filename,
                    path: filePath,
                    thumbnail: thumbPath,
                    size: imageBuffer.length,
                    timestamp: timestamp,
                    dimensions: result.dimensions || null,
                    options: captureOptions
                };
                
                // Store in history
                if (!this.screenshotHistory.has(sessionId)) {
                    this.screenshotHistory.set(sessionId, []);
                }
                this.screenshotHistory.get(sessionId).push(capture);
                
                // Trim history to last 100
                const history = this.screenshotHistory.get(sessionId);
                if (history.length > 100) {
                    const old = history.shift();
                    await fs.remove(old.path);
                    await fs.remove(old.thumbnail);
                }
                
                this.emit('screenshot_captured', sessionId, capture);
                
                return capture;
            } else {
                throw new Error('No image data received');
            }
            
        } catch (error) {
            console.error(`Screenshot capture failed for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async captureBulkScreenshots(sessionId, count = 5, interval = 1000, options = {}) {
        const captures = [];
        
        for (let i = 0; i < count; i++) {
            try {
                const capture = await this.captureScreenshot(sessionId, {
                    ...options,
                    bulk: true,
                    index: i
                });
                captures.push(capture);
                
                if (i < count - 1) {
                    await this.sleep(interval);
                }
            } catch (error) {
                console.error(`Bulk screenshot ${i + 1}/${count} failed:`, error);
                captures.push({ error: error.message, index: i });
            }
        }
        
        this.emit('bulk_screenshots_captured', sessionId, captures);
        
        return captures;
    }
    
    // ==================== SCREEN RECORDING ====================
    
    async startRecording(sessionId, duration = 30, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.recordingSessions.has(sessionId)) {
            throw new Error('Already recording');
        }
        
        const recordingId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const filename = `recording_${sessionId}_${timestamp}.mp4`;
        const filePath = path.join(this.recordingsDir, filename);
        
        const recordingOptions = {
            ...this.recordingOptions,
            ...options,
            duration: duration,
            quality: options.quality || this.recordingOptions.quality,
            framerate: options.framerate || this.recordingOptions.framerate,
            bitrate: options.bitrate || this.recordingOptions.bitrate,
            audio: options.audio !== false
        };
        
        try {
            // Send start recording command
            await this.sessionManager.executeCommand(sessionId, 'start_screen_recording', recordingOptions, 10000);
            
            const recordingState = {
                id: recordingId,
                sessionId: sessionId,
                filename: filename,
                path: filePath,
                startTime: timestamp,
                duration: duration,
                options: recordingOptions,
                status: 'recording',
                chunks: []
            };
            
            this.recordingSessions.set(sessionId, recordingState);
            this.emit('recording_started', sessionId, recordingState);
            
            // Auto-stop after duration
            if (duration > 0) {
                setTimeout(async () => {
                    if (this.recordingSessions.has(sessionId)) {
                        await this.stopRecording(sessionId);
                    }
                }, duration * 1000);
            }
            
            return recordingState;
            
        } catch (error) {
            console.error(`Failed to start recording for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopRecording(sessionId) {
        const recordingState = this.recordingSessions.get(sessionId);
        if (!recordingState) {
            throw new Error('No active recording');
        }
        
        try {
            // Send stop recording command
            const result = await this.sessionManager.executeCommand(sessionId, 'stop_screen_recording', {}, 30000);
            
            if (result && result.videoData) {
                // Save video data
                const videoBuffer = Buffer.from(result.videoData, 'base64');
                await fs.writeFile(recordingState.path, videoBuffer);
                
                recordingState.status = 'completed';
                recordingState.endTime = Date.now();
                recordingState.size = videoBuffer.length;
                recordingState.durationActual = (recordingState.endTime - recordingState.startTime) / 1000;
                
                // Store in history
                if (!this.videoHistory.has(sessionId)) {
                    this.videoHistory.set(sessionId, []);
                }
                this.videoHistory.get(sessionId).push(recordingState);
                
                // Trim history to last 50
                const history = this.videoHistory.get(sessionId);
                if (history.length > 50) {
                    const old = history.shift();
                    await fs.remove(old.path);
                }
                
                this.emit('recording_stopped', sessionId, recordingState);
                
                return recordingState;
            }
            
        } catch (error) {
            console.error(`Failed to stop recording for session ${sessionId}:`, error);
            recordingState.status = 'failed';
            recordingState.error = error.message;
            throw error;
            
        } finally {
            this.recordingSessions.delete(sessionId);
        }
    }
    
    // ==================== LIVE SCREEN STREAMING ====================
    
    async startLiveStream(sessionId, streamUrl = null, quality = 'medium') {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.streamingSessions.has(sessionId)) {
            throw new Error('Already streaming');
        }
        
        const streamId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        
        const streamOptions = {
            url: streamUrl || `wss://${config.server.host}/screen-stream/${streamId}`,
            quality: quality,
            framerate: quality === 'high' ? 30 : quality === 'medium' ? 15 : 10,
            resolution: quality === 'high' ? '1920x1080' : quality === 'medium' ? '1280x720' : '854x480',
            bitrate: quality === 'high' ? 5000000 : quality === 'medium' ? 2000000 : 1000000
        };
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'start_screen_stream', streamOptions, 10000);
            
            const streamState = {
                id: streamId,
                sessionId: sessionId,
                url: streamOptions.url,
                startTime: timestamp,
                options: streamOptions,
                status: 'streaming',
                viewers: 0,
                frames: 0
            };
            
            this.streamingSessions.set(sessionId, streamState);
            this.emit('stream_started', sessionId, streamState);
            
            return streamState;
            
        } catch (error) {
            console.error(`Failed to start screen stream for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopLiveStream(sessionId) {
        const streamState = this.streamingSessions.get(sessionId);
        if (!streamState) {
            throw new Error('No active stream');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_screen_stream', {}, 10000);
            
            streamState.status = 'stopped';
            streamState.endTime = Date.now();
            streamState.duration = (streamState.endTime - streamState.startTime) / 1000;
            
            this.emit('stream_stopped', sessionId, streamState);
            
            return streamState;
            
        } catch (error) {
            console.error(`Failed to stop screen stream for session ${sessionId}:`, error);
            throw error;
            
        } finally {
            this.streamingSessions.delete(sessionId);
        }
    }
    
    // ==================== SCREEN CONTROL ====================
    
    async setScreenBrightness(sessionId, level) {
        if (level < 0 || level > 100) {
            throw new Error('Brightness must be between 0 and 100');
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_screen_brightness', { level }, 10000);
    }
    
    async getScreenBrightness(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'get_screen_brightness', {}, 10000);
    }
    
    async setScreenTimeout(sessionId, seconds) {
        if (seconds < 0 || seconds > 3600) {
            throw new Error('Timeout must be between 0 and 3600 seconds');
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_screen_timeout', { seconds }, 10000);
    }
    
    async lockScreen(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'lock_screen', {}, 10000);
    }
    
    async unlockScreen(sessionId, password = null) {
        return await this.sessionManager.executeCommand(sessionId, 'unlock_screen', { password }, 10000);
    }
    
    async turnScreenOn(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'turn_screen_on', {}, 10000);
    }
    
    async turnScreenOff(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'turn_screen_off', {}, 10000);
    }
    
    async setScreenOrientation(sessionId, orientation) {
        const validOrientations = ['portrait', 'landscape', 'auto', 'locked'];
        if (!validOrientations.includes(orientation)) {
            throw new Error(`Invalid orientation: ${orientation}. Valid: ${validOrientations.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_screen_orientation', { orientation }, 10000);
    }
    
    async getScreenInfo(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'get_screen_info', {}, 10000);
    }
    
    // ==================== REMOTE CONTROL ====================
    
    async sendTouch(sessionId, x, y, action = 'tap') {
        const validActions = ['tap', 'double_tap', 'long_press', 'swipe'];
        if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action}. Valid: ${validActions.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'send_touch', { x, y, action }, 10000);
    }
    
    async sendSwipe(sessionId, startX, startY, endX, endY, duration = 300) {
        return await this.sessionManager.executeCommand(sessionId, 'send_swipe', { startX, startY, endX, endY, duration }, 10000);
    }
    
    async sendKeyPress(sessionId, keyCode) {
        return await this.sessionManager.executeCommand(sessionId, 'send_key_press', { keyCode }, 10000);
    }
    
    async sendText(sessionId, text) {
        return await this.sessionManager.executeCommand(sessionId, 'send_text', { text }, 10000);
    }
    
    // ==================== IMAGE PROCESSING ====================
    
    async generateThumbnail(imageBuffer, width = 320, height = 240) {
        try {
            if (typeof sharp !== 'undefined') {
                return await sharp(imageBuffer)
                    .resize(width, height, { fit: 'cover' })
                    .jpeg({ quality: 70 })
                    .toBuffer();
            } else {
                return imageBuffer.slice(0, Math.min(imageBuffer.length, 50000));
            }
        } catch (error) {
            console.error('Thumbnail generation failed:', error);
            return imageBuffer;
        }
    }
    
    async applyFilter(imageBuffer, filter) {
        if (typeof sharp === 'undefined') {
            return imageBuffer;
        }
        
        try {
            let processed = sharp(imageBuffer);
            
            switch(filter) {
                case 'grayscale':
                    processed = processed.grayscale();
                    break;
                case 'sepia':
                    processed = processed.tint({ r: 112, g: 66, b: 20 });
                    break;
                case 'vintage':
                    processed = processed.modulate({ brightness: 0.9, saturation: 0.8 });
                    break;
                case 'vivid':
                    processed = processed.modulate({ saturation: 1.3, brightness: 1.1 });
                    break;
                case 'cool':
                    processed = processed.tint({ r: 100, g: 120, b: 200 });
                    break;
                case 'warm':
                    processed = processed.tint({ r: 220, g: 160, b: 100 });
                    break;
                default:
                    return imageBuffer;
            }
            
            return await processed.jpeg({ quality: 90 }).toBuffer();
        } catch (error) {
            console.error('Filter application failed:', error);
            return imageBuffer;
        }
    }
    
    // ==================== SCREENSHOT MANAGEMENT ====================
    
    async getScreenshots(sessionId, limit = 50, offset = 0) {
        const history = this.screenshotHistory.get(sessionId) || [];
        return history.slice(offset, offset + limit);
    }
    
    async getScreenshot(sessionId, captureId) {
        const history = this.screenshotHistory.get(sessionId) || [];
        return history.find(c => c.id === captureId);
    }
    
    async deleteScreenshot(sessionId, captureId) {
        const history = this.screenshotHistory.get(sessionId);
        if (!history) return false;
        
        const index = history.findIndex(c => c.id === captureId);
        if (index !== -1) {
            const capture = history[index];
            await fs.remove(capture.path);
            await fs.remove(capture.thumbnail);
            history.splice(index, 1);
            this.emit('screenshot_deleted', sessionId, captureId);
            return true;
        }
        return false;
    }
    
    async clearScreenshots(sessionId) {
        const history = this.screenshotHistory.get(sessionId);
        if (history) {
            for (const capture of history) {
                await fs.remove(capture.path);
                await fs.remove(capture.thumbnail);
            }
            this.screenshotHistory.delete(sessionId);
            this.emit('screenshots_cleared', sessionId);
            return true;
        }
        return false;
    }
    
    // ==================== RECORDING MANAGEMENT ====================
    
    async getRecordings(sessionId, limit = 50, offset = 0) {
        const history = this.videoHistory.get(sessionId) || [];
        return history.slice(offset, offset + limit);
    }
    
    async getRecording(sessionId, recordingId) {
        const history = this.videoHistory.get(sessionId) || [];
        return history.find(r => r.id === recordingId);
    }
    
    async deleteRecording(sessionId, recordingId) {
        const history = this.videoHistory.get(sessionId);
        if (!history) return false;
        
        const index = history.findIndex(r => r.id === recordingId);
        if (index !== -1) {
            const recording = history[index];
            await fs.remove(recording.path);
            history.splice(index, 1);
            this.emit('recording_deleted', sessionId, recordingId);
            return true;
        }
        return false;
    }
    
    async clearRecordings(sessionId) {
        const history = this.videoHistory.get(sessionId);
        if (history) {
            for (const recording of history) {
                await fs.remove(recording.path);
            }
            this.videoHistory.delete(sessionId);
            this.emit('recordings_cleared', sessionId);
            return true;
        }
        return false;
    }
    
    // ==================== STATISTICS ====================
    
    async getScreenStats(sessionId) {
        const screenshots = this.screenshotHistory.get(sessionId) || [];
        const recordings = this.videoHistory.get(sessionId) || [];
        const activeRecording = this.recordingSessions.get(sessionId);
        const activeStream = this.streamingSessions.get(sessionId);
        
        const totalScreenshotSize = screenshots.reduce((sum, s) => sum + s.size, 0);
        const totalRecordingSize = recordings.reduce((sum, r) => sum + (r.size || 0), 0);
        
        return {
            screenshots: {
                total: screenshots.length,
                totalSize: totalScreenshotSize,
                totalSizeMB: (totalScreenshotSize / 1024 / 1024).toFixed(2),
                oldest: screenshots[0]?.timestamp,
                newest: screenshots[screenshots.length - 1]?.timestamp
            },
            recordings: {
                total: recordings.length,
                totalSize: totalRecordingSize,
                totalSizeMB: (totalRecordingSize / 1024 / 1024).toFixed(2),
                totalDuration: recordings.reduce((sum, r) => sum + (r.durationActual || 0), 0),
                oldest: recordings[0]?.startTime,
                newest: recordings[recordings.length - 1]?.startTime
            },
            active: {
                recording: activeRecording ? {
                    id: activeRecording.id,
                    startTime: activeRecording.startTime,
                    duration: activeRecording.duration,
                    status: activeRecording.status
                } : null,
                streaming: activeStream ? {
                    id: activeStream.id,
                    startTime: activeStream.startTime,
                    viewers: activeStream.viewers,
                    status: activeStream.status
                } : null
            }
        };
    }
    
    // ==================== CLEANUP ====================
    
    startCleanupInterval() {
        setInterval(async () => {
            await this.cleanup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    async cleanup() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        // Clean old screenshots
        for (const [sessionId, history] of this.screenshotHistory) {
            const filtered = history.filter(c => {
                const age = now - c.timestamp;
                if (age > maxAge) {
                    fs.remove(c.path).catch(console.error);
                    fs.remove(c.thumbnail).catch(console.error);
                    return false;
                }
                return true;
            });
            
            if (filtered.length === 0) {
                this.screenshotHistory.delete(sessionId);
            } else {
                this.screenshotHistory.set(sessionId, filtered);
            }
        }
        
        // Clean old recordings
        for (const [sessionId, history] of this.videoHistory) {
            const filtered = history.filter(r => {
                const age = now - r.startTime;
                if (age > maxAge) {
                    fs.remove(r.path).catch(console.error);
                    return false;
                }
                return true;
            });
            
            if (filtered.length === 0) {
                this.videoHistory.delete(sessionId);
            } else {
                this.videoHistory.set(sessionId, filtered);
            }
        }
        
        // Clean directories
        const cleanDir = async (dir) => {
            try {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stats = await fs.stat(filePath);
                    if (now - stats.mtimeMs > maxAge) {
                        await fs.remove(filePath);
                    }
                }
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        };
        
        await cleanDir(this.screenshotsDir);
        await cleanDir(this.recordingsDir);
        await cleanDir(this.streamsDir);
        await cleanDir(this.thumbnailsDir);
        
        this.emit('cleanup_completed');
    }
    
    // ==================== UTILITIES ====================
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onScreenshotCaptured(callback) {
        this.on('screenshot_captured', callback);
    }
    
    onBulkScreenshotsCaptured(callback) {
        this.on('bulk_screenshots_captured', callback);
    }
    
    onRecordingStarted(callback) {
        this.on('recording_started', callback);
    }
    
    onRecordingStopped(callback) {
        this.on('recording_stopped', callback);
    }
    
    onStreamStarted(callback) {
        this.on('stream_started', callback);
    }
    
    onStreamStopped(callback) {
        this.on('stream_stopped', callback);
    }
    
    onScreenshotDeleted(callback) {
        this.on('screenshot_deleted', callback);
    }
    
    onScreenshotsCleared(callback) {
        this.on('screenshots_cleared', callback);
    }
    
    onRecordingDeleted(callback) {
        this.on('recording_deleted', callback);
    }
    
    onRecordingsCleared(callback) {
        this.on('recordings_cleared', callback);
    }
    
    onCleanupCompleted(callback) {
        this.on('cleanup_completed', callback);
    }
}

module.exports = ScreenCaptureModule;
