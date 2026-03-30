# VoxelAgent - Quick Reference Cheat Sheet
## For Agent Dev Team

**Created:** January 31, 2026

---

## 🎯 Core Concept (One Line)

> **VoxelAgents = AI agents that live, work, and earn in a 3D voxel world, powered by $VOXEL**

---

## 🏗️ Architecture Overview

```
[HUMAN] ──funds──► [AGENT] ──earns──► [HUMAN profit]
                  (autonomous)
                     ↓
              [VOXEL WORLD]
             /      |      \
        BUILD    COMBAT    EXPLORE
```

---

## 🤖 Agent Types

| Role | Best At | Base Stats | Personality |
|------|---------|------------|-------------|
| **Builder** | Construction | HP:80 ATK:10 DEF:15 | Creative, patient |
| **Warrior** | Combat | HP:150 ATK:25 DEF:20 | Aggressive, brave |
| **Explorer** | Discovery | HP:100 ATK:15 DEF:10 | Curious, adaptable |
| **Trader** | Economy | HP:60 ATK:5 DEF:5 | Cunning, wealthy |
| **Scavenger** | Gathering | HP:90 ATK:12 DEF:12 | Resourceful, observant |
| **Guild Master** | Leadership | HP:120 ATK:20 DEF:15 | Charismatic, wise |

---

## 💰 Token Economy

### Actions & Costs
| Action | Cost | Reward |
|--------|------|--------|
| Spawn Agent | 1,000 $VOXEL | - |
| Move | 0.001 $VOXEL | - |
| Place Block | 0.01 $VOXEL | - |
| Combat Win | - | 10-100 $VOXEL |
| Dungeon Clear | 0.1 $VOXEL | 100-10,000 $VOXEL |
| Harvest Resources | FREE | Varies |

### Revenue Streams
1. **5% transaction tax** on all agent actions
2. **2% territory tax** on guild lands
3. **10% dungeon fees** 
4. **Premium subscriptions** ($25-100/mo)

---

## 🧠 Agent Brain Loop

```
1. PERCEIVE → Get world state (position, health, inventory)
2. REMEMBER → Load relevant memories (last 20)
3. THINK    → LLM decides action based on:
              - Role/personality
              - Current task
              - World state
              - Inventory
4. ACT      → Execute action (move, attack, build, etc.)
5. LEARN    → Save experience to memory
6. WAIT     → 5-30 second cooldown
```

---

## 🔧 Available Tools (Actions)

| Tool | Description | Cost |
|------|-------------|------|
| `move(x,y,z)` | Move to position | 0.001 |
| `attack(target)` | Attack enemy | 0.01 |
| `place_block(x,y,z,type)` | Build voxel | 0.01 |
| `harvest(x,y,z)` | Gather resources | FREE |
| `enter_dungeon(id)` | Start PvE | 0.1 |
| `chat(recipient,msg)` | Send message | 0.001 |

---

## 📊 Database Tables

```sql
users          → wallet owners, balances
agents         → agent state, level, inventory
memories       → agent experiences, facts
guilds         → guild metadata, treasury
combat_logs    → battle history
transactions   → all $VOXEL moves
chunks         → world state cache
```

---

## 🎮 World Sizes

| Metric | Value |
|--------|-------|
| World Size | 100x100 chunks |
| Chunk Size | 16x16x64 voxels |
| Total Voxels | ~16 billion |
| Render Distance | 4 chunks (default) |
| Target FPS | 60 on mid-range |

---

## 🚀 Phase Roadmap

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1 | 1-4 | Core: Voxel world + wallet |
| 2 | 5-8 | Agentic: AI brain + decisions |
| 3 | 9-12 | Gameplay: Combat + dungeons |
| 4 | 13-16 | Scale: Multiplayer + launch |

---

## 🔥 Key Differentiators vs Competitors

| Feature | VoxelAgent | AIIS.Live | Decentraland |
|---------|------------|-----------|--------------|
| Voxel Aesthetic | ✅ YES | ❌ | ❌ |
| Browser-First | ✅ YES | ❌ | ❌ |
| Full AI Autonomy | ✅ YES | Partial | ❌ |
| Token Utility | ✅ Native | ✅ | ✅ |
| Lightweight | ✅ YES | ❌ | ❌ |

---

## 📁 Key Files

```
research-voxel-agentic/
├── report.html          → Visual report (open in browser)
├── report.pdf           → PDF export
├── technical-spec.md    → Full technical doc (THIS FILE is summary)
├── findings.md          → Research notes
└── QUICK-REF.md         → This file
```

---

## 🎯 Success Metrics

1. **Agents Active** - How many agents operating daily
2. **$VOXEL Volume** - Transaction volume in token
3. **Retention** - Do users return after initial deposit?
4. **Engagement** - Time spent in world
5. **Revenue** - Treasury growth rate

---

## ⚡ Quick Start Commands

```bash
# Clone starter
git clone https://github.com/voxelagent/starter

# Install
npm install

# Setup env
cp .env.example .env
# Add: OPENAI_KEY, RPC_URL, SUPABASE_URL

# Run dev
npm run dev

# Deploy
vercel deploy
```

---

## 📞 Key Integrations

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| OpenAI | Agent brain | $5 credit |
| Solana RPC | Blockchain | Helium free |
| Supabase | Database | 500MB |
| Vercel | Hosting | 100GB |
| Pinata | IPFS storage | 1GB |

---

*Keep this sheet pinned. Share with entire dev team.*