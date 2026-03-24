/**
 * System Control Module - Complete System Management System
 * Features: System Info, Battery Control, Process Management, Reboot/Power Off, Bootloader, Recovery, Build Prop
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const config = require('../config');

class SystemControlModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.processMonitor = new Map(); // sessionId -> monitor state
        this.systemStats = new Map(); // sessionId -> system statistics
        this.buildProps = new Map(); // sessionId -> build.prop data
        this.bootLogs = new Map(); // sessionId -> boot logs
        this.crashReports = new Map(); // sessionId -> crash reports
        
        // System monitoring options
        this.monitoringOptions = {
            interval: 5000, // 5 seconds
            monitorCPU: true,
            monitorMemory: true,
            monitorBattery: true,
            monitorNetwork: true,
            monitorProcesses: true
        };
        
        // Initialize directories
        this.initDirectories();
        
        // Start monitoring interval
        this.startMonitoringInterval();
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    initDirectories() {
        this.logsDir = path.join(__dirname, '../../system_logs');
        this.crashesDir = path.join(__dirname, '../../crash_reports');
        this.dumpsDir = path.join(__dirname, '../../system_dumps');
        fs.ensureDirSync(this.logsDir);
        fs.ensureDirSync(this.crashesDir);
        fs.ensureDirSync(this.dumpsDir);
    }
    
    // ==================== SYSTEM INFORMATION ====================
    
    async getSystemInfo(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_system_info', {}, 30000);
            
            const systemInfo = {
                device: {
                    model: result.device.model,
                    manufacturer: result.device.manufacturer,
                    brand: result.device.brand,
                    board: result.device.board,
                    hardware: result.device.hardware,
                    fingerprint: result.device.fingerprint,
                    serial: result.device.serial,
                    imei: result.device.imei,
                    imsi: result.device.imsi,
                    simSerial: result.device.simSerial,
                    phoneNumber: result.device.phoneNumber
                },
                os: {
                    version: result.os.version,
                    sdk: result.os.sdk,
                    build: result.os.build,
                    codename: result.os.codename,
                    securityPatch: result.os.securityPatch,
                    bootloader: result.os.bootloader,
                    baseband: result.os.baseband,
                    kernel: result.os.kernel
                },
                hardware: {
                    cpu: {
                        cores: result.hardware.cpu.cores,
                        processor: result.hardware.cpu.processor,
                        architecture: result.hardware.cpu.architecture,
                        features: result.hardware.cpu.features,
                        bogoMIPS: result.hardware.cpu.bogoMIPS,
                        hardware: result.hardware.cpu.hardware,
                        revision: result.hardware.cpu.revision
                    },
                    memory: {
                        total: result.hardware.memory.total,
                        free: result.hardware.memory.free,
                        used: result.hardware.memory.used,
                        totalMB: (result.hardware.memory.total / 1024 / 1024).toFixed(2),
                        freeMB: (result.hardware.memory.free / 1024 / 1024).toFixed(2),
                        usedMB: (result.hardware.memory.used / 1024 / 1024).toFixed(2),
                        swapTotal: result.hardware.memory.swapTotal,
                        swapFree: result.hardware.memory.swapFree
                    },
                    storage: {
                        internal: {
                            total: result.hardware.storage.internal.total,
                            free: result.hardware.storage.internal.free,
                            used: result.hardware.storage.internal.used
                        },
                        external: result.hardware.storage.external ? {
                            total: result.hardware.storage.external.total,
                            free: result.hardware.storage.external.free,
                            used: result.hardware.storage.external.used
                        } : null
                    },
                    display: {
                        width: result.hardware.display.width,
                        height: result.hardware.display.height,
                        dpi: result.hardware.display.dpi,
                        refreshRate: result.hardware.display.refreshRate,
                        density: result.hardware.display.density,
                        resolution: `${result.hardware.display.width}x${result.hardware.display.height}`
                    },
                    sensors: result.hardware.sensors,
                    battery: {
                        level: result.hardware.battery.level,
                        temperature: result.hardware.battery.temperature,
                        voltage: result.hardware.battery.voltage,
                        technology: result.hardware.battery.technology,
                        health: result.hardware.battery.health,
                        status: result.hardware.battery.status
                    }
                },
                software: {
                    installedApps: result.software.installedApps,
                    runningServices: result.software.runningServices,
                    recentTasks: result.software.recentTasks,
                    uptime: result.software.uptime,
                    bootTime: result.software.bootTime
                }
            };
            
            this.systemStats.set(sessionId, systemInfo);
            this.emit('system_info', sessionId, systemInfo);
            
            return systemInfo;
            
        } catch (error) {
            console.error(`Failed to get system info for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getBuildProp(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_build_prop', {}, 30000);
            
            const buildProp = {
                properties: result.properties,
                system: result.system,
                product: result.product,
                radio: result.radio,
                boot: result.boot,
                recovery: result.recovery
            };
            
            this.buildProps.set(sessionId, buildProp);
            this.emit('build_prop', sessionId, buildProp);
            
            return buildProp;
            
        } catch (error) {
            console.error(`Failed to get build.prop for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== BATTERY CONTROL ====================
    
    async getBatteryInfo(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_battery_info', {}, 10000);
            
            const batteryInfo = {
                level: result.level,
                temperature: result.temperature,
                voltage: result.voltage,
                current: result.current,
                power: result.power,
                health: result.health,
                status: result.status,
                plugged: result.plugged,
                technology: result.technology,
                chargeCounter: result.chargeCounter,
                capacity: result.capacity,
                cycleCount: result.cycleCount,
                timeToFull: result.timeToFull,
                timeToEmpty: result.timeToEmpty
            };
            
            this.emit('battery_info', sessionId, batteryInfo);
            
            return batteryInfo;
            
        } catch (error) {
            console.error(`Failed to get battery info for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async enableBatterySaver(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_battery_saver', {}, 10000);
            this.emit('battery_saver_enabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to enable battery saver for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableBatterySaver(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_battery_saver', {}, 10000);
            this.emit('battery_saver_disabled', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to disable battery saver for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async optimizeBattery(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'optimize_battery', {}, 30000);
            this.emit('battery_optimized', sessionId, result);
            return result;
        } catch (error) {
            console.error(`Failed to optimize battery for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== PROCESS MANAGEMENT ====================
    
    async listProcesses(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'list_processes', {}, 30000);
            
            const processes = result.processes.map(proc => ({
                pid: proc.pid,
                name: proc.name,
                status: proc.status,
                cpu: proc.cpu,
                memory: proc.memory,
                memoryMB: (proc.memory / 1024 / 1024).toFixed(2),
                threads: proc.threads,
                priority: proc.priority,
                nice: proc.nice,
                user: proc.user,
                startTime: proc.startTime,
                uptime: proc.uptime,
                cmdline: proc.cmdline
            }));
            
            this.emit('processes_listed', sessionId, processes);
            
            return processes;
            
        } catch (error) {
            console.error(`Failed to list processes for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async killProcess(sessionId, pid) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'kill_process', {
                pid: pid
            }, 10000);
            
            this.emit('process_killed', sessionId, pid);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to kill process for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async killProcessByName(sessionId, processName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'kill_process_by_name', {
                name: processName
            }, 30000);
            
            this.emit('process_killed_by_name', sessionId, processName, result.killed);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to kill process by name for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async reniceProcess(sessionId, pid, priority) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (priority < -20 || priority > 19) {
            throw new Error('Priority must be between -20 and 19');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'renice_process', {
                pid: pid,
                priority: priority
            }, 10000);
            
            this.emit('process_reniced', sessionId, pid, priority);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to renice process for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== SYSTEM CONTROL ====================
    
    async reboot(sessionId, mode = 'normal') {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const validModes = ['normal', 'recovery', 'bootloader', 'fastboot', 'download'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}. Valid: ${validModes.join(', ')}`);
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'reboot', {
                mode: mode
            }, 30000);
            
            this.emit('device_rebooting', sessionId, mode);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to reboot device for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async powerOff(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'power_off', {}, 30000);
            this.emit('device_powering_off', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to power off device for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async restart(sessionId) {
        return await this.reboot(sessionId, 'normal');
    }
    
    async shutdown(sessionId) {
        return await this.powerOff(sessionId);
    }
    
    async recoveryMode(sessionId) {
        return await this.reboot(sessionId, 'recovery');
    }
    
    async bootloaderMode(sessionId) {
        return await this.reboot(sessionId, 'bootloader');
    }
    
    async fastbootMode(sessionId) {
        return await this.reboot(sessionId, 'fastboot');
    }
    
    // ==================== SYSTEM SETTINGS ====================
    
    async getSystemSetting(sessionId, settingName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_system_setting', {
                name: settingName
            }, 10000);
            
            this.emit('system_setting', sessionId, settingName, result.value);
            
            return result.value;
            
        } catch (error) {
            console.error(`Failed to get system setting for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async setSystemSetting(sessionId, settingName, value) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'set_system_setting', {
                name: settingName,
                value: value
            }, 10000);
            
            this.emit('system_setting_changed', sessionId, settingName, value);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to set system setting for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async enableDeveloperOptions(sessionId) {
        return await this.setSystemSetting(sessionId, 'development_settings_enabled', 1);
    }
    
    async disableDeveloperOptions(sessionId) {
        return await this.setSystemSetting(sessionId, 'development_settings_enabled', 0);
    }
    
    async enableUsbDebugging(sessionId) {
        return await this.setSystemSetting(sessionId, 'adb_enabled', 1);
    }
    
    async disableUsbDebugging(sessionId) {
        return await this.setSystemSetting(sessionId, 'adb_enabled', 0);
    }
    
    async enableStayAwake(sessionId) {
        return await this.setSystemSetting(sessionId, 'stay_on_while_plugged_in', 1);
    }
    
    async disableStayAwake(sessionId) {
        return await this.setSystemSetting(sessionId, 'stay_on_while_plugged_in', 0);
    }
    
    // ==================== SYSTEM MONITORING ====================
    
    async startSystemMonitoring(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.processMonitor.has(sessionId)) {
            throw new Error('Already monitoring');
        }
        
        const monitoringOptions = {
            ...this.monitoringOptions,
            ...options
        };
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'start_system_monitoring', monitoringOptions, 10000);
            
            const monitor = {
                id: crypto.randomBytes(8).toString('hex'),
                sessionId: sessionId,
                startTime: Date.now(),
                options: monitoringOptions,
                status: 'active'
            };
            
            this.processMonitor.set(sessionId, monitor);
            this.emit('system_monitoring_started', sessionId, monitor);
            
            return monitor;
            
        } catch (error) {
            console.error(`Failed to start system monitoring for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopSystemMonitoring(sessionId) {
        const monitor = this.processMonitor.get(sessionId);
        if (!monitor) {
            throw new Error('Not monitoring');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_system_monitoring', {}, 10000);
            
            monitor.status = 'stopped';
            monitor.endTime = Date.now();
            
            this.emit('system_monitoring_stopped', sessionId, monitor);
            
            return monitor;
            
        } catch (error) {
            console.error(`Failed to stop system monitoring for session ${sessionId}:`, error);
            throw error;
        } finally {
            this.processMonitor.delete(sessionId);
        }
    }
    
    async getSystemStats(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_system_stats', {}, 10000);
            
            const stats = {
                cpu: {
                    usage: result.cpu.usage,
                    cores: result.cpu.cores,
                    frequencies: result.cpu.frequencies,
                    temperatures: result.cpu.temperatures,
                    loadAvg: result.cpu.loadAvg
                },
                memory: {
                    total: result.memory.total,
                    free: result.memory.free,
                    used: result.memory.used,
                    cached: result.memory.cached,
                    buffers: result.memory.buffers,
                    available: result.memory.available
                },
                network: {
                    interfaces: result.network.interfaces,
                    connections: result.network.connections,
                    rxBytes: result.network.rxBytes,
                    txBytes: result.network.txBytes
                },
                disk: {
                    total: result.disk.total,
                    free: result.disk.free,
                    used: result.disk.used,
                    reads: result.disk.reads,
                    writes: result.disk.writes
                },
                uptime: result.uptime,
                load: result.load,
                processes: result.processes
            };
            
            this.emit('system_stats', sessionId, stats);
            
            return stats;
            
        } catch (error) {
            console.error(`Failed to get system stats for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== SYSTEM LOGS ====================
    
    async getLogcat(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_logcat', {
                buffer: options.buffer || 'main',
                level: options.level || 'info',
                filter: options.filter || '',
                lines: options.lines || 100,
                tail: options.tail !== false
            }, 30000);
            
            const logs = result.logs.map(log => ({
                timestamp: log.timestamp,
                pid: log.pid,
                tid: log.tid,
                level: log.level,
                tag: log.tag,
                message: log.message
            }));
            
            this.emit('logcat', sessionId, logs);
            
            return logs;
            
        } catch (error) {
            console.error(`Failed to get logcat for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getDmesg(sessionId, lines = 100) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_dmesg', {
                lines: lines
            }, 30000);
            
            const logs = result.logs.map(log => ({
                timestamp: log.timestamp,
                level: log.level,
                message: log.message
            }));
            
            this.emit('dmesg', sessionId, logs);
            
            return logs;
            
        } catch (error) {
            console.error(`Failed to get dmesg for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getKmsg(sessionId, lines = 100) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_kmsg', {
                lines: lines
            }, 30000);
            
            const logs = result.logs.map(log => ({
                timestamp: log.timestamp,
                level: log.level,
                message: log.message
            }));
            
            this.emit('kmsg', sessionId, logs);
            
            return logs;
            
        } catch (error) {
            console.error(`Failed to get kmsg for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getBootLogs(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_boot_logs', {}, 30000);
            
            const bootLogs = {
                lastBoot: result.lastBoot,
                bootTime: result.bootTime,
                logs: result.logs,
                services: result.services,
                modules: result.modules
            };
            
            this.bootLogs.set(sessionId, bootLogs);
            this.emit('boot_logs', sessionId, bootLogs);
            
            return bootLogs;
            
        } catch (error) {
            console.error(`Failed to get boot logs for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== CRASH REPORTING ====================
    
    async getCrashReports(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_crash_reports', {}, 30000);
            
            const reports = result.reports.map(report => ({
                id: report.id,
                timestamp: report.timestamp,
                process: report.process,
                pid: report.pid,
                signal: report.signal,
                stacktrace: report.stacktrace,
                details: report.details
            }));
            
            this.crashReports.set(sessionId, reports);
            this.emit('crash_reports', sessionId, reports);
            
            return reports;
            
        } catch (error) {
            console.error(`Failed to get crash reports for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async clearCrashReports(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'clear_crash_reports', {}, 10000);
            this.crashReports.delete(sessionId);
            this.emit('crash_reports_cleared', sessionId);
            return result;
        } catch (error) {
            console.error(`Failed to clear crash reports for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== SYSTEM DUMP ====================
    
    async takeSystemDump(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const dumpId = crypto.randomBytes(8).toString('hex');
        const dumpPath = path.join(this.dumpsDir, `dump_${sessionId}_${dumpId}.json`);
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'take_system_dump', {}, 60000);
            
            const dump = {
                id: dumpId,
                sessionId: sessionId,
                timestamp: Date.now(),
                path: dumpPath,
                size: JSON.stringify(result).length,
                data: result
            };
            
            await fs.writeJson(dumpPath, dump, { spaces: 2 });
            
            this.emit('system_dump_taken', sessionId, dump);
            
            return dump;
            
        } catch (error) {
            console.error(`Failed to take system dump for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== UTILITIES ====================
    
    startMonitoringInterval() {
        setInterval(async () => {
            for (const [sessionId, monitor] of this.processMonitor) {
                if (monitor.status === 'active') {
                    try {
                        await this.getSystemStats(sessionId);
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
        
        // Clean old dumps
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
        
        await cleanDir(this.logsDir);
        await cleanDir(this.crashesDir);
        await cleanDir(this.dumpsDir);
        
        // Clear caches
        this.systemStats.clear();
        this.buildProps.clear();
        this.bootLogs.clear();
        this.crashReports.clear();
        
        this.emit('cleanup_completed');
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onSystemInfo(callback) {
        this.on('system_info', callback);
    }
    
    onBuildProp(callback) {
        this.on('build_prop', callback);
    }
    
    onBatteryInfo(callback) {
        this.on('battery_info', callback);
    }
    
    onBatterySaverEnabled(callback) {
        this.on('battery_saver_enabled', callback);
    }
    
    onBatterySaverDisabled(callback) {
        this.on('battery_saver_disabled', callback);
    }
    
    onBatteryOptimized(callback) {
        this.on('battery_optimized', callback);
    }
    
    onProcessesListed(callback) {
        this.on('processes_listed', callback);
    }
    
    onProcessKilled(callback) {
        this.on('process_killed', callback);
    }
    
    onProcessKilledByName(callback) {
        this.on('process_killed_by_name', callback);
    }
    
    onProcessReniced(callback) {
        this.on('process_reniced', callback);
    }
    
    onDeviceRebooting(callback) {
        this.on('device_rebooting', callback);
    }
    
    onDevicePoweringOff(callback) {
        this.on('device_powering_off', callback);
    }
    
    onSystemSetting(callback) {
        this.on('system_setting', callback);
    }
    
    onSystemSettingChanged(callback) {
        this.on('system_setting_changed', callback);
    }
    
    onSystemMonitoringStarted(callback) {
        this.on('system_monitoring_started', callback);
    }
    
    onSystemMonitoringStopped(callback) {
        this.on('system_monitoring_stopped', callback);
    }
    
    onSystemStats(callback) {
        this.on('system_stats', callback);
    }
    
    onLogcat(callback) {
        this.on('logcat', callback);
    }
    
    onDmesg(callback) {
        this.on('dmesg', callback);
    }
    
    onKmsg(callback) {
        this.on('kmsg', callback);
    }
    
    onBootLogs(callback) {
        this.on('boot_logs', callback);
    }
    
    onCrashReports(callback) {
        this.on('crash_reports', callback);
    }
    
    onCrashReportsCleared(callback) {
        this.on('crash_reports_cleared', callback);
    }
    
    onSystemDumpTaken(callback) {
        this.on('system_dump_taken', callback);
    }
    
    onCleanupCompleted(callback) {
        this.on('cleanup_completed', callback);
    }
}

module.exports = SystemControlModule;
