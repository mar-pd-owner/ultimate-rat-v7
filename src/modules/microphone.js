/**
 * Microphone Module - Complete Audio Control System
 * Features: Microphone Recording, Live Streaming, Audio Playback, Volume Control, Equalizer, Voice Effects
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

class MicrophoneModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.recordingSessions = new Map(); // sessionId -> recording state
        this.streamingSessions = new Map(); // sessionId -> streaming state
        this.playingSessions = new Map(); // sessionId -> playback state
        this.audioCache = new Map(); // sessionId -> cached audio data
        this.voiceEffects = new Map(); // sessionId -> active voice effects
        
        // Audio processing options
        this.audioOptions = {
            sampleRate: 44100,
            bitRate: 128,
            channels: 1,
            format: 'mp3',
            quality: 'high'
        };
        
        // Voice effects presets
        this.effectsPresets = {
            none: { pitch: 1.0, speed: 1.0, echo: 0, reverb: 0, bass: 0, treble: 0 },
            robot: { pitch: 0.7, speed: 1.2, echo: 0.5, reverb: 0.3, bass: 0.2, treble: 0.8 },
            alien: { pitch: 1.5, speed: 0.8, echo: 0.4, reverb: 0.6, bass: 0.1, treble: 0.9 },
            deep: { pitch: 0.6, speed: 0.9, echo: 0.2, reverb: 0.4, bass: 0.8, treble: 0.2 },
            chipmunk: { pitch: 1.8, speed: 1.3, echo: 0.1, reverb: 0.2, bass: 0.1, treble: 0.9 },
            echo: { pitch: 1.0, speed: 1.0, echo: 0.8, reverb: 0.3, bass: 0.5, treble: 0.5 },
            reverb: { pitch: 1.0, speed: 1.0, echo: 0.3, reverb: 0.8, bass: 0.5, treble: 0.5 },
            bass_boost: { pitch: 1.0, speed: 1.0, echo: 0.2, reverb: 0.2, bass: 1.2, treble: 0.5 },
            treble_boost: { pitch: 1.0, speed: 1.0, echo: 0.2, reverb: 0.2, bass: 0.5, treble: 1.2 }
        };
        
        // Initialize directories
        this.initDirectories();
    }
    
    initDirectories() {
        this.recordingsDir = path.join(__dirname, '../../recordings');
        this.streamsDir = path.join(this.recordingsDir, 'streams');
        this.cacheDir = path.join(this.recordingsDir, 'cache');
        fs.ensureDirSync(this.recordingsDir);
        fs.ensureDirSync(this.streamsDir);
        fs.ensureDirSync(this.cacheDir);
    }
    
    // ==================== MICROPHONE RECORDING ====================
    
    async startRecording(sessionId, duration = 30, quality = 'high', format = 'mp3') {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.recordingSessions.has(sessionId)) {
            throw new Error('Already recording');
        }
        
        const recordingId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const filename = `recording_${sessionId}_${timestamp}.${format}`;
        const filePath = path.join(this.recordingsDir, filename);
        
        const recordingOptions = {
            duration: duration,
            quality: quality,
            format: format,
            sampleRate: quality === 'high' ? 44100 : quality === 'medium' ? 22050 : 11025,
            bitRate: quality === 'high' ? 192 : quality === 'medium' ? 128 : 64,
            channels: 1,
            effects: this.voiceEffects.get(sessionId) || this.effectsPresets.none
        };
        
        try {
            // Send start recording command
            await this.sessionManager.executeCommand(sessionId, 'start_audio_recording', recordingOptions, 10000);
            
            const recordingState = {
                id: recordingId,
                filename: filename,
                path: filePath,
                startTime: timestamp,
                duration: duration,
                options: recordingOptions,
                status: 'recording',
                data: []
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
            const result = await this.sessionManager.executeCommand(sessionId, 'stop_audio_recording', {}, 30000);
            
            if (result && result.audioData) {
                // Save audio data
                const audioBuffer = Buffer.from(result.audioData, 'base64');
                await fs.writeFile(recordingState.path, audioBuffer);
                
                // Cache audio data
                this.audioCache.set(recordingState.id, {
                    path: recordingState.path,
                    size: audioBuffer.length,
                    duration: (Date.now() - recordingState.startTime) / 1000,
                    format: recordingState.options.format
                });
                
                recordingState.status = 'completed';
                recordingState.endTime = Date.now();
                recordingState.size = audioBuffer.length;
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
    
    // ==================== LIVE MICROPHONE STREAMING ====================
    
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
            url: streamUrl || `wss://${config.server.host}/audio-stream/${streamId}`,
            quality: quality,
            sampleRate: quality === 'high' ? 44100 : quality === 'medium' ? 22050 : 11025,
            bitRate: quality === 'high' ? 128 : 64,
            format: 'mp3',
            chunkSize: 4096
        };
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'start_audio_stream', streamOptions, 10000);
            
            const streamState = {
                id: streamId,
                url: streamOptions.url,
                startTime: timestamp,
                options: streamOptions,
                status: 'streaming',
                listeners: 0,
                chunks: []
            };
            
            this.streamingSessions.set(sessionId, streamState);
            this.emit('stream_started', sessionId, streamState);
            
            return streamState;
            
        } catch (error) {
            console.error(`Failed to start audio stream for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopLiveStream(sessionId) {
        const streamState = this.streamingSessions.get(sessionId);
        if (!streamState) {
            throw new Error('No active stream');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_audio_stream', {}, 10000);
            
            streamState.status = 'stopped';
            streamState.endTime = Date.now();
            
            this.emit('stream_stopped', sessionId, streamState);
            
            return streamState;
            
        } catch (error) {
            console.error(`Failed to stop audio stream for session ${sessionId}:`, error);
            throw error;
            
        } finally {
            this.streamingSessions.delete(sessionId);
        }
    }
    
    // ==================== AUDIO PLAYBACK ====================
    
    async playAudio(sessionId, audioPath, volume = 100, loop = false) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.playingSessions.has(sessionId)) {
            await this.stopAudio(sessionId);
        }
        
        const playbackId = crypto.randomBytes(8).toString('hex');
        
        const playbackOptions = {
            path: audioPath,
            volume: Math.min(100, Math.max(0, volume)),
            loop: loop,
            startTime: 0
        };
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'play_audio', playbackOptions, 10000);
            
            const playbackState = {
                id: playbackId,
                path: audioPath,
                volume: volume,
                loop: loop,
                startTime: Date.now(),
                status: 'playing'
            };
            
            this.playingSessions.set(sessionId, playbackState);
            this.emit('audio_playing', sessionId, playbackState);
            
            return playbackState;
            
        } catch (error) {
            console.error(`Failed to play audio for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopAudio(sessionId) {
        const playbackState = this.playingSessions.get(sessionId);
        if (!playbackState) {
            return false;
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_audio', {}, 5000);
            
            playbackState.status = 'stopped';
            playbackState.endTime = Date.now();
            
            this.emit('audio_stopped', sessionId, playbackState);
            
            return playbackState;
            
        } catch (error) {
            console.error(`Failed to stop audio for session ${sessionId}:`, error);
            throw error;
            
        } finally {
            this.playingSessions.delete(sessionId);
        }
    }
    
    async pauseAudio(sessionId) {
        const playbackState = this.playingSessions.get(sessionId);
        if (!playbackState || playbackState.status !== 'playing') {
            throw new Error('No audio playing');
        }
        
        await this.sessionManager.executeCommand(sessionId, 'pause_audio', {}, 5000);
        
        playbackState.status = 'paused';
        this.emit('audio_paused', sessionId, playbackState);
        
        return playbackState;
    }
    
    async resumeAudio(sessionId) {
        const playbackState = this.playingSessions.get(sessionId);
        if (!playbackState || playbackState.status !== 'paused') {
            throw new Error('No paused audio');
        }
        
        await this.sessionManager.executeCommand(sessionId, 'resume_audio', {}, 5000);
        
        playbackState.status = 'playing';
        this.emit('audio_resumed', sessionId, playbackState);
        
        return playbackState;
    }
    
    async setVolume(sessionId, volume) {
        if (volume < 0 || volume > 100) {
            throw new Error('Volume must be between 0 and 100');
        }
        
        const playbackState = this.playingSessions.get(sessionId);
        if (playbackState) {
            playbackState.volume = volume;
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_audio_volume', { volume }, 5000);
    }
    
    // ==================== VOICE EFFECTS ====================
    
    async setVoiceEffect(sessionId, effect) {
        if (!this.effectsPresets[effect]) {
            throw new Error(`Unknown effect: ${effect}. Available: ${Object.keys(this.effectsPresets).join(', ')}`);
        }
        
        const effectSettings = this.effectsPresets[effect];
        this.voiceEffects.set(sessionId, effectSettings);
        
        // Apply effect if recording is active
        if (this.recordingSessions.has(sessionId)) {
            await this.sessionManager.executeCommand(sessionId, 'set_voice_effect', effectSettings, 5000);
        }
        
        this.emit('voice_effect_changed', sessionId, effect, effectSettings);
        
        return effectSettings;
    }
    
    async setCustomVoiceEffect(sessionId, settings) {
        const validSettings = {
            pitch: { min: 0.5, max: 2.0, default: 1.0 },
            speed: { min: 0.5, max: 2.0, default: 1.0 },
            echo: { min: 0, max: 1.0, default: 0 },
            reverb: { min: 0, max: 1.0, default: 0 },
            bass: { min: 0, max: 2.0, default: 1.0 },
            treble: { min: 0, max: 2.0, default: 1.0 }
        };
        
        const effectSettings = {};
        
        for (const [key, range] of Object.entries(validSettings)) {
            if (settings[key] !== undefined) {
                effectSettings[key] = Math.min(range.max, Math.max(range.min, settings[key]));
            } else {
                effectSettings[key] = range.default;
            }
        }
        
        this.voiceEffects.set(sessionId, effectSettings);
        
        if (this.recordingSessions.has(sessionId)) {
            await this.sessionManager.executeCommand(sessionId, 'set_voice_effect', effectSettings, 5000);
        }
        
        this.emit('voice_effect_changed', sessionId, 'custom', effectSettings);
        
        return effectSettings;
    }
    
    async removeVoiceEffect(sessionId) {
        this.voiceEffects.delete(sessionId);
        
        if (this.recordingSessions.has(sessionId)) {
            await this.sessionManager.executeCommand(sessionId, 'remove_voice_effect', {}, 5000);
        }
        
        this.emit('voice_effect_removed', sessionId);
        
        return true;
    }
    
    // ==================== AUDIO PROCESSING ====================
    
    async getAudioInfo(sessionId, recordingId) {
        const recording = this.audioCache.get(recordingId);
        if (!recording) {
            throw new Error('Recording not found');
        }
        
        const stats = await fs.stat(recording.path);
        
        return {
            id: recordingId,
            path: recording.path,
            size: stats.size,
            duration: recording.duration,
            format: recording.format,
            created: stats.birthtime,
            modified: stats.mtime
        };
    }
    
    async downloadAudio(sessionId, recordingId) {
        const recording = this.audioCache.get(recordingId);
        if (!recording) {
            throw new Error('Recording not found');
        }
        
        const audioData = await fs.readFile(recording.path);
        
        return {
            id: recordingId,
            data: audioData.toString('base64'),
            size: audioData.length,
            format: recording.format,
            duration: recording.duration
        };
    }
    
    async deleteAudio(sessionId, recordingId) {
        const recording = this.audioCache.get(recordingId);
        if (!recording) {
            return false;
        }
        
        await fs.remove(recording.path);
        this.audioCache.delete(recordingId);
        
        this.emit('audio_deleted', sessionId, recordingId);
        
        return true;
    }
    
    async clearAudio(sessionId) {
        const recordings = Array.from(this.audioCache.keys());
        for (const id of recordings) {
            const recording = this.audioCache.get(id);
            if (recording) {
                await fs.remove(recording.path);
            }
            this.audioCache.delete(id);
        }
        
        this.emit('audio_cleared', sessionId);
        
        return true;
    }
    
    // ==================== VOLUME CONTROL ====================
    
    async setSystemVolume(sessionId, volume) {
        if (volume < 0 || volume > 100) {
            throw new Error('Volume must be between 0 and 100');
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_system_volume', { volume }, 5000);
    }
    
    async getSystemVolume(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'get_system_volume', {}, 5000);
    }
    
    async mute(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'mute_audio', {}, 5000);
    }
    
    async unmute(sessionId) {
        return await this.sessionManager.executeCommand(sessionId, 'unmute_audio', {}, 5000);
    }
    
    async setSpeakerMode(sessionId, mode) {
        const validModes = ['earpiece', 'speaker', 'headset', 'bluetooth'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid speaker mode: ${mode}. Valid: ${validModes.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_speaker_mode', { mode }, 5000);
    }
    
    // ==================== EQUALIZER ====================
    
    async setEqualizer(sessionId, preset) {
        const presets = ['normal', 'rock', 'pop', 'jazz', 'classical', 'bass', 'treble', 'vocal'];
        if (!presets.includes(preset)) {
            throw new Error(`Invalid equalizer preset: ${preset}. Valid: ${presets.join(', ')}`);
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_equalizer', { preset }, 5000);
    }
    
    async setCustomEqualizer(sessionId, bands) {
        // bands: array of 10 values between -12 and +12 dB
        if (!Array.isArray(bands) || bands.length !== 10) {
            throw new Error('Equalizer must have 10 bands');
        }
        
        for (const band of bands) {
            if (band < -12 || band > 12) {
                throw new Error('Each band must be between -12 and +12 dB');
            }
        }
        
        return await this.sessionManager.executeCommand(sessionId, 'set_custom_equalizer', { bands }, 5000);
    }
    
    // ==================== AUDIO ANALYSIS ====================
    
    async analyzeAudio(sessionId, recordingId) {
        const recording = this.audioCache.get(recordingId);
        if (!recording) {
            throw new Error('Recording not found');
        }
        
        // This would normally use audio analysis libraries
        // For now, return simulated analysis
        return {
            id: recordingId,
            duration: recording.duration,
            averageVolume: 65,
            peakVolume: 92,
            hasSpeech: true,
            hasMusic: false,
            speechConfidence: 0.87,
            language: 'en',
            transcript: 'Simulated audio transcript for testing purposes.'
        };
    }
    
    async transcribeAudio(sessionId, recordingId) {
        const analysis = await this.analyzeAudio(sessionId, recordingId);
        return analysis.transcript;
    }
    
    // ==================== RECORDING MANAGEMENT ====================
    
    async getRecordings(sessionId, limit = 50, offset = 0) {
        const recordings = Array.from(this.audioCache.values());
        return recordings.slice(offset, offset + limit);
    }
    
    async getRecordingStats(sessionId) {
        const recordings = Array.from(this.audioCache.values());
        const totalSize = recordings.reduce((sum, r) => sum + r.size, 0);
        const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
        
        return {
            total: recordings.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            totalDuration: totalDuration,
            averageDuration: totalDuration / (recordings.length || 1),
            oldest: recordings.length > 0 ? recordings[recordings.length - 1]?.created : null,
            newest: recordings.length > 0 ? recordings[0]?.created : null
        };
    }
    
    // ==================== UTILITIES ====================
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==================== EVENT HANDLERS ====================
    
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
    
    onAudioPlaying(callback) {
        this.on('audio_playing', callback);
    }
    
    onAudioStopped(callback) {
        this.on('audio_stopped', callback);
    }
    
    onAudioPaused(callback) {
        this.on('audio_paused', callback);
    }
    
    onAudioResumed(callback) {
        this.on('audio_resumed', callback);
    }
    
    onVoiceEffectChanged(callback) {
        this.on('voice_effect_changed', callback);
    }
    
    onVoiceEffectRemoved(callback) {
        this.on('voice_effect_removed', callback);
    }
    
    onAudioDeleted(callback) {
        this.on('audio_deleted', callback);
    }
    
    // ==================== CLEANUP ====================
    
    cleanup() {
        // Clear all session data
        this.recordingSessions.clear();
        this.streamingSessions.clear();
        this.playingSessions.clear();
        this.voiceEffects.clear();
        
        // Remove old recordings (older than 24 hours)
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
        
        cleanDir(this.recordingsDir).catch(console.error);
        cleanDir(this.streamsDir).catch(console.error);
        cleanDir(this.cacheDir).catch(console.error);
        
        // Clear audio cache
        this.audioCache.clear();
    }
}

module.exports = MicrophoneModule;
