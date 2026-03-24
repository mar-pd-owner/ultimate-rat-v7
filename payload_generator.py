import os
import json
import hashlib
import base64
import secrets
from datetime import datetime
from config import Config
from database import db
import qrcode
from io import BytesIO

class PayloadGenerator:
    def __init__(self):
        self.payload_dir = Config.PAYLOAD_DIR
        os.makedirs(self.payload_dir, exist_ok=True)
    
    def generate_payload_id(self):
        return secrets.token_hex(8)
    
    def generate_payload(self, payload_type='jpg'):
        payload_id = self.generate_payload_id()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{payload_type}_{timestamp}_{payload_id}.{payload_type}"
        filepath = os.path.join(self.payload_dir, filename)
        
        # Simple payload data
        payload_data = {
            'id': payload_id,
            'type': payload_type,
            'version': '13.0',
            'callback': f"{Config.HOST}:{Config.PORT}",
            'created': datetime.now().isoformat(),
            'exploit': Config.EXPLOITS['whatsapp']
        }
        
        # Create JPG header
        if payload_type == 'jpg':
            header = bytes([0xFF, 0xD8, 0xFF, 0xE0])
        elif payload_type == 'png':
            header = bytes([0x89, 0x50, 0x4E, 0x47])
        elif payload_type == 'mp3':
            header = bytes([0x49, 0x44, 0x33])
        elif payload_type == 'pdf':
            header = b'%PDF-1.4\n'
        else:
            header = b''
        
        # Combine header and payload
        payload_content = header + json.dumps(payload_data).encode()
        
        # Save payload
        with open(filepath, 'wb') as f:
            f.write(payload_content)
        
        # Generate QR code
        download_url = f"{Config.HOST}/download/{payload_id}"
        qr = qrcode.make(download_url)
        qr_path = os.path.join(self.payload_dir, f"{payload_id}_qr.png")
        qr.save(qr_path)
        
        # Save to database
        db.add_payload(payload_id, filename)
        
        return {
            'payload_id': payload_id,
            'filename': filename,
            'filepath': filepath,
            'size': len(payload_content),
            'download_url': download_url,
            'qr_code': qr_path,
            'created': datetime.now().isoformat()
        }
    
    def get_payload(self, payload_id):
        # Find payload file
        for f in os.listdir(self.payload_dir):
            if payload_id in f and not f.endswith('_qr.png'):
                filepath = os.path.join(self.payload_dir, f)
                return {
                    'payload_id': payload_id,
                    'filename': f,
                    'filepath': filepath,
                    'exists': True
                }
        return None

payload_generator = PayloadGenerator()
