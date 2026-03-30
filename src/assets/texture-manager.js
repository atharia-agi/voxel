// Texture Manager for Voxel Engine
class TextureManager {
    constructor() {
        this.textures = new Map();
        this.atlas = null;
        this.atlasSize = 1024;
        this.textureSize = 16; // Each texture is 16x16 pixels
    }
    
    // Create procedural textures
    createProceduralTextures() {
        const textures = {};
        
        // Stone texture
        textures.stone = this.createNoiseTexture(128, 128, 128, 0.8);
        
        // Dirt texture
        textures.dirt = this.createNoiseTexture(139, 90, 43, 0.9);
        
        // Grass textures
        textures.grass_top = this.createGrassTopTexture();
        textures.grass_side = this.createGrassSideTexture();
        
        // Sand texture
        textures.sand = this.createNoiseTexture(237, 201, 175, 0.7);
        
        // Wood textures
        textures.wood_top = this.createWoodTopTexture();
        textures.wood_side = this.createWoodSideTexture();
        
        // Leaves texture
        textures.leaves = this.createNoiseTexture(34, 139, 34, 0.6);
        
        // Water texture
        textures.water = this.createWaterTexture();
        
        // Lava texture
        textures.lava = this.createLavaTexture();
        
        // Glass texture
        textures.glass = this.createGlassTexture();
        
        // Ore textures
        textures.coal_ore = this.createOreTexture(50, 50, 50);
        textures.iron_ore = this.createOreTexture(200, 200, 200);
        textures.gold_ore = this.createOreTexture(255, 215, 0);
        textures.diamond_ore = this.createOreTexture(0, 255, 255);
        
        // Cobblestone
        textures.cobblestone = this.createCobblestoneTexture();
        
        // Brick
        textures.brick = this.createBrickTexture();
        
        // Store textures
        for (const [name, canvas] of Object.entries(textures)) {
            this.textures.set(name, canvas);
        }
        
        return textures;
    }
    
    createNoiseTexture(r, g, b, variation = 0.1) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base color
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, 16, 16);
        
        // Add noise
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const noise = (Math.random() - 0.5) * 255 * variation;
                const nr = Math.max(0, Math.min(255, r + noise));
                const ng = Math.max(0, Math.min(255, g + noise));
                const nb = Math.max(0, Math.min(255, b + noise));
                
                ctx.fillStyle = `rgb(${nr}, ${ng}, ${nb})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        return canvas;
    }
    
    createGrassTopTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base green
        ctx.fillStyle = 'rgb(95, 159, 53)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add variations
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const noise = (Math.random() - 0.5) * 40;
                const g = Math.max(0, Math.min(255, 159 + noise));
                ctx.fillStyle = `rgb(${95 + noise}, ${g}, ${53 + noise})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        // Add grass details
        ctx.fillStyle = 'rgb(75, 139, 33)';
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillRect(x, y, 1, 1);
        }
        
        return canvas;
    }
    
    createGrassSideTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Dirt base
        ctx.fillStyle = 'rgb(139, 90, 43)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add dirt texture
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const noise = (Math.random() - 0.5) * 30;
                ctx.fillStyle = `rgb(${139 + noise}, ${90 + noise}, ${43 + noise})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        // Grass top
        ctx.fillStyle = 'rgb(95, 159, 53)';
        ctx.fillRect(0, 0, 16, 3);
        
        // Grass details on side
        ctx.fillStyle = 'rgb(75, 139, 33)';
        for (let x = 0; x < 16; x++) {
            if (Math.random() > 0.3) {
                ctx.fillRect(x, 3, 1, Math.floor(Math.random() * 2) + 1);
            }
        }
        
        return canvas;
    }
    
    createWoodTopTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base wood color
        ctx.fillStyle = 'rgb(150, 100, 50)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add rings
        const centerX = 8;
        const centerY = 8;
        
        for (let radius = 2; radius < 8; radius += 2) {
            ctx.strokeStyle = 'rgb(120, 80, 40)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Add texture
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const noise = (Math.random() - 0.5) * 20;
                const r = Math.max(0, Math.min(255, 150 + noise));
                const g = Math.max(0, Math.min(255, 100 + noise));
                const b = Math.max(0, Math.min(255, 50 + noise));
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        return canvas;
    }
    
    createWoodSideTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base wood color
        ctx.fillStyle = 'rgb(150, 100, 50)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add vertical lines
        for (let x = 0; x < 16; x += 2) {
            ctx.strokeStyle = 'rgb(120, 80, 40)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 16);
            ctx.stroke();
        }
        
        // Add texture
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const noise = (Math.random() - 0.5) * 20;
                const r = Math.max(0, Math.min(255, 150 + noise));
                const g = Math.max(0, Math.min(255, 100 + noise));
                const b = Math.max(0, Math.min(255, 50 + noise));
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        return canvas;
    }
    
    createWaterTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base water color
        ctx.fillStyle = 'rgba(30, 100, 200, 0.7)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add wave patterns
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const wave = Math.sin((x + y) * 0.5) * 20;
                const r = Math.max(0, Math.min(255, 30 + wave));
                const g = Math.max(0, Math.min(255, 100 + wave));
                const b = Math.max(0, Math.min(255, 200 + wave));
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        return canvas;
    }
    
    createLavaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base lava color
        ctx.fillStyle = 'rgb(255, 100, 0)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add hot spots
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const size = Math.floor(Math.random() * 3) + 1;
            
            ctx.fillStyle = 'rgb(255, 200, 0)';
            ctx.fillRect(x, y, size, size);
        }
        
        // Add texture
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const noise = (Math.random() - 0.5) * 50;
                const r = Math.max(0, Math.min(255, 255 + noise));
                const g = Math.max(0, Math.min(255, 100 + noise));
                const b = Math.max(0, Math.min(255, 0 + noise));
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        return canvas;
    }
    
    createGlassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Transparent base
        ctx.fillStyle = 'rgba(200, 230, 255, 0.3)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add glass reflection
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        
        // Diagonal lines
        for (let i = -16; i < 32; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 16, 16);
            ctx.stroke();
        }
        
        // Add border
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
        ctx.strokeRect(0.5, 0.5, 15, 15);
        
        return canvas;
    }
    
    createOreTexture(r, g, b) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Stone base
        ctx.fillStyle = 'rgb(128, 128, 128)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add stone texture
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const noise = (Math.random() - 0.5) * 20;
                ctx.fillStyle = `rgb(${128 + noise}, ${128 + noise}, ${128 + noise})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        // Add ore spots
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const size = Math.floor(Math.random() * 2) + 1;
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, size, size);
        }
        
        return canvas;
    }
    
    createCobblestoneTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base color
        ctx.fillStyle = 'rgb(125, 125, 125)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add cobblestone pattern
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * 14);
            const y = Math.floor(Math.random() * 14);
            const w = Math.floor(Math.random() * 3) + 2;
            const h = Math.floor(Math.random() * 3) + 2;
            
            const shade = Math.random() * 30 - 15;
            ctx.fillStyle = `rgb(${125 + shade}, ${125 + shade}, ${125 + shade})`;
            ctx.fillRect(x, y, w, h);
            
            // Outline
            ctx.strokeStyle = 'rgb(90, 90, 90)';
            ctx.strokeRect(x, y, w, h);
        }
        
        return canvas;
    }
    
    createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Base color
        ctx.fillStyle = 'rgb(170, 86, 58)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Draw bricks
        const brickHeight = 4;
        const brickWidth = 8;
        const mortarSize = 1;
        
        for (let row = 0; row < 4; row++) {
            const offset = (row % 2) * (brickWidth / 2);
            
            for (let col = -1; col < 3; col++) {
                const x = col * brickWidth + offset;
                const y = row * brickHeight;
                
                // Brick
                const shade = Math.random() * 20 - 10;
                ctx.fillStyle = `rgb(${170 + shade}, ${86 + shade}, ${58 + shade})`;
                ctx.fillRect(x + mortarSize, y + mortarSize, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2);
                
                // Outline
                ctx.strokeStyle = 'rgb(100, 50, 30)';
                ctx.strokeRect(x + mortarSize, y + mortarSize, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2);
            }
        }
        
        return canvas;
    }
    
    // Create texture atlas
    createAtlas() {
        const atlas = document.createElement('canvas');
        atlas.width = this.atlasSize;
        atlas.height = this.atlasSize;
        const ctx = atlas.getContext('2d');
        
        // Create all textures
        this.createProceduralTextures();
        
        // Place textures in atlas
        let index = 0;
        for (const [name, textureCanvas] of this.textures) {
            const x = (index % 16) * this.textureSize;
            const y = Math.floor(index / 16) * this.textureSize;
            
            ctx.drawImage(textureCanvas, x, y);
            index++;
        }
        
        this.atlas = atlas;
        return atlas;
    }
    
    // Get texture from atlas
    getTextureUV(name) {
        const index = Array.from(this.textures.keys()).indexOf(name);
        if (index === -1) return { u: 0, v: 0 };
        
        const x = (index % 16) * this.textureSize;
        const y = Math.floor(index / 16) * this.textureSize;
        
        return {
            u: x / this.atlasSize,
            v: y / this.atlasSize,
            size: this.textureSize / this.atlasSize
        };
    }
    
    // Create Three.js texture from atlas
    createThreeTexture() {
        if (!this.atlas) {
            this.createAtlas();
        }
        
        const texture = new THREE.CanvasTexture(this.atlas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
}

// Export for use in other files
window.TextureManager = TextureManager;