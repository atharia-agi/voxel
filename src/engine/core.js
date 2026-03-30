// Voxel Engine Pro - Core System
class VoxelEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Engine settings
        this.settings = {
            renderDistance: 8,
            chunkSize: 16,
            voxelSize: 1,
            maxChunksPerFrame: 4,
            enableShadows: true,
            enableLighting: true,
            enableAO: true,
            enableLOD: true,
            dayNightCycle: true
        };
        
        // Performance monitoring
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now(),
            chunks: 0,
            vertices: 0,
            drawCalls: 0,
            memory: 0
        };
        
        this.init();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 50, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = this.settings.enableShadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        this.setupLighting();
        
        // Input handling
        this.setupInput();
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Start render loop
        this.animate();
    }
    
    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);
        
        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
        
        // Hemisphere light for sky color
        this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
        this.scene.add(this.hemisphereLight);
    }
    
    setupInput() {
        // Mouse lock
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.canvas) {
                const sensitivity = 0.002;
                this.camera.rotation.y -= event.movementX * sensitivity;
                this.camera.rotation.x -= event.movementY * sensitivity;
                this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
            }
        });
        
        // Keyboard input
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    updateCamera(delta) {
        const speed = this.keys['ShiftLeft'] ? 20 : 10;
        const direction = new THREE.Vector3();
        
        this.camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        
        const right = new THREE.Vector3();
        right.crossVectors(direction, new THREE.Vector3(0, 1, 0));
        
        // Forward/Backward
        if (this.keys['KeyW']) {
            this.camera.position.addScaledVector(direction, speed * delta);
        }
        if (this.keys['KeyS']) {
            this.camera.position.addScaledVector(direction, -speed * delta);
        }
        
        // Left/Right
        if (this.keys['KeyA']) {
            this.camera.position.addScaledVector(right, -speed * delta);
        }
        if (this.keys['KeyD']) {
            this.camera.position.addScaledVector(right, speed * delta);
        }
        
        // Up/Down
        if (this.keys['Space']) {
            this.camera.position.y += speed * delta;
        }
        if (this.keys['ShiftLeft'] && this.keys['KeyS']) {
            this.camera.position.y -= speed * delta;
        }
    }
    
    updateStats() {
        // FPS calculation
        this.stats.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.stats.lastTime;
        
        if (elapsed >= 1000) {
            this.stats.fps = Math.round((this.stats.frameCount * 1000) / elapsed);
            this.stats.frameCount = 0;
            this.stats.lastTime = currentTime;
            
            // Update UI
            document.getElementById('fps').textContent = this.stats.fps;
            document.getElementById('chunks').textContent = this.stats.chunks;
            document.getElementById('vertices').textContent = this.stats.vertices.toLocaleString();
            document.getElementById('draw-calls').textContent = this.stats.drawCalls;
            document.getElementById('memory').textContent = this.stats.memory;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update camera
        this.updateCamera(delta);
        
        // Update world (if exists)
        if (window.world) {
            window.world.update(this.camera.position, delta);
            this.stats.chunks = window.world.chunks.size;
        }
        
        // Update characters
        if (window.characters) {
            window.characters.forEach(char => char.update(delta));
        }
        
        // Update stats
        this.stats.drawCalls = this.renderer.info.render.calls;
        this.stats.vertices = this.renderer.info.render.triangles * 3;
        this.stats.memory = Math.round(performance.memory?.usedJSHeapSize / 1048576 || 0);
        
        this.updateStats();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    addMesh(mesh) {
        this.scene.add(mesh);
    }
    
    removeMesh(mesh) {
        this.scene.remove(mesh);
    }
    
    setTimeOfDay(time) {
        // 0 = midnight, 0.5 = noon, 1 = midnight
        const sunAngle = time * Math.PI * 2;
        
        // Sun position
        this.sunLight.position.x = Math.cos(sunAngle) * 100;
        this.sunLight.position.y = Math.sin(sunAngle) * 100;
        
        // Sun intensity
        const intensity = Math.max(0, Math.sin(sunAngle));
        this.sunLight.intensity = intensity * 1.5;
        
        // Sky color
        const skyColor = new THREE.Color();
        if (intensity > 0.3) {
            skyColor.setHex(0x87CEEB); // Day
        } else if (intensity > 0) {
            skyColor.setHex(0xFF7F50); // Sunset/Sunrise
        } else {
            skyColor.setHex(0x0a0a20); // Night
        }
        
        this.scene.background = skyColor;
        this.scene.fog.color = skyColor;
    }
}

// Export for use in other files
window.VoxelEngine = VoxelEngine;