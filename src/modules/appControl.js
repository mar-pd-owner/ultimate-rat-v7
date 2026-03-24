/**
 * App Control Module - Complete Application Management System
 * Features: List/Install/Uninstall Apps, App Info, Force Stop, Clear Data, App Permissions, App Usage Stats
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

class AppControlModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.appCache = new Map(); // sessionId -> cached apps
        this.installingApps = new Map(); // sessionId -> install queue
        this.uninstallingApps = new Map(); // sessionId -> uninstall queue
        this.appStats = new Map(); // sessionId -> app statistics
        
        // App categories
        this.appCategories = {
            social: ['whatsapp', 'facebook', 'instagram', 'twitter', 'telegram', 'snapchat', 'tiktok'],
            messaging: ['whatsapp', 'telegram', 'signal', 'messenger', 'line', 'wechat'],
            browser: ['chrome', 'firefox', 'opera', 'brave', 'samsung', 'edge'],
            media: ['youtube', 'spotify', 'netflix', 'prime', 'hulu', 'disney'],
            productivity: ['office', 'word', 'excel', 'powerpoint', 'outlook', 'drive'],
            security: ['antivirus', 'vpn', 'firewall', 'malware', 'security'],
            games: ['game', 'play', 'candy', 'clash', 'pubg', 'fortnite']
        };
        
        // Blacklisted apps (system apps that shouldn't be modified)
        this.blacklistedApps = [
            'android', 'system', 'google', 'gms', 'qualcomm', 'mediatek',
            'kernel', 'launcher', 'settings', 'phone', 'contacts', 'dialer'
        ];
        
        // Initialize directories
        this.initDirectories();
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    initDirectories() {
        this.backupsDir = path.join(__dirname, '../../app_backups');
        this.extractsDir = path.join(__dirname, '../../app_extracts');
        fs.ensureDirSync(this.backupsDir);
        fs.ensureDirSync(this.extractsDir);
    }
    
    // ==================== APP LISTING ====================
    
    async listApps(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'list_apps', {
                includeSystem: options.includeSystem || false,
                includeDisabled: options.includeDisabled || false,
                filter: options.filter || '',
                sortBy: options.sortBy || 'name'
            }, 30000);
            
            if (result && result.apps) {
                const apps = result.apps.map(app => ({
                    name: app.name,
                    packageName: app.packageName,
                    version: app.version,
                    versionCode: app.versionCode,
                    size: app.size,
                    installed: app.installed,
                    enabled: app.enabled,
                    isSystem: app.isSystem,
                    isUpdated: app.isUpdated,
                    installDate: app.installDate,
                    updateDate: app.updateDate,
                    category: this.getAppCategory(app.packageName, app.name),
                    permissions: app.permissions,
                    activities: app.activities,
                    services: app.services,
                    icon: app.icon
                }));
                
                // Cache apps
                this.appCache.set(sessionId, {
                    apps: apps,
                    timestamp: Date.now(),
                    count: apps.length
                });
                
                this.emit('apps_listed', sessionId, apps);
                
                return apps;
            }
            
            return [];
            
        } catch (error) {
            console.error(`Failed to list apps for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    getAppCategory(packageName, appName) {
        const lowerName = (packageName + ' ' + appName).toLowerCase();
        
        for (const [category, keywords] of Object.entries(this.appCategories)) {
            for (const keyword of keywords) {
                if (lowerName.includes(keyword)) {
                    return category;
                }
            }
        }
        
        return 'other';
    }
    
    async getAppInfo(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_app_info', {
                package: packageName
            }, 30000);
            
            const appInfo = {
                name: result.name,
                packageName: result.packageName,
                version: result.version,
                versionCode: result.versionCode,
                size: result.size,
                dataSize: result.dataSize,
                cacheSize: result.cacheSize,
                installed: result.installed,
                enabled: result.enabled,
                isSystem: result.isSystem,
                isUpdated: result.isUpdated,
                installDate: result.installDate,
                updateDate: result.updateDate,
                firstInstallTime: result.firstInstallTime,
                lastUpdateTime: result.lastUpdateTime,
                targetSdk: result.targetSdk,
                minSdk: result.minSdk,
                permissions: result.permissions,
                activities: result.activities,
                services: result.services,
                receivers: result.receivers,
                providers: result.providers,
                signature: result.signature,
                certificate: result.certificate
            };
            
            this.emit('app_info', sessionId, appInfo);
            
            return appInfo;
            
        } catch (error) {
            console.error(`Failed to get app info for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== APP INSTALLATION ====================
    
    async installApp(sessionId, apkPath, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const installId = crypto.randomBytes(8).toString('hex');
        const installStart = Date.now();
        
        const install = {
            id: installId,
            sessionId: sessionId,
            apkPath: apkPath,
            options: options,
            startTime: installStart,
            status: 'installing'
        };
        
        this.installingApps.set(installId, install);
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'install_app', {
                path: apkPath,
                replace: options.replace || false,
                grantPermissions: options.grantPermissions || false,
                installLocation: options.installLocation || 'auto'
            }, 120000);
            
            install.status = 'completed';
            install.endTime = Date.now();
            install.duration = install.endTime - installStart;
            install.packageName = result.packageName;
            
            // Clear cache to refresh app list
            this.appCache.delete(sessionId);
            
            this.emit('app_installed', sessionId, install);
            
            return {
                id: installId,
                packageName: result.packageName,
                success: true,
                message: result.message
            };
            
        } catch (error) {
            console.error(`Failed to install app for session ${sessionId}:`, error);
            install.status = 'failed';
            install.error = error.message;
            this.emit('install_failed', sessionId, install);
            throw error;
            
        } finally {
            setTimeout(() => {
                this.installingApps.delete(installId);
            }, 60000);
        }
    }
    
    async installFromURL(sessionId, url, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            // Download APK from URL
            const downloadResult = await this.sessionManager.executeCommand(sessionId, 'download_file', {
                url: url,
                destination: '/sdcard/Download/temp.apk'
            }, 60000);
            
            if (downloadResult.success) {
                // Install downloaded APK
                return await this.installApp(sessionId, '/sdcard/Download/temp.apk', options);
            }
            
            throw new Error('Failed to download APK');
            
        } catch (error) {
            console.error(`Failed to install from URL for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== APP UNINSTALLATION ====================
    
    async uninstallApp(sessionId, packageName, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Check if app is blacklisted
        if (this.isBlacklisted(packageName)) {
            throw new Error('Cannot uninstall system app');
        }
        
        const uninstallId = crypto.randomBytes(8).toString('hex');
        const uninstallStart = Date.now();
        
        const uninstall = {
            id: uninstallId,
            sessionId: sessionId,
            packageName: packageName,
            options: options,
            startTime: uninstallStart,
            status: 'uninstalling'
        };
        
        this.uninstallingApps.set(uninstallId, uninstall);
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'uninstall_app', {
                package: packageName,
                keepData: options.keepData || false
            }, 60000);
            
            uninstall.status = 'completed';
            uninstall.endTime = Date.now();
            uninstall.duration = uninstall.endTime - uninstallStart;
            
            // Clear cache to refresh app list
            this.appCache.delete(sessionId);
            
            this.emit('app_uninstalled', sessionId, uninstall);
            
            return {
                id: uninstallId,
                packageName: packageName,
                success: true,
                message: result.message
            };
            
        } catch (error) {
            console.error(`Failed to uninstall app for session ${sessionId}:`, error);
            uninstall.status = 'failed';
            uninstall.error = error.message;
            this.emit('uninstall_failed', sessionId, uninstall);
            throw error;
            
        } finally {
            setTimeout(() => {
                this.uninstallingApps.delete(uninstallId);
            }, 60000);
        }
    }
    
    isBlacklisted(packageName) {
        const lowerPackage = packageName.toLowerCase();
        for (const blacklist of this.blacklistedApps) {
            if (lowerPackage.includes(blacklist)) {
                return true;
            }
        }
        return false;
    }
    
    // ==================== APP CONTROL ====================
    
    async startApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'start_app', {
                package: packageName
            }, 30000);
            
            this.emit('app_started', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to start app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'stop_app', {
                package: packageName
            }, 30000);
            
            this.emit('app_stopped', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to stop app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async forceStopApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'force_stop_app', {
                package: packageName
            }, 30000);
            
            this.emit('app_force_stopped', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to force stop app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async clearAppData(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'clear_app_data', {
                package: packageName
            }, 30000);
            
            this.emit('app_data_cleared', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to clear app data for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async clearAppCache(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'clear_app_cache', {
                package: packageName
            }, 30000);
            
            this.emit('app_cache_cleared', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to clear app cache for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async enableApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'enable_app', {
                package: packageName
            }, 30000);
            
            this.emit('app_enabled', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to enable app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async disableApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Check if app is blacklisted
        if (this.isBlacklisted(packageName)) {
            throw new Error('Cannot disable system app');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'disable_app', {
                package: packageName
            }, 30000);
            
            this.emit('app_disabled', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to disable app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== APP PERMISSIONS ====================
    
    async getAppPermissions(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_app_permissions', {
                package: packageName
            }, 30000);
            
            const permissions = {
                granted: result.granted,
                denied: result.denied,
                requested: result.requested,
                dangerous: result.dangerous
            };
            
            this.emit('app_permissions', sessionId, packageName, permissions);
            
            return permissions;
            
        } catch (error) {
            console.error(`Failed to get app permissions for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async grantPermission(sessionId, packageName, permission) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'grant_permission', {
                package: packageName,
                permission: permission
            }, 30000);
            
            this.emit('permission_granted', sessionId, packageName, permission);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to grant permission for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async revokePermission(sessionId, packageName, permission) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'revoke_permission', {
                package: packageName,
                permission: permission
            }, 30000);
            
            this.emit('permission_revoked', sessionId, packageName, permission);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to revoke permission for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== APP BACKUP ====================
    
    async backupApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const backupId = crypto.randomBytes(8).toString('hex');
        const backupPath = path.join(this.backupsDir, `${backupId}_${packageName}.apk`);
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'backup_app', {
                package: packageName,
                destination: backupPath
            }, 60000);
            
            const backup = {
                id: backupId,
                packageName: packageName,
                path: backupPath,
                size: result.size,
                created: Date.now()
            };
            
            this.emit('app_backup_created', sessionId, backup);
            
            return backup;
            
        } catch (error) {
            console.error(`Failed to backup app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async restoreApp(sessionId, backupId) {
        const backupPath = path.join(this.backupsDir, `${backupId}_*.apk`);
        const files = await fs.readdir(this.backupsDir);
        const backupFile = files.find(f => f.startsWith(backupId));
        
        if (!backupFile) {
            throw new Error('Backup not found');
        }
        
        const fullPath = path.join(this.backupsDir, backupFile);
        
        return await this.installApp(sessionId, fullPath);
    }
    
    // ==================== APP STATISTICS ====================
    
    async getAppUsage(sessionId, packageName, days = 7) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_app_usage', {
                package: packageName,
                days: days
            }, 30000);
            
            const usage = {
                packageName: packageName,
                totalTime: result.totalTime,
                foregroundTime: result.foregroundTime,
                backgroundTime: result.backgroundTime,
                launchCount: result.launchCount,
                lastUsed: result.lastUsed,
                dailyUsage: result.dailyUsage
            };
            
            this.appStats.set(`${sessionId}:${packageName}`, usage);
            this.emit('app_usage', sessionId, usage);
            
            return usage;
            
        } catch (error) {
            console.error(`Failed to get app usage for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getAllAppUsage(sessionId, days = 7) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_all_app_usage', {
                days: days
            }, 60000);
            
            const usage = result.apps.map(app => ({
                packageName: app.packageName,
                name: app.name,
                totalTime: app.totalTime,
                launchCount: app.launchCount,
                lastUsed: app.lastUsed
            }));
            
            this.emit('all_app_usage', sessionId, usage);
            
            return usage;
            
        } catch (error) {
            console.error(`Failed to get all app usage for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== APP SEARCH ====================
    
    async searchApps(sessionId, query) {
        const apps = await this.listApps(sessionId);
        
        const results = apps.filter(app => 
            app.name.toLowerCase().includes(query.toLowerCase()) ||
            app.packageName.toLowerCase().includes(query.toLowerCase())
        );
        
        this.emit('apps_searched', sessionId, query, results);
        
        return results;
    }
    
    async getAppsByCategory(sessionId, category) {
        const apps = await this.listApps(sessionId);
        
        const results = apps.filter(app => app.category === category);
        
        this.emit('apps_by_category', sessionId, category, results);
        
        return results;
    }
    
    // ==================== APP MONITORING ====================
    
    async startAppMonitoring(sessionId, interval = 5000) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'start_app_monitoring', {
                interval: interval
            }, 10000);
            
            this.emit('app_monitoring_started', sessionId);
            
            return true;
            
        } catch (error) {
            console.error(`Failed to start app monitoring for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopAppMonitoring(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_app_monitoring', {}, 10000);
            
            this.emit('app_monitoring_stopped', sessionId);
            
            return true;
            
        } catch (error) {
            console.error(`Failed to stop app monitoring for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getForegroundApp(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_foreground_app', {}, 10000);
            
            const foreground = {
                packageName: result.packageName,
                name: result.name,
                activity: result.activity,
                startTime: result.startTime
            };
            
            this.emit('foreground_app', sessionId, foreground);
            
            return foreground;
            
        } catch (error) {
            console.error(`Failed to get foreground app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== APP BLOCKING ====================
    
    async blockApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'block_app', {
                package: packageName
            }, 30000);
            
            this.emit('app_blocked', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to block app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async unblockApp(sessionId, packageName) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'unblock_app', {
                package: packageName
            }, 30000);
            
            this.emit('app_unblocked', sessionId, packageName);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to unblock app for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getBlockedApps(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_blocked_apps', {}, 30000);
            
            const blocked = result.apps.map(app => ({
                packageName: app.packageName,
                name: app.name,
                blockedAt: app.blockedAt
            }));
            
            this.emit('blocked_apps', sessionId, blocked);
            
            return blocked;
            
        } catch (error) {
            console.error(`Failed to get blocked apps for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== UTILITIES ====================
    
    startCleanupInterval() {
        setInterval(async () => {
            await this.cleanup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    async cleanup() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        // Clean old backups
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
        
        await cleanDir(this.backupsDir);
        await cleanDir(this.extractsDir);
        
        // Clear caches
        this.appCache.clear();
        this.appStats.clear();
        
        this.emit('cleanup_completed');
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onAppsListed(callback) {
        this.on('apps_listed', callback);
    }
    
    onAppInfo(callback) {
        this.on('app_info', callback);
    }
    
    onAppInstalled(callback) {
        this.on('app_installed', callback);
    }
    
    onInstallFailed(callback) {
        this.on('install_failed', callback);
    }
    
    onAppUninstalled(callback) {
        this.on('app_uninstalled', callback);
    }
    
    onUninstallFailed(callback) {
        this.on('uninstall_failed', callback);
    }
    
    onAppStarted(callback) {
        this.on('app_started', callback);
    }
    
    onAppStopped(callback) {
        this.on('app_stopped', callback);
    }
    
    onAppForceStopped(callback) {
        this.on('app_force_stopped', callback);
    }
    
    onAppDataCleared(callback) {
        this.on('app_data_cleared', callback);
    }
    
    onAppCacheCleared(callback) {
        this.on('app_cache_cleared', callback);
    }
    
    onAppEnabled(callback) {
        this.on('app_enabled', callback);
    }
    
    onAppDisabled(callback) {
        this.on('app_disabled', callback);
    }
    
    onAppPermissions(callback) {
        this.on('app_permissions', callback);
    }
    
    onPermissionGranted(callback) {
        this.on('permission_granted', callback);
    }
    
    onPermissionRevoked(callback) {
        this.on('permission_revoked', callback);
    }
    
    onAppBackupCreated(callback) {
        this.on('app_backup_created', callback);
    }
    
    onAppUsage(callback) {
        this.on('app_usage', callback);
    }
    
    onAllAppUsage(callback) {
        this.on('all_app_usage', callback);
    }
    
    onAppsSearched(callback) {
        this.on('apps_searched', callback);
    }
    
    onAppsByCategory(callback) {
        this.on('apps_by_category', callback);
    }
    
    onAppMonitoringStarted(callback) {
        this.on('app_monitoring_started', callback);
    }
    
    onAppMonitoringStopped(callback) {
        this.on('app_monitoring_stopped', callback);
    }
    
    onForegroundApp(callback) {
        this.on('foreground_app', callback);
    }
    
    onAppBlocked(callback) {
        this.on('app_blocked', callback);
    }
    
    onAppUnblocked(callback) {
        this.on('app_unblocked', callback);
    }
    
    onBlockedApps(callback) {
        this.on('blocked_apps', callback);
    }
    
    onCleanupCompleted(callback) {
        this.on('cleanup_completed', callback);
    }
}

module.exports = AppControlModule;
