# Run Cow Run

A top-down browser game where you control a cow fleeing from knights on horseback. Collect keys, unlock the castle, and defeat the dragon boss.

## How to Play

1. **Choose difficulty** — Easy, Medium, or Hard
2. **Collect keys** scattered across the map (3 on Easy, 5 on Medium/Hard)
3. **Avoid knights** that chase you with pathfinding AI
4. **Enter the castle** once the gate opens
5. **Defeat the dragon** by dodging attacks and collecting 3 bombs

### Controls

- **Movement:** Arrow keys or WASD
- **Menu:** Press 1, 2, or 3 to select difficulty

## Difficulty Settings

|  | Easy | Medium | Hard |
|--|------|--------|------|
| Map size | 40x40 | 50x50 | 60x60 |
| Keys | 3 | 5 | 5 |
| Max knights | 5 | 8 | 8 |
| Knight speed | Slow | Medium | Fast |
| Dragon attacks | Forgiving | Balanced | Aggressive |

## Tech Stack

- **Phaser 3** — 2D game framework with Arcade Physics
- **TypeScript**
- **Vite** — dev server and bundler
- **EasyStar.js** — A* pathfinding for knight AI

All visuals are drawn programmatically with colored shapes — no image assets.

## Development

```bash
npm install
npm run dev
```

Opens at `localhost:8080`. Accessible on your local network for mobile testing.

```bash
npm run build    # typecheck + production bundle
npx tsc --noEmit # typecheck only
```
