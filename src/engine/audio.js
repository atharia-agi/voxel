// Audio System for Voxel Engine
class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = {}; // buffer -> AudioBuffer
        this.soundInstances = []; // currently playing sounds
        this.masterVolume = 0.8;
        this.musicVolume = 0.5;
        this.enabled = true;
        
        // 3D audio settings
        this.listener = null;
        
        // Initialize audio context
        this.init();
    }
    
    init() {
        try {
            // Fix up for prefixing
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            
            // Create listener (if using panner nodes)
            this.listener = this.context.listener;
            
            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    // Load audio from URL (placeholder for now)
    loadSound(name, url) {
        if (!this.enabled) return Promise.resolve();
        
        // In a real implementation, we would fetch and decode the audio
        // For now, we'll create a placeholder sound
        return new Promise((resolve, reject) => {
            // Simulate loading
            setTimeout(() => {
                // Create a simple oscillator-based sound as placeholder
                const buffer = this.context.createBuffer(2, this.context.sampleRate, this.context.sampleRate);
                const left = buffer.getChannelData(0);
                const right = buffer.getChannelData(1);
                
                // Generate some noise
                for (let i = 0; i < buffer.length; i++) {
                    left[i] = Math.random() * 2 - 1;
                    right[i] = Math.random() * 2 - 1;
                }
                
                this.sounds[name] = buffer;
                resolve();
            }, 100);
        });
    }
    
    // Play a sound
    playSound(name, options = {}) {
        if (!this.enabled || !this.sounds[name]) return null;
        
        const source = this.context.createBufferSource();
        source.buffer = this.sounds[name];
        
        // Create gain node for volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = this.masterVolume * (options.volume || 1);
        
        // Apply pitch shift if requested
        if (options.pitch) {
            source.playbackRate.value = options.pitch;
        }
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // Set looping
        source.loop = options.loop || false;
        
        // Start sound
        const startTime = options.startTime || 0;
        source.start(startTime);
        
        // Track instance for cleanup
        const instance = {
            source: source,
            gainNode: gainNode,
            name: name,
            startTime: this.context.currentTime
        };
        
        this.soundInstances.push(instance);
        
        // Clean up when finished
        source.onended = () => {
            this.removeSoundInstance(instance);
        };
        
        return instance;
    }
    
    // Play 3D sound (simplified - just volume based on distance)
    playSound3D(name, position, listenerPosition, options = {}) {
        if (!this.enabled) return null;
        
        // Calculate distance-based volume
        const distance = position.distanceTo(listenerPosition);
        const maxDistance = options.maxDistance || 20;
        const rolloff = options.rolloff || 1;
        
        let volume = 1;
        if (distance > 0) {
            volume = 1 / (1 + rolloff * (distance - 1)); // Simple rolloff
            volume = Math.max(0, Math.min(1, volume));
        }
        
        // Apply directionality (simple cone)
        if (options.direction && options.coneAngle) {
            const toListener = listenerPosition.clone().sub(position).normalize();
            const angle = Math.acos(toListener.dot(options.direction));
            const coneAngle = options.coneAngle * (Math.PI / 180); // convert to radians
            
            if (angle > coneAngle) {
                // Outside cone - reduce volume
                volume *= 0.2;
            }
        }
        
        const soundOptions = {
            volume: volume * (options.volume || 1),
            pitch: options.pitch,
            loop: options.loop,
            startTime: options.startTime
        };
        
        return this.playSound(name, soundOptions);
    }
    
    // Stop a specific sound instance
    stopSound(instance) {
        if (!instance) return;
        instance.source.stop();
        this.removeSoundInstance(instance);
    }
    
    removeSoundInstance(instance) {
        const index = this.soundInstances.indexOf(instance);
        if (index !== -1) {
            this.soundInstances.splice(index, 1);
        }
    }
    
    // Stop all sounds
    stopAllSounds() {
        this.soundInstances.forEach(instance => {
            instance.source.stop();
        });
        this.soundInstances = [];
    }
    
    // Set master volume
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Load and play music
    playMusic(name, options = {}) {
        // Stop current music if any
        if (this.currentMusic) {
            this.stopSound(this.currentMusic);
        }
        
        const musicOptions = {
            volume: options.volume || 0.5,
            loop: options.loop !== undefined ? options.loop : true,
            ...options
        };
        
        this.currentMusic = this.playSound(name, musicOptions);
        return this.currentMusic;
    }
    
    // Pause/resume context (for when tab is hidden)
    suspend() {
        if (this.context && this.context.state !== 'suspended') {
            this.context.suspend();
        }
    }
    
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
    
    // Get stats
    getStats() {
        return {
            enabled: this.enabled,
            soundsLoaded: Object.keys(this.sounds).length,
            playingInstances: this.soundInstances.filter(i => !i.source.stopped).length,
            masterVolume: this.masterVolume,
            contextState: this.context ? this.context.state : 'not initialized'
        };
    }
    
    // Mute/unmute
    mute() {
        this.previousVolume = this.masterVolume;
        this.setMasterVolume(0);
    }
    
    unmute() {
        if (this.previousVolume !== undefined) {
            this.setMasterVolume(this.previousVolume);
        }
    }
}

// Global audio manager
window.AudioManager = AudioManager;