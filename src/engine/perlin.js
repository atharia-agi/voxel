// Perlin Noise Implementation for Terrain Generation
class PerlinNoise {
    constructor(seed = Math.random() * 10000) {
        this.seed = seed;
        this.permutation = this.generatePermutation();
    }
    
    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }
        
        // Shuffle using seed
        let random = this.seededRandom(this.seed);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Duplicate for overflow
        return [...p, ...p];
    }
    
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(t, a, b) {
        return a + t * (b - a);
    }
    
    grad(hash, x, y, z = 0) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    // 2D Perlin noise
    perlin2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.permutation[X] + Y;
        const B = this.permutation[X + 1] + Y;
        
        return this.lerp(v,
            this.lerp(u, this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y)),
            this.lerp(u, this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1))
        );
    }
    
    // 3D Perlin noise
    perlin3D(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A] + Z;
        const AB = this.permutation[A + 1] + Z;
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B] + Z;
        const BB = this.permutation[B + 1] + Z;
        
        return this.lerp(w,
            this.lerp(v,
                this.lerp(u, this.grad(this.permutation[AA], x, y, z), this.grad(this.permutation[BA], x - 1, y, z)),
                this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z), this.grad(this.permutation[BB], x - 1, y - 1, z))
            ),
            this.lerp(v,
                this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1), this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.permutation[AB + 1], x, y - 1, z - 1), this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))
            )
        );
    }
    
    // Fractal Brownian Motion (FBM) for more natural noise
    fbm2D(x, y, octaves = 6, persistence = 0.5, lacunarity = 2.0) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.perlin2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        return total / maxValue;
    }
    
    // 3D FBM
    fbm3D(x, y, z, octaves = 6, persistence = 0.5, lacunarity = 2.0) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.perlin3D(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        return total / maxValue;
    }
    
    // Ridge noise for mountain-like features
    ridgeNoise(x, y) {
        return 1.0 - Math.abs(this.perlin2D(x, y));
    }
    
    // Valley noise
    valleyNoise(x, y) {
        return Math.abs(this.perlin2D(x, y));
    }
    
    // Terrain noise combining multiple noise functions
    terrainNoise(x, y) {
        const base = this.fbm2D(x * 0.01, y * 0.01, 6, 0.5, 2.0);
        const mountains = this.fbm2D(x * 0.005, y * 0.005, 4, 0.6, 2.2);
        const valleys = this.valleyNoise(x * 0.02, y * 0.02);
        
        let terrain = base * 0.5;
        terrain += mountains * 0.3;
        terrain -= valleys * 0.2;
        
        return terrain;
    }
}

// Simplex Noise (alternative implementation)
class SimplexNoise {
    constructor(seed = Math.random() * 10000) {
        this.seed = seed;
        this.p = this.buildPermutationTable();
    }
    
    buildPermutationTable() {
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        
        let random = this.seededRandom(this.seed);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        const perm = new Uint8Array(512);
        const permMod12 = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            perm[i] = p[i & 255];
            permMod12[i] = perm[i] % 12;
        }
        
        return { perm, permMod12 };
    }
    
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    // 2D Simplex noise
    noise2D(x, y) {
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;
        
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        
        const ii = i & 255;
        const jj = j & 255;
        
        const gi0 = this.p.permMod12[ii + this.p.perm[jj]];
        const gi1 = this.p.permMod12[ii + i1 + this.p.perm[jj + j1]];
        const gi2 = this.p.permMod12[ii + 1 + this.p.perm[jj + 1]];
        
        let n0 = 0, n1 = 0, n2 = 0;
        
        let t0 = 0.5 - x0*x0 - y0*y0;
        if (t0 >= 0) {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        
        let t1 = 0.5 - x1*x1 - y1*y1;
        if (t1 >= 0) {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        
        let t2 = 0.5 - x2*x2 - y2*y2;
        if (t2 >= 0) {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        
        return 70.0 * (n0 + n1 + n2);
    }
    
    get grad3() {
        return [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
    }
    
    dot(g, x, y) {
        return g[0]*x + g[1]*y;
    }
}

// Export for use in other files
window.PerlinNoise = PerlinNoise;
window.SimplexNoise = SimplexNoise;