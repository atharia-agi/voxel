// Model Loader for Voxel Engine
class ModelLoader {
    constructor() {
        this.models = new Map();
        this.cache = new Map();
    }
    
    // Create simple voxel models
    createVoxelModel(type, scale = 1) {
        const group = new THREE.Group();
        
        switch(type) {
            case 'tree':
                this.createTree(group, scale);
                break;
            case 'rock':
                this.createRock(group, scale);
                break;
            case 'flower':
                this.createFlower(group, scale);
                break;
            case 'grass':
                this.createGrass(group, scale);
                break;
            case 'cactus':
                this.createCactus(group, scale);
                break;
            case 'mushroom':
                this.createMushroom(group, scale);
                break;
            case 'chest':
                this.createChest(group, scale);
                break;
            case 'furnace':
                this.createFurnace(group, scale);
                break;
            case 'crafting_table':
                this.createCraftingTable(group, scale);
                break;
            case 'torch':
                this.createTorch(group, scale);
                break;
            default:
                return null;
        }
        
        return group;
    }
    
    createTree(group, scale) {
        // Trunk
        const trunkGeometry = new THREE.BoxGeometry(0.4 * scale, 2 * scale, 0.4 * scale);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1 * scale;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);
        
        // Leaves (simplified)
        const leavesGeometry = new THREE.BoxGeometry(1.5 * scale, 1.5 * scale, 1.5 * scale);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2.5 * scale;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);
        
        // Additional leaves
        const leaves2Geometry = new THREE.BoxGeometry(1.2 * scale, 1.2 * scale, 1.2 * scale);
        const leaves2 = new THREE.Mesh(leaves2Geometry, leavesMaterial);
        leaves2.position.set(0.5 * scale, 2 * scale, 0);
        leaves2.castShadow = true;
        group.add(leaves2);
        
        const leaves3 = new THREE.Mesh(leaves2Geometry, leavesMaterial);
        leaves3.position.set(-0.5 * scale, 2 * scale, 0);
        leaves3.castShadow = true;
        group.add(leaves3);
        
        group.userData.type = 'tree';
    }
    
    createRock(group, scale) {
        // Multiple rock cubes
        const rockGeometry = new THREE.BoxGeometry(1 * scale, 0.6 * scale, 1 * scale);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        
        const rock1 = new THREE.Mesh(rockGeometry, rockMaterial);
        rock1.position.set(0, 0.3 * scale, 0);
        rock1.castShadow = true;
        rock1.receiveShadow = true;
        group.add(rock1);
        
        const rock2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.6 * scale, 0.4 * scale, 0.6 * scale),
            rockMaterial
        );
        rock2.position.set(0.4 * scale, 0.2 * scale, 0.3 * scale);
        rock2.castShadow = true;
        group.add(rock2);
        
        const rock3 = new THREE.Mesh(
            new THREE.BoxGeometry(0.5 * scale, 0.3 * scale, 0.5 * scale),
            rockMaterial
        );
        rock3.position.set(-0.3 * scale, 0.15 * scale, -0.2 * scale);
        rock3.castShadow = true;
        group.add(rock3);
        
        group.userData.type = 'rock';
    }
    
    createFlower(group, scale) {
        // Stem
        const stemGeometry = new THREE.BoxGeometry(0.1 * scale, 0.5 * scale, 0.1 * scale);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25 * scale;
        group.add(stem);
        
        // Flower head
        const flowerGeometry = new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.3 * scale);
        const flowerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = 0.5 * scale;
        flower.castShadow = true;
        group.add(flower);
        
        // Center
        const centerGeometry = new THREE.BoxGeometry(0.15 * scale, 0.15 * scale, 0.15 * scale);
        const centerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.5 * scale;
        group.add(center);
        
        group.userData.type = 'flower';
    }
    
    createGrass(group, scale) {
        // Grass blades
        const grassGeometry = new THREE.BoxGeometry(0.05 * scale, 0.3 * scale, 0.05 * scale);
        const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
        
        for (let i = 0; i < 5; i++) {
            const blade = new THREE.Mesh(grassGeometry, grassMaterial);
            blade.position.set(
                (Math.random() - 0.5) * 0.3 * scale,
                0.15 * scale,
                (Math.random() - 0.5) * 0.3 * scale
            );
            blade.rotation.z = (Math.random() - 0.5) * 0.5;
            group.add(blade);
        }
        
        group.userData.type = 'grass';
    }
    
    createCactus(group, scale) {
        // Main cactus
        const cactusGeometry = new THREE.BoxGeometry(0.4 * scale, 1.5 * scale, 0.4 * scale);
        const cactusMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
        const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
        cactus.position.y = 0.75 * scale;
        cactus.castShadow = true;
        cactus.receiveShadow = true;
        group.add(cactus);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2 * scale, 0.6 * scale, 0.2 * scale);
        
        const arm1 = new THREE.Mesh(armGeometry, cactusMaterial);
        arm1.position.set(0.3 * scale, 1 * scale, 0);
        arm1.rotation.z = Math.PI / 4;
        arm1.castShadow = true;
        group.add(arm1);
        
        const arm2 = new THREE.Mesh(armGeometry, cactusMaterial);
        arm2.position.set(-0.3 * scale, 0.8 * scale, 0);
        arm2.rotation.z = -Math.PI / 4;
        arm2.castShadow = true;
        group.add(arm2);
        
        group.userData.type = 'cactus';
    }
    
    createMushroom(group, scale) {
        // Stem
        const stemGeometry = new THREE.BoxGeometry(0.2 * scale, 0.4 * scale, 0.2 * scale);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.2 * scale;
        group.add(stem);
        
        // Cap
        const capGeometry = new THREE.BoxGeometry(0.6 * scale, 0.3 * scale, 0.6 * scale);
        const capMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.5 * scale;
        cap.castShadow = true;
        group.add(cap);
        
        // Spots
        const spotGeometry = new THREE.BoxGeometry(0.1 * scale, 0.05 * scale, 0.1 * scale);
        const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        
        for (let i = 0; i < 5; i++) {
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            spot.position.set(
                (Math.random() - 0.5) * 0.4 * scale,
                0.55 * scale,
                (Math.random() - 0.5) * 0.4 * scale
            );
            group.add(spot);
        }
        
        group.userData.type = 'mushroom';
    }
    
    createChest(group, scale) {
        // Base
        const baseGeometry = new THREE.BoxGeometry(0.8 * scale, 0.4 * scale, 0.6 * scale);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.2 * scale;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Lid
        const lidGeometry = new THREE.BoxGeometry(0.8 * scale, 0.2 * scale, 0.6 * scale);
        const lid = new THREE.Mesh(lidGeometry, baseMaterial);
        lid.position.y = 0.5 * scale;
        lid.castShadow = true;
        group.add(lid);
        
        // Lock
        const lockGeometry = new THREE.BoxGeometry(0.1 * scale, 0.15 * scale, 0.05 * scale);
        const lockMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const lock = new THREE.Mesh(lockGeometry, lockMaterial);
        lock.position.set(0, 0.35 * scale, 0.325 * scale);
        group.add(lock);
        
        group.userData.type = 'chest';
    }
    
    createFurnace(group, scale) {
        // Base
        const baseGeometry = new THREE.BoxGeometry(0.8 * scale, 0.8 * scale, 0.8 * scale);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.4 * scale;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Front
        const frontGeometry = new THREE.BoxGeometry(0.6 * scale, 0.6 * scale, 0.1 * scale);
        const frontMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        const front = new THREE.Mesh(frontGeometry, frontMaterial);
        front.position.set(0, 0.4 * scale, 0.4 * scale);
        group.add(front);
        
        // Glow
        const glowGeometry = new THREE.BoxGeometry(0.4 * scale, 0.4 * scale, 0.05 * scale);
        const glowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF4500,
            emissiveIntensity: 0.5
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, 0.4 * scale, 0.43 * scale);
        group.add(glow);
        
        group.userData.type = 'furnace';
    }
    
    createCraftingTable(group, scale) {
        // Base
        const baseGeometry = new THREE.BoxGeometry(0.8 * scale, 0.8 * scale, 0.8 * scale);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.4 * scale;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Top grid
        const gridGeometry = new THREE.BoxGeometry(0.7 * scale, 0.05 * scale, 0.7 * scale);
        const gridMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.position.y = 0.825 * scale;
        group.add(grid);
        
        // Grid lines
        const lineGeometry = new THREE.BoxGeometry(0.05 * scale, 0.02 * scale, 0.7 * scale);
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        for (let i = 0; i < 2; i++) {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(-0.2 + i * 0.4, 0.835 * scale, 0);
            group.add(line);
        }
        
        const lineGeometry2 = new THREE.BoxGeometry(0.7 * scale, 0.02 * scale, 0.05 * scale);
        for (let i = 0; i < 2; i++) {
            const line = new THREE.Mesh(lineGeometry2, lineMaterial);
            line.position.set(0, 0.835 * scale, -0.2 + i * 0.4);
            group.add(line);
        }
        
        group.userData.type = 'crafting_table';
    }
    
    createTorch(group, scale) {
        // Stick
        const stickGeometry = new THREE.BoxGeometry(0.1 * scale, 0.6 * scale, 0.1 * scale);
        const stickMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stick = new THREE.Mesh(stickGeometry, stickMaterial);
        stick.position.y = 0.3 * scale;
        group.add(stick);
        
        // Flame
        const flameGeometry = new THREE.BoxGeometry(0.2 * scale, 0.3 * scale, 0.2 * scale);
        const flameMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFA500,
            emissive: 0xFFA500,
            emissiveIntensity: 1
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 0.75 * scale;
        group.add(flame);
        
        // Light source
        const light = new THREE.PointLight(0xFFA500, 1, 8);
        light.position.y = 0.75 * scale;
        group.add(light);
        
        group.userData.type = 'torch';
    }
    
    // Load model from JSON (simple format)
    loadFromJSON(json) {
        const group = new THREE.Group();
        
        json.blocks.forEach(block => {
            const geometry = new THREE.BoxGeometry(block.size || 1, block.size || 1, block.size || 1);
            const material = new THREE.MeshLambertMaterial({ color: block.color || 0xffffff });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(block.x || 0, block.y || 0, block.z || 0);
            mesh.rotation.set(block.rx || 0, block.ry || 0, block.rz || 0);
            mesh.scale.set(block.sx || 1, block.sy || 1, block.sz || 1);
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            group.add(mesh);
        });
        
        return group;
    }
    
    // Create custom model
    createCustomModel(blocks) {
        const group = new THREE.Group();
        
        blocks.forEach(block => {
            const geometry = new THREE.BoxGeometry(block.width || 1, block.height || 1, block.depth || 1);
            const material = new THREE.MeshLambertMaterial({ color: block.color || 0xffffff });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(block.x || 0, block.y || 0, block.z || 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            group.add(mesh);
        });
        
        return group;
    }
    
    // Cache model
    cacheModel(name, model) {
        this.models.set(name, model);
    }
    
    // Get cached model
    getCachedModel(name) {
        return this.models.get(name);
    }
    
    // Clone model
    cloneModel(name) {
        const original = this.models.get(name);
        if (original) {
            return original.clone();
        }
        return null;
    }
}

// Export for use in other files
window.ModelLoader = ModelLoader;