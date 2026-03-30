// Advanced Lighting System with PBR-style Shading and Voxel AO
class AdvancedLighting {
    constructor(engine, world) {
        this.engine = engine;
        this.world = world;
        
        // Light sources
        this.sunLight = null;
        this.ambientLight = null;
        this.hemisphereLight = null;
        
        // Light colors and intensities
        this.sunColor = new THREE.Color(0xffffff);
        this.ambientColor = new THREE.Color(0x4a6fa5);
        
        // Time of day (0-1, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
        this.timeOfDay = 0.5;
        this.dayNightSpeed = 0.01;
        
        // PBR-like settings
        this.settings = {
            enablePBR: true,
            enableVoxelAO: true,
            enableSoftShadows: true,
            enableLightScattering: false,
            enableSubsurfaceScattering: false,
            sunIntensity: 1.5,
            ambientIntensity: 0.4,
            aoStrength: 0.7,
            shadowSoftness: 2.0,
            bounceLightIntensity: 0.2,
            colorTemperature: 6500 // Kelvin, 6500 = daylight
        };
        
        // Light caching
        this.lightMap = new Map();
        
        // Setup lights
        this.setupLights();
        
        // Voxel AO cache
        this.voxelAOCache = new Map();
    }
    
    setupLights() {
        // Main directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, this.settings.sunIntensity);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        
        // Shadow map configuration
        this.sunLight.shadow.mapSize.width = this.settings.enableSoftShadows ? 2048 : 1024;
        this.sunLight.shadow.mapSize.height = this.settings.enableSoftShadows ? 2048 : 1024;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        
        // Soft shadow settings
        this.sunLight.shadow.radius = this.settings.shadowSoftness;
        this.sunLight.shadow.bias = -0.001;
        
        this.engine.scene.add(this.sunLight);
        
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, this.settings.ambientIntensity);
        this.engine.scene.add(this.ambientLight);
        
        // Hemisphere light for sky/ground color blending
        this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
        this.engine.scene.add(this.hemisphereLight);
    }
    
    update(delta) {
        // Update time of day
        if (this.world.engine.settings.dayNightCycle) {
            this.timeOfDay += this.dayNightSpeed * delta;
            if (this.timeOfDay > 1) this.timeOfDay = 0;
        }
        
        // Update sun position based on time
        this.updateSunPosition();
        
        // Update light colors based on time
        this.updateLightColors();
        
        // Update shadow settings
        this.updateShadows();
    }
    
    updateSunPosition() {
        const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
        const height = Math.sin(this.timeOfDay * Math.PI);
        
        const x = Math.cos(angle) * 100;
        const y = height * 100;
        const z = Math.sin(angle) * 50;
        
        this.sunLight.position.set(x, y, z);
        
        // Always look at center
        this.sunLight.target.position.set(0, 0, 0);
        this.sunLight.target.updateMatrixWorld();
        
        // Set intensity based on height (0 at night, full at noon)
        this.sunLight.intensity = Math.max(0, height) * this.settings.sunIntensity;
    }
    
    updateLightColors() {
        // Sun color based on time
        let sunR, sunG, sunB;
        
        if (this.timeOfDay < 0.25) {
            // Night to sunrise
            const t = this.timeOfDay / 0.25;
            sunR = 100 + t * 155;
            sunG = 100 + t * 100;
            sunB = 150 + t * 105;
        } else if (this.timeOfDay < 0.5) {
            // Sunrise to noon
            const t = (this.timeOfDay - 0.25) / 0.25;
            sunR = 255 - t * 10;
            sunG = 200 + t * 55;
            sunB = 255 - t * 50;
        } else if (this.timeOfDay < 0.75) {
            // Noon to sunset
            const t = (this.timeOfDay - 0.5) / 0.25;
            sunR = 245;
            sunG = 255 - t * 155;
            sunB = 205 - t * 55;
        } else {
            // Sunset to night
            const t = (this.timeOfDay - 0.75) / 0.25;
            sunR = 245 - t * 145;
            sunG = 100 - t * 0;
            sunB = 150 - t * 50;
        }
        
        this.sunColor.setRGB(sunR / 255, sunG / 255, sunB / 255);
        this.sunLight.color.copy(this.sunColor);
        
        // Ambient light follows sun
        const ambientIntensity = 0.2 + Math.max(0, Math.sin(this.timeOfDay * Math.PI)) * 0.3;
        this.ambientLight.intensity = ambientIntensity * this.settings.ambientIntensity;
        
        // Sky color
        if (this.timeOfDay < 0.25) {
            this.engine.scene.background = new THREE.Color(0x0a0a20); // Night
        } else if (this.timeOfDay < 0.35) {
            // Sunrise
            const t = (this.timeOfDay - 0.25) / 0.1;
            this.engine.scene.background = new THREE.Color().lerpColors(
                new THREE.Color(0x0a0a20),
                new THREE.Color(0xFF7F50),
                t
            );
        } else if (this.timeOfDay < 0.65) {
            this.engine.scene.background = new THREE.Color(0x87CEEB); // Day
        } else if (this.timeOfDay < 0.75) {
            // Sunset
            const t = (this.timeOfDay - 0.65) / 0.1;
            this.engine.scene.background = new THREE.Color().lerpColors(
                new THREE.Color(0x87CEEB),
                new THREE.Color(0xFF7F50),
                t
            );
        } else {
            this.engine.scene.background = new THREE.Color(0x0a0a20); // Night
        }
        
        // Update fog
        this.engine.scene.fog.color.copy(this.engine.scene.background);
    }
    
    updateShadows() {
        // Only cast shadows during day
        const isDay = this.timeOfDay > 0.25 && this.timeOfDay < 0.75;
        this.sunLight.castShadow = isDay && this.settings.enableSoftShadows;
        
        // Update shadow radius for soft shadows
        this.sunLight.shadow.radius = isDay ? this.settings.shadowSoftness : 0;
    }
    
    // Calculate Voxel Ambient Occlusion
    calculateVoxelAO(x, y, z, face) {
        const key = `${x},${y},${z}:${face}`;
        
        if (this.voxelAOCache.has(key)) {
            return this.voxelAOCache.get(key);
        }
        
        let ao = [1, 1, 1, 1]; // Default no occlusion
        
        if (this.settings.enableVoxelAO) {
            const faceData = this.getFaceNeighborData(x, y, z, face);
            ao = this.calculateAOFactors(faceData);
        }
        
        this.voxelAOCache.set(key, ao);
        return ao;
    }
    
    getFaceNeighborData(x, y, z, face) {
        // Get neighboring block data for AO calculation
        const neighbors = [];
        
        switch(face) {
            case 'top':
                neighbors.push(
                    { x: x-1, y: y+1, z: z, dir: [-1, 1, 0] },
                    { x: x+1, y: y+1, z: z, dir: [1, 1, 0] },
                    { x: x, y: y+1, z: z-1, dir: [0, 1, -1] },
                    { x: x, y: y+1, z: z+1, dir: [0, 1, 1] },
                    { x: x-1, y: y+1, z: z-1, dir: [-1, 1, -1] },
                    { x: x+1, y: y+1, z: z+1, dir: [1, 1, 1] }
                );
                break;
            case 'bottom':
                neighbors.push(
                    { x: x-1, y: y-1, z: z, dir: [-1, -1, 0] },
                    { x: x+1, y: y-1, z: z, dir: [1, -1, 0] },
                    { x: x, y: y-1, z: z-1, dir: [0, -1, -1] },
                    { x: x, y: y-1, z: z+1, dir: [0, -1, 1] },
                    { x: x-1, y: y-1, z: z-1, dir: [-1, -1, -1] },
                    { x: x+1, y: y-1, z: z+1, dir: [1, -1, 1] }
                );
                break;
            default:
                // Side faces
                neighbors.push(
                    { x: x-1, y: y, z: z, dir: [-1, 0, 0] },
                    { x: x+1, y: y, z: z, dir: [1, 0, 0] },
                    { x: x, y: y-1, z: z, dir: [0, -1, 0] },
                    { x: x, y: y+1, z: z, dir: [0, 1, 0] },
                    { x: x, y: y, z: z-1, dir: [0, 0, -1] },
                    { x: x, y: y, z: z+1, dir: [0, 0, 1] }
                );
        }
        
        return neighbors.map(n => {
            const voxel = this.world.getVoxel(n.x, n.y, n.z);
            const props = BlockProperties[voxel];
            return {
                isSolid: voxel !== BlockType.AIR && (!props || props.solid),
                isTransparent: props && props.transparent,
                lightLevel: props?.lightLevel || 0
            };
        });
    }
    
    calculateAOFactors(neighborData) {
        // Calculate AO for each corner of a face
        // 0 = fully occluded, 1 = no occlusion
        
        // For top face (looking down):
        // Corner 0: x-1, z-1
        // Corner 1: x+1, z-1
        // Corner 2: x+1, z+1
        // Corner 3: x-1, z+1
        
        const factors = [1, 1, 1, 1];
        
        // Simplified AO calculation
        // Check vertical neighbors for occlusion
        const verticalCheck = (side1, side2, corner) => {
            let occlusion = 0;
            
            // Check two adjacent side blocks
            if (neighborData[side1]?.isSolid) occlusion += 0.3;
            if (neighborData[side2]?.isSolid) occlusion += 0.3;
            
            // Check diagonal corner block
            if (neighborData[corner]?.isSolid) occlusion += 0.4;
            
            return Math.min(1, Math.max(0.3, 1 - occlusion));
        };
        
        // For top face: neighbors 0,1,2,3 are the side-adjacent, 4,5 are diagonals
        if (neighborData.length >= 6) {
            factors[0] = verticalCheck(0, 2, 4); // Top-left
            factors[1] = verticalCheck(0, 2, 5); // Top-right
            factors[2] = verticalCheck(1, 3, 5); // Bottom-right
            factors[3] = verticalCheck(1, 3, 4); // Bottom-left
        }
        
        return factors;
    }
    
    // Get light level at position (combination of sunlight and block light)
    getLightAtPosition(x, y, z) {
        const sunLight = this.calculateSunlight(x, y, z);
        const blockLight = this.calculateBlockLight(x, y, z);
        
        // Combine: sunlight is white, block light has color
        const combined = Math.max(sunLight, blockLight.level);
        
        return {
            level: combined,
            hasBlockLight: blockLight.level > 0,
            blockLightColor: blockLight.color
        };
    }
    
    calculateSunlight(x, y, z) {
        // Sunlight propagates downward from sky
        let light = 15; // Full sunlight at sky
        
        // Check if there's a direct path to sky
        for (let checkY = y; checkY < 64; checkY++) {
            const voxel = this.world.getVoxel(x, checkY, z);
            const props = BlockProperties[voxel];
            
            if (voxel === BlockType.AIR) {
                continue;
            }
            
            if (props && props.transparent && props.solid) {
                // Transparent solid blocks reduce light
                light -= 1;
            } else if (props && props.transparent && !props.solid) {
                // Liquid and air don't block much
                light -= 0.5;
            } else {
                // Solid block blocks all sunlight from above
                return 0;
            }
            
            if (light <= 0) break;
        }
        
        return Math.max(0, Math.floor(light));
    }
    
    calculateBlockLight(x, y, z) {
        // Block light propagates in all directions
        let maxLight = 0;
        let lightColor = new THREE.Color(0xffffff);
        
        // Check all 6 neighbors for light sources
        const neighbors = [
            [x-1, y, z], [x+1, y, z],
            [x, y-1, z], [x, y+1, z],
            [x, y, z-1], [x, y, z+1]
        ];
        
        neighbors.forEach(([nx, ny, nz]) => {
            const voxel = this.world.getVoxel(nx, ny, nz);
            const props = BlockProperties[voxel];
            
            if (props && props.lightLevel > 0) {
                if (props.lightLevel > maxLight) {
                    maxLight = props.lightLevel;
                    // Get light color based on block type
                    lightColor = this.getBlockLightColor(voxel);
                }
            }
        });
        
        // Light decays with distance
        maxLight = Math.max(0, maxLight - 1);
        
        return { level: maxLight, color: lightColor };
    }
    
    getBlockLightColor(blockType) {
        switch(blockType) {
            case BlockType.LAVA:
            case BlockType.GLOWSTONE:
                return new THREE.Color(1, 0.5, 0); // Orange
            case BlockType.SEA_LANTERN:
                return new THREE.Color(0.3, 0.8, 0.8); // Cyan
            case 27: // Sea lantern
                return new THREE.Color(0.5, 1, 0.8); // Light cyan
            default:
                return new THREE.Color(1, 0.9, 0.7); // Warm white
        }
    }
    
    // Apply lighting to chunk mesh
    applyLightingToChunk(chunk, geometry) {
        if (!geometry.attributes.color) return;
        
        const colors = geometry.attributes.color.array;
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = Math.floor(positions[i]) + chunk.worldX;
            const y = Math.floor(positions[i + 1]);
            const z = Math.floor(positions[i + 2]);
            
            const light = this.getLightAtPosition(x, y, z);
            
            // Apply AO and light to vertex color
            const ao = this.calculateVoxelAO(x, y, z, this.getFaceFromNormal(positions, i));
            const aoFactor = ao[0]; // Simplified, use first corner
            
            const lightFactor = light.level / 15;
            const finalLight = aoFactor * lightFactor;
            
            // Modify vertex color based on lighting
            colors[i] *= finalLight;
            colors[i + 1] *= finalLight;
            colors[i + 2] *= finalLight;
        }
        
        geometry.attributes.color.needsUpdate = true;
    }
    
    getFaceFromNormal(positions, index) {
        // Determine face from normal direction
        const nx = positions[index];
        const ny = positions[index + 1];
        const nz = positions[index + 2];
        
        if (ny > 0.5) return 'top';
        if (ny < -0.5) return 'bottom';
        if (nz > 0.5) return 'front';
        if (nz < -0.5) return 'back';
        if (nx > 0.5) return 'right';
        return 'left';
    }
    
    clearCache() {
        this.voxelAOCache.clear();
    }
    
    toggle() {
        this.settings.enableVoxelAO = !this.settings.enableVoxelAO;
        this.clearCache();
        console.log('Voxel AO:', this.settings.enableVoxelAO ? 'ON' : 'OFF');
    }
}

// Ray-traced Lighting (simplified for performance)
class RayTracedLighting {
    constructor(engine) {
        this.engine = engine;
        this.enabled = false;
        this.rayCount = 0;
        this.maxRaysPerFrame = 100;
    }
    
    castRay(origin, direction, maxDistance = 50) {
        // Simplified ray casting for light bounces
        const steps = Math.floor(maxDistance * 2);
        const stepSize = maxDistance / steps;
        
        let closestHit = null;
        let closestDistance = maxDistance;
        
        for (let i = 0; i < steps; i++) {
            const t = i * stepSize;
            const point = origin.clone().add(direction.clone().multiplyScalar(t));
            
            const voxel = this.engine.world?.getVoxel(
                Math.floor(point.x),
                Math.floor(point.y),
                Math.floor(point.z)
            );
            
            if (voxel && voxel !== BlockType.AIR) {
                if (t < closestDistance) {
                    closestDistance = t;
                    closestHit = {
                        point: point,
                        voxel: voxel,
                        normal: this.getNormalAtPoint(point, direction)
                    };
                }
                break;
            }
        }
        
        this.rayCount++;
        return closestHit;
    }
    
    getNormalAtPoint(point, direction) {
        // Calculate normal based on which face was hit
        return direction.clone().negate().normalize();
    }
    
    calculateIndirectLight(position, normal) {
        // Calculate indirect (bounced) light using ray tracing
        const bounces = [];
        const up = new THREE.Vector3(0, 1, 0);
        
        // Cast rays in hemisphere
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const rayDir = new THREE.Vector3(
                Math.cos(angle) * 0.5,
                normal.y,
                Math.sin(angle) * 0.5
            ).normalize();
            
            const hit = this.castRay(position, rayDir, 10);
            if (hit) {
                bounces.push({
                    direction: rayDir,
                    distance: position.distanceTo(hit.point),
                    voxel: hit.voxel
                });
            }
        }
        
        // Average bounced light
        const lightContribution = bounces.length / 4;
        return Math.min(1, lightContribution * 0.3);
    }
    
    resetRayCount() {
        this.rayCount = 0;
    }
    
    toggle() {
        this.enabled = !this.enabled;
        console.log('Ray-traced lighting:', this.enabled ? 'ON' : 'OFF');
    }
}

// Export for use in other files
window.AdvancedLighting = AdvancedLighting;
window.RayTracedLighting = RayTracedLighting;