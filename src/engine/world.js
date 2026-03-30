// World System for Voxel Engine
class World {
    constructor(engine) {
        this.engine = engine;
        this.chunkManager = new ChunkManager(this, engine.settings.chunkSize);
        this.seed = Math.random() * 10000;
        this.noise = new PerlinNoise(this.seed);
        this.lighting = new LightingSystem(this);
        
        // World settings
        this.settings = {
            seaLevel: 32,
            maxHeight: 64,
            caveFrequency: 0.05,
            oreFrequency: 0.02,
            treeChance: 0.01
        };
        
        // Block palette
        this.palette = new Map();
        this.initPalette();
    }
    
    initPalette() {
        // Create texture atlas
        const textureManager = new TextureManager();
        this.textureAtlas = textureManager.createAtlas();
    }
    
    // Generate terrain for a chunk
    generateChunk(chunk) {
        const chunkSize = chunk.chunkSize;
        
        for (let y = 0; y < chunkSize; y++) {
            for (let z = 0; z < chunkSize; z++) {
                for (let x = 0; x < chunkSize; x++) {
                    const worldX = chunk.worldX + x;
                    const worldZ = chunk.worldZ + z;
                    
                    // Generate terrain height using noise
                    const height = this.getTerrainHeight(worldX, worldZ);
                    
                    // Generate biome
                    const biome = this.getBiome(worldX, worldZ);
                    
                    // Fill voxels
                    if (y === 0) {
                        // Bedrock
                        chunk.setLocal(x, y, z, BlockType.BEDROCK);
                    } else if (y < height - 5) {
                        // Stone with ores
                        const oreType = this.getOreType(worldX, y, worldZ);
                        chunk.setLocal(x, y, z, oreType);
                    } else if (y < height) {
                        // Surface layers
                        if (biome === 'desert') {
                            chunk.setLocal(x, y, z, BlockType.SAND);
                        } else if (biome === 'snow') {
                            chunk.setLocal(x, y, z, y === height - 1 ? BlockType.SNOW : BlockType.DIRT);
                        } else {
                            chunk.setLocal(x, y, z, y === height - 1 ? BlockType.GRASS : BlockType.DIRT);
                        }
                    } else if (y < this.settings.seaLevel) {
                        // Water
                        chunk.setLocal(x, y, z, BlockType.WATER);
                    } else {
                        // Air
                        chunk.setLocal(x, y, z, BlockType.AIR);
                    }
                    
                    // Generate caves
                    if (this.isCave(worldX, y, worldZ)) {
                        chunk.setLocal(x, y, z, BlockType.AIR);
                    }
                    
                    // Generate trees
                    if (y === height - 1 && biome !== 'desert' && biome !== 'snow') {
                        if (Math.random() < this.settings.treeChance) {
                            this.generateTree(chunk, x, y, z);
                        }
                    }
                    
                    // Initialize lighting
                    const sunlight = y >= height ? 15 : 0;
                    chunk.setLight(x, y, z, sunlight);
                }
            }
        }
        
        // Calculate lighting
        this.lighting.calculateChunk(chunk);
        chunk.loaded = true;
    }
    
    // Get terrain height at world coordinates
    getTerrainHeight(x, z) {
        const scale = 0.01;
        const octaves = 6;
        const persistence = 0.5;
        const lacunarity = 2.0;
        
        let amplitude = 1;
        let frequency = scale;
        let noiseHeight = 0;
        let maxAmplitude = 0;
        
        for (let i = 0; i < octaves; i++) {
            const sampleX = x * frequency;
            const sampleZ = z * frequency;
            
            const noiseValue = this.noise.perlin2D(sampleX, sampleZ);
            noiseHeight += noiseValue * amplitude;
            
            maxAmplitude += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        // Normalize and scale
        noiseHeight = (noiseHeight / maxAmplitude + 1) / 2;
        return Math.floor(noiseHeight * this.settings.maxHeight);
    }
    
    // Get biome at world coordinates
    getBiome(x, z) {
        const temperature = this.noise.perlin2D(x * 0.005, z * 0.005);
        const humidity = this.noise.perlin2D(x * 0.003 + 1000, z * 0.003 + 1000);
        
        if (temperature > 0.5 && humidity < 0.3) return 'desert';
        if (temperature < -0.3) return 'snow';
        if (humidity > 0.6) return 'forest';
        return 'plains';
    }
    
    // Get ore type at coordinates
    getOreType(x, y, z) {
        const oreNoise = this.noise.perlin3D(x * this.settings.oreFrequency, y * this.settings.oreFrequency, z * this.settings.oreFrequency);
        
        if (oreNoise > 0.8 && y < 16) return BlockType.DIAMOND_ORE;
        if (oreNoise > 0.7 && y < 32) return BlockType.GOLD_ORE;
        if (oreNoise > 0.6 && y < 48) return BlockType.IRON_ORE;
        if (oreNoise > 0.5 && y < 64) return BlockType.COAL_ORE;
        
        return BlockType.STONE;
    }
    
    // Check if position is inside a cave
    isCave(x, y, z) {
        const caveNoise = this.noise.perlin3D(
            x * this.settings.caveFrequency,
            y * this.settings.caveFrequency * 2,
            z * this.settings.caveFrequency
        );
        
        return caveNoise > 0.7 && y > 5 && y < this.settings.seaLevel - 5;
    }
    
    // Generate tree at chunk position
    generateTree(chunk, x, y, z) {
        const height = 4 + Math.floor(Math.random() * 3);
        
        // Trunk
        for (let i = 0; i < height; i++) {
            if (y + i < chunk.chunkSize) {
                chunk.setLocal(x, y + i, z, BlockType.WOOD);
            }
        }
        
        // Leaves
        const leafStart = y + height - 2;
        for (let ly = leafStart; ly < y + height + 2; ly++) {
            const radius = ly < y + height ? 2 : 1;
            for (let lx = -radius; lx <= radius; lx++) {
                for (let lz = -radius; lz <= radius; lz++) {
                    if (lx === 0 && lz === 0 && ly < y + height) continue;
                    
                    const nx = x + lx;
                    const nz = z + lz;
                    const ny = ly;
                    
                    if (nx >= 0 && nx < chunk.chunkSize && 
                        ny >= 0 && ny < chunk.chunkSize && 
                        nz >= 0 && nz < chunk.chunkSize) {
                        
                        if (Math.random() > 0.3) {
                            chunk.setLocal(nx, ny, nz, BlockType.LEAVES);
                        }
                    }
                }
            }
        }
    }
    
    // Get voxel at world coordinates
    getVoxel(x, y, z) {
        const chunkX = Math.floor(x / this.chunkManager.chunkSize);
        const chunkZ = Math.floor(z / this.chunkManager.chunkSize);
        const chunk = this.chunkManager.getChunk(chunkX, chunkZ);
        
        if (!chunk) return BlockType.AIR;
        
        const localX = ((x % this.chunkManager.chunkSize) + this.chunkManager.chunkSize) % this.chunkManager.chunkSize;
        const localZ = ((z % this.chunkManager.chunkSize) + this.chunkManager.chunkSize) % this.chunkManager.chunkSize;
        
        return chunk.getLocal(localX, y, localZ);
    }
    
    // Set voxel at world coordinates
    setVoxel(x, y, z, type) {
        const chunkX = Math.floor(x / this.chunkManager.chunkSize);
        const chunkZ = Math.floor(z / this.chunkManager.chunkSize);
        const chunk = this.chunkManager.getChunk(chunkX, chunkZ);
        
        if (!chunk) return false;
        
        const localX = ((x % this.chunkManager.chunkSize) + this.chunkManager.chunkSize) % this.chunkManager.chunkSize;
        const localZ = ((z % this.chunkManager.chunkSize) + this.chunkManager.chunkSize) % this.chunkManager.chunkSize;
        
        const result = chunk.setLocal(localX, y, localZ, type);
        
        if (result) {
            // Update lighting
            this.lighting.updateBlock(x, y, z);
            
            // Mark neighboring chunks as dirty if on border
            if (localX === 0) this.markChunkDirty(chunkX - 1, chunkZ);
            if (localX === this.chunkManager.chunkSize - 1) this.markChunkDirty(chunkX + 1, chunkZ);
            if (localZ === 0) this.markChunkDirty(chunkX, chunkZ - 1);
            if (localZ === this.chunkManager.chunkSize - 1) this.markChunkDirty(chunkX, chunkZ + 1);
        }
        
        return result;
    }
    
    // Mark chunk as needing rebuild
    markChunkDirty(chunkX, chunkZ) {
        const chunk = this.chunkManager.getChunk(chunkX, chunkZ);
        if (chunk) {
            chunk.dirty = true;
            this.chunkManager.meshQueue.push(chunk);
        }
    }
    
    // Update world around player
    update(playerPosition, delta) {
        this.chunkManager.update(
            playerPosition.x,
            playerPosition.z,
            this.engine.settings.renderDistance
        );
    }
    
    // Toggle lighting system
    toggleLighting() {
        this.engine.settings.enableLighting = !this.engine.settings.enableLighting;
        this.rebuildAllChunks();
    }
    
    // Toggle shadows
    toggleShadows() {
        this.engine.settings.enableShadows = !this.engine.settings.enableShadows;
        this.engine.renderer.shadowMap.enabled = this.engine.settings.enableShadows;
    }
    
    // Toggle wireframe mode
    toggleWireframe() {
        const chunks = this.chunkManager.getLoadedChunks();
        chunks.forEach(chunk => {
            if (chunk.mesh) {
                chunk.mesh.material.wireframe = !chunk.mesh.material.wireframe;
            }
        });
    }
    
    // Regenerate world with new seed
    regenerate() {
        this.seed = Math.random() * 10000;
        this.noise = new PerlinNoise(this.seed);
        
        // Clear existing chunks
        const chunks = this.chunkManager.getLoadedChunks();
        chunks.forEach(chunk => {
            if (chunk.mesh) {
                this.engine.removeMesh(chunk.mesh);
            }
            chunk.dispose();
        });
        
        this.chunkManager.chunks.clear();
        this.chunkManager.meshQueue = [];
    }
    
    // Rebuild all chunk meshes
    rebuildAllChunks() {
        const chunks = this.chunkManager.getLoadedChunks();
        chunks.forEach(chunk => {
            chunk.dirty = true;
            this.chunkManager.meshQueue.push(chunk);
        });
    }
}

// Lighting System
class LightingSystem {
    constructor(world) {
        this.world = world;
    }
    
    calculateChunk(chunk) {
        // Simple flood fill lighting
        const chunkSize = chunk.chunkSize;
        
        for (let y = chunkSize - 1; y >= 0; y--) {
            for (let z = 0; z < chunkSize; z++) {
                for (let x = 0; x < chunkSize; x++) {
                    const voxel = chunk.getLocal(x, y, z);
                    
                    if (voxel === BlockType.AIR || BlockProperties[voxel]?.transparent) {
                        // Sunlight from above
                        if (y === chunkSize - 1) {
                            chunk.setLight(x, y, z, 15);
                        } else {
                            const aboveLight = chunk.getLight(x, y + 1, z);
                            chunk.setLight(x, y, z, Math.max(0, aboveLight - 1));
                        }
                    } else {
                        // Block blocks light
                        chunk.setLight(x, y, z, 0);
                    }
                }
            }
        }
        
        // Block light sources
        for (let y = 0; y < chunkSize; y++) {
            for (let z = 0; z < chunkSize; z++) {
                for (let x = 0; x < chunkSize; x++) {
                    const voxel = chunk.getLocal(x, y, z);
                    const props = BlockProperties[voxel];
                    
                    if (props && props.lightLevel > 0) {
                        this.spreadLight(chunk, x, y, z, props.lightLevel);
                    }
                }
            }
        }
    }
    
    spreadLight(chunk, x, y, z, level) {
        if (level <= 0) return;
        
        const stack = [[x, y, z, level]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [cx, cy, cz, currentLevel] = stack.pop();
            const key = `${cx},${cy},${cz}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (cx < 0 || cx >= chunk.chunkSize || 
                cy < 0 || cy >= chunk.chunkSize || 
                cz < 0 || cz >= chunk.chunkSize) {
                continue;
            }
            
            const existingLight = chunk.getLight(cx, cy, cz);
            if (currentLevel <= existingLight) continue;
            
            chunk.setLight(cx, cy, cz, currentLevel);
            
            const voxel = chunk.getLocal(cx, cy, cz);
            if (voxel !== BlockType.AIR && BlockProperties[voxel] && !BlockProperties[voxel].transparent) {
                continue;
            }
            
            // Spread to neighbors
            const neighbors = [
                [cx + 1, cy, cz], [cx - 1, cy, cz],
                [cx, cy + 1, cz], [cx, cy - 1, cz],
                [cx, cy, cz + 1], [cx, cy, cz - 1]
            ];
            
            neighbors.forEach(([nx, ny, nz]) => {
                stack.push([nx, ny, nz, currentLevel - 1]);
            });
        }
    }
    
    updateBlock(x, y, z) {
        // Mark chunk as dirty for lighting recalculation
        const chunkX = Math.floor(x / this.world.chunkManager.chunkSize);
        const chunkZ = Math.floor(z / this.world.chunkManager.chunkSize);
        this.world.markChunkDirty(chunkX, chunkZ);
    }
}

// Export for use in other files
window.World = World;
window.LightingSystem = LightingSystem;