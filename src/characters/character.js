// Base Character Class
class Character {
    constructor(position = new THREE.Vector3(0, 50, 0)) {
        this.position = position.clone();
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // Physics
        this.gravity = -20;
        this.jumpForce = 8;
        this.onGround = false;
        this.groundCheckDistance = 0.1;
        
        // Movement
        this.moveSpeed = 5;
        this.sprintSpeed = 8;
        this.friction = 0.8;
        
        // Health and stats
        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 100;
        this.level = 1;
        this.experience = 0;
        
        // Model
        this.mesh = null;
        this.animator = null;
        
        // Animation state
        this.animationState = 'idle';
        this.animationTime = 0;
        
        this.createMesh();
    }
    
    createMesh() {
        // Create a simple voxel-style character
        const group = new THREE.Group();
        
        // Body (main cube)
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf1c40f });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        head.castShadow = true;
        group.add(head);
        
        // Eyes
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.55, 0.3);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.55, 0.3);
        group.add(rightEye);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.55, 0.6, 0);
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.55, 0.6, 0);
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.35, 0.6, 0.35);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, -0.3, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, -0.3, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        
        // Store references for animation
        this.parts = {
            body,
            head,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            leftEye,
            rightEye
        };
    }
    
    update(delta) {
        // Update animation
        this.updateAnimation(delta);
        
        // Update physics
        this.updatePhysics(delta);
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.y;
    }
    
    updateAnimation(delta) {
        this.animationTime += delta;
        
        // Simple animation based on state
        switch (this.animationState) {
            case 'idle':
                this.parts.body.position.y = 0.6 + Math.sin(this.animationTime * 2) * 0.02;
                this.parts.head.position.y = 1.5 + Math.sin(this.animationTime * 2) * 0.02;
                break;
                
            case 'walking':
                const walkSpeed = 8;
                this.parts.leftLeg.rotation.x = Math.sin(this.animationTime * walkSpeed) * 0.5;
                this.parts.rightLeg.rotation.x = -Math.sin(this.animationTime * walkSpeed) * 0.5;
                this.parts.leftArm.rotation.x = -Math.sin(this.animationTime * walkSpeed) * 0.3;
                this.parts.rightArm.rotation.x = Math.sin(this.animationTime * walkSpeed) * 0.3;
                break;
                
            case 'running':
                const runSpeed = 12;
                this.parts.leftLeg.rotation.x = Math.sin(this.animationTime * runSpeed) * 0.8;
                this.parts.rightLeg.rotation.x = -Math.sin(this.animationTime * runSpeed) * 0.8;
                this.parts.leftArm.rotation.x = -Math.sin(this.animationTime * runSpeed) * 0.6;
                this.parts.rightArm.rotation.x = Math.sin(this.animationTime * runSpeed) * 0.6;
                break;
                
            case 'jumping':
                this.parts.leftArm.rotation.x = -Math.PI / 2;
                this.parts.rightArm.rotation.x = -Math.PI / 2;
                break;
                
            case 'breaking':
                this.parts.rightArm.rotation.x = Math.sin(this.animationTime * 20) * 0.5;
                this.parts.rightArm.rotation.z = -Math.PI / 4;
                break;
                
            case 'placing':
                this.parts.rightArm.rotation.x = -Math.PI / 4;
                this.parts.rightArm.rotation.z = Math.PI / 4;
                break;
        }
    }
    
    updatePhysics(delta) {
        // Apply gravity
        this.velocity.y += this.gravity * delta;
        
        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Ground check
        this.onGround = false;
        
        // Simple ground collision (should be improved with actual voxel collision)
        if (this.position.y < 50) { // Temporary ground level
            this.position.y = 50;
            this.velocity.y = 0;
            this.onGround = true;
        }
        
        // Friction
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;
    }
    
    move(direction, speed = this.moveSpeed, isSprinting = false) {
        const actualSpeed = isSprinting ? this.sprintSpeed : speed;
        
        this.velocity.x = direction.x * actualSpeed;
        this.velocity.z = direction.z * actualSpeed;
        
        this.animationState = isSprinting ? 'running' : 'walking';
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpForce;
            this.animationState = 'jumping';
        }
    }
    
    stop() {
        if (this.animationState === 'walking' || this.animationState === 'running') {
            this.animationState = 'idle';
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    addExperience(amount) {
        this.experience += amount;
        const nextLevel = this.level * 100;
        
        if (this.experience >= nextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.experience = 0;
        this.maxHealth += 10;
        this.health = this.maxHealth;
        
        console.log(`Level up! Now level ${this.level}`);
    }
    
    die() {
        console.log('Character died');
        // Respawn logic here
        this.health = this.maxHealth;
        this.position.set(0, 50, 0);
    }
    
    // Get bounding box for collision
    getBoundingBox() {
        return new THREE.Box3().setFromObject(this.mesh);
    }
    
    // Raycast for interaction
    raycast(range = 5) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.rotation);
        
        const raycaster = new THREE.Raycaster(this.position, direction, 0, range);
        return raycaster;
    }
}

// Export for use in other files
window.Character = Character;