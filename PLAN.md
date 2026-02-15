# Run Cow Run - Implementation Plan

## Context

Building a top-down browser game where the player controls a cow fleeing from knights on horseback across a map with trees and rocks. The game needs to work on mobile (browser) for easy phone testing. This is a from-scratch project in an empty directory.

## Tech Stack

- **Phaser 3** — mature 2D game framework with built-in physics, tilemaps, input, and scaling
- **Vite** — fast dev server with `host: true` so you can test on your phone via LAN IP
- **TypeScript** — type safety
- **EasyStar.js** — lightweight A* pathfinding for knight AI
- **No image assets initially** — all visuals drawn programmatically (colored shapes), replaceable with sprites later

```
dependencies: phaser, easystarjs
devDependencies: vite, typescript
```

## Project Structure

```
run_cow_run/
├── index.html
├── package.json, tsconfig.json, vite.config.ts
├── public/style.css
└── src/
    ├── main.ts              # Creates Phaser.Game
    ├── config.ts            # Game config (Arcade Physics, RESIZE scaling)
    ├── constants.ts         # Tile size, speeds, colors
    ├── scenes/
    │   ├── BootScene.ts     # Asset preloading (no-op in phase 1)
    │   ├── MenuScene.ts     # Title screen, tap to start
    │   ├── GameScene.ts     # Main gameplay — the central orchestrator
    │   ├── GameOverScene.ts # Score, high score, restart (+ victory variant)
    │   └── BossScene.ts    # Dragon boss fight: survive 30s of fireballs
    ├── entities/
    │   ├── Player.ts        # Cow: Container with shape children + Arcade body
    │   ├── Knight.ts        # Knight: chase AI + path following
    │   ├── Key.ts           # Collectible key: static body + bobbing tween
    │   ├── Dragon.ts        # Boss dragon: static body at top of arena
    │   └── Fireball.ts      # Dragon projectile: moves toward target
    ├── ai/
    │   └── Pathfinder.ts    # EasyStar.js wrapper, converts tile<->world coords
    ├── map/
    │   ├── MapManager.ts    # Programmatic tilemap + tileset texture generation
    │   └── MapGenerator.ts  # Random obstacle placement with constraints
    └── ui/
        ├── HUD.ts           # Score/timer text pinned to camera
        └── VirtualJoystick.ts  # Floating touch joystick for mobile
```

## Implementation Phases

### Phase 1: Project Setup + Movable Cow ✅

**Files:** package.json, tsconfig.json, vite.config.ts, index.html, public/style.css, src/main.ts, src/config.ts, src/constants.ts, all 4 scenes (stubs), src/entities/Player.ts

- [x] `npm init` + install phaser, vite, typescript
- [x] Vite config with `host: true` (exposes on LAN for phone testing) and port 8080
- [x] `index.html` with `user-scalable=no` viewport meta to prevent pinch-zoom on mobile
- [x] Phaser config: `Phaser.Scale.RESIZE` (fills viewport), Arcade Physics with zero gravity
- [x] Player is a `Phaser.GameObjects.Container` with ellipse body + circle spots + circle head + ellipse ears, backed by an Arcade circular physics body
- [x] Input: arrow keys + WASD via `createCursorKeys()` and `addKeys()`
- [x] Camera follows player with lerp smoothing: `startFollow(player, true, 0.08, 0.08)`
- [x] Green background fills the world

### Phase 2: Obstacles + Collision ✅

**Files:** src/map/MapManager.ts, src/map/MapGenerator.ts, update GameScene.ts

- [x] Generate tileset texture programmatically via `scene.textures.createCanvas()` — draw grass, tree, and rock tiles as colored shapes
- [x] Create tilemap with `scene.make.tilemap({ data, tileWidth: 32, tileHeight: 32 })`
- [x] 50x50 tile world (1600x1600px), border of rocks around edges
- [x] Procedural obstacle placement: ~15% density, no obstacles within 5 tiles of spawn, no adjacent obstacles
- [x] Collision via `obstacleLayer.setCollisionByExclusion([TILE_GRASS])` + `physics.add.collider(player, obstacleLayer)`

### Phase 3: Knights + Chase AI ✅

**Files:** src/entities/Knight.ts, src/ai/Pathfinder.ts, update GameScene.ts

- [x] Knight entity: brown horse + red torso + gray helmet + lance, circular physics body
- [x] Direct-chase fallback: `Phaser.Math.Angle.Between` when pathfinding fails
- [x] EasyStar.js pathfinding: obstacle grid, `setAcceptableTiles([TILE_GRASS])`, diagonals with corner-cutting disabled
- [x] Knights recalculate paths every 500ms (not every frame) to stay performant
- [x] Knight spawning: first at ~5s, then every 15s, at random grass tiles on map edges, max 8 knights
- [x] Catch detection: `physics.add.overlap(knightGroup, player, onCaught)` — overlap not collider, so it's a touch-catch
- [x] Knights collide with obstacles and each other
- [x] All knight speeds ramp globally from 90 → 140 over time (always below player's 160)

### Phase 4: Castle Structure ✅

**Files:** src/constants.ts, src/map/MapGenerator.ts, src/map/MapManager.ts

- [x] Add castle tile types: `TILE_CASTLE_WALL=3`, `TILE_CASTLE_ROOF=4`, `TILE_TURRET=5`, `TILE_GATE=6`, `TILE_DRAWBRIDGE=7`
- [x] Castle dimensions (7x7), margin, and colors (wall, roof, turret, gate, drawbridge) in constants
- [x] `placeCastle()` in MapGenerator — random corner (shuffle-then-pick-farthest), 7x7 wall ring with roof interior, turrets on 4 corners, 3-wide gate (portcullis), 3x2 drawbridge extending outward, 2-tile obstacle buffer
- [x] Tileset canvas extended from 3→8 tiles: grass, tree, rock, castle wall (brick), roof (shingles), turret (circular tower), gate (iron bars), drawbridge (wooden planks)
- [x] Castle walls/roof/turrets/gate collide; drawbridge is walkable (excluded from collision alongside grass)
- [x] Pathfinder accepts drawbridge tiles so knights can walk on them
- [x] `MapData` interface returns grid, keyPositions, gateTiles, drawbridgeTiles, castleCorner

### Phase 5: Collectible Keys ✅

**Files:** src/constants.ts, src/map/MapGenerator.ts, src/entities/Key.ts, src/scenes/GameScene.ts

- [x] Key constants (`KEY_COUNT=5`, distances, colors) in constants
- [x] `placeKeys()` in MapGenerator — scatter 5 keys on grass tiles far from spawn and each other, positions returned in `MapData`
- [x] Key entity: yellow circle + black stroke + shaft + teeth, static body, bobbing tween
- [x] GameScene: spawn one key at a time, overlap collection with proper collider cleanup, `keysCollected` counter, HUD text (`Keys: 0/5`)
- [x] Debug collision overlay toggled with F1

### Phase 6: Gate + Castle Entry ✅

**Files:** src/scenes/GameScene.ts

- [x] Gate tiles (3-wide portcullis) already placed in castle wall by MapGenerator
- [x] Drawbridge extends outward from gate for visual clarity
- [x] GameScene: gate tiles swap to drawbridge on all 5 keys, gold camera flash, tight trigger zone on gate tiles → `scene.start('BossScene', { score })` (falls back to GameOverScene until BossScene exists)

### Phase 7: Dragon Boss Battle

**Files:** src/constants.ts, src/entities/Dragon.ts, src/entities/Fireball.ts, src/scenes/BossScene.ts, src/scenes/GameOverScene.ts, src/config.ts

- [x] Boss constants (arena size, fireball speed/interval, 30s survive time) in constants
- [ ] Dragon entity: green body, wings, eyes, horns, static
- [ ] Fireball entity: orange-red + yellow core, moves toward target
- [ ] BossScene: dark arena, dragon fires at player every 1.2s, escalating spread (1→2→3 fireballs), countdown HUD
- [ ] GameOverScene: handle `{ victory: true }` with gold "VICTORY!" text
- [ ] Register BossScene in config.ts

### Phase 8: Polish + Mobile Controls

**Files:** src/ui/HUD.ts, src/ui/VirtualJoystick.ts, update GameOverScene.ts, update GameScene.ts

- [ ] **HUD**: survival timer + score text, pinned with `setScrollFactor(0)`
- [ ] **Virtual joystick**: floating (appears where you touch), left 60% of screen, base circle + thumb circle, outputs normalized forceX/forceY
- [ ] **Game over**: display survival time, track high score in localStorage, tap to restart
- [ ] **Game feel**: screen shake on catch, brief invincibility at start
- [ ] **Scoring**: survive as long as possible, score = seconds survived

### Phase 9: Mobile Optimization

- [ ] Object pooling for knights
- [ ] CSS `touch-action: none` on canvas
- [ ] FPS counter for dev testing
- [ ] Smaller map on small screens

## Verification

1. `npm run dev` — opens at localhost:8080
2. Castle visible in corner, collision works
3. Keys scattered, collectible, HUD updates
4. Gate blocks until 5 keys, then opens
5. Boss scene: dodge fireballs 30s → victory, get hit → game over
6. Full loop: menu → game → collect keys → enter castle → boss → victory/game over → restart
7. Mobile: virtual joystick, smooth 60fps
