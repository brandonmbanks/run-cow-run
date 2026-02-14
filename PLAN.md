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
    │   └── GameOverScene.ts # Score, high score, restart
    ├── entities/
    │   ├── Player.ts        # Cow: Container with shape children + Arcade body
    │   └── Knight.ts        # Knight: chase AI + path following
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

### Phase 3: Knights + Chase AI

**Files:** src/entities/Knight.ts, src/ai/Pathfinder.ts, update GameScene.ts

- [ ] Knight entity: red rectangle body + smaller head, circular physics body
- [ ] Start with simple direct-chase: `Phaser.Math.Angle.Between` to get direction toward player
- [ ] Add EasyStar.js pathfinding: extract obstacle grid, `setAcceptableTiles([-1])`, enable diagonals
- [ ] Knights recalculate paths every 500ms (not every frame) to stay performant
- [ ] Knight spawning: one new knight every 15s, spawning at map edges, max 8 knights
- [ ] Catch detection: `physics.add.overlap(knightGroup, player, onCaught)` — overlap not collider, so it's a touch-catch
- [ ] Knights collide with obstacles and each other

### Phase 4: Polish + Mobile Controls

**Files:** src/ui/HUD.ts, src/ui/VirtualJoystick.ts, update GameOverScene.ts, update GameScene.ts

- [ ] **HUD**: survival timer + score text, pinned with `setScrollFactor(0)`
- [ ] **Virtual joystick**: floating (appears where you touch), left 60% of screen, base circle + thumb circle, outputs normalized forceX/forceY
- [ ] **Game over**: display survival time, track high score in localStorage, tap to restart
- [ ] **Game feel**: screen shake on catch, knight speed increases over time (capped below player speed), brief invincibility at start
- [ ] **Scoring**: survive as long as possible, score = seconds survived

### Phase 5: Mobile Optimization

- [ ] Object pooling for knights via `physics.add.group({ classType: Knight, maxSize: 8, runChildUpdate: true })`
- [ ] CSS `touch-action: none` on canvas to prevent scroll/zoom
- [ ] FPS counter for dev testing
- [ ] Smaller map (30x30) on small screens
- [ ] Increase pathfinding interval on low-end devices

## Verification

1. `npm run dev` — opens at localhost:8080
2. Desktop: WASD/arrows move the cow, knights chase, obstacles block, game over on catch, restart works
3. Mobile: open `http://<lan-ip>:8080` on phone, virtual joystick appears on touch, smooth 60fps
4. Progression: knights spawn over time, speed increases, score tracks survival time
