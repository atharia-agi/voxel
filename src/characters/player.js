// Player Character with Controls
class Player extends Character {
    constructor(engine) {
        super(new THREE.Vector3(0, 50, 0));
        this.engine = engine;
        
        // Input state
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isPointerLocked = false;
        
        // Camera attachment
        this.cameraOffset = new THREE.Vector3(0, 1.6, 0); // Eye height
        this.firstPerson = true;
        
        // Interaction
        this.selectedBlock = BlockType.STONE;
        this.reachDistance = 6;
        this.breakCooldown = 0;
        this.placeCooldown = 0;
        
        // Inventory
        this.inventory = [
            BlockType.STONE,
            BlockType.DIRT,
            BlockType.GRASS,
            BlockType.WOOD,
            BlockType.LEAVES,
            BlockType.SAND,
            BlockType.GLASS,
            BlockType.COBBLESTONE,
            BlockType.BRICK
        ];
        this.hotbarSlot = 0;
        
        this.setupControls();
    }
    
    setupControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Hotbar selection
            if (e.code >= 'Digit1' && e.code <= 'Digit9') {
                this.hotbarSlot = parseInt(e.code.replace('Digit', '')) - 1;
                this.selectedBlock = this.inventory[this.hotbarSlot];
            }
            
            // Jump
            if (e.code === 'Space') {
                this.jump();
            }
            
            // Inventory toggle
            if (e.code === 'KeyE') {
                this.toggleInventory();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'Space') {
                this.stop();
            }
        });
        
        // Mouse movement (for camera)
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                const sensitivity = 0.002;
                this.rotation.y -= e.movementX * sensitivity;
                this.rotation.x -= e.movementY * sensitivity;
                this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
            }
        });
        
        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            if (this.isPointerLocked) {
                if (e.button === 0) { // Left click - break
                    this.breakBlock();
                } else if (e.button === 2) { // Right click - place
                    this.placeBlock();
                }
            }
        });
        
        // Pointer lock
        this.engine.canvas.addEventListener('click', () => {
            this.engine.canvas.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.engine.canvas;
        });
    }
    
    update(delta) {
        // Update movement from input
        this.handleMovement(delta);
        
        // Update cooldowns
        if (this.breakCooldown > 0) this.breakCooldown -= delta;
        if (this.placeCooldown > 0) this.placeCooldown -= delta;
        
        // Update parent class
        super.update(delta);
        
        // Update camera
        this.updateCamera();
    }
    
    handleMovement(delta) {
        const direction = new THREE.Vector3();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        // Get camera direction
        this.engine.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
        
        // Movement direction
        if (this.keys['KeyW']) direction.add(forward);
        if (this.keys['KeyS']) direction.sub(forward);
        if (this.keys['KeyA']) direction.sub(right);
        if (this.keys['KeyD']) direction.add(right);
        
        if (direction.length() > 0) {
            direction.normalize();
            const isSprinting = this.keys['ShiftLeft'];
            this.move(direction, undefined, isSprinting);
        } else {
            this.stop();
        }
    }
    
    updateCamera() {
        if (this.firstPerson) {
            // First person camera
            this.engine.camera.position.copy(this.position);
            this.engine.camera.position.add(this.cameraOffset);
            this.engine.camera.rotation.copy(this.rotation);
        } else {
            // Third person camera (behind player)
            const offset = new THREE.Vector3(0, 2, -4);
            offset.applyEuler(this.rotation);
            this.engine.camera.position.copy(this.position).add(offset);
            this.engine.camera.lookAt(this.position);
        }
    }
    
    breakBlock() {
        if (this.breakCooldown > 0) return;
        
        const ray = this.raycast(this.reachDistance);
        const intersects = ray.intersectObjects(this.engine.scene.children, true);
        
        for (const intersect of intersects) {
            if (intersect.object.userData.chunk) {
                const point = intersect.point;
                const normal = intersect.face.normal;
                
                // Get block position (add small epsilon to normal)
                const blockX = Math.floor(point.x + normal.x * 0.5);
                const blockY = Math.floor(point.y + normal.y * 0.5);
                const blockZ = Math.floor(point.z + normal.z * 0.5);
                
                // Break the block
                if (window.world.setVoxel(blockX, blockY, blockZ, BlockType.AIR)) {
                    this.animationState = 'breaking';
                    this.breakCooldown = 0.3;
                    
                    // Add experience for breaking blocks
                    this.addExperience(1);
                    
                    // Play break effect
                    this.playBreakEffect(blockX, blockY, blockZ);
                    
                    setTimeout(() => {
                        if (this.animationState === 'breaking') {
                            this.animationState = 'idle';
                        }
                    }, 300);
                    
                    break;
                }
            }
        }
    }
    
    placeBlock() {
        if (this.placeCooldown > 0) return;
        
        const ray = this.raycast(this.reachDistance);
        const intersects = ray.intersectObjects(this.engine.scene.children, true);
        
        for (const intersect of intersects) {
            if (intersect.object.userData.chunk) {
                const point = intersect.point;
                const normal = intersect.face.normal;
                
                // Get placement position
                const blockX = Math.floor(point.x + normal.x * 0.5);
                const blockY = Math.floor(point.y + normal.y * 0.5);
                const blockZ = Math.floor(point.z + normal.z * 0.5);
                
                // Check if player is not occupying this space
                const playerBox = this.getBoundingBox();
                const blockBox = new THREE.Box3(
                    new THREE.Vector3(blockX, blockY, blockZ),
                    new THREE.Vector3(blockX + 1, blockY + 1, blockZ + 1)
                );
                
                if (!playerBox.intersectsBox(blockBox)) {
                    // Place the block
                    if (window.world.setVoxel(blockX, blockY, blockZ, this.selectedBlock)) {
                        this.animationState = 'placing';
                        this.placeCooldown = 0.3;
                        
                        // Play place effect
                        this.playPlaceEffect(blockX, blockY, blockZ);
                        
                        setTimeout(() => {
                            if (this.animationState === 'placing') {
                                this.animationState = 'idle';
                            }
                        }, 300);
                        
                        break;
                    }
                }
            }
        }
    }
    
    playBreakEffect(x, y, z) {
        // Create particle effect
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 8; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.set(x + 0.5, y + 0.5, z + 0.5);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5,
                (Math.random() - 0.5) * 5
            );
            
            this.engine.addMesh(particle);
            
            // Animate particle
            const startTime = performance.now();
            const animate = () => {
                const elapsed = (performance.now() - startTime) / 1000;
                if (elapsed < 1) {
                    particle.position.add(velocity.clone().multiplyScalar(0.016));
                    velocity.y -= 9.8 * 0.016;
                    particle.rotation.x += 0.1;
                    particle.rotation.y += 0.1;
                    requestAnimationFrame(animate);
                } else {
                    this.engine.removeMesh(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            };
            animate();
        }
    }
    
    playPlaceEffect(x, y, z) {
        // Simple placement effect
        const geometry = new THREE.RingGeometry(0.3, 0.5, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide 
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.set(x + 0.5, y + 0.01, z + 0.5);
        ring.rotation.x = -Math.PI / 2;
        
        this.engine.addMesh(ring);
        
        // Fade out effect
        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            if (elapsed < 0.5) {
                ring.material.opacity = 0.5 * (1 - elapsed * 2);
                ring.scale.set(1 + elapsed * 4, 1 + elapsed * 4, 1);
                requestAnimationFrame(animate);
            } else {
                this.engine.removeMesh(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        animate();
    }
    
    toggleInventory() {
        // Toggle inventory UI (simplified)
        console.log('Inventory:', this.inventory.map(b => BlockProperties[b]?.name || 'Unknown'));
    }
    
    // Get player stats for UI
    getStats() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            hunger: this.hunger,
            level: this.level,
            experience: this.experience,
            selectedBlock: BlockProperties[this.selectedBlock]?.name || 'Unknown'
        };
    }
}

// Export for use in other files
window.Player = Player;