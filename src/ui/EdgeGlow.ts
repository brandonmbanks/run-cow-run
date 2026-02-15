const GLOW_COLOR = 0xffd700;
const GLOW_SIZE = 28;
const GLOW_ALPHA = 0.25;

export class EdgeGlow {
  private gfx: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(98);
  }

  /** Convert desired screen-pixel position to scrollFactor=0 draw coordinates (accounts for camera zoom). */
  private screenToLocal(sx: number, sy: number): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    return {
      x: cam.centerX + (sx - cam.centerX) / cam.zoom,
      y: cam.centerY + (sy - cam.centerY) / cam.zoom,
    };
  }

  /** Call each frame with the world position of the target. Hides when target is on screen. */
  update(targetX: number, targetY: number): void {
    this.gfx.clear();

    const cam = this.scene.cameras.main;

    // Convert world position to screen-pixel position
    const sx = (targetX - cam.worldView.x) * cam.zoom;
    const sy = (targetY - cam.worldView.y) * cam.zoom;

    const w = cam.width;
    const h = cam.height;
    const pad = 20;

    // If target is on screen, no glow needed
    if (sx >= pad && sx <= w - pad && sy >= pad && sy <= h - pad) {
      return;
    }

    // Find intersection of line from screen center to target with screen edges
    const cx = w / 2;
    const cy = h / 2;
    const dx = sx - cx;
    const dy = sy - cy;

    if (dx === 0 && dy === 0) return;

    // Scale factor to reach each edge
    let t = Infinity;
    if (dx !== 0) {
      const tRight = (w - pad - cx) / dx;
      const tLeft = (pad - cx) / dx;
      if (tRight > 0) t = Math.min(t, tRight);
      if (tLeft > 0) t = Math.min(t, tLeft);
    }
    if (dy !== 0) {
      const tBottom = (h - pad - cy) / dy;
      const tTop = (pad - cy) / dy;
      if (tBottom > 0) t = Math.min(t, tBottom);
      if (tTop > 0) t = Math.min(t, tTop);
    }

    // Screen-pixel position of glow
    const screenGlowX = cx + dx * t;
    const screenGlowY = cy + dy * t;

    // Convert to scrollFactor=0 draw coordinates
    const glow = this.screenToLocal(screenGlowX, screenGlowY);

    // Draw soft glow as concentric circles with decreasing alpha
    // Scale glow size by 1/zoom so it appears consistent on screen
    const scaledSize = GLOW_SIZE / cam.zoom;
    const steps = 5;
    for (let i = steps; i >= 0; i--) {
      const radius = scaledSize * (i / steps);
      const alpha = GLOW_ALPHA * (1 - i / steps);
      this.gfx.fillStyle(GLOW_COLOR, alpha);
      this.gfx.fillCircle(glow.x, glow.y, radius);
    }
  }

  hide(): void {
    this.gfx.clear();
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
