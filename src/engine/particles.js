// Particle System for Voxel Engine
class ParticleSystem {
    constructor(engine) {
        this.engine = engine;
        this.particles = [];
        this.emitters = [];
        this.maxParticles = 1000;
        this.particlePool = [];
        
        // Particle textures (we'll use simple shapes for now)
        this.particleTextures = {};
        
        // Initialize
        this.init();
    }
    
    init() {
        // Create simple particle textures
        this.createParticleTextures();
    }
    
    createParticleTextures() {
        // Smoke texture
        const smokeCanvas = document.createElement('canvas');
        smokeCanvas.width = 32;
        smokeCanvas.height = 32;
        const smokeCtx = smokeCanvas.getContext('2d');
        
        // Radial gradient for smoke
        const gradient = smokeCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        smokeCtx.fillStyle = gradient;
        smokeCtx.fillRect(0, 0, 32, 32);
        
        this.particleTextures.smoke = new THREE.CanvasTexture(smokeCanvas);
        this.particleTextures.smoke.minFilter = THREE.LinearFilter;
        this.particleTextures.smoke.magFilter = THREE.LinearFilter;
        
        // Fire texture
        const fireCanvas = document.createElement('canvas');
        fireCanvas.width = 32;
        fireCanvas.height = 32;
        const fireCtx = fireCanvas.getContext('2d');
        
        // Fire-like gradient
        const fireGrad = fireCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        fireGrad.addColorStop(0, 'rgba(255, 100, 0, 0.9)');
        fireGrad.addColorStop(0.5, 'rgba(255, 150, 0, 0.5)');
        fireGrad.addColorStop(1, 'rgba(255, 200, 0, 0)');
        fireCtx.fillStyle = fireGrad;
        fireCtx.fillRect(0, 0, 32, 32);
        
        this.particleTextures.fire = new THREE.CanvasTexture(fireCanvas);
        this.particleTextures.fire.minFilter = THREE.LinearFilter;
        this.particleTextures.fire.magFilter = THREE.LinearFilter;
        
        // Spark texture
        const sparkCanvas = document.createElement('canvas');
        sparkCanvas.width = 16;
        sparkCanvas.height = 16;
        const sparkCtx = sparkCanvas.getContext('2d');
        sparkCtx.fillStyle = 'rgba(255, 255, 100, 0.8)';
        sparkCtx.beginPath();
        sparkCtx.arc(8, 8, 6, 0, Math.PI * 2);
        sparkCtx.fill();
        
        this.particleTextures.spark = new THREE.CanvasTexture(sparkCanvas);
        this.particleTextures.spark.minFilter = THREE.LinearFilter;
        this.particleTextures.spark.magFilter = THREE.LinearFilter;
        
        // Water droplet texture
        const waterCanvas = document.createElement('canvas');
        waterCanvas.width = 16;
        waterCanvas.height = 16;
        const waterCtx = waterCanvas.getContext('2d');
        waterCtx.fillStyle = 'rgba(100, 150, 255, 0.7)';
        waterCtx.beginPath();
        waterCtx.ellipse(8, 8, 6, 4, 0, 0, Math.PI * 2);
        waterCtx.fill();
        
        this.particleTextures.water = new THREE.CanvasTexture(waterCanvas);
        this.particleTextures.water.minFilter = THREE.LinearFilter;
        this.particleTextures.water.magFilter = THREE.LinearFilter;
    }
    
    // Create particle emitter
    createEmitter(options = {}) {
        const emitter = {
            position: options.position || new THREE.Vector3(),
            velocity: options.velocity || new THREE.Vector3(0, 1, 0),
            acceleration: options.acceleration || new THREE.Vector3(0, -0.1, 0),
            radius: options.radius || 1,
            particleCount: options.particleCount || 10,
            lifeTime: options.lifeTime || 2, // seconds
            particleLife: options.particleLife || 1.5,
            size: options.size || 1,
            sizeVariation: options.sizeVariation || 0.5,
            color: options.color || new THREE.Color(0xffffff),
            colorVariation: options.colorVariation || 0.2,
            texture: options.texture || 'smoke',
            enabled: options.enabled !== undefined ? options.enabled : true,
            emissionRate: options.emissionRate || 10, // particles per second
            emissionTimer: 0,
            particles: []
        };
        
        this.emitters.push(emitter);
        return emitter;
    }
    
    // Emit particles from position (burst)
    emitBurst(position, options = {}) {
        const count = options.count || 10;
        const particleOptions = {
            position: position.clone(),
            velocity: options.velocity || new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            ),
            acceleration: options.acceleration || new THREE.Vector3(0, -0.1, 0),
            lifeTime: options.lifeTime || 1.5,
            size: options.size || 1,
            color: options.color || new THREE.Color(0xffffff),
            texture: options.texture || 'smoke'
        };
        
        for (let i = 0; i < count; i++) {
            this.spawnParticle(particleOptions);
        }
    }
    
    // Spawn a single particle
    spawnParticle(options) {
        // Get particle from pool or create new
        let particle;
        if (this.particlePool.length > 0) {
            particle = this.particlePool.pop();
        } else if (this.particles.length < this.maxParticles) {
            particle = this.createParticle();
        } else {
            // Reuse oldest particle
            particle = this.particles.shift();
        }
        
        // Initialize particle
        particle.position.copy(options.position);
        particle.velocity.copy(options.velocity);
        particle.acceleration = options.acceleration.clone();
        particle.life = options.lifeTime || 1;
        particle.maxLife = particle.life;
        particle.size = options.size * (0.5 + Math.random() * (options.sizeVariation || 1));
        particle.rotation = Math.random() * Math.PI * 2;
        particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
        particle.color = options.color.clone();
        
        // Apply color variation
        if (options.colorVariation) {
            particle.color.r += (Math.random() - 0.5) * options.colorVariation;
            particle.color.g += (Math.random() - 0.5) * options.colorVariation;
            particle.color.b += (Math.random() - 0.5) * options.colorVariation;
            particle.color.r = Math.max(0, Math.min(1, particle.color.r));
            particle.color.g = Math.max(0, Math.min(1, particle.color.g));
            particle.color.b = Math.max(0, Math.min(1, particle.color.b));
        }
        
        // Set texture
        particle.texture = this.particleTextures[options.texture] || this.particleTextures.smoke;
        
        // Set alive flag
        particle.alive = true;
        
        // Add to active particles
        this.particles.push(particle);
        
        return particle;
    }
    
    createParticle() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        geometry.rotateX(-Math.PI / 2); // Face up
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            depthTest: true,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false; // Important for particles
        
        return {
            mesh: mesh,
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            acceleration: new THREE.Vector3(),
            life: 0,
            maxLife: 0,
            size: 1,
            rotation: 0,
            rotationSpeed: 0,
            color: new THREE.Color(1, 1, 1),
            texture: null,
            alive: false
        };
    }
    
    update(delta) {
        // Update emitters
        this.emitters.forEach(emitter => {
            if (!emitter.enabled) return;
            
            emitter.emissionTimer += delta;
            const emissionInterval = 1 / emitter.emissionRate;
            
            while (emitter.emissionTimer >= emissionInterval && this.particles.length < this.maxParticles) {
                this.spawnParticle({
                    position: emitter.position.clone().add(
                        new THREE.Vector3(
                            (Math.random() - 0.5) * emitter.radius * 2,
                            (Math.random() - 0.5) * emitter.radius * 2,
                            (Math.random() - 0.5) * emitter.radius * 2
                        )
                    ),
                    velocity: emitter.velocity.clone().add(
                        new THREE.Vector3(
                            (Math.random() - 0.5) * 0.5,
                            (Math.random() - 0.5) * 0.5,
                            (Math.random() - 0.5) * 0.5
                        )
                    ),
                    acceleration: emitter.acceleration.clone(),
                    lifeTime: emitter.particleLife,
                    size: emitter.size,
                    color: emitter.color,
                    texture: emitter.texture
                });
                
                emitter.emissionTimer -= emissionInterval;
            }
        });
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            if (!p.alive) {
                this.particles.splice(i, 1);
                this.particlePool.push(p);
                continue;
            }
            
            // Update life
            p.life -= delta;
            if (p.life <= 0) {
                p.alive = false;
                continue;
            }
            
            // Update physics
            p.velocity.add(p.acceleration.clone().multiplyScalar(delta));
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            
            // Update mesh
            p.mesh.position.copy(p.position);
            p.mesh.rotation.z = p.rotation;
            p.mesh.scale.set(p.size, p.size, 1);
            
            // Update material
            p.mesh.material.map = p.texture;
            p.mesh.material.color.copy(p.color);
            p.mesh.material.opacity = p.life / p.maxLife; // Fade out
            
            // Update rotation
            p.rotation += p.rotationSpeed * delta;
            
            // Size over life (optional: puff up then shrink)
            const lifeRatio = p.life / p.maxLife;
            p.mesh.scale.multiplyScalar(0.5 + lifeRatio * 0.5); // Start small, grow to normal
        }
    }
    
    // Add particle mesh to scene
    addToScene() {
        this.particles.forEach(p => {
            if (p.alive && !p.mesh.parent) {
                this.engine.addMesh(p.mesh);
            }
        });
    }
    
    // Remove all particles from scene
    removeFromScene() {
        this.particles.forEach(p => {
            if (p.mesh.parent) {
                this.engine.removeMesh(p.mesh);
            }
        });
    }
    
    // Clear all particles
    clear() {
        this.removeFromScene();
        this.particles.forEach(p => this.particlePool.push(p));
        this.particles = [];
        this.emitters = [];
    }
    
    // Get stats
    getStats() {
        return {
            activeParticles: this.particles.filter(p => p.alive).length,
            pooledParticles: this.particlePool.length,
            emitters: this.emitters.length,
            maxParticles: this.maxParticles
        };
    }
    
    // Specific effect methods
    createExplosion(position, options = {}) {
        const count = options.count || 20;
        const color = options.color || new THREE.Color(1, 0.5, 0);
        
        for (let i = 0; i < count; i++) {
            const angle1 = (i / count) * Math.PI * 2;
            const angle2 = Math.random() * Math.PI;
            const speed = 2 + Math.random() * 3;
            
            this.spawnParticle({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.sin(angle1) * Math.cos(angle2) * speed,
                    Math.sin(angle2) * speed * 0.5,
                    Math.cos(angle1) * Math.cos(angle2) * speed
                ),
                acceleration: new THREE.Vector3(0, -0.2, 0),
                lifeTime: 0.5 + Math.random() * 0.5,
                size: 0.5 + Math.random() * 1,
                color: color.clone(),
                texture: Math.random() > 0.5 ? 'fire' : 'smoke'
            });
        }
    }
    
    createFire(position, size = 2, height = 3) {
        // Create fire emitter
        return this.createEmitter({
            position: position,
            particleCount: 20,
            lifeTime: 3,
            particleLife: 1.5,
            emissionRate: 50,
            size: size,
            color: new THREE.Color(1, 0.4, 0),
            texture: 'fire',
            velocity: new THREE.Vector3(0, 0.5, 0),
            acceleration: new THREE.Vector3(0, 0.05, 0)
        });
    }
    
    createSmoke(position, size = 1.5, height = 4) {
        return this.createEmitter({
            position: position,
            particleCount: 15,
            lifeTime: 5,
            particleLife: 3,
            emissionRate: 20,
            size: size,
            color: new THREE.Color(0.8, 0.8, 0.8),
            texture: 'smoke',
            velocity: new THREE.Vector3(0, 0.2, 0),
            acceleration: new THREE.Vector3(0, -0.01, 0)
        });
    }
    
    createWaterSplash(position, intensity = 1) {
        const count = Math.floor(10 * intensity);
        
        for (let i = 0; i < count; i++) {
            this.spawnParticle({
                position: position.clone().add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 0.5,
                        Math.random() * 0.5,
                        (Math.random() - 0.5) * 0.5
                    )
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 3,
                    (Math.random() - 0.5) * 2
                ),
                acceleration: new THREE.Vector3(0, -0.3, 0),
                lifeTime: 0.8 + Math.random() * 0.7,
                size: 0.3 + Math.random() * 0.3,
                color: new THREE.Color(0.6, 0.8, 1),
                texture: 'water'
            });
        }
    }
}

// Export for use in other files
window.ParticleSystem = ParticleSystem;