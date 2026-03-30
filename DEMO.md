# Voxel Engine Pro - Demo Guide

## Quick Start

### 1. Direct Browser Open (Simplest)
Buka file `index.html` langsung di browser web Anda. Beberapa fitur mungkin memerlukan local server.

### 2. Local Server (Recommended)
Untuk fitur lengkap, jalankan local server:

```bash
# Menggunakan Python 3
python -m http.server 8000

# Atau menggunakan Node.js
npx http-server -p 8000

# Atau menggunakan PHP
php -S localhost:8000
```

Kemudian buka: `http://localhost:8000`

### 3. Install Dependencies (Optional)
```bash
npm install
npm start
```

## Demo Features

### 🎮 Basic Controls
1. **Mouse Click** pada game canvas untuk mengunci kursor
2. **ESC** untuk melepas kunci kursor
3. **WASD** untuk bergerak
4. **Mouse** untuk melihat sekeliling
5. **Space** untuk melompat
6. **Shift** untuk berlari

### 🏗️ Building & Mining
1. **Left Click** pada blok untuk menghancurkan
2. **Right Click** untuk menempatkan blok
3. **1-9** untuk memilih blok dari hotbar
4. **E** untuk membuka inventory (di console)

### 🌍 World Features
1. **Regenerate World** - Buat dunia baru dengan seed acak
2. **Toggle Lighting** - Hidup/matikan sistem pencahayaan
3. **Toggle Shadows** - Hidup/matikan bayangan
4. **Wireframe** - Tampilkan garis geometri
5. **Day/Night** - Ganti siang/malam

### 👥 NPC Interaction
1. **Spawn Character** - Spawn NPC villager
2. Mendekati NPC untuk berinteraksi
3. NPC akan bergerak dan berpatroli secara acak
4. Monster akan mengejar jika terlalu dekat

## Demo Scenes

### Scene 1: Basic Terrain
- Dunia dengan berbagai biome
- Pohon, batu, dan vegetasi
- System pencahayaan dinamis

### Scene 2: Building
- Tempatkan berbagai jenis blok
- Buat struktur sederhana
- Lihat sistem bayangan

### Scene 3: NPC System
- Spawn berbagai tipe NPC
- Amati perilaku AI mereka
- Interaksi dengan NPC

### Scene 4: Day/Night Cycle
- Amati perubahan langit
- Bayangan bergerak dengan matahari
- NPC bereaksi terhadap waktu

## Performance Tips

### Untuk Komputer Lambat:
1. Turunkan render distance di `src/engine/core.js`:
   ```javascript
   this.settings.renderDistance = 6; // dari 8
   ```
2. Matikan shadows:
   ```javascript
   this.settings.enableShadows = false;
   ```
3. Matikan lighting complex:
   ```javascript
   this.settings.enableAO = false;
   ```

### Untuk Komputer Cepat:
1. Tingkatkan render distance:
   ```javascript
   this.settings.renderDistance = 12; // dari 8
   ```
2. Aktifkan semua fitur visual
3. Gunakan resolusi tinggi

## Customization Demo

### Adding Custom Blocks
1. Edit `src/engine/voxel.js`
2. Tambahkan block type baru:
   ```javascript
   const BlockType = {
       // ... existing blocks
       MY_CUSTOM_BLOCK: 35
   };
   ```
3. Tambahkan properties:
   ```javascript
   const BlockProperties = {
       [BlockType.MY_CUSTOM_BLOCK]: {
           name: 'My Custom Block',
           transparent: false,
           solid: true,
           // ... other properties
       }
   };
   ```

### Adding Custom Textures
1. Edit `src/assets/texture-manager.js`
2. Tambahkan fungsi texture baru:
   ```javascript
   createMyCustomTexture() {
       const canvas = document.createElement('canvas');
       canvas.width = 16;
       canvas.height = 16;
       const ctx = canvas.getContext('2d');
       // ... draw texture
       return canvas;
   }
   ```
3. Tambahkan ke palette:
   ```javascript
   textures.my_custom = this.createMyCustomTexture();
   ```

### Adding Custom NPCs
1. Edit `src/characters/npc.js`
2. Tambahkan setup method:
   ```javascript
   setupMyNPC() {
       const colors = {
           body: 0xFF0000,
           head: 0x00FF00,
           // ... etc
       };
       this.updateColors(colors);
   }
   ```
3. Tambahkan case di switch:
   ```javascript
   case 'mynpc':
       this.setupMyNPC();
       break;
   ```

## Testing Scenarios

### Scenario 1: Performance Test
1. Regenerate world beberapa kali
2. Bergerak cepat dengan sprint
3.观察 FPS di stats panel
4. Coba naikkan render distance

### Scenario 2: Lighting Test
1. Toggle lighting on/off
2. Ganti waktu siang/malam
3. Amati perubahan bayangan
4. Test dengan torch placement

### Scenario 3: NPC AI Test
1. Spawn beberapa NPC
2. Amati perilaku idle
3. Dekati untuk trigger interaksi
4. Test dengan monster spawn

### Scenario 4: Building Test
1. Pilih berbagai blok
2. Buat struktur sederhana
3. Amati sistem bayangan
4. Test dengan glass transparency

## Troubleshooting

### Masalah: Game tidak jalan
**Solusi:**
1. Pastikan browser mendukung WebGL
2. Update browser ke versi terbaru
3. Clear cache browser
4. Gunakan Chrome atau Firefox

### Masalah: FPS rendah
**Solusi:**
1. Turunkan render distance
2. Matikan shadows
3. Tutup tab lain
4. Update graphics driver

### Masalah: Texture tidak muncul
**Solusi:**
1. Pastikan canvas diizinkan oleh browser
2. Check console untuk error
3. Coba local server instead of file://

### Masalah: Controls tidak responsif
**Solusi:**
1. Click pada game canvas untuk lock pointer
2. Check jika ada elemen lain yang focused
3. Refresh halaman

## Advanced Features

### Custom World Presets
1. Edit `world/preset-world.json`
2. Modify biomes, structures, ores
3. Regenerate world untuk apply changes

### Modding Support
1. Create custom JS files di `src/custom/`
2. Load setelah main.js
3. Override atau extend classes yang ada

### Export/Import World
1. Implementasikan save/load system
2. Gunakan localStorage atau IndexedDB
3. Export ke JSON untuk sharing

## Next Steps

Setelah mencoba demo:
1. Explore source code untuk memahami implementasi
2. Modifikasi untuk fitur baru
3. Share hasil dengan komunitas
4. Contribute ke proyek

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Voxel Game Development](https://github.com/illuminance/voxel-game-development)
- [Procedural Generation](https://www.redblobgames.com/)

---

**Happy Voxel Crafting!** 🎮⛏️