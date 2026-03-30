// NPC Character Class
class NPC extends Character {
    constructor(position, type = 'villager') {
        super(position);
        this.type = type;
        this.aiState = 'idle';
        this.targetPosition = null;
        this.waypoints = [];
        this.currentWaypoint = 0;
        this.interactionRadius = 3;
        this.dialogue = [];
        this.tradeItems = [];
        
        this.setupNPC();
    }
    
    setupNPC() {
        switch(this.type) {
            case 'villager':
                this.setupVillager();
                break;
            case 'monster':
                this.setupMonster();
                break;
            case 'animal':
                this.setupAnimal();
                break;
            default:
                this.setupVillager();
        }
    }
    
    setupVillager() {
        // Villager appearance
        const colors = {
            body: 0x8B4513, // Brown
            head: 0xf1c40f, // Yellow
            arms: 0x8B4513,
            legs: 0x2c3e50 // Dark blue
        };
        
        this.updateColors(colors);
        
        // Dialogue options
        this.dialogue = [
            "Hello traveler!",
            "Nice weather we're having.",
            "Be careful in the caves!",
            "I have some goods for trade.",
            "Have you seen the village elder?"
        ];
        
        // Trade items
        this.tradeItems = [
            { give: BlockType.STONE, receive: BlockType.IRON_ORE, amount: 3 },
            { give: BlockType.WOOD, receive: BlockType.COAL_ORE, amount: 2 },
            { give: BlockType.SAND, receive: BlockType.GLASS, amount: 1 }
        ];
    }
    
    setupMonster() {
        // Monster appearance
        const colors = {
            body: 0x2c3e50, // Dark
            head: 0xe74c3c, // Red
            arms: 0x2c3e50,
            legs: 0x2c3e50
        };
        
        this.updateColors(colors);
        
        // Monster properties
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 10;
        this.attackRange = 2;
        this.attackCooldown = 0;
        this.aggressionRange = 10;
    }
    
    setupAnimal() {
        // Animal appearance
        const colors = {
            body: 0xf1c40f, // Yellow
            head: 0xf39c12, // Orange
            arms: 0xf1c40f,
            legs: 0x8B4513
        };
        
        this.updateColors(colors);
        
        // Animal properties
        this.health = 20;
        this.maxHealth = 20;
        this.fleeRange = 5;
        this.fleeSpeed = 8;
    }
    
    updateColors(colors) {
        // Update mesh colors based on type
        if (this.parts.body) this.parts.body.material.color.setHex(colors.body);
        if (this.parts.head) this.parts.head.material.color.setHex(colors.head);
        if (this.parts.leftArm) this.parts.leftArm.material.color.setHex(colors.arms);
        if (this.parts.rightArm) this.parts.rightArm.material.color.setHex(colors.arms);
        if (this.parts.leftLeg) this.parts.leftLeg.material.color.setHex(colors.legs);
        if (this.parts.rightLeg) this.parts.rightLeg.material.color.setHex(colors.legs);
    }
    
    update(delta) {
        // Update AI
        this.updateAI(delta);
        
        // Update parent class
        super.update(delta);
    }
    
    updateAI(delta) {
        switch(this.aiState) {
            case 'idle':
                this.idleState(delta);
                break;
            case 'walking':
                this.walkingState(delta);
                break;
            case 'fleeing':
                this.fleeingState(delta);
                break;
            case 'chasing':
                this.chasingState(delta);
                break;
            case 'attacking':
                this.attackingState(delta);
                break;
            case 'trading':
                this.tradingState(delta);
                break;
        }
    }
    
    idleState(delta) {
        this.stop();
        
        // Randomly decide to start walking
        if (Math.random() < 0.001) {
            this.setRandomWaypoint();
            this.aiState = 'walking';
        }
    }
    
    walkingState(delta) {
        if (!this.targetPosition) {
            this.aiState = 'idle';
            return;
        }
        
        // Move towards target
        const direction = new THREE.Vector3();
        direction.subVectors(this.targetPosition, this.position);
        direction.y = 0;
        
        if (direction.length() < 0.5) {
            // Reached target
            this.aiState = 'idle';
            this.targetPosition = null;
        } else {
            direction.normalize();
            this.move(direction);
        }
        
        // Check for player interaction
        const player = this.findPlayer();
        if (player) {
            const distance = this.position.distanceTo(player.position);
            
            switch(this.type) {
                case 'villager':
                    if (distance < this.interactionRadius) {
                        this.aiState = 'trading';
                        this.lookAt(player.position);
                    }
                    break;
                    
                case 'monster':
                    if (distance < this.aggressionRange) {
                        this.aiState = 'chasing';
                    }
                    break;
                    
                case 'animal':
                    if (distance < this.fleeRange) {
                        this.aiState = 'fleeing';
                    }
                    break;
            }
        }
    }
    
    fleeingState(delta) {
        const player = this.findPlayer();
        if (!player) {
            this.aiState = 'idle';
            return;
        }
        
        // Run away from player
        const direction = new THREE.Vector3();
        direction.subVectors(this.position, player.position);
        direction.y = 0;
        direction.normalize();
        
        this.move(direction, this.fleeSpeed, true);
        
        // Check if far enough
        const distance = this.position.distanceTo(player.position);
        if (distance > this.fleeRange * 2) {
            this.aiState = 'idle';
        }
    }
    
    chasingState(delta) {
        const player = this.findPlayer();
        if (!player) {
            this.aiState = 'idle';
            return;
        }
        
        // Move towards player
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, this.position);
        direction.y = 0;
        
        const distance = direction.length();
        
        if (distance > this.attackRange) {
            direction.normalize();
            this.move(direction, this.moveSpeed * 1.5, true);
        } else {
            // Close enough to attack
            this.aiState = 'attacking';
        }
        
        // Lost interest
        if (distance > this.aggressionRange * 2) {
            this.aiState = 'idle';
        }
    }
    
    attackingState(delta) {
        const player = this.findPlayer();
        if (!player) {
            this.aiState = 'idle';
            return;
        }
        
        // Look at player
        this.lookAt(player.position);
        
        // Attack cooldown
        this.attackCooldown -= delta;
        
        if (this.attackCooldown <= 0) {
            const distance = this.position.distanceTo(player.position);
            
            if (distance <= this.attackRange) {
                // Attack player
                player.takeDamage(this.damage);
                this.attackCooldown = 1.0;
                
                // Attack animation
                this.animationState = 'breaking';
                setTimeout(() => {
                    this.animationState = 'idle';
                }, 300);
            } else {
                // Move closer
                this.aiState = 'chasing';
            }
        }
    }
    
    tradingState(delta) {
        // Stop moving
        this.stop();
        
        // Simple trading logic
        if (Math.random() < 0.01) {
            console.log(`${this.type} says: ${this.getRandomDialogue()}`);
        }
        
        // Check if player moved away
        const player = this.findPlayer();
        if (player) {
            const distance = this.position.distanceTo(player.position);
            if (distance > this.interactionRadius * 1.5) {
                this.aiState = 'idle';
            }
        }
    }
    
    findPlayer() {
        if (window.player) {
            return window.player;
        }
        return null;
    }
    
    setRandomWaypoint() {
        // Generate random position around NPC
        const radius = 5 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        
        this.targetPosition = new THREE.Vector3(
            this.position.x + Math.cos(angle) * radius,
            this.position.y,
            this.position.z + Math.sin(angle) * radius
        );
    }
    
    lookAt(target) {
        const direction = new THREE.Vector3();
        direction.subVectors(target, this.position);
        direction.y = 0;
        
        if (direction.length() > 0) {
            this.rotation.y = Math.atan2(direction.x, direction.z);
        }
    }
    
    getRandomDialogue() {
        return this.dialogue[Math.floor(Math.random() * this.dialogue.length)];
    }
    
    // NPC specific methods
    interact() {
        switch(this.type) {
            case 'villager':
                return this.getTradeOptions();
            case 'monster':
                return this.getCombatInfo();
            case 'animal':
                return this.getAnimalInfo();
            default:
                return null;
        }
    }
    
    getTradeOptions() {
        return {
            dialogue: this.getRandomDialogue(),
            trades: this.tradeItems
        };
    }
    
    getCombatInfo() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            damage: this.damage,
            type: this.type
        };
    }
    
    getAnimalInfo() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            type: this.type
        };
    }
    
    // Spawn point
    static spawnVillager(position) {
        return new NPC(position, 'villager');
    }
    
    static spawnMonster(position) {
        return new NPC(position, 'monster');
    }
    
    static spawnAnimal(position) {
        return new NPC(position, 'animal');
    }
}

// NPC Manager
class NPCManager {
    constructor(engine) {
        this.engine = engine;
        this.npcs = [];
        this.spawnRadius = 50;
        this.maxNPCs = 20;
        this.spawnTimer = 0;
        this.spawnInterval = 5; // seconds
    }
    
    update(delta) {
        // Update all NPCs
        this.npcs.forEach(npc => npc.update(delta));
        
        // Spawn new NPCs
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval && this.npcs.length < this.maxNPCs) {
            this.spawnRandomNPC();
            this.spawnTimer = 0;
        }
        
        // Remove dead or distant NPCs
        this.cleanupNPCs();
    }
    
    spawnRandomNPC() {
        // Get player position
        const playerPos = window.player ? window.player.position : new THREE.Vector3();
        
        // Random position around player
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * this.spawnRadius;
        
        const position = new THREE.Vector3(
            playerPos.x + Math.cos(angle) * distance,
            50, // Ground level
            playerPos.z + Math.sin(angle) * distance
        );
        
        // Random NPC type
        const types = ['villager', 'monster', 'animal'];
        const weights = [0.5, 0.3, 0.2]; // Probability weights
        
        let random = Math.random();
        let type = 'villager';
        
        if (random < weights[2]) {
            type = 'animal';
        } else if (random < weights[1] + weights[2]) {
            type = 'monster';
        }
        
        this.spawnNPC(position, type);
    }
    
    spawnNPC(position, type) {
        const npc = new NPC(position, type);
        this.npcs.push(npc);
        this.engine.addMesh(npc.mesh);
        
        console.log(`Spawned ${type} at`, position);
    }
    
    cleanupNPCs() {
        const playerPos = window.player ? window.player.position : new THREE.Vector3();
        
        this.npcs = this.npcs.filter(npc => {
            const distance = npc.position.distanceTo(playerPos);
            
            // Remove if too far or dead
            if (distance > this.spawnRadius * 3 || npc.health <= 0) {
                this.engine.removeMesh(npc.mesh);
                npc.mesh.geometry.dispose();
                npc.mesh.material.dispose();
                return false;
            }
            
            return true;
        });
    }
    
    getNPCsInRadius(position, radius) {
        return this.npcs.filter(npc => {
            return npc.position.distanceTo(position) <= radius;
        });
    }
}

// Export for use in other files
window.NPC = NPC;
window.NPCManager = NPCManager;