// Chunk System for Voxel World
class Chunk {
    constructor(chunkX, chunkZ, chunkSize = 16) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.chunkSize = chunkSize;
        this.voxels = new Uint8Array(chunkSize * chunkSize * chunkSize); // 16x16x16
        this.lightMap = new Uint8Array(chunkSize * chunkSize * chunkSize);
        this.mesh = null;
        this.dirty = true;
        this.loaded = false;
        
        // World position
        this.worldX = chunkX * chunkSize;
        this.worldZ = chunkZ * chunkSize;
        
        // LOD level (0 = full detail, 1 = half detail, etc.)
        this.lodLevel = 0;
        this.lodMeshes = [];
    }
    
    // Get voxel at local coordinates
    getLocal(x, y, z) {
        if (x < 0 || x >= this.chunkSize || 
            y < 0 || y >= this.chunkSize || 
            z < 0 || z >= this.chunkSize) {
            return null;
        }
        const index = this.getIndex(x, y, z);
        return this.voxels[index];
    }
    
    // Set voxel at local coordinates
    setLocal(x, y, z, type) {
        if (x < 0 || x >= this.chunkSize || 
            y < 0 || y >= this.chunkSize || 
            z < 0 || z >= this.chunkSize) {
            return false;
        }
        const index = this.getIndex(x, y, z);
        this.voxels[index] = type;
        this.dirty = true;
        return true;
    }
    
    // Get light level at local coordinates
    getLight(x, y, z) {
        if (x < 0 || x >= this.chunkSize || 
            y < 0 || y >= this.chunkSize || 
            z < 0 || z >= this.chunkSize) {
            return 15; // Default light
        }
        const index = this.getIndex(x, y, z);
        return this.lightMap[index];
    }
    
    // Set light level at local coordinates
    setLight(x, y, z, level) {
        if (x < 0 || x >= this.chunkSize || 
            y < 0 || y >= this.chunkSize || 
            z < 0 || z >= this.chunkSize) {
            return;
        }
        const index = this.getIndex(x, y, z);
        this.lightMap[index] = level;
    }
    
    // Convert 3D coordinates to 1D index
    getIndex(x, y, z) {
        return (y * this.chunkSize * this.chunkSize) + (z * this.chunkSize) + x;
    }
    
    // Convert 1D index to 3D coordinates
    getCoords(index) {
        const y = Math.floor(index / (this.chunkSize * this.chunkSize));
        const z = Math.floor((index % (this.chunkSize * this.chunkSize)) / this.chunkSize);
        const x = index % this.chunkSize;
        return { x, y, z };
    }
    
    // Check if chunk needs mesh rebuild
    needsUpdate() {
        return this.dirty && this.loaded;
    }
    
    // Build mesh for this chunk
    buildMesh(world) {
        if (!this.dirty) return;
        
        const vertices = [];
        const normals = [];
        const uvs = [];
        const colors = [];
        const indices = [];
        
        let vertexCount = 0;
        
        // Iterate through all voxels in chunk
        for (let y = 0; y < this.chunkSize; y++) {
            for (let z = 0; z < this.chunkSize; z++) {
                for (let x = 0; x < this.chunkSize; x++) {
                    const voxelType = this.getLocal(x, y, z);
                    
                    // Skip air blocks
                    if (voxelType === BlockType.AIR) continue;
                    
                    const blockProps = BlockProperties[voxelType];
                    if (!blockProps) continue;
                    
                    // Check each face
                    Object.values(Faces).forEach(face => {
                        const nx = x + face.dir[0];
                        const ny = y + face.dir[1];
                        const nz = z + face.dir[2];
                        
                        // Check neighbor
                        let neighborType;
                        if (nx >= 0 && nx < this.chunkSize && 
                            ny >= 0 && ny < this.chunkSize && 
                            nz >= 0 && nz < this.chunkSize) {
                            // Neighbor in same chunk
                            neighborType = this.getLocal(nx, ny, nz);
                        } else {
                            // Neighbor in adjacent chunk
                            const worldX = this.worldX + nx;
                            const worldZ = this.worldZ + nz;
                            neighborType = world.getVoxel(worldX, ny, worldZ);
                        }
                        
                        // Only draw face if neighbor is transparent
                        const neighborProps = BlockProperties[neighborType];
                        if (neighborProps && neighborProps.transparent) {
                            // Add face vertices
                            face.corners.forEach(corner => {
                                const vx = x + corner[0];
                                const vy = y + corner[1];
                                const vz = z + corner[2];
                                
                                vertices.push(vx, vy, vz);
                                normals.push(face.dir[0], face.dir[1], face.dir[2]);
                                
                                // UV coordinates (simplified)
                                const u = (corner[0] + corner[2]) * 0.5;
                                const v = corner[1];
                                uvs.push(u, v);
                                
                                // Color based on light level
                                const light = this.getLight(x, y, z) / 15;
                                colors.push(light, light, light);
                            });
                            
                            // Add face indices
                            indices.push(
                                vertexCount, vertexCount + 1, vertexCount + 2,
                                vertexCount, vertexCount + 2, vertexCount + 3
                            );
                            vertexCount += 4;
                        }
                    });
                }
            }
        }
        
        // Create Three.js geometry
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
        }
        
        if (vertices.length > 0) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geometry.setIndex(indices);
            
            // Create material with vertex colors
            const material = new THREE.MeshLambertMaterial({
                vertexColors: true,
                side: THREE.FrontSide
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(this.worldX, 0, this.worldZ);
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.mesh.userData.chunk = this;
        }
        
        this.dirty = false;
    }
    
    // Get mesh for rendering
    getMesh() {
        return this.mesh;
    }
    
    // Dispose chunk resources
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
        }
        this.voxels = null;
        this.lightMap = null;
        this.loaded = false;
    }
}

// Chunk Manager for handling multiple chunks
class ChunkManager {
    constructor(world, chunkSize = 16) {
        this.world = world;
        this.chunkSize = chunkSize;
        this.chunks = new Map(); // key: "x,z", value: Chunk
        this.meshQueue = [];
        this.maxMeshesPerFrame = 2;
    }
    
    // Get chunk key
    getChunkKey(x, z) {
        return `${x},${z}`;
    }
    
    // Get chunk by coordinates
    getChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        return this.chunks.get(key);
    }
    
    // Load or create chunk
    loadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        let chunk = this.chunks.get(key);
        
        if (!chunk) {
            chunk = new Chunk(chunkX, chunkZ, this.chunkSize);
            this.chunks.set(key, chunk);
            
            // Generate chunk terrain
            this.world.generateChunk(chunk);
            
            // Add to mesh queue
            this.meshQueue.push(chunk);
        }
        
        return chunk;
    }
    
    // Unload chunk
    unloadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        const chunk = this.chunks.get(key);
        
        if (chunk) {
            chunk.dispose();
            this.chunks.delete(key);
            return true;
        }
        return false;
    }
    
    // Update chunks around player position
    update(playerX, playerZ, renderDistance) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);
        
        // Load nearby chunks
        for (let z = -renderDistance; z <= renderDistance; z++) {
            for (let x = -renderDistance; x <= renderDistance; x++) {
                const chunkX = playerChunkX + x;
                const chunkZ = playerChunkZ + z;
                const distance = Math.sqrt(x * x + z * z);
                
                if (distance <= renderDistance) {
                    this.loadChunk(chunkX, chunkZ);
                }
            }
        }
        
        // Unload distant chunks
        const chunksToRemove = [];
        for (const [key, chunk] of this.chunks) {
            const dx = chunk.chunkX - playerChunkX;
            const dz = chunk.chunkZ - playerChunkZ;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > renderDistance + 2) {
                chunksToRemove.push(key);
            }
        }
        
        chunksToRemove.forEach(key => {
            const [x, z] = key.split(',').map(Number);
            this.unloadChunk(x, z);
        });
        
        // Process mesh queue
        let processed = 0;
        while (this.meshQueue.length > 0 && processed < this.maxMeshesPerFrame) {
            const chunk = this.meshQueue.shift();
            if (chunk.needsUpdate()) {
                chunk.buildMesh(this.world);
                if (chunk.mesh) {
                    this.world.engine.addMesh(chunk.mesh);
                }
                processed++;
            }
        }
    }
    
    // Get all loaded chunks
    getLoadedChunks() {
        return Array.from(this.chunks.values());
    }
}

// Export for use in other files
window.Chunk = Chunk;
window.ChunkManager = ChunkManager;