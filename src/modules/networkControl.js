/**
 * Network Control Module - Complete Network Management System
 * Features: WiFi Control, Mobile Data, Bluetooth, Hotspot, VPN, Network Monitoring
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

class NetworkControlModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.activeConnections = new Map(); // sessionId -> connection state
        this.wifiNetworks = new Map(); // sessionId -> cached WiFi networks
        this.bluetoothDevices = new Map(); // sessionId -> cached Bluetooth devices
        this.hotspotSessions = new Map(); // sessionId -> hotspot state
        this.vpnSessions = new Map(); // sessionId -> VPN state
        this.networkStats = new Map(); // sessionId -> network statistics
        this.packetCapture = new Map(); // sessionId -> packet capture state
        
        // Network monitoring options
        this.monitoringOptions = {
            interval: 5000, // 5 seconds
            capturePackets: false,
            captureDNS: true,
            captureHTTP: true,
            maxPackets: 1000
        };
        
        // Initialize directories
        this.initDirectories();
        
        // Start monitoring interval
        this.startMonitoringInterval();
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    initDirectories() {
        this.packetsDir = path.join(__dirname, '../../packets');
        this.logsDir = path.join(__dirname, '../../network_logs');
        fs.ensureDirSync(this.packetsDir);
        fs.ensureDirSync(this.logsDir);
    }
    
    // ==================== WiFi CONTROL ====================
    
    async enableWiFi(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_wifi', {}, 10000);
            this.emit('wifi_enabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to enable WiFi for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableWiFi(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_wifi', {}, 10000);
            this.emit('wifi_disabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to disable WiFi for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async scanWiFi(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'scan_wifi', {}, 30000);
            
            if (result && result.networks) {
                const networks = result.networks.map(network => ({
                    ssid: network.ssid,
                    bssid: network.bssid,
                    signal: network.signal,
                    frequency: network.frequency,
                    security: network.security,
                    channel: network.channel,
                    capabilities: network.capabilities
                }));
                
                this.wifiNetworks.set(sessionId, {
                    networks: networks,
                    timestamp: Date.now(),
                    count: networks.length
                });
                
                this.emit('wifi_scan_completed', sessionId, networks);
                
                return networks;
            }
            
            return [];
            
        } catch (error) {
            console.error(`Failed to scan WiFi for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async connectToWiFi(sessionId, ssid, password = null, security = 'wpa2') {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'connect_wifi', {
                ssid: ssid,
                password: password,
                security: security
            }, 30000);
            
            this.emit('wifi_connected', sessionId, ssid);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to connect to WiFi for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disconnectWiFi(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disconnect_wifi', {}, 10000);
            this.emit('wifi_disconnected', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to disconnect WiFi for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async forgetWiFiNetwork(sessionId, ssid) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'forget_wifi', {
                ssid: ssid
            }, 10000);
            
            this.emit('wifi_forgotten', sessionId, ssid);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to forget WiFi network for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getWiFiInfo(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_wifi_info', {}, 10000);
            
            const info = {
                connected: result.connected,
                ssid: result.ssid,
                bssid: result.bssid,
                signal: result.signal,
                signalStrength: result.signalStrength,
                frequency: result.frequency,
                speed: result.speed,
                ipAddress: result.ipAddress,
                gateway: result.gateway,
                dns: result.dns,
                macAddress: result.macAddress
            };
            
            this.emit('wifi_info', sessionId, info);
            
            return info;
            
        } catch (error) {
            console.error(`Failed to get WiFi info for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== MOBILE DATA CONTROL ====================
    
    async enableMobileData(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_mobile_data', {}, 10000);
            this.emit('mobile_data_enabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to enable mobile data for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableMobileData(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_mobile_data', {}, 10000);
            this.emit('mobile_data_disabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to disable mobile data for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getMobileDataUsage(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_mobile_data_usage', {}, 10000);
            
            const usage = {
                total: result.total,
                used: result.used,
                remaining: result.remaining,
                percentage: result.percentage,
                warning: result.warning,
                limit: result.limit,
                apps: result.apps
            };
            
            this.emit('mobile_data_usage', sessionId, usage);
            
            return usage;
            
        } catch (error) {
            console.error(`Failed to get mobile data usage for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async setMobileDataLimit(sessionId, limitMB) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'set_mobile_data_limit', {
                limit: limitMB
            }, 10000);
            
            this.emit('mobile_data_limit_set', sessionId, limitMB);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to set mobile data limit for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== AIRPLANE MODE ====================
    
    async enableAirplaneMode(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_airplane_mode', {}, 10000);
            this.emit('airplane_mode_enabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to enable airplane mode for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableAirplaneMode(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_airplane_mode', {}, 10000);
            this.emit('airplane_mode_disabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to disable airplane mode for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async toggleAirplaneMode(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'toggle_airplane_mode', {}, 10000);
            this.emit('airplane_mode_toggled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to toggle airplane mode for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== BLUETOOTH CONTROL ====================
    
    async enableBluetooth(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_bluetooth', {}, 10000);
            this.emit('bluetooth_enabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to enable Bluetooth for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableBluetooth(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_bluetooth', {}, 10000);
            this.emit('bluetooth_disabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to disable Bluetooth for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async scanBluetooth(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'scan_bluetooth', {}, 30000);
            
            if (result && result.devices) {
                const devices = result.devices.map(device => ({
                    name: device.name,
                    address: device.address,
                    type: device.type,
                    bonded: device.bonded,
                    rssi: device.rssi,
                    uuids: device.uuids
                }));
                
                this.bluetoothDevices.set(sessionId, {
                    devices: devices,
                    timestamp: Date.now(),
                    count: devices.length
                });
                
                this.emit('bluetooth_scan_completed', sessionId, devices);
                
                return devices;
            }
            
            return [];
            
        } catch (error) {
            console.error(`Failed to scan Bluetooth for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async pairBluetoothDevice(sessionId, address) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'pair_bluetooth', {
                address: address
            }, 30000);
            
            this.emit('bluetooth_paired', sessionId, address);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to pair Bluetooth device for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async unpairBluetoothDevice(sessionId, address) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'unpair_bluetooth', {
                address: address
            }, 10000);
            
            this.emit('bluetooth_unpaired', sessionId, address);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to unpair Bluetooth device for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== HOTSPOT CONTROL ====================
    
    async enableHotspot(sessionId, ssid, password = null) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_hotspot', {
                ssid: ssid,
                password: password || this.generateRandomPassword(),
                security: 'wpa2'
            }, 30000);
            
            const hotspot = {
                ssid: ssid,
                password: password,
                clients: 0,
                enabled: true,
                startTime: Date.now()
            };
            
            this.hotspotSessions.set(sessionId, hotspot);
            this.emit('hotspot_enabled', sessionId, hotspot);
            
            return hotspot;
            
        } catch (error) {
            console.error(`Failed to enable hotspot for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableHotspot(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_hotspot', {}, 10000);
            
            this.hotspotSessions.delete(sessionId);
            this.emit('hotspot_disabled', sessionId);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to disable hotspot for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getHotspotClients(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_hotspot_clients', {}, 10000);
            
            const clients = result.clients.map(client => ({
                ip: client.ip,
                mac: client.mac,
                hostname: client.hostname,
                connected: client.connected
            }));
            
            this.emit('hotspot_clients', sessionId, clients);
            
            return clients;
            
        } catch (error) {
            console.error(`Failed to get hotspot clients for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== VPN CONTROL ====================
    
    async enableVPN(sessionId, config, type = 'openvpn') {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_vpn', {
                config: config,
                type: type
            }, 30000);
            
            const vpn = {
                type: type,
                enabled: true,
                startTime: Date.now(),
                config: config
            };
            
            this.vpnSessions.set(sessionId, vpn);
            this.emit('vpn_enabled', sessionId, vpn);
            
            return vpn;
            
        } catch (error) {
            console.error(`Failed to enable VPN for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableVPN(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_vpn', {}, 10000);
            
            this.vpnSessions.delete(sessionId);
            this.emit('vpn_disabled', sessionId);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to disable VPN for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getVPNStatus(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_vpn_status', {}, 10000);
            
            const status = {
                enabled: result.enabled,
                type: result.type,
                connected: result.connected,
                server: result.server,
                bytesIn: result.bytesIn,
                bytesOut: result.bytesOut,
                duration: result.duration
            };
            
            this.emit('vpn_status', sessionId, status);
            
            return status;
            
        } catch (error) {
            console.error(`Failed to get VPN status for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== NETWORK MONITORING ====================
    
    async startNetworkMonitoring(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.activeConnections.has(sessionId)) {
            throw new Error('Already monitoring');
        }
        
        const monitoringOptions = {
            ...this.monitoringOptions,
            ...options
        };
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'start_network_monitoring', monitoringOptions, 10000);
            
            const monitor = {
                id: crypto.randomBytes(8).toString('hex'),
                sessionId: sessionId,
                startTime: Date.now(),
                options: monitoringOptions,
                status: 'active'
            };
            
            this.activeConnections.set(sessionId, monitor);
            this.emit('network_monitoring_started', sessionId, monitor);
            
            return monitor;
            
        } catch (error) {
            console.error(`Failed to start network monitoring for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopNetworkMonitoring(sessionId) {
        const monitor = this.activeConnections.get(sessionId);
        if (!monitor) {
            throw new Error('Not monitoring');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'stop_network_monitoring', {}, 10000);
            
            monitor.status = 'stopped';
            monitor.endTime = Date.now();
            
            this.emit('network_monitoring_stopped', sessionId, monitor);
            
            return monitor;
            
        } catch (error) {
            console.error(`Failed to stop network monitoring for session ${sessionId}:`, error);
            throw error;
        } finally {
            this.activeConnections.delete(sessionId);
        }
    }
    
    async getNetworkStats(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_network_stats', {}, 10000);
            
            const stats = {
                wifi: {
                    rxBytes: result.wifi.rxBytes,
                    txBytes: result.wifi.txBytes,
                    rxPackets: result.wifi.rxPackets,
                    txPackets: result.wifi.txPackets,
                    speed: result.wifi.speed
                },
                mobile: {
                    rxBytes: result.mobile.rxBytes,
                    txBytes: result.mobile.txBytes,
                    rxPackets: result.mobile.rxPackets,
                    txPackets: result.mobile.txPackets,
                    networkType: result.mobile.networkType
                },
                total: {
                    rxBytes: result.total.rxBytes,
                    txBytes: result.total.txBytes,
                    rxPackets: result.total.rxPackets,
                    txPackets: result.total.txPackets
                }
            };
            
            this.networkStats.set(sessionId, stats);
            this.emit('network_stats', sessionId, stats);
            
            return stats;
            
        } catch (error) {
            console.error(`Failed to get network stats for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== PACKET CAPTURE ====================
    
    async startPacketCapture(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.packetCapture.has(sessionId)) {
            throw new Error('Already capturing packets');
        }
        
        const captureId = crypto.randomBytes(8).toString('hex');
        const filename = `capture_${sessionId}_${Date.now()}.pcap`;
        const filePath = path.join(this.packetsDir, filename);
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'start_packet_capture', {
                interface: options.interface || 'any',
                filter: options.filter || '',
                maxPackets: options.maxPackets || 1000,
                output: filePath
            }, 10000);
            
            const capture = {
                id: captureId,
                sessionId: sessionId,
                filename: filename,
                path: filePath,
                startTime: Date.now(),
                options: options,
                status: 'capturing',
                packets: 0
            };
            
            this.packetCapture.set(sessionId, capture);
            this.emit('packet_capture_started', sessionId, capture);
            
            return capture;
            
        } catch (error) {
            console.error(`Failed to start packet capture for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopPacketCapture(sessionId) {
        const capture = this.packetCapture.get(sessionId);
        if (!capture) {
            throw new Error('Not capturing packets');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'stop_packet_capture', {}, 10000);
            
            capture.status = 'stopped';
            capture.endTime = Date.now();
            capture.packets = result.packets;
            
            this.emit('packet_capture_stopped', sessionId, capture);
            
            return capture;
            
        } catch (error) {
            console.error(`Failed to stop packet capture for session ${sessionId}:`, error);
            throw error;
        } finally {
            this.packetCapture.delete(sessionId);
        }
    }
    
    // ==================== NETWORK SCANNING ====================
    
    async scanNetwork(sessionId, target, ports = []) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'scan_network', {
                target: target,
                ports: ports,
                timeout: 1000
            }, 60000);
            
            const scanResults = {
                target: target,
                startTime: result.startTime,
                endTime: result.endTime,
                duration: result.duration,
                hosts: result.hosts.map(host => ({
                    ip: host.ip,
                    mac: host.mac,
                    hostname: host.hostname,
                    openPorts: host.openPorts,
                    os: host.os
                }))
            };
            
            this.emit('network_scan_completed', sessionId, scanResults);
            
            return scanResults;
            
        } catch (error) {
            console.error(`Failed to scan network for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getNetworkInfo(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_network_info', {}, 10000);
            
            const info = {
                interfaces: result.interfaces.map(iface => ({
                    name: iface.name,
                    ip: iface.ip,
                    mac: iface.mac,
                    netmask: iface.netmask,
                    gateway: iface.gateway,
                    dns: iface.dns,
                    status: iface.status
                })),
                routing: result.routing,
                arp: result.arp,
                connections: result.connections
            };
            
            this.emit('network_info', sessionId, info);
            
            return info;
            
        } catch (error) {
            console.error(`Failed to get network info for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== UTILITIES ====================
    
    generateRandomPassword(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    
    startMonitoringInterval() {
        setInterval(async () => {
            for (const [sessionId, monitor] of this.activeConnections) {
                if (monitor.status === 'active') {
                    try {
                        await this.getNetworkStats(sessionId);
                    } catch (error) {
                        console.error(`Failed to update stats for session ${sessionId}:`, error);
                    }
                }
            }
        }, 5000); // Every 5 seconds
    }
    
    startCleanupInterval() {
        setInterval(async () => {
            await this.cleanup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    async cleanup() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        // Clean old packet captures
        const cleanDir = async (dir) => {
            try {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stats = await fs.stat(filePath);
                    if (now - stats.mtimeMs > maxAge) {
                        await fs.remove(filePath);
                    }
                }
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        };
        
        await cleanDir(this.packetsDir);
        await cleanDir(this.logsDir);
        
        // Clear caches
        this.wifiNetworks.clear();
        this.bluetoothDevices.clear();
        this.networkStats.clear();
        
        this.emit('cleanup_completed');
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onWiFiEnabled(callback) {
        this.on('wifi_enabled', callback);
    }
    
    onWiFiDisabled(callback) {
        this.on('wifi_disabled', callback);
    }
    
    onWiFiScanCompleted(callback) {
        this.on('wifi_scan_completed', callback);
    }
    
    onWiFiConnected(callback) {
        this.on('wifi_connected', callback);
    }
    
    onWiFiDisconnected(callback) {
        this.on('wifi_disconnected', callback);
    }
    
    onBluetoothEnabled(callback) {
        this.on('bluetooth_enabled', callback);
    }
    
    onBluetoothDisabled(callback) {
        this.on('bluetooth_disabled', callback);
    }
    
    onBluetoothScanCompleted(callback) {
        this.on('bluetooth_scan_completed', callback);
    }
    
    onHotspotEnabled(callback) {
        this.on('hotspot_enabled', callback);
    }
    
    onHotspotDisabled(callback) {
        this.on('hotspot_disabled', callback);
    }
    
    onVPNEnabled(callback) {
        this.on('vpn_enabled', callback);
    }
    
    onVPNDisabled(callback) {
        this.on('vpn_disabled', callback);
    }
    
    onNetworkMonitoringStarted(callback) {
        this.on('network_monitoring_started', callback);
    }
    
    onNetworkMonitoringStopped(callback) {
        this.on('network_monitoring_stopped', callback);
    }
    
    onNetworkStats(callback) {
        this.on('network_stats', callback);
    }
    
    onPacketCaptureStarted(callback) {
        this.on('packet_capture_started', callback);
    }
    
    onPacketCaptureStopped(callback) {
        this.on('packet_capture_stopped', callback);
    }
    
    onNetworkScanCompleted(callback) {
        this.on('network_scan_completed', callback);
    }
    
    onCleanupCompleted(callback) {
        this.on('cleanup_completed', callback);
    }
}

module.exports = NetworkControlModule;
