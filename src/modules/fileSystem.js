/**
 * File System Module - Complete File Management System
 * Features: File Browser, Upload/Download, Search, Archive, Encryption, Backup
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const unzipper = require('unzipper');
const config = require('../config');

class FileSystemModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.activeTransfers = new Map(); // sessionId -> transfer state
        this.fileCache = new Map(); // sessionId -> file cache
        this.directoryCache = new Map(); // sessionId -> directory cache
        this.downloadQueue = new Map(); // sessionId -> download queue
        this.uploadQueue = new Map(); // sessionId -> upload queue
        
        // File type detection
        this.fileTypes = {
            images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
            videos: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
            audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
            documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
            spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
            presentations: ['ppt', 'pptx', 'odp'],
            archives: ['zip', 'rar', '7z', 'tar', 'gz'],
            executables: ['exe', 'apk', 'bat', 'sh', 'bin'],
            code: ['js', 'py', 'java', 'cpp', 'c', 'html', 'css', 'php', 'json', 'xml']
        };
        
        // Initialize directories
        this.initDirectories();
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    initDirectories() {
        this.downloadsDir = path.join(__dirname, '../../downloads');
        this.uploadsDir = path.join(__dirname, '../../uploads');
        this.tempDir = path.join(__dirname, '../../temp');
        this.backupsDir = path.join(__dirname, '../../backups');
        
        fs.ensureDirSync(this.downloadsDir);
        fs.ensureDirSync(this.uploadsDir);
        fs.ensureDirSync(this.tempDir);
        fs.ensureDirSync(this.backupsDir);
    }
    
    // ==================== FILE BROWSER ====================
    
    async listDirectory(sessionId, dirPath = '/', options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'list_directory', {
                path: dirPath,
                showHidden: options.showHidden || false,
                sortBy: options.sortBy || 'name',
                sortOrder: options.sortOrder || 'asc'
            }, 30000);
            
            if (result && result.files) {
                // Parse file list
                const files = result.files.map(file => ({
                    name: file.name,
                    path: file.path,
                    size: file.size,
                    type: this.detectFileType(file.name),
                    isDirectory: file.isDirectory,
                    isFile: file.isFile,
                    isHidden: file.isHidden || false,
                    permissions: file.permissions,
                    owner: file.owner,
                    group: file.group,
                    modified: file.modified,
                    created: file.created,
                    accessed: file.accessed
                }));
                
                // Cache directory listing
                this.directoryCache.set(`${sessionId}:${dirPath}`, {
                    path: dirPath,
                    files: files,
                    timestamp: Date.now()
                });
                
                this.emit('directory_listed', sessionId, dirPath, files);
                
                return {
                    path: dirPath,
                    files: files,
                    total: files.length,
                    totalSize: files.reduce((sum, f) => sum + (f.isFile ? f.size : 0), 0)
                };
            }
            
            throw new Error('Invalid response from device');
            
        } catch (error) {
            console.error(`Failed to list directory for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    detectFileType(filename) {
        const ext = path.extname(filename).toLowerCase().substring(1);
        
        for (const [type, extensions] of Object.entries(this.fileTypes)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }
        
        return 'unknown';
    }
    
    // ==================== FILE DOWNLOAD ====================
    
    async downloadFile(sessionId, remotePath, localPath = null) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const downloadId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const filename = path.basename(remotePath);
        const downloadPath = localPath || path.join(this.downloadsDir, `${downloadId}_${filename}`);
        
        const transfer = {
            id: downloadId,
            sessionId: sessionId,
            type: 'download',
            remotePath: remotePath,
            localPath: downloadPath,
            filename: filename,
            size: 0,
            transferred: 0,
            status: 'pending',
            startTime: timestamp,
            chunks: []
        };
        
        this.activeTransfers.set(downloadId, transfer);
        
        try {
            // Request file download
            const result = await this.sessionManager.executeCommand(sessionId, 'download_file', {
                path: remotePath,
                chunkSize: 1024 * 1024 // 1MB chunks
            }, 60000);
            
            if (result && result.fileData) {
                // Save file
                const fileBuffer = Buffer.from(result.fileData, 'base64');
                await fs.writeFile(downloadPath, fileBuffer);
                
                transfer.size = fileBuffer.length;
                transfer.transferred = fileBuffer.length;
                transfer.status = 'completed';
                transfer.endTime = Date.now();
                
                // Cache file info
                this.fileCache.set(downloadId, {
                    id: downloadId,
                    path: downloadPath,
                    name: filename,
                    size: transfer.size,
                    downloaded: transfer.endTime
                });
                
                this.emit('file_downloaded', sessionId, transfer);
                
                return {
                    id: downloadId,
                    path: downloadPath,
                    filename: filename,
                    size: transfer.size,
                    status: 'completed'
                };
            }
            
            throw new Error('No file data received');
            
        } catch (error) {
            console.error(`Failed to download file for session ${sessionId}:`, error);
            transfer.status = 'failed';
            transfer.error = error.message;
            this.emit('download_failed', sessionId, transfer);
            throw error;
            
        } finally {
            // Keep transfer in map for history, but mark as completed
            setTimeout(() => {
                this.activeTransfers.delete(downloadId);
            }, 60000);
        }
    }
    
    async downloadMultipleFiles(sessionId, remotePaths, options = {}) {
        const results = [];
        
        for (const remotePath of remotePaths) {
            try {
                const result = await this.downloadFile(sessionId, remotePath);
                results.push(result);
                
                if (options.delay) {
                    await this.sleep(options.delay);
                }
            } catch (error) {
                console.error(`Failed to download ${remotePath}:`, error);
                results.push({ path: remotePath, error: error.message });
            }
        }
        
        this.emit('multiple_files_downloaded', sessionId, results);
        
        return results;
    }
    
    // ==================== FILE UPLOAD ====================
    
    async uploadFile(sessionId, localPath, remotePath = null) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (!await fs.pathExists(localPath)) {
            throw new Error('Local file not found');
        }
        
        const uploadId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const filename = path.basename(localPath);
        const uploadPath = remotePath || path.join('/', filename);
        
        const transfer = {
            id: uploadId,
            sessionId: sessionId,
            type: 'upload',
            localPath: localPath,
            remotePath: uploadPath,
            filename: filename,
            size: 0,
            transferred: 0,
            status: 'pending',
            startTime: timestamp
        };
        
        this.activeTransfers.set(uploadId, transfer);
        
        try {
            // Read file
            const fileBuffer = await fs.readFile(localPath);
            const fileData = fileBuffer.toString('base64');
            
            transfer.size = fileBuffer.length;
            
            // Upload file
            const result = await this.sessionManager.executeCommand(sessionId, 'upload_file', {
                path: uploadPath,
                data: fileData,
                overwrite: true
            }, 60000);
            
            transfer.transferred = fileBuffer.length;
            transfer.status = 'completed';
            transfer.endTime = Date.now();
            
            this.emit('file_uploaded', sessionId, transfer);
            
            return {
                id: uploadId,
                remotePath: uploadPath,
                filename: filename,
                size: transfer.size,
                status: 'completed'
            };
            
        } catch (error) {
            console.error(`Failed to upload file for session ${sessionId}:`, error);
            transfer.status = 'failed';
            transfer.error = error.message;
            this.emit('upload_failed', sessionId, transfer);
            throw error;
            
        } finally {
            setTimeout(() => {
                this.activeTransfers.delete(uploadId);
            }, 60000);
        }
    }
    
    // ==================== FILE OPERATIONS ====================
    
    async deleteFile(sessionId, filePath) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'delete_file', {
                path: filePath
            }, 30000);
            
            this.emit('file_deleted', sessionId, filePath);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to delete file for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async deleteDirectory(sessionId, dirPath, recursive = true) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'delete_directory', {
                path: dirPath,
                recursive: recursive
            }, 30000);
            
            this.emit('directory_deleted', sessionId, dirPath);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to delete directory for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async createDirectory(sessionId, dirPath) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'create_directory', {
                path: dirPath
            }, 30000);
            
            this.emit('directory_created', sessionId, dirPath);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to create directory for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async renameFile(sessionId, oldPath, newPath) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'rename_file', {
                oldPath: oldPath,
                newPath: newPath
            }, 30000);
            
            this.emit('file_renamed', sessionId, oldPath, newPath);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to rename file for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async copyFile(sessionId, sourcePath, destPath) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'copy_file', {
                source: sourcePath,
                destination: destPath
            }, 30000);
            
            this.emit('file_copied', sessionId, sourcePath, destPath);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to copy file for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async moveFile(sessionId, sourcePath, destPath) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'move_file', {
                source: sourcePath,
                destination: destPath
            }, 30000);
            
            this.emit('file_moved', sessionId, sourcePath, destPath);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to move file for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== FILE SEARCH ====================
    
    async searchFiles(sessionId, query, searchPath = '/', options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'search_files', {
                query: query,
                path: searchPath,
                caseSensitive: options.caseSensitive || false,
                regex: options.regex || false,
                fileTypes: options.fileTypes || [],
                minSize: options.minSize,
                maxSize: options.maxSize,
                modifiedAfter: options.modifiedAfter,
                modifiedBefore: options.modifiedBefore
            }, 60000);
            
            if (result && result.files) {
                const files = result.files.map(file => ({
                    name: file.name,
                    path: file.path,
                    size: file.size,
                    type: this.detectFileType(file.name),
                    modified: file.modified,
                    score: file.score
                }));
                
                this.emit('search_completed', sessionId, query, files);
                
                return {
                    query: query,
                    results: files,
                    total: files.length,
                    searchTime: result.searchTime
                };
            }
            
            return { query: query, results: [], total: 0 };
            
        } catch (error) {
            console.error(`Failed to search files for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== FILE ARCHIVE ====================
    
    async createZip(sessionId, files, zipName = null) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const zipId = crypto.randomBytes(8).toString('hex');
        const zipPath = zipName || `${zipId}.zip`;
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'create_zip', {
                files: files,
                output: zipPath,
                compression: 9
            }, 60000);
            
            this.emit('zip_created', sessionId, zipPath, files.length);
            
            return {
                id: zipId,
                path: zipPath,
                fileCount: files.length,
                size: result.size
            };
            
        } catch (error) {
            console.error(`Failed to create zip for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async extractZip(sessionId, zipPath, destPath = null) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const extractPath = destPath || path.dirname(zipPath);
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'extract_zip', {
                zipPath: zipPath,
                destination: extractPath,
                overwrite: true
            }, 60000);
            
            this.emit('zip_extracted', sessionId, zipPath, extractPath);
            
            return {
                zipPath: zipPath,
                destination: extractPath,
                fileCount: result.fileCount
            };
            
        } catch (error) {
            console.error(`Failed to extract zip for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== FILE ENCRYPTION ====================
    
    async encryptFile(sessionId, filePath, key = null) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const encryptionKey = key || crypto.randomBytes(32).toString('hex');
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'encrypt_file', {
                path: filePath,
                key: encryptionKey,
                algorithm: 'aes-256-gcm'
            }, 60000);
            
            this.emit('file_encrypted', sessionId, filePath);
            
            return {
                path: result.encryptedPath,
                originalPath: filePath,
                key: encryptionKey
            };
            
        } catch (error) {
            console.error(`Failed to encrypt file for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async decryptFile(sessionId, filePath, key) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'decrypt_file', {
                path: filePath,
                key: key,
                algorithm: 'aes-256-gcm'
            }, 60000);
            
            this.emit('file_decrypted', sessionId, filePath);
            
            return {
                path: result.decryptedPath,
                originalPath: filePath
            };
            
        } catch (error) {
            console.error(`Failed to decrypt file for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== FILE INFO ====================
    
    async getFileInfo(sessionId, filePath) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_file_info', {
                path: filePath
            }, 30000);
            
            return {
                name: result.name,
                path: result.path,
                size: result.size,
                type: this.detectFileType(result.name),
                isDirectory: result.isDirectory,
                isFile: result.isFile,
                permissions: result.permissions,
                owner: result.owner,
                group: result.group,
                modified: result.modified,
                created: result.created,
                accessed: result.accessed,
                md5: result.md5,
                sha256: result.sha256
            };
            
        } catch (error) {
            console.error(`Failed to get file info for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async getStorageInfo(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'get_storage_info', {}, 30000);
            
            return {
                internal: {
                    total: result.internal.total,
                    free: result.internal.free,
                    used: result.internal.used,
                    totalGB: (result.internal.total / 1024 / 1024 / 1024).toFixed(2),
                    freeGB: (result.internal.free / 1024 / 1024 / 1024).toFixed(2),
                    usedGB: (result.internal.used / 1024 / 1024 / 1024).toFixed(2)
                },
                external: result.external ? {
                    total: result.external.total,
                    free: result.external.free,
                    used: result.external.used,
                    totalGB: (result.external.total / 1024 / 1024 / 1024).toFixed(2),
                    freeGB: (result.external.free / 1024 / 1024 / 1024).toFixed(2),
                    usedGB: (result.external.used / 1024 / 1024 / 1024).toFixed(2)
                } : null
            };
            
        } catch (error) {
            console.error(`Failed to get storage info for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    // ==================== BACKUP ====================
    
    async createBackup(sessionId, backupName = null) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const backupId = crypto.randomBytes(8).toString('hex');
        const backupPath = backupName || `backup_${sessionId}_${Date.now()}.zip`;
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'create_backup', {
                name: backupPath,
                include: ['/sdcard/DCIM', '/sdcard/Download', '/sdcard/Documents'],
                exclude: ['.thumbnails', '.trash']
            }, 120000);
            
            const backupRecord = {
                id: backupId,
                sessionId: sessionId,
                name: backupPath,
                size: result.size,
                fileCount: result.fileCount,
                created: Date.now(),
                path: result.path
            };
            
            // Save backup record
            const backupFile = path.join(this.backupsDir, `${backupId}.json`);
            await fs.writeJson(backupFile, backupRecord);
            
            this.emit('backup_created', sessionId, backupRecord);
            
            return backupRecord;
            
        } catch (error) {
            console.error(`Failed to create backup for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async restoreBackup(sessionId, backupId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const backupFile = path.join(this.backupsDir, `${backupId}.json`);
        if (!await fs.pathExists(backupFile)) {
            throw new Error('Backup not found');
        }
        
        const backup = await fs.readJson(backupFile);
        
        try {
            const result = await this.sessionManager.executeCommand(sessionId, 'restore_backup', {
                name: backup.name,
                restoreTo: '/sdcard/Restored'
            }, 120000);
            
            this.emit('backup_restored', sessionId, backup);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to restore backup for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async listBackups(sessionId) {
        const files = await fs.readdir(this.backupsDir);
        const backups = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const backup = await fs.readJson(path.join(this.backupsDir, file));
                backups.push(backup);
            }
        }
        
        return backups.sort((a, b) => b.created - a.created);
    }
    
    // ==================== TRANSFER MANAGEMENT ====================
    
    async getActiveTransfers(sessionId = null) {
        const transfers = Array.from(this.activeTransfers.values());
        
        if (sessionId) {
            return transfers.filter(t => t.sessionId === sessionId);
        }
        
        return transfers;
    }
    
    async cancelTransfer(transferId) {
        const transfer = this.activeTransfers.get(transferId);
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        
        if (transfer.status === 'completed' || transfer.status === 'failed') {
            throw new Error('Transfer already completed');
        }
        
        try {
            await this.sessionManager.executeCommand(transfer.sessionId, 'cancel_transfer', {
                transferId: transferId
            }, 10000);
            
            transfer.status = 'cancelled';
            this.emit('transfer_cancelled', transfer);
            
            return transfer;
            
        } catch (error) {
            console.error(`Failed to cancel transfer:`, error);
            throw error;
        }
    }
    
    // ==================== CLEANUP ====================
    
    startCleanupInterval() {
        setInterval(async () => {
            await this.cleanup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    async cleanup() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        // Clean old downloads
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
        
        await cleanDir(this.downloadsDir);
        await cleanDir(this.uploadsDir);
        await cleanDir(this.tempDir);
        
        // Clean old backups (keep last 10)
        const backups = await this.listBackups();
        if (backups.length > 10) {
            const oldBackups = backups.slice(10);
            for (const backup of oldBackups) {
                const backupFile = path.join(this.backupsDir, `${backup.id}.json`);
                await fs.remove(backupFile);
                if (backup.path && await fs.pathExists(backup.path)) {
                    await fs.remove(backup.path);
                }
            }
        }
        
        // Clear caches
        this.directoryCache.clear();
        
        this.emit('cleanup_completed');
    }
    
    // ==================== UTILITIES ====================
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onDirectoryListed(callback) {
        this.on('directory_listed', callback);
    }
    
    onFileDownloaded(callback) {
        this.on('file_downloaded', callback);
    }
    
    onDownloadFailed(callback) {
        this.on('download_failed', callback);
    }
    
    onFileUploaded(callback) {
        this.on('file_uploaded', callback);
    }
    
    onUploadFailed(callback) {
        this.on('upload_failed', callback);
    }
    
    onFileDeleted(callback) {
        this.on('file_deleted', callback);
    }
    
    onDirectoryDeleted(callback) {
        this.on('directory_deleted', callback);
    }
    
    onDirectoryCreated(callback) {
        this.on('directory_created', callback);
    }
    
    onFileRenamed(callback) {
        this.on('file_renamed', callback);
    }
    
    onFileCopied(callback) {
        this.on('file_copied', callback);
    }
    
    onFileMoved(callback) {
        this.on('file_moved', callback);
    }
    
    onSearchCompleted(callback) {
        this.on('search_completed', callback);
    }
    
    onZipCreated(callback) {
        this.on('zip_created', callback);
    }
    
    onZipExtracted(callback) {
        this.on('zip_extracted', callback);
    }
    
    onFileEncrypted(callback) {
        this.on('file_encrypted', callback);
    }
    
    onFileDecrypted(callback) {
        this.on('file_decrypted', callback);
    }
    
    onBackupCreated(callback) {
        this.on('backup_created', callback);
    }
    
    onBackupRestored(callback) {
        this.on('backup_restored', callback);
    }
    
    onTransferCancelled(callback) {
        this.on('transfer_cancelled', callback);
    }
    
    onCleanupCompleted(callback) {
        this.on('cleanup_completed', callback);
    }
}

module.exports = FileSystemModule;
