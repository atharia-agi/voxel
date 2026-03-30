# Voxel Engine Pro 🎮

AAA-quality voxel game engine that runs in the browser. Inspired by Minecraft with modern rendering features.

## Features

### Core Engine
- **Chunk-based world generation** with infinite terrain
- **Procedural terrain** using Perlin noise
- **Dynamic lighting** with day/night cycle
- **Shadow mapping** for realistic shadows
- **Ambient occlusion** for depth
- **Multiple biomes** (forest, desert, snow, plains)

### Gameplay
- **Player controls** with WASD movement, mouse look, jumping
- **Block placement/breaking** with cooldowns
- **Inventory system** with hotbar
- **NPCs** (villagers, monsters, animals) with AI
- **Trading system** with villagers
- **Combat system** with health and damage

### Graphics
- **Procedural textures** (stone, dirt, grass, wood, etc.)
- **Particle effects** for block breaking/placing
- **Fog effects** for depth
- **Real-time shadows**
- **Day/night cycle** with dynamic sky colors

### Optimization
- **Chunk loading/unloading** based on render distance
- **LOD system** (Level of Detail)
- **Frustum culling**
- **Vertex color lighting**
- **Efficient mesh generation**

## Controls

### Movement
- **W/A/S/D** - Move forward/left/backward/right
- **Mouse** - Look around
- **Space** - Jump
- **Shift** - Sprint

### Interaction
- **Left Click** - Break block
- **Right Click** - Place block
- **1-9** - Select block from hotbar
- **E** - Open inventory (console only)

### UI Controls
- **Regenerate World** - Creates new world with random seed
- **Toggle Lighting** - Enable/disable dynamic lighting
- **Toggle Shadows** - Enable/disable shadow mapping
- **Wireframe** - Toggle wireframe view
- **Spawn Character** - Spawn a villager NPC
- **Day/Night** - Toggle between day and night

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge)
- WebGL support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voxel-engine-pro.git
cd voxel-engine-pro
```

2. Install dependencies (optional, for development):
```bash
npm install
```

3. Start local server:
```bash
npm start
# or
npx http-server . -p 3000
```

4. Open browser:
```
http://localhost:3000
```

### Alternative: Direct Open
Simply open `index.html` in your browser (some features may require a local server).

## Project Structure

```
voxel-engine-pro/
├── index.html              # Main HTML file
├── package.json            # Project configuration
├── README.md              # Documentation
├── src/
│   ├── engine/
│   │   ├── core.js        # Engine core (VoxelEngine class)
│   │   ├── voxel.js       # Voxel/block definitions
│   │   ├── chunk.js       # Chunk system
│   │   ├── world.js       # World generation
│   │   ├── lighting.js    # Lighting system
│   │   └── perlin.js      # Perlin noise implementation
│   ├── characters/
│   │   ├── character.js   # Base character class
│   │   ├── player.js      # Player controls
│   │   └── npc.js         # NPC AI system
│   ├── assets/
│   │   ├── texture-manager.js  # Procedural texture generation
│   │   └── model-loader.js     # 3D model loading
│   └── game/
│       └── main.js        # Game initialization
├── assets/
│   ├── textures/          # Texture files (if any)
│   ├── models/            # 3D model files
│   └── characters/        # Character assets
├── world/                 # World data files
└── examples/              # Example files
```

## Block Types

The engine supports various block types:

| ID | Name | Properties |
|---|---|---|
| 0 | Air | Transparent, non-solid |
| 1 | Stone | Solid, mineable |
| 2 | Dirt | Solid, mineable |
| 3 | Grass | Solid, surface block |
| 4 | Sand | Solid, affected by gravity |
| 5 | Wood | Solid, flammable |
| 6 | Leaves | Transparent, flammable |
| 7 | Water | Liquid, transparent |
| 8 | Lava | Liquid, light source |
| 9 | Glass | Transparent, fragile |
| 10-34 | Ores & Others | Various properties |

## NPC Types

### Villager
- Trades with player
- Roams around spawn
- Dialogue system

### Monster
- Aggressive AI
- Chases player
- Deals damage

### Animal
- Passive AI
- Flees from player
- Can be hunted

## Performance Tips

1. **Adjust render distance** in `src/engine/core.js`:
```javascript
this.settings = {
    renderDistance: 8, // Lower for better performance
    chunkSize: 16,    // Keep at 16 for compatibility
};
```

2. **Disable shadows** for low-end devices:
```javascript
this.settings.enableShadows = false;
```

3. **Reduce max chunks per frame**:
```javascript
this.settings.maxChunksPerFrame = 2;
```

## Customization

### Adding New Blocks
Edit `src/engine/voxel.js`:
```javascript
const BlockType = {
    // Add your block
    MY_BLOCK: 35,
};

const BlockProperties = {
    [BlockType.MY_BLOCK]: {
        name: 'My Block',
        transparent: false,
        solid: true,
        lightLevel: 0,
        hardness: 1.0,
        drop: BlockType.MY_BLOCK,
        texture: { top: 'my_top', bottom: 'my_bottom', side: 'my_side' }
    }
};
```

### Adding New Textures
Edit `src/assets/texture-manager.js`:
```javascript
createProceduralTextures() {
    // Add your texture
    textures.my_texture = this.createNoiseTexture(255, 0, 0, 0.5);
}
```

### Adding New NPCs
Edit `src/characters/npc.js`:
```javascript
setupNPC() {
    // Add new NPC type
    case 'merchant':
        this.setupMerchant();
        break;
}
```

## Technical Details

### Rendering Pipeline
1. World divided into 16x16x16 chunks
2. Each chunk generates mesh on-demand
3. Mesh only includes visible faces
4. Vertex colors for lighting
5. Frustum culling for performance

### Lighting System
- **Sunlight**: Floods from sky downward
- **Block lights**: Emitters (torches, lava)
- **Ambient occlusion**: Voxel-based
- **Shadow mapping**: Real-time

### World Generation
1. Perlin noise for heightmap
2. Biome selection based on temperature/humidity
3. Cave generation using 3D noise
4. Ore placement
5. Tree generation

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Edge | ✅ Full |
| Safari | ✅ Partial |
| Mobile | ⚠️ Limited |

## Known Issues

1. **Mobile performance**: Limited by WebGL
2. **Memory usage**: Large worlds consume RAM
3. **Multiplayer**: Not yet implemented
4. **Save/Load**: Not yet implemented

## Future Features

- [ ] Multiplayer support
- [ ] World saving/loading
- [ ] More block types
- [ ] Advanced crafting system
- [ ] Physics engine improvements
- [ ] Sound system
- [ ] Modding support

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Credits

- **Three.js** - 3D rendering library
- **Perlin Noise** - Terrain generation algorithm
- **Minecraft** - Inspiration for voxel gameplay

## Contact

For questions, suggestions, or bug reports:
- GitHub Issues
- Email: your-email@example.com

---

**Happy Voxel Crafting!** 🎮⛏️