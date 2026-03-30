// Voxel Data Structure and Block Types
class Voxel {
    constructor(x, y, z, type = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.type = type;
        this.lightLevel = 15; // 0-15
        this.sunlight = 15;  // 0-15
        this.metadata = {};
    }
    
    isEmpty() {
        return this.type === 0;
    }
    
    isSolid() {
        return this.type !== 0 && this.type !== 8 && this.type !== 9; // Not air, water, or lava
    }
    
    isTransparent() {
        return this.type === 0 || this.type === 8 || this.type === 9 || this.type === 10 || this.type === 11;
    }
}

// Block Types Registry
const BlockType = {
    AIR: 0,
    STONE: 1,
    DIRT: 2,
    GRASS: 3,
    SAND: 4,
    WOOD: 5,
    LEAVES: 6,
    WATER: 7,
    LAVA: 8,
    GLASS: 9,
    COAL_ORE: 10,
    IRON_ORE: 11,
    GOLD_ORE: 12,
    DIAMOND_ORE: 13,
    BEDROCK: 14,
    SNOW: 15,
    ICE: 16,
    CLAY: 17,
    GRAVEL: 18,
    BRICK: 19,
    STONE_BRICK: 20,
    WOOD_PLANKS: 21,
    COBBLESTONE: 22,
    MOSSY_COBBLESTONE: 23,
    OBSIDIAN: 24,
    QUARTZ: 25,
    GLOWSTONE: 26,
    SEA_LANTERN: 27,
    CONCRETE: 28,
    TERRACOTTA: 29,
    PRISMARINE: 30,
    DARK_PRISMARINE: 31,
    REDSTONE_ORE: 32,
    LAPIS_ORE: 33,
    EMERALD_ORE: 34
};

// Block Properties
const BlockProperties = {
    [BlockType.AIR]: {
        name: 'Air',
        transparent: true,
        solid: false,
        lightLevel: 0,
        hardness: 0,
        drop: null
    },
    [BlockType.STONE]: {
        name: 'Stone',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 1.5,
        drop: BlockType.COBBLESTONE,
        texture: { top: 'stone', bottom: 'stone', side: 'stone' }
    },
    [BlockType.DIRT]: {
        name: 'Dirt',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 0.5,
        drop: BlockType.DIRT,
        texture: { top: 'dirt', bottom: 'dirt', side: 'dirt' }
    },
    [BlockType.GRASS]: {
        name: 'Grass',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 0.6,
        drop: BlockType.DIRT,
        texture: { top: 'grass_top', bottom: 'dirt', side: 'grass_side' }
    },
    [BlockType.SAND]: {
        name: 'Sand',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 0.5,
        drop: BlockType.SAND,
        texture: { top: 'sand', bottom: 'sand', side: 'sand' }
    },
    [BlockType.WOOD]: {
        name: 'Wood',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 2.0,
        drop: BlockType.WOOD,
        texture: { top: 'wood_top', bottom: 'wood_top', side: 'wood_side' }
    },
    [BlockType.LEAVES]: {
        name: 'Leaves',
        transparent: true,
        solid: true,
        lightLevel: 0,
        hardness: 0.2,
        drop: BlockType.LEAVES,
        texture: { top: 'leaves', bottom: 'leaves', side: 'leaves' }
    },
    [BlockType.WATER]: {
        name: 'Water',
        transparent: true,
        solid: false,
        lightLevel: 0,
        hardness: 100,
        drop: null,
        texture: { top: 'water', bottom: 'water', side: 'water' }
    },
    [BlockType.LAVA]: {
        name: 'Lava',
        transparent: true,
        solid: false,
        lightLevel: 15,
        hardness: 100,
        drop: null,
        texture: { top: 'lava', bottom: 'lava', side: 'lava' }
    },
    [BlockType.GLASS]: {
        name: 'Glass',
        transparent: true,
        solid: true,
        lightLevel: 0,
        hardness: 0.3,
        drop: null,
        texture: { top: 'glass', bottom: 'glass', side: 'glass' }
    },
    [BlockType.COAL_ORE]: {
        name: 'Coal Ore',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 3.0,
        drop: 'coal',
        texture: { top: 'coal_ore', bottom: 'coal_ore', side: 'coal_ore' }
    },
    [BlockType.IRON_ORE]: {
        name: 'Iron Ore',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 3.0,
        drop: 'iron_ore',
        texture: { top: 'iron_ore', bottom: 'iron_ore', side: 'iron_ore' }
    },
    [BlockType.GLOWSTONE]: {
        name: 'Glowstone',
        transparent: true,
        solid: true,
        lightLevel: 15,
        hardness: 0.3,
        drop: BlockType.GLOWSTONE,
        texture: { top: 'glowstone', bottom: 'glowstone', side: 'glowstone' }
    }
};

// Block face definitions
const Faces = {
    TOP: { dir: [0, 1, 0], corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]] },
    BOTTOM: { dir: [0, -1, 0], corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]] },
    RIGHT: { dir: [1, 0, 0], corners: [[1,0,1], [1,0,0], [1,1,0], [1,1,1]] },
    LEFT: { dir: [-1, 0, 0], corners: [[0,0,0], [0,0,1], [0,1,1], [0,1,0]] },
    FRONT: { dir: [0, 0, 1], corners: [[0,0,1], [1,0,1], [1,1,1], [0,1,1]] },
    BACK: { dir: [0, 0, -1], corners: [[1,0,0], [0,0,0], [0,1,0], [1,1,0]] }
};

// Export for use in other files
window.Voxel = Voxel;
window.BlockType = BlockType;
window.BlockProperties = BlockProperties;
window.Faces = Faces;