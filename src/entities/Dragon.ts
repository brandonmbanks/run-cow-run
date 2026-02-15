import Phaser from 'phaser';
import {
  COLORS,
  DRAGON_SPEED,
  DRAGON_BODY_RADIUS,
  TRIPLE_FIREBALL_SPREAD,
  ROLL_TELEGRAPH_DURATION,
  ROLL_SPEED,
  ROLL_DURATION,
  SPIN_ATTACK_DURATION,
  SPIN_FIREBALL_COUNT,
  SPIN_REVOLUTIONS,
  ATTACK_COOLDOWN_MIN,
  ATTACK_COOLDOWN_MAX,
  DRAGON_FIREBALL_SPEED,
} from '../constants';

export enum DragonState {
  IDLE = 'IDLE',
  TRIPLE_FIREBALL = 'TRIPLE_FIREBALL',
  ROLL_TELEGRAPH = 'ROLL_TELEGRAPH',
  ROLLING = 'ROLLING',
  STUNNED = 'STUNNED',
  SPIN_ATTACK = 'SPIN_ATTACK',
}

export class Dragon extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  private currentState = DragonState.IDLE;
  private stateTimer = 0;
  private cooldown: number;
  private cooldownTimer = 0;

  private target: Phaser.GameObjects.Container;
  private onFireball: (x: number, y: number, angle: number, speed?: number) => void;

  // Roll attack
  private rollTargetX = 0;
  private rollTargetY = 0;

  // Spin attack
  private spinAngle = 0;
  private spinFireballsEmitted = 0;

  // Visual reference for flash effect
  private bodyShape: Phaser.GameObjects.Ellipse;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Phaser.GameObjects.Container,
    onFireball: (x: number, y: number, angle: number, speed?: number) => void,
  ) {
    super(scene, x, y);
    this.target = target;
    this.onFireball = onFireball;
    this.cooldown = this.randomCooldown();

    // --- Visual: top-down dragon ---

    // Tail (thin, trailing behind)
    const tail = scene.add.rectangle(-30, 0, 20, 4, COLORS.dragon);

    // Wings (dark-green ellipses, angled out)
    const wingL = scene.add.ellipse(-4, -18, 20, 10, COLORS.dragonWing);
    wingL.setAngle(-20);
    const wingR = scene.add.ellipse(-4, 18, 20, 10, COLORS.dragonWing);
    wingR.setAngle(20);

    // Main body (large green ellipse)
    this.bodyShape = scene.add.ellipse(0, 0, 44, 28, COLORS.dragon);

    // Belly overlay (yellow-green)
    const belly = scene.add.ellipse(2, 0, 30, 16, COLORS.dragonBelly);

    // Head (green circle, forward)
    const head = scene.add.circle(22, 0, 10, COLORS.dragon);

    // Horns (gray)
    const hornL = scene.add.rectangle(26, -8, 4, 10, COLORS.dragonHorn);
    hornL.setAngle(-15);
    const hornR = scene.add.rectangle(26, 8, 4, 10, COLORS.dragonHorn);
    hornR.setAngle(15);

    // Red eyes
    const eyeL = scene.add.circle(26, -4, 2.5, COLORS.dragonEye);
    const eyeR = scene.add.circle(26, 4, 2.5, COLORS.dragonEye);

    this.add([tail, wingL, wingR, this.bodyShape, belly, head, hornL, hornR, eyeL, eyeR]);

    scene.add.existing(this as Phaser.GameObjects.Container);
    scene.physics.add.existing(this as Phaser.GameObjects.Container);

    this.body.setCircle(DRAGON_BODY_RADIUS);
    this.body.setOffset(-DRAGON_BODY_RADIUS, -DRAGON_BODY_RADIUS);
  }

  getState(): DragonState {
    return this.currentState;
  }

  /** Called by BossScene when dragon hits a wall while rolling. */
  wallHitWhileRolling(): void {
    if (this.currentState === DragonState.ROLLING) {
      this.enterState(DragonState.STUNNED);
    }
  }

  step(time: number, delta: number): void {
    this.stateTimer += delta;

    switch (this.currentState) {
      case DragonState.IDLE:
        this.updateIdle(delta);
        break;
      case DragonState.TRIPLE_FIREBALL:
        this.updateTripleFireball();
        break;
      case DragonState.ROLL_TELEGRAPH:
        this.updateRollTelegraph();
        break;
      case DragonState.ROLLING:
        this.updateRolling();
        break;
      case DragonState.STUNNED:
        this.updateStunned();
        break;
      case DragonState.SPIN_ATTACK:
        this.updateSpinAttack(delta);
        break;
    }
  }

  // --- State transitions ---

  private enterState(state: DragonState): void {
    this.currentState = state;
    this.stateTimer = 0;

    switch (state) {
      case DragonState.IDLE:
        this.cooldown = this.randomCooldown();
        this.cooldownTimer = 0;
        this.bodyShape.setFillStyle(COLORS.dragon);
        break;

      case DragonState.TRIPLE_FIREBALL:
        this.body.setVelocity(0, 0);
        this.fireTripleFireball();
        break;

      case DragonState.ROLL_TELEGRAPH:
        this.body.setVelocity(0, 0);
        this.rollTargetX = this.target.x;
        this.rollTargetY = this.target.y;
        break;

      case DragonState.ROLLING: {
        const angle = Phaser.Math.Angle.Between(
          this.x, this.y,
          this.rollTargetX, this.rollTargetY,
        );
        this.body.setVelocity(
          Math.cos(angle) * ROLL_SPEED,
          Math.sin(angle) * ROLL_SPEED,
        );
        this.rotation = angle;
        break;
      }

      case DragonState.STUNNED:
        this.body.setVelocity(0, 0);
        this.bodyShape.setFillStyle(COLORS.dragon);
        break;

      case DragonState.SPIN_ATTACK:
        this.body.setVelocity(0, 0);
        this.spinAngle = 0;
        this.spinFireballsEmitted = 0;
        break;
    }
  }

  // --- State updates ---

  private updateIdle(delta: number): void {
    // Move toward player
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    this.body.setVelocity(
      Math.cos(angle) * DRAGON_SPEED,
      Math.sin(angle) * DRAGON_SPEED,
    );
    this.rotation = angle;

    // Count toward next attack
    this.cooldownTimer += delta;
    if (this.cooldownTimer >= this.cooldown) {
      this.pickAttack();
    }
  }

  private updateTripleFireball(): void {
    // Fireballs already fired on enter; wait ~300ms then return to idle
    if (this.stateTimer >= 300) {
      this.enterState(DragonState.IDLE);
    }
  }

  private updateRollTelegraph(): void {
    // Flash red during telegraph
    const flash = Math.floor(this.stateTimer / 150) % 2 === 0;
    this.bodyShape.setFillStyle(flash ? 0xff0000 : COLORS.dragon);

    if (this.stateTimer >= ROLL_TELEGRAPH_DURATION) {
      this.enterState(DragonState.ROLLING);
    }
  }

  private updateRolling(): void {
    if (this.stateTimer >= ROLL_DURATION) {
      this.enterState(DragonState.STUNNED);
    }
  }

  private updateStunned(): void {
    // Flash to indicate stun
    const flash = Math.floor(this.stateTimer / 100) % 2 === 0;
    this.bodyShape.setFillStyle(flash ? 0xaaaaaa : COLORS.dragon);

    if (this.stateTimer >= 1000) {
      this.enterState(DragonState.IDLE);
    }
  }

  private updateSpinAttack(delta: number): void {
    const totalFireballs = SPIN_FIREBALL_COUNT * SPIN_REVOLUTIONS;
    const progress = this.stateTimer / SPIN_ATTACK_DURATION;
    this.spinAngle = progress * SPIN_REVOLUTIONS * Math.PI * 2;

    // Emit fireballs evenly over duration
    const expectedEmitted = Math.floor(progress * totalFireballs);
    while (this.spinFireballsEmitted < expectedEmitted && this.spinFireballsEmitted < totalFireballs) {
      const fbAngle = (this.spinFireballsEmitted / totalFireballs) * SPIN_REVOLUTIONS * Math.PI * 2;
      this.onFireball(this.x, this.y, fbAngle, DRAGON_FIREBALL_SPEED);
      this.spinFireballsEmitted++;
    }

    // Visual rotation
    this.rotation = this.spinAngle;

    if (this.stateTimer >= SPIN_ATTACK_DURATION) {
      this.enterState(DragonState.IDLE);
    }
  }

  // --- Attack logic ---

  private pickAttack(): void {
    const attacks = [
      DragonState.TRIPLE_FIREBALL,
      DragonState.ROLL_TELEGRAPH,
      DragonState.SPIN_ATTACK,
    ];
    const choice = Phaser.Utils.Array.GetRandom(attacks);
    this.enterState(choice);
  }

  private fireTripleFireball(): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    for (let i = -1; i <= 1; i++) {
      this.onFireball(this.x, this.y, angle + i * TRIPLE_FIREBALL_SPREAD);
    }
  }

  private randomCooldown(): number {
    return Phaser.Math.Between(ATTACK_COOLDOWN_MIN, ATTACK_COOLDOWN_MAX);
  }
}
