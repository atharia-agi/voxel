// Main Game Entry Point
class Game {
    constructor() {
        this.engine = null;
        this.world = null;
        this.player = null;
        this.npcManager = null;
        this.timeOfDay = 0.5; // Noon
        this.timeSpeed = 0.01; // Speed of day/night cycle
        
        this.init();
    }
    
    async init() {
        // Show loading screen
        this.updateLoadingScreen('Initializing engine...', 0);
        
        // Wait for DOM
        await this.waitForDOM();
        
        // Initialize engine
        this.updateLoadingScreen('Creating 3D engine...', 10);
        this.engine = new VoxelEngine(document.getElementById('game-canvas'));
        
        // Initialize world
        this.updateLoadingScreen('Generating world...', 30);
        this.world = new World(this.engine);
        window.world = this.world;
        
        // Initialize player
        this.updateLoadingScreen('Creating player...', 60);
        this.player = new Player(this.engine);
        window.player = this.player;
        this.engine.addMesh(this.player.mesh);
        
        // Initialize NPC manager
        this.updateLoadingScreen('Setting up NPCs...', 70);
        this.npcManager = new NPCManager(this.engine);
        window.characters = [];
        
        // Spawn some initial NPCs
        this.spawnInitialNPCs();
        
        // Initialize time of day
        this.updateLoadingScreen('Setting up day/night cycle...', 80);
        this.engine.setTimeOfDay(this.timeOfDay);
        
        // Setup UI
        this.updateLoadingScreen('Setting up UI...', 90);
        this.setupUI();
        
        // Setup world controls
        this.setupWorldControls();
        
        // Start game loop
        this.updateLoadingScreen('Starting game...', 100);
        await this.sleep(500);
        
        this.hideLoadingScreen();
        this.startGameLoop();
        
        console.log('🎮 Game initialized successfully!');
    }
    
    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateLoadingScreen(text, progress) {
        const loadingText = document.getElementById('loading-text');
        const loadingProgress = document.getElementById('loading-progress');
        
        if (loadingText) loadingText.textContent = text;
        if (loadingProgress) loadingProgress.style.width = `${progress}%`;
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    spawnInitialNPCs() {
        // Spawn some villagers
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const distance = 10 + Math.random() * 20;
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                50,
                Math.sin(angle) * distance
            );
            
            const villager = NPC.spawnVillager(position);
            this.npcManager.npcs.push(villager);
            this.engine.addMesh(villager.mesh);
        }
        
        // Spawn some animals
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 25;
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                50,
                Math.sin(angle) * distance
            );
            
            const animal = NPC.spawnAnimal(position);
            this.npcManager.npcs.push(animal);
            this.engine.addMesh(animal.mesh);
        }
        
        // Spawn a monster
        const monsterPos = new THREE.Vector3(20, 50, 20);
        const monster = NPC.spawnMonster(monsterPos);
        this.npcManager.npcs.push(monster);
        this.engine.addMesh(monster.mesh);
        
        window.characters = this.npcManager.npcs;
    }
    
    setupUI() {
        // Create hotbar UI
        this.createHotbarUI();
        
        // Create health/hunger bars
        this.createStatusBars();
        
        // Create crosshair
        this.createCrosshair();
        
        // Create minimap
        this.createMinimap();
    }
    
    createHotbarUI() {
        const hotbar = document.createElement('div');
        hotbar.id = 'hotbar';
        hotbar.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 2px;
            background: rgba(0, 0, 0, 0.5);
            padding: 4px;
            border-radius: 4px;
        `;
        
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.style.cssText = `
                width: 48px;
                height: 48px;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            // Add slot number
            const num = document.createElement('div');
            num.style.cssText = `
                position: absolute;
                top: 2px;
                left: 4px;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.7);
            `;
            num.textContent = i + 1;
            slot.appendChild(num);
            
            // Add block icon
            if (i < this.player.inventory.length) {
                const blockType = this.player.inventory[i];
                const blockName = BlockProperties[blockType]?.name || '';
                slot.title = blockName;
                slot.style.background = `rgba(${this.getBlockColor(blockType)}, 0.3)`;
            }
            
            // Highlight selected slot
            if (i === this.player.hotbarSlot) {
                slot.style.borderColor = '#FFD700';
                slot.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
            }
            
            slot.addEventListener('click', () => {
                this.player.hotbarSlot = i;
                this.player.selectedBlock = this.player.inventory[i];
                this.updateHotbarUI();
            });
            
            hotbar.appendChild(slot);
        }
        
        document.getElementById('game-container').appendChild(hotbar);
    }
    
    updateHotbarUI() {
        const hotbar = document.getElementById('hotbar');
        if (!hotbar) return;
        
        const slots = hotbar.querySelectorAll('.hotbar-slot');
        slots.forEach((slot, i) => {
            if (i === this.player.hotbarSlot) {
                slot.style.borderColor = '#FFD700';
                slot.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
            } else {
                slot.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                slot.style.boxShadow = 'none';
            }
        });
    }
    
    getBlockColor(blockType) {
        const colors = {
            [BlockType.STONE]: '128, 128, 128',
            [BlockType.DIRT]: '139, 90, 43',
            [BlockType.GRASS]: '95, 159, 53',
            [BlockType.SAND]: '237, 201, 175',
            [BlockType.WOOD]: '150, 100, 50',
            [BlockType.LEAVES]: '34, 139, 34',
            [BlockType.GLASS]: '200, 230, 255',
            [BlockType.COBBLESTONE]: '125, 125, 125',
            [BlockType.BRICK]: '170, 86, 58'
        };
        return colors[blockType] || '255, 255, 255';
    }
    
    createStatusBars() {
        const statusContainer = document.createElement('div');
        statusContainer.id = 'status-bars';
        statusContainer.style.cssText = `
            position: absolute;
            bottom: 140px;
            left: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        
        // Health bar
        const healthBar = this.createBar('Health', '#e74c3c', 100);
        healthBar.id = 'health-bar';
        statusContainer.appendChild(healthBar);
        
        // Hunger bar
        const hungerBar = this.createBar('Hunger', '#f39c12', 100);
        hungerBar.id = 'hunger-bar';
        statusContainer.appendChild(hungerBar);
        
        // Experience bar
        const expBar = this.createBar('Experience', '#3498db', 0);
        expBar.id = 'exp-bar';
        statusContainer.appendChild(expBar);
        
        document.getElementById('game-container').appendChild(statusContainer);
    }
    
    createBar(label, color, value) {
        const bar = document.createElement('div');
        bar.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        const labelEl = document.createElement('div');
        labelEl.style.cssText = `
            color: white;
            font-size: 12px;
            width: 70px;
        `;
        labelEl.textContent = label;
        bar.appendChild(labelEl);
        
        const track = document.createElement('div');
        track.style.cssText = `
            width: 150px;
            height: 8px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 4px;
            overflow: hidden;
        `;
        
        const fill = document.createElement('div');
        fill.style.cssText = `
            height: 100%;
            background: ${color};
            width: ${value}%;
            transition: width 0.3s;
        `;
        fill.className = 'bar-fill';
        
        track.appendChild(fill);
        bar.appendChild(track);
        
        return bar;
    }
    
    updateStatusBars() {
        const healthBar = document.querySelector('#health-bar .bar-fill');
        const hungerBar = document.querySelector('#hunger-bar .bar-fill');
        const expBar = document.querySelector('#exp-bar .bar-fill');
        
        if (healthBar) healthBar.style.width = `${this.player.health}%`;
        if (hungerBar) hungerBar.style.width = `${this.player.hunger}%`;
        if (expBar) {
            const expPercent = (this.player.experience / (this.player.level * 100)) * 100;
            expBar.style.width = `${expPercent}%`;
        }
    }
    
    createCrosshair() {
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        crosshair.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            pointer-events: none;
        `;
        
        // Horizontal line
        const hLine = document.createElement('div');
        hLine.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 2px;
            background: white;
            transform: translateY(-50%);
        `;
        
        // Vertical line
        const vLine = document.createElement('div');
        vLine.style.cssText = `
            position: absolute;
            left: 50%;
            top: 0;
            width: 2px;
            height: 100%;
            background: white;
            transform: translateX(-50%);
        `;
        
        crosshair.appendChild(hLine);
        crosshair.appendChild(vLine);
        document.getElementById('game-container').appendChild(crosshair);
    }
    
    createMinimap() {
        const minimap = document.createElement('div');
        minimap.id = 'minimap';
        minimap.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 150px;
            height: 150px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            overflow: hidden;
        `;
        
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        canvas.id = 'minimap-canvas';
        minimap.appendChild(canvas);
        
        document.getElementById('game-container').appendChild(minimap);
    }
    
    updateMinimap() {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const size = 150;
        const scale = 2; // Pixels per block
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        
        const playerX = this.player.position.x;
        const playerZ = this.player.position.z;
        
        // Draw terrain
        for (let z = -size/2/scale; z < size/2/scale; z++) {
            for (let x = -size/2/scale; x < size/2/scale; x++) {
                const worldX = Math.floor(playerX + x);
                const worldZ = Math.floor(playerZ + z);
                const height = this.world.getTerrainHeight(worldX, worldZ);
                
                const screenX = size/2 + x * scale;
                const screenY = size/2 + z * scale;
                
                // Color based on height
                if (height < this.world.settings.seaLevel) {
                    ctx.fillStyle = '#1e64c8'; // Water
                } else if (height < 40) {
                    ctx.fillStyle = '#5f9f35'; // Grass
                } else if (height < 60) {
                    ctx.fillStyle = '#8b5a2b'; // Dirt
                } else {
                    ctx.fillStyle = '#808080'; // Stone
                }
                
                ctx.fillRect(screenX, screenY, scale, scale);
            }
        }
        
        // Draw NPCs
        ctx.fillStyle = '#ff0000';
        this.npcManager.npcs.forEach(npc => {
            const dx = (npc.position.x - playerX) * scale;
            const dz = (npc.position.z - playerZ) * scale;
            const screenX = size/2 + dx;
            const screenY = size/2 + dz;
            
            if (screenX >= 0 && screenX < size && screenY >= 0 && screenY < size) {
                ctx.fillRect(screenX - 2, screenY - 2, 4, 4);
            }
        });
        
        // Draw player
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(size/2 - 3, size/2 - 3, 6, 6);
        
        // Draw direction
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size/2, size/2);
        const dirX = Math.sin(this.player.rotation.y) * 15;
        const dirZ = Math.cos(this.player.rotation.y) * 15;
        ctx.lineTo(size/2 + dirX, size/2 - dirZ);
        ctx.stroke();
    }
    
    setupWorldControls() {
        // Extend world with control methods
        this.world.toggleLighting = () => {
            this.engine.settings.enableLighting = !this.engine.settings.enableLighting;
            this.world.rebuildAllChunks();
            console.log('Lighting:', this.engine.settings.enableLighting ? 'ON' : 'OFF');
        };
        
        this.world.toggleShadows = () => {
            this.engine.settings.enableShadows = !this.engine.settings.enableShadows;
            this.engine.renderer.shadowMap.enabled = this.engine.settings.enableShadows;
            console.log('Shadows:', this.engine.settings.enableShadows ? 'ON' : 'OFF');
        };
        
        this.world.toggleWireframe = () => {
            const chunks = this.world.chunkManager.getLoadedChunks();
            chunks.forEach(chunk => {
                if (chunk.mesh) {
                    chunk.mesh.material.wireframe = !chunk.mesh.material.wireframe;
                }
            });
        };
        
        this.world.generate = () => {
            this.world.regenerate();
            console.log('World regenerated with new seed:', this.world.seed);
        };
        
        // Time of day controls
        window.timeOfDay = {
            toggle: () => {
                if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
                    this.timeOfDay = 0.5; // Day
                } else {
                    this.timeOfDay = 0; // Night
                }
                this.engine.setTimeOfDay(this.timeOfDay);
            },
            set: (time) => {
                this.timeOfDay = time;
                this.engine.setTimeOfDay(this.timeOfDay);
            }
        };
        
        // Character spawning
        window.character = {
            spawn: () => {
                const pos = new THREE.Vector3(
                    this.player.position.x + Math.random() * 10 - 5,
                    50,
                    this.player.position.z + Math.random() * 10 - 5
                );
                const npc = NPC.spawnVillager(pos);
                this.npcManager.npcs.push(npc);
                this.engine.addMesh(npc.mesh);
                window.characters = this.npcManager.npcs;
            }
        };
    }
    
    startGameLoop() {
        let lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            const delta = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Update time of day
            if (this.engine.settings.dayNightCycle) {
                this.timeOfDay += this.timeSpeed * delta;
                if (this.timeOfDay > 1) this.timeOfDay = 0;
                this.engine.setTimeOfDay(this.timeOfDay);
            }
            
            // Update player
            this.player.update(delta);
            
            // Update NPCs
            this.npcManager.update(delta);
            
            // Update UI
            this.updateStatusBars();
            this.updateMinimap();
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    window.game = new Game();
});

// Export for use in other files
window.Game = Game;