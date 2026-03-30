// Physics Engine for Voxel World
class PhysicsEngine {
    constructor(world) {
        this.world = world;
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.terminalVelocity = -50; // max fall speed
        
        // Collision settings
        this.settings = {
            enableCollisions: true,
            enableSliding: true,
            stepHeight: 0.5, // max step height to climb
            skinWidth: 0.01, // prevents getting stuck
            bounce: 0.1,
            friction: 0.8
        };
        
        // Cache for raycasting
        this.raycaster = new THREE.Raycaster();
        this.raycaster.firstHitOnly = true;
    }
    
    // Update physics for a character
    updateCharacter(character, delta) {
        if (!this.settings.enableCollisions) {
            // Simple gravity only
            character.velocity.add(this.gravity.clone().multiplyScalar(delta));
            character.position.add(character.velocity.clone().multiplyScalar(delta));
            return;
        }
        
        // Apply gravity
        character.velocity.add(this.gravity.clone().multiplyScalar(delta));
        
        // Terminal velocity
        if (character.velocity.y < this.terminalVelocity) {
            character.velocity.y = this.terminalVelocity;
        }
        
        // Store original position for collision resolution
        const originalPosition = character.position.clone();
        const originalVelocity = character.velocity.clone();
        
        // Try to move in XZ plane first (horizontal movement)
        this.moveHorizontally(character, delta);
        
        // Then move in Y (vertical movement)
        this.moveVertically(character, delta);
        
        // Update character's rotation to face movement direction
        if (character.velocity.length() > 0.01) {
            // Only update rotation if moving significantly
            const direction = character.velocity.clone().normalize();
            // Ignore vertical component for rotation
            direction.y = 0;
            if (direction.length() > 0) {
                character.rotation.y = Math.atan2(direction.x, direction.z);
            }
        }
    }
    
    moveHorizontally(character, delta) {
        // Create a box slightly smaller than character for skin
        const size = new THREE.Vector3(0.4, 1.6, 0.4); // character size
        const halfSize = size.clone().multiplyScalar(0.5);
        const position = character.position.clone();
        
        // Calculate desired movement
        const move = character.velocity.clone();
        move.y = 0; // Only horizontal
        move.multiplyScalar(delta);
        
        if (move.length() < 0.001) return;
        
        // Check for collisions in the movement direction
        const hit = this.sweepBox(position, halfSize, move);
        
        if (hit) {
            // Move to hit position
            character.position.copy(hit.point);
            
            // If sliding is enabled, slide along the surface
            if (this.settings.enableSliding && hit.normal) {
                // Remove velocity component into the wall
                const velocityIntoWall = character.velocity.dot(hit.normal);
                if (velocityIntoWall < 0) {
                    // Only slide if moving into the wall
                    const slideVelocity = character.velocity.clone()
                        .sub(hit.normal.clone().multiplyScalar(velocityIntoWall * (1 + this.settings.bounce)));
                    character.velocity.copy(slideVelocity);
                }
            } else {
                // Stop horizontal movement
                character.velocity.x = 0;
                character.velocity.z = 0;
            }
        } else {
            // No collision, apply movement
            character.position.add(move);
        }
    }
    
    moveVertically(character, delta) {
        const size = new THREE.Vector3(0.4, 1.6, 0.4);
        const halfSize = size.clone().multiplyScalar(0.5);
        const position = character.position.clone();
        
        // Vertical movement
        const moveY = character.velocity.y * delta;
        
        // Check for ground collision (downward movement) or head collision (upward)
        let hit = null;
        if (moveY < 0) {
            // Moving down - check for ground
            hit = this.sweepBox(position, halfSize, new THREE.Vector3(0, moveY, 0));
        } else if (moveY > 0) {
            // Moving up - check for head hit
            hit = this.sweepBox(position, halfSize, new THREE.Vector3(0, moveY, 0));
        }
        
        if (hit) {
            // Move to hit position
            character.position.y = hit.point.y;
            
            // Apply bounce and stop vertical velocity
            character.velocity.y = -character.velocity.y * this.settings.bounce;
            
            // If we hit the ground, set onGround flag
            if (moveY < 0 && hit.normal.y > 0) {
                character.onGround = true;
                
                // Try to step up if there's a small obstacle
                if (!character.onGround && moveY >= 0) {
                    // Actually, we only step when moving forward and hitting a ledge
                    // This is handled in horizontal movement with step height
                }
            } else if (moveY > 0) {
                // Hit head
                character.onGround = false;
            }
        } else {
            // No vertical collision
            character.position.y += moveY;
            character.onGround = false; // Not on ground if moving up or in air
            
            // If we were on ground and now falling, we're no longer on ground
            if (moveY <= 0) {
                character.onGround = false;
            }
        }
        
        // Step up capability: if we're moving forward and hit a ledge, try to step up
        if (character.velocity.length() > 0.1 && character.onGround) {
            this.tryStepUp(character, delta);
        }
    }
    
    tryStepUp(character, delta) {
        const stepHeight = this.settings.stepHeight;
        const originalPos = character.position.clone();
        
        // Try lifting character up by step height
        character.position.y += stepHeight;
        
        // Check if we can move horizontally at this height
        const move = character.velocity.clone();
        move.y = 0;
        move.multiplyScalar(delta);
        
        if (move.length() > 0.001) {
            const hit = this.sweepBox(
                character.position.clone(),
                new THREE.Vector3(0.4, 1.6, 0.4).multiplyScalar(0.5),
                move
            );
            
            if (!hit) {
                // We can step up! Keep the upward movement
                character.position.y += move.y; // Actually, we already moved up
                character.velocity.y = 0; // Reset vertical velocity after step
                return;
            }
        }
        
        // If we can't step up, put character back down
        character.position.copy(originalPos);
    }
    
    // Sweep a box through the world and return first hit
    sweepBox(startPos, halfSize, move) {
        // Expand the box by skin width to prevent tunneling
        const skin = this.settings.skinWidth;
        const expandedHalfSize = halfSize.clone().add(new THREE.Vector3(skin, skin, skin));
        
        // Calculate box bounds
        const min = startPos.clone().sub(expandedHalfSize);
        const max = startPos.clone().add(expandedHalfSize);
        
        // If no movement, return null
        if (move.length() < 0.0001) return null;
        
        // Calculate which voxels we might intersect
        const step = Math.sign(move.x) !== 0 ? Math.sign(move.x) : 0;
        const steps = Math.ceil(Math.abs(move.x) / 1) + 2; // +2 for safety
        
        let closestHit = null;
        let closestDistance = Infinity;
        
        // Sweep along the movement direction in small steps
        const stepSize = 0.1; // 10cm steps for precision
        const stepCount = Math.ceil(move.length() / stepSize);
        const stepVec = move.clone().normalize().multiplyScalar(stepSize);
        
        for (let i = 0; i <= stepCount; i++) {
            const position = startPos.clone().add(stepVec.clone().multiplyScalar(i));
            
            // Check voxels in a slightly expanded bounds at this position
            const checkMin = position.clone().sub(expandedHalfSize);
            const checkMax = position.clone().add(expandedHalfSize);
            
            // Convert to voxel coordinates
            const minX = Math.floor(checkMin.x);
            const minY = Math.floor(checkMin.y);
            const minZ = Math.floor(checkMin.z);
            const maxX = Math.floor(checkMax.x);
            const maxY = Math.floor(checkMax.y);
            const minZ = Math.floor(checkMin.z);
            const maxZ = Math.floor(checkMax.z);
            
            // Check each voxel in the bounds
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const voxel = this.world.getVoxel(x, y, z);
                        if (voxel === BlockType.AIR) continue;
                        
                        const props = BlockProperties[voxel];
                        if (!props || !props.solid) continue;
                        
                        // Check if our box intersects this voxel
                        const voxelMin = new THREE.Vector3(x, y, z);
                        const voxelMax = new THREE.Vector3(x + 1, y + 1, z + 1);
                        
                        // Simple AABB check
                        if (position.x < voxelMax.x && 
                            position.x + expandedHalfSize.x * 2 > voxelMin.x &&
                            position.y < voxelMax.y && 
                            position.y + expandedHalfSize.y * 2 > voxelMin.y &&
                            position.z < voxelMax.z && 
                            position.z + expandedHalfSize.z * 2 > voxelMin.z) {
                            
                            // Calculate hit point and normal
                            const hit = this.calculateBoxVoxelHit(
                                position, expandedHalfSize, move, voxelMin, voxelMax
                            );
                            
                            if (hit && hit.distance < closestDistance) {
                                closestDistance = hit.distance;
                                closestHit = hit;
                            }
                        }
                    }
                }
            }
        }
        
        return closestHit;
    }
    
    calculateBoxVoxelHit(boxPos, boxHalfSize, move, voxelMin, voxelMax) {
        // Use separating axis theorem for box-box sweep
        // Simplified: check which face we hit first
        
        let tMin = 0;
        let tMax = 1;
        let hitNormal = new THREE.Vector3();
        
        // Check each axis
        const axes = [
            { axis: new THREE.Vector3(1, 0, 0), min: 'x', max: 'x' },
            { axis: new THREE.Vector3(0, 1, 0), min: 'y', max: 'y' },
            { axis: new THREE.Vector3(0, 0, 1), min: 'z', max: 'z' }
        ];
        
        for (const {axis, min, max} of axes) {
            const origin = boxPos[min];
            const extent = boxHalfSize[min];
            const voxelMin = voxelMin[min];
            const voxelMax = voxelMax[min];
            const velocity = move[min];
            
            if (Math.abs(velocity) < 0.0001) {
                // No movement on this axis - check for overlap
                const overlap1 = voxelMax - (origin - extent);
                const overlap2 = (origin + extent) - voxelMin;
                if (overlap1 < 0 || overlap2 < 0) {
                    // Overlap - already intersecting
                    return null; // or handle as penetration
                }
                continue;
            }
            
            const invVelocity = 1 / velocity;
            let t1 = (voxelMin - origin + extent) * invVelocity;
            let t2 = (voxelMax - origin - extent) * invVelocity;
            
            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }
            
            if (t1 > tMin) tMin = t1;
            if (t2 < tMax) tMax = t2;
            
            if (tMin > tMax) return null; // No hit
            
            // Set normal based on which side we hit
            if (t1 > tMin) {
                hitNormal.copy(axis).multiplyScalar(velocity < 0 ? 1 : -1);
            }
        }
        
        if (tMin < 0 || tMin > 1) return null;
        
        const hitPoint = boxPos.clone().add(move.clone().multiplyScalar(tMin));
        return {
            point: hitPoint,
            normal: hitNormal,
            distance: tMin * move.length()
        };
    }
    
    // Raycast for block breaking/placing
    raycastBlocks(origin, direction, maxDistance = 5) {
        this.raycaster.set(origin, direction);
        this.raycaster.far = maxDistance;
        
        // We'll iterate through voxels along the ray
        const step = 0.1; // 10cm steps
        let distance = 0;
        
        while (distance < maxDistance) {
            const position = origin.clone().add(direction.clone().multiplyScalar(distance));
            const voxel = this.world.getVoxel(
                Math.floor(position.x),
                Math.floor(position.y),
                Math.floor(position.z)
            );
            
            if (voxel !== BlockType.AIR) {
                const props = BlockProperties[voxel];
                if (props && props.solid) {
                    // Hit a solid block
                    // Calculate face normal based on direction of approach
                    const hitPos = position.clone();
                    return {
                        position: hitPos,
                        voxel: voxel,
                        position: new THREE.Vector3(
                            Math.floor(hitPos.x),
                            Math.floor(hitPos.y),
                            Math.floor(hitPos.z)
                        ),
                        normal: direction.clone().negate() // Simplified
                    };
                }
            }
            
            distance += step;
        }
        
        return null;
    }
    
    // Check if position is solid
    isSolid(x, y, z) {
        const voxel = this.world.getVoxel(x, y, z);
        if (voxel === BlockType.AIR) return false;
        const props = BlockProperties[voxel];
        return props && props.solid;
    }
    
    // Get normal at voxel face
    getNormalAtPosition(x, y, z, face) {
        switch(face) {
            case 'top': return new THREE.Vector3(0, 1, 0);
            case 'bottom': return new THREE.Vector3(0, -1, 0);
            case 'front': return new THREE.Vector3(0, 0, 1);
            case 'back': return new THREE.Vector3(0, 0, -1);
            case 'right': return new THREE.Vector3(1, 0, 0);
            case 'left': return new THREE.Vector3(-1, 0, 0);
            default: return new THREE.Vector3(0, 1, 0);
        }
    }
}

// Export for use in other files
window.PhysicsEngine = PhysicsEngine;