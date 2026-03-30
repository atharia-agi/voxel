// Improved World Streaming and Memory Management System
class WorldStreamer {
    constructor(world) {
        this.world = world;
        this.chunkManager = world.chunkManager;
        
        // Streaming settings
        this.settings = {
            maxMemoryChunks: 1000,      // Maximum chunks in memory
            memoryBudgetMB: 100,        // Memory budget for chunks
            priorityQueueSize: 50,      // Max chunks in priority queue
            loadDistance: 12,           // Chunks to load around player
            unloadDistance: 15,         // Distance to unload chunks
            preloadDistance: 8,         // Preload distance for smooth streaming
            maxLoadPerFrame: 4,         // Max chunks to load per frame
            maxUnloadPerFrame: 8,       // Max chunks to unload per frame
            enablePredictiveStreaming: true,
            enableMemoryBudgeting: true
        };
        
        // Streaming queues
        this.loadQueue = [];           // Chunks to load (priority sorted)
        this.unloadQueue = [];         // Chunks to unload
        this.priorityChunks = new Set(); // High priority chunks
        
        // Memory tracking
        this.memoryUsage = {
            chunks: 0,
            voxels: 0,
            lightmaps: 0,
            meshes: 0,
            total: 0,
            budget: this.settings.memoryBudgetMB * 1024 * 1024 // Convert to bytes
        };
        
        // Player tracking for predictive streaming
        this.playerHistory = {
            positions: [],
            velocities: [],
            maxHistory: 10
        };
        
        // Stats
        this.stats = {
            chunksLoaded: 0,
            chunksUnloaded: 0,
            queueSize: 0,
            memoryUsage: 0,
            loadTime: 0,
            unloadTime: 0
        };
    }
    
    update(playerPosition, playerVelocity, delta) {
        const startTime = performance.now();
        
        // Update player history for prediction
        this.updatePlayerHistory(playerPosition, playerVelocity);
        
        // Clear queues
        this.loadQueue = [];
        this.unloadQueue = [];
        
        // Determine chunks to load/unload
        this.calculateStreaming(playerPosition, playerVelocity);
        
        // Apply memory budgeting
        if (this.settings.enableMemoryBudgeting) {
            this.applyMemoryBudget();
        }
        
        // Process load queue
        this.processLoadQueue();
        
        // Process unload queue
        this.processUnloadQueue();
        
        this.stats.queueSize = this.loadQueue.length;
        this.stats.memoryUsage = this.memoryUsage.total;
        this.stats.loadTime = performance.now() - startTime;
    }
    
    updatePlayerHistory(position, velocity) {
        this.playerHistory.positions.push(position.clone());
        this.playerHistory.velocities.push(velocity.clone());
        
        if (this.playerHistory.positions.length > this.playerHistory.maxHistory) {
            this.playerHistory.positions.shift();
            this.playerHistory.velocities.shift();
        }
    }
    
    predictPlayerPosition(framesAhead = 5) {
        if (this.playerHistory.positions.length < 2) {
            return this.playerHistory.positions[this.playerHistory.positions.length - 1];
        }
        
        // Simple linear prediction
        const recentVel = this.playerHistory.velocities.slice(-3).reduce((sum, v) => 
            sum.add(v), new THREE.Vector3()).divideScalar(3);
        
        const currentPos = this.playerHistory.positions[this.playerHistory.positions.length - 1];
        return currentPos.clone().add(recentVel.clone().multiplyScalar(framesAhead * 0.1));
    }
    
    calculateStreaming(playerPosition, playerVelocity) {
        const playerChunkX = Math.floor(playerPosition.x / 16);
        const playerChunkZ = Math.floor(playerPosition.z / 16);
        
        // If predictive streaming is enabled, use predicted position
        let checkPos = playerPosition;
        if (this.settings.enablePredictiveStreaming) {
            const predictedPos = this.predictPlayerPosition(10); // 1 second ahead
            // Blend current and predicted position
            checkPos = predictedPos.clone().multiplyScalar(0.7)
                .add(playerPosition.clone().multiplyScalar(0.3));
        }
        
        const checkChunkX = Math.floor(checkPos.x / 16);
        const checkChunkZ = Math.floor(checkPos.z / 16);
        
        // Mark chunks around player for loading
        const loadRadius = this.settings.loadDistance;
        const unloadRadius = this.settings.unloadDistance;
        const preloadRadius = this.settings.preloadDistance;
        
        // First, mark all currently loaded chunks for potential unload
        this.chunkManager.chunks.forEach((chunk, key) => {
            const dx = chunk.chunkX - checkChunkX;
            const dz = chunk.chunkZ - checkChunkZ;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > unloadRadius) {
                this.unloadQueue.push({ chunk, priority: -distance }); // Negative priority = lower priority
            } else if (distance <= loadRadius) {
                // Already in load radius, check if needs loading
                if (!chunk.loaded) {
                    const priority = this.calculateLoadPriority(chunk, checkPos);
                    this.loadQueue.push({ chunk, priority });
                }
            }
        });
        
        // Then, mark chunks in load radius for loading
        for (let z = -loadRadius; z <= loadRadius; z++) {
            for (let x = -loadRadius; x <= loadRadius; x++) {
                const chunkX = checkChunkX + x;
                const chunkZ = checkChunkZ + z;
                const distance = Math.sqrt(x * x + z * z);
                
                // Skip if already queued for unload
                if (this.unloadQueue.some(item => 
                    item.chunk.chunkX === chunkX && item.chunk.chunkZ === chunkZ)) {
                    continue;
                }
                
                const chunk = this.chunkManager.getChunk(chunkX, chunkZ);
                if (!chunk) {
                    // Need to create and load chunk
                    const priority = this.calculateLoadPriority(null, checkPos, chunkX, chunkZ);
                    this.loadQueue.push({ chunk: null, chunkX, chunkZ, priority });
                } else if (!chunk.loaded) {
                    // Chunk exists but not loaded
                    const priority = this.calculateLoadPriority(chunk, checkPos);
                    this.loadQueue.push({ chunk, priority });
                }
            }
        }
        
        // Sort queues by priority (higher priority first)
        this.loadQueue.sort((a, b) => b.priority - a.priority);
        this.unloadQueue.sort((a, b) => a.priority - b.priority); // More negative = lower priority
    }
    
    calculateLoadPriority(chunk, playerPos, chunkX, chunkZ) {
        let priority = 0;
        
        // Distance-based priority (closer = higher priority)
        if (chunk) {
            const distance = playerPos.distanceTo(
                new THREE.Vector3(chunk.worldX + 8, 0, chunk.worldZ + 8)
            );
            priority = Math.max(0, 100 - distance);
        } else if (chunkX !== undefined && chunkZ !== undefined) {
            const worldX = chunkX * 16 + 8;
            const worldZ = chunkZ * 16 + 8;
            const distance = playerPos.distanceTo(
                new THREE.Vector3(worldX, 0, worldZ)
            );
            priority = Math.max(0, 100 - distance);
        }
        
        // Height-based priority (ground level = higher priority)
        const groundY = this.world.getTerrainHeight(
            chunk ? chunk.worldX + 8 : chunkX * 16 + 8,
            chunk ? chunk.worldZ + 8 : chunkZ * 16 + 8
        );
        
        const heightPriority = Math.max(0, 50 - Math.abs(playerPos.y - groundY) * 2);
        priority += heightPriority;
        
        // Biome-based priority (interesting biomes = higher priority)
        // This would be expanded based on biome types
        
        // Player velocity factor (prioritize direction of movement)
        if (this.playerHistory.velocities.length > 0) {
            const avgVel = this.playerHistory.velocities.slice(-3).reduce((sum, v) => 
                sum.add(v), new THREE.Vector3()).divideScalar(Math.min(3, this.playerHistory.velocities.length));
            
            if (chunk) {
                const toChunk = new THREE.Vector3(
                    chunk.worldX + 8 - playerPos.x,
                    0,
                    chunk.worldZ + 8 - playerPos.z
                );
                if (toChunk.length() > 0) {
                    toChunk.normalize();
                    const velDir = avgVel.clone().normalize();
                    const dot = toChunk.dot(velDir);
                    priority += Math.max(0, dot * 30); // Boost for chunks in movement direction
                }
            }
        }
        
        return priority;
    }
    
    applyMemoryBudget() {
        // Estimate memory usage
        this.estimateMemoryUsage();
        
        // If over budget, start unloading lowest priority chunks
        if (this.memoryUsage.total > this.memoryUsage.budget) {
            const overBudget = this.memoryUsage.total - this.memoryUsage.budget;
            const chunksToUnload = Math.ceil(overBudget / this.estimateChunkMemory());
            
            // Add lowest priority loaded chunks to unload queue
            const loadedChunks = Array.from(this.chunkManager.chunks.values())
                .filter(chunk => chunk.loaded)
                .sort((a, b) => {
                    // Sort by priority (lower priority first for unloading)
                    const priorityA = this.calculateLoadPriority(a, this.playerHistory.positions[this.playerHistory.positions.length - 1]);
                    const priorityB = this.calculateLoadPriority(b, this.playerHistory.positions[this.playerHistory.positions.length - 1]);
                    return priorityA - priorityB;
                });
            
            for (let i = 0; i < Math.min(chunksToUnload, loadedChunks.length); i++) {
                const chunk = loadedChunks[i];
                // Check if not already in unload queue
                if (!this.unloadQueue.some(item => item.chunk === chunk)) {
                    this.unloadQueue.push({ chunk, priority: -1000 }); // Highest priority for unloading
                }
            }
        }
    }
    
    estimateMemoryUsage() {
        let totalBytes = 0;
        let chunkCount = 0;
        let voxelCount = 0;
        let lightmapCount = 0;
        let meshCount = 0;
        
        this.chunkManager.chunks.forEach(chunk => {
            if (chunk.loaded) {
                chunkCount++;
                
                // Voxel data: 1 byte per voxel
                voxelCount += chunk.voxels.length;
                
                // Lightmap: 1 byte per voxel
                lightmapCount += chunk.lightMap.length;
                
                // Mesh data (estimate)
                if (chunk.mesh && chunk.mesh.geometry) {
                    meshCount++;
                    const geom = chunk.mesh.geometry;
                    if (geom.attributes.position) {
                        // Rough estimate: 3 floats per vertex + 3 floats per normal + 2 floats per uv
                        const vertexCount = geom.attributes.position.count;
                        totalBytes += vertexCount * (3 + 3 + 2) * 4; // 4 bytes per float
                    }
                }
            }
        });
        
        // Base chunk overhead
        totalBytes += chunkCount * 200; // ~200 bytes per chunk object
        
        // Voxel and lightmap data
        totalBytes += (voxelCount + lightmapCount) * 1; // 1 byte each
        
        this.memoryUsage = {
            chunks: chunkCount * 200,
            voxels: voxelCount,
            lightmaps: lightmapCount,
            meshes: Math.max(0, totalBytes - (chunkCount * 200 + voxelCount + lightmapCount)),
            total: totalBytes,
            budget: this.settings.memoryBudgetMB * 1024 * 1024
        };
    }
    
    estimateChunkMemory() {
        // Estimate average memory per chunk in bytes
        // Voxels: 16^3 = 4096 bytes
        // Lightmap: 4096 bytes
        // Mesh: ~5000 bytes (estimate)
        // Overhead: 200 bytes
        return 4096 + 4096 + 5000 + 200;
    }
    
    processLoadQueue() {
        const startTime = performance.now();
        let loaded = 0;
        
        while (this.loadQueue.length > 0 && loaded < this.settings.maxLoadPerFrame) {
            const item = this.loadQueue.shift();
            let chunk = item.chunk;
            let needsCreation = false;
            
            if (!chunk) {
                // Need to create chunk
                chunk = this.world.chunkManager.loadChunk(item.chunkX, item.chunkZ);
                needsCreation = true;
            }
            
            if (chunk && !chunk.loaded) {
                // Generate chunk terrain
                this.world.generateChunk(chunk);
                chunk.loaded = true;
                
                // Build mesh
                if (chunk.needsUpdate()) {
                    chunk.buildMesh(this.world);
                    if (chunk.mesh) {
                        this.world.engine.addMesh(chunk.mesh);
                    }
                }
                
                loaded++;
                this.stats.chunksLoaded++;
            }
        }
        
        this.stats.loadTime = performance.now() - startTime;
    }
    
    processUnloadQueue() {
        const startTime = performance.now();
        let unloaded = 0;
        
        while (this.unloadQueue.length > 0 && unloaded < this.settings.maxUnloadPerFrame) {
            const item = this.unloadQueue.shift();
            const chunk = item.chunk;
            
            if (chunk && chunk.loaded) {
                // Remove mesh from scene
                if (chunk.mesh && chunk.mesh.parent) {
                    this.world.engine.removeMesh(chunk.mesh);
                }
                
                // Dispose chunk resources
                chunk.dispose();
                chunk.loaded = false;
                
                unloaded++;
                this.stats.chunksUnloaded++;
            }
        }
        
        this.stats.unloadTime = performance.now() - startTime;
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    getMemoryUsage() {
        return { ...this.memoryUsage };
    }
    
    forceUnloadDistantChunks(playerPosition, distance) {
        const unloaded = [];
        this.chunkManager.chunks.forEach((chunk, key) => {
            const chunkPos = new THREE.Vector3(chunk.worldX + 8, 0, chunk.worldZ + 8);
            if (chunkPos.distanceTo(playerPosition) > distance && chunk.loaded) {
                // Remove mesh from scene
                if (chunk.mesh && chunk.mesh.parent) {
                    this.world.engine.removeMesh(chunk.mesh);
                }
                
                // Dispose chunk
                chunk.dispose();
                chunk.loaded = false;
                unloaded.push(chunk);
                this.stats.chunksUnloaded++;
            }
        });
        return unloaded;
    }
    
    getChunksInRadius(position, radius) {
        const chunks = [];
        const chunkRadius = Math.ceil(radius / 16);
        const playerChunkX = Math.floor(position.x / 16);
        const playerChunkZ = Math.floor(position.z / 16);
        
        for (let z = -chunkRadius; z <= chunkRadius; z++) {
            for (let x = -chunkRadius; x <= chunkRadius; x++) {
                const chunkX = playerChunkX + x;
                const chunkZ = playerChunkZ + z;
                const chunk = this.chunkManager.getChunk(chunkX, chunkZ);
                if (chunk && chunk.loaded) {
                    chunks.push(chunk);
                }
            }
        }
        
        return chunks;
    }
}

// Export for use in other files
window.WorldStreamer = WorldStreamer;