// Advanced Rendering System with LOD, Occlusion Culling, and Post-Processing
class AdvancedRenderer {
    constructor(engine) {
        this.engine = engine;
        this.lodLevels = [];
        this.occlusionQuery = null;
        this.frustum = new THREE.Frustum();
        this.projectionMatrix = new THREE.Matrix4();
        
        // Settings
        this.settings = {
            enableLOD: true,
            enableOcclusionCulling: true,
            enablePostProcessing: true,
            enableAmbientOcclusion: true,
            enableShadows: true,
            shadowMapSize: 2048,
            maxLODLevels: 4,
            lodDistance: [32, 64, 128, 256],
            frustumCulling: true,
            occlusionCulling: false // Requires GPU support
        };
        
        // Initialize systems
        this.setupPostProcessing();
        this.setupLODSystem();
        this.setupOcclusionCulling();
        
        // Performance counters
        this.stats = {
            visibleChunks: 0,
            culledChunks: 0,
            lod0: 0,
            lod1: 0,
            lod2: 0,
            lod3: 0,
            drawCalls: 0,
            triangles: 0,
            batches: 0
        };
    }
    
    setupPostProcessing() {
        // Create render targets
        const rtParams = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        };
        
        this.renderTarget = new THREE.WebGLRenderTarget(
            this.engine.canvas.width,
            this.engine.canvas.height,
            rtParams
        );
        
        // Post-processing quad
        const postGeometry = new THREE.PlaneGeometry(2, 2);
        const postMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(this.engine.canvas.width, this.engine.canvas.height) },
                time: { value: 0 },
                vignetteIntensity: { value: 0.4 },
                saturation: { value: 1.1 },
                contrast: { value: 1.05 },
                brightness: { value: 0.02 },
                fogColor: { value: new THREE.Color(0x87CEEB) },
                fogNear: { value: 50 },
                fogFar: { value: 200 },
                enableFog: { value: true }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 resolution;
                uniform float time;
                uniform float vignetteIntensity;
                uniform float saturation;
                uniform float contrast;
                uniform float brightness;
                uniform vec3 fogColor;
                uniform float fogNear;
                uniform float fogFar;
                uniform bool enableFog;
                
                varying vec2 vUv;
                
                vec3 adjustSaturation(vec3 color, float sat) {
                    float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
                    return mix(vec3(gray), color, sat);
                }
                
                float random(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec2 uv = vUv;
                    vec4 color = texture2D(tDiffuse, uv);
                    
                    // Brightness
                    color.rgb += brightness;
                    
                    // Contrast
                    color.rgb = (color.rgb - 0.5) * contrast + 0.5;
                    
                    // Saturation
                    color.rgb = adjustSaturation(color.rgb, saturation);
                    
                    // Vignette
                    vec2 center = uv - 0.5;
                    float dist = length(center);
                    float vignette = 1.0 - smoothstep(0.5, 1.2, dist) * vignetteIntensity;
                    color.rgb *= vignette;
                    
                    // Film grain
                    float grain = random(uv + time) * 0.05;
                    color.rgb += grain - 0.025;
                    
                    // Fog
                    if (enableFog) {
                        float depth = gl_FragCoord.z / gl_FragCoord.w;
                        float fogFactor = smoothstep(fogNear, fogFar, depth);
                        color.rgb = mix(color.rgb, fogColor, fogFactor);
                    }
                    
                    // Tone mapping (simple Reinhard)
                    color.rgb = color.rgb / (color.rgb + vec3(1.0));
                    
                    // Gamma correction
                    color.rgb = pow(color.rgb, vec3(1.0 / 2.2));
                    
                    gl_FragColor = color;
                }
            `,
            transparent: false
        });
        
        this.postScene = new THREE.Scene();
        this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.postQuad = new THREE.Mesh(postGeometry, postMaterial);
        this.postScene.add(this.postQuad);
    }
    
    setupLODSystem() {
        // LOD level configurations
        this.lodLevels = [
            { distance: 0, subdivision: 1, triangles: 1 },      // LOD 0: Full detail
            { distance: 32, subdivision: 2, triangles: 0.25 },  // LOD 1: 50% reduction
            { distance: 64, subdivision: 4, triangles: 0.0625 }, // LOD 2: 75% reduction
            { distance: 128, subdivision: 8, triangles: 0.0156 } // LOD 3: 90% reduction
        ];
    }
    
    setupOcclusionCulling() {
        // Occlusion query setup (GPU-dependent)
        if (this.engine.renderer.capabilities.isWebGL2) {
            this.occlusionQuery = {
                supported: true,
                queries: []
            };
        }
    }
    
    // Create LOD mesh for chunk
    createLODMeshes(chunk) {
        const meshes = [];
        
        this.lodLevels.forEach((lod, index) => {
            const geometry = this.createLODGeometry(chunk, index);
            const material = this.createLODMaterial(index);
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(chunk.mesh.position);
            mesh.visible = false;
            mesh.userData.lodLevel = index;
            mesh.userData.lodDistance = lod.distance;
            
            meshes.push(mesh);
        });
        
        return meshes;
    }
    
    createLODGeometry(chunk, lodLevel) {
        const subdivision = this.lodLevels[lodLevel].subdivision;
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        
        // Simplified geometry for LOD
        const size = chunk.chunkSize;
        const step = Math.max(1, Math.floor(size / (8 / subdivision)));
        
        for (let y = 0; y < size; y += step) {
            for (let z = 0; z < size; z += step) {
                for (let x = 0; x < size; x += step) {
                    const voxel = chunk.getLocal(x, y, z);
                    if (voxel === BlockType.AIR) continue;
                    
                    // Simplified cube
                    const px = x;
                    const py = y;
                    const pz = z;
                    const ps = step;
                    
                    // Add simplified faces
                    this.addSimplifiedFace(vertices, normals, uvs, indices,
                        px, py, pz, ps, ps, ps, [0, 1, 0], 0); // Top
                    this.addSimplifiedFace(vertices, normals, uvs, indices,
                        px, py, pz, ps, ps, ps, [0, -1, 0], 1); // Bottom
                }
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        
        return geometry;
    }
    
    addSimplifiedFace(vertices, normals, uvs, indices, px, py, pz, w, h, d, normal, faceIndex) {
        const baseIndex = vertices.length / 3;
        
        switch(faceIndex) {
            case 0: // Top
                vertices.push(
                    px, py+h, pz, px+w, py+h, pz, px+w, py+h, pz+d,
                    px, py+h, pz, px+w, py+h, pz+d, px, py+h, pz+d
                );
                break;
            case 1: // Bottom
                vertices.push(
                    px, py, pz+d, px+w, py, pz+d, px+w, py, pz,
                    px, py, pz+d, px+w, py, pz, px, py, pz
                );
                break;
        }
        
        for (let i = 0; i < 6; i++) {
            normals.push(normal[0], normal[1], normal[2]);
        }
        
        uvs.push(0,0, 1,0, 1,1, 0,0, 1,1, 0,1);
        
        indices.push(
            baseIndex, baseIndex+1, baseIndex+2,
            baseIndex+3, baseIndex+4, baseIndex+5
        );
    }
    
    createLODMaterial(lodLevel) {
        // Simpler material for distant chunks
        const opacity = 1.0 - (lodLevel * 0.1);
        
        return new THREE.MeshLambertMaterial({
            color: 0xffffff,
            vertexColors: true,
            transparent: opacity < 1.0,
            opacity: opacity,
            flatShading: lodLevel > 1
        });
    }
    
    // Update LOD for visible chunks
    updateLOD(cameraPosition, chunks) {
        this.stats.lod0 = this.stats.lod1 = this.stats.lod2 = this.stats.lod3 = 0;
        
        chunks.forEach(chunk => {
            if (!chunk.mesh) return;
            
            const distance = cameraPosition.distanceTo(
                new THREE.Vector3(chunk.worldX + 8, 32, chunk.worldZ + 8)
            );
            
            // Determine LOD level
            let lodLevel = 0;
            for (let i = this.lodLevels.length - 1; i >= 0; i--) {
                if (distance >= this.lodLevels[i].distance) {
                    lodLevel = i;
                    break;
                }
            }
            
            // Update mesh visibility
            if (chunk.meshes && chunk.meshes.length > 0) {
                chunk.meshes.forEach((mesh, index) => {
                    mesh.visible = index === lodLevel;
                });
            }
            
            // Update stats
            switch(lodLevel) {
                case 0: this.stats.lod0++; break;
                case 1: this.stats.lod1++; break;
                case 2: this.stats.lod2++; break;
                case 3: this.stats.lod3++; break;
            }
        });
    }
    
    // Frustum culling
    updateFrustum() {
        this.camera.updateMatrixWorld();
        this.projectionMatrix.multiplyMatrices(
            this.engine.camera.projectionMatrix,
            this.engine.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projectionMatrix);
    }
    
    isInFrustum(object) {
        if (!this.settings.frustumCulling) return true;
        
        const boundingSphere = new THREE.Sphere(
            object.position,
            object.geometry ? object.geometry.boundingSphere?.radius || 1 : 1
        );
        
        return this.frustum.intersectsSphere(boundingSphere);
    }
    
    // Occlusion culling (simplified)
    performOcclusionCulling(cameraPosition, chunks) {
        const visible = [];
        const culled = [];
        
        chunks.forEach(chunk => {
            // Simple distance-based occlusion
            const distance = cameraPosition.distanceTo(
                new THREE.Vector3(chunk.worldX + 8, 32, chunk.worldZ + 8)
            );
            
            // Check if chunk is behind other chunks (simplified)
            let occluded = false;
            
            if (this.settings.enableOcclusionCulling && distance > 64) {
                // Check if any closer chunk blocks view
                chunks.forEach(other => {
                    if (other === chunk) return;
                    
                    const otherDist = cameraPosition.distanceTo(
                        new THREE.Vector3(other.worldX + 8, 32, other.worldZ + 8)
                    );
                    
                    if (otherDist < distance && otherDist < 48) {
                        // Potentially occluding - simplified check
                        const dx = chunk.worldX - other.worldX;
                        const dz = chunk.worldZ - other.worldZ;
                        
                        if (Math.abs(dx) < 16 && Math.abs(dz) < 16) {
                            occluded = true;
                        }
                    }
                });
            }
            
            if (occluded) {
                culled.push(chunk);
            } else {
                visible.push(chunk);
            }
        });
        
        this.stats.visibleChunks = visible.length;
        this.stats.culledChunks = culled.length;
        
        return { visible, culled };
    }
    
    // Render with post-processing
    render(scene, camera) {
        this.updateFrustum();
        
        if (this.settings.enablePostProcessing) {
            // Render scene to target
            this.engine.renderer.setRenderTarget(this.renderTarget);
            this.engine.renderer.render(scene, camera);
            
            // Apply post-processing
            this.postQuad.material.uniforms.tDiffuse.value = this.renderTarget.texture;
            this.postQuad.material.uniforms.time.value = performance.now() / 1000;
            
            // Update fog uniforms
            this.postQuad.material.uniforms.fogColor.value = scene.fog?.color || new THREE.Color(0x87CEEB);
            this.postQuad.material.uniforms.fogNear.value = scene.fog?.near || 50;
            this.postQuad.material.uniforms.fogFar.value = scene.fog?.far || 200;
            
            this.engine.renderer.setRenderTarget(null);
            this.engine.renderer.render(this.postScene, this.postCamera);
        } else {
            // Direct render
            this.engine.renderer.render(scene, camera);
        }
    }
    
    // Resize handler
    onResize(width, height) {
        this.renderTarget.setSize(width, height);
        this.postQuad.material.uniforms.resolution.value.set(width, height);
    }
    
    // Toggle post-processing
    togglePostProcessing() {
        this.settings.enablePostProcessing = !this.settings.enablePostProcessing;
        console.log('Post-processing:', this.settings.enablePostProcessing ? 'ON' : 'OFF');
    }
    
    // Get stats
    getStats() {
        return { ...this.stats };
    }
}

// Ambient Occlusion System
class AmbientOcclusionSystem {
    constructor(world) {
        this.world = world;
        this.aoCache = new Map();
        this.enabled = true;
    }
    
    calculateAOFactors(x, y, z, direction) {
        // Calculate ambient occlusion for vertex at (x,y,z) with given face direction
        // Returns 4 values for quad corners (0-1, darker = more occlusion)
        
        const neighbors = this.getNeighborOffsets(direction);
        
        // Check corners
        const c1 = this.sampleCorner(x + neighbors[0][0], y + neighbors[0][1], z + neighbors[0][2]);
        const c2 = this.sampleCorner(x + neighbors[1][0], y + neighbors[1][1], z + neighbors[1][2]);
        const c3 = this.sampleCorner(x + neighbors[2][0], y + neighbors[2][1], z + neighbors[2][2]);
        const c4 = this.sampleCorner(x + neighbors[3][0], y + neighbors[3][1], z + neighbors[3][2]);
        
        return [c1, c2, c3, c4];
    }
    
    getNeighborOffsets(direction) {
        switch(direction) {
            case 'top':
                return [[-1,1,0], [0,1,-1], [1,1,0], [0,1,1]];
            case 'bottom':
                return [[1,-1,0], [0,-1,1], [-1,-1,0], [0,-1,-1]];
            case 'front':
                return [[-1,0,1], [0,-1,1], [1,0,1], [0,1,1]];
            case 'back':
                return [[1,0,-1], [0,-1,-1], [-1,0,-1], [0,1,-1]];
            case 'left':
                return [[-1,0,-1], [0,-1,-1], [-1,0,1], [0,1,-1]];
            case 'right':
                return [[1,0,1], [0,-1,1], [1,0,-1], [0,1,1]];
            default:
                return [[0,0,0], [0,0,0], [0,0,0], [0,0,0]];
        }
    }
    
    sampleCorner(x, y, z) {
        // Check if corner is occluded
        const voxel = this.world.getVoxel(x, y, z);
        
        if (voxel === BlockType.AIR) {
            return 1.0; // No occlusion
        }
        
        const props = BlockProperties[voxel];
        if (!props || props.transparent) {
            return 1.0;
        }
        
        return 0.0; // Full occlusion
    }
    
    // Calculate for entire chunk
    calculateChunkAO(chunk) {
        const aoData = new Map();
        
        for (let y = 0; y < chunk.chunkSize; y++) {
            for (let z = 0; z < chunk.chunkSize; z++) {
                for (let x = 0; x < chunk.chunkSize; x++) {
                    const voxel = chunk.getLocal(x, y, z);
                    if (voxel === BlockType.AIR) continue;
                    
                    // Calculate AO for each face
                    ['top', 'bottom', 'front', 'back', 'left', 'right'].forEach(face => {
                        const key = `${x},${y},${z}:${face}`;
                        aoData.set(key, this.calculateAOFactors(x, y, z, face));
                    });
                }
            }
        }
        
        return aoData;
    }
    
    clearCache() {
        this.aoCache.clear();
    }
}

// Export for use in other files
window.AdvancedRenderer = AdvancedRenderer;
window.AmbientOcclusionSystem = AmbientOcclusionSystem;