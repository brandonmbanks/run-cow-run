# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server on port 8080 with LAN access (`host: true`)
- `npm run build` — typecheck then bundle for production
- `npx tsc --noEmit` — typecheck without emitting

No test framework is configured yet.

## Architecture

Top-down 2D browser game built with **Phaser 3** + **Arcade Physics**, bundled by **Vite**, written in **TypeScript**. All visuals are drawn programmatically (colored shapes, no image assets). Designed for mobile browser play.

### Scene flow

`BootScene` → `MenuScene` → `GameScene` → `GameOverScene` → (restart) `GameScene`

Scenes are registered in `src/config.ts`. `GameScene` is the central orchestrator that creates entities, sets up physics, and handles input.

### Key patterns

- **Entities** (`src/entities/`) extend `Phaser.GameObjects.Container` with child shapes and an Arcade physics body. The `declare body:` pattern is used to narrow the body type.
- **Constants** (`src/constants.ts`) holds all tuning values (tile size, speeds, colors). Reference this when adjusting game balance.
- **Map system** (`src/map/`) will use programmatic tileset textures via `scene.textures.createCanvas()` and Phaser tilemaps.
- **Knight AI** (`src/ai/`) will use **EasyStar.js** for A* pathfinding on the tile grid.

### Implementation status

See `PLAN.md` for the phased implementation plan with checkboxes. Phase 1 (project setup + movable cow) is complete.
