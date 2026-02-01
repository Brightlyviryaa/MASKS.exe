import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * HUB - Teater Kosong (Theater Hub)
 */
export class HubScene extends BaseScene {
    constructor() {
        super({ key: 'HubScene' });
        this.idleTimer = null;
        this.easterEggShown = false;
    }

    create() {
        const { width, height } = this.scale;

        // Fade in
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Check for corrupted hub (play_count >= 2)
        const playCount = GameState.getPlayCount();
        const isCorrupted = playCount >= 2;

        // Theater background - use glitch version if corrupted
        const bgKey = isCorrupted ? 'bg_theater_glitch' : 'bg_theater';
        const theaterBg = this.add.image(width / 2, height / 2, bgKey);
        theaterBg.setDisplaySize(width, height);

        // If corrupted, add subtle glitch flicker effect
        if (isCorrupted) {
            this.time.addEvent({
                delay: 2000 + Math.random() * 3000,
                callback: () => {
                    this.cameras.main.flash(60, 60, 40, 40);
                },
                loop: true
            });
        }

        // Spotlight effect (simulated with gradient overlay)
        const spotlight = this.add.circle(width / 2, height / 2 - 50, 150, 0xffd700, isCorrupted ? 0.05 : 0.1);
        this.tweens.add({
            targets: spotlight,
            alpha: isCorrupted ? 0.1 : 0.2,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Title text with dark background for contrast
        const titleY = height / 2 - 180;

        // Title background for better contrast
        const titleBg = this.add.rectangle(width / 2, titleY, 320, 50, 0x000000, 0.6);

        // Title changes for corrupted hub
        const titleColor = isCorrupted ? '#aa6666' : '#ffd700';
        const titleMessage = isCorrupted ? 'The Stage Remembers' : 'Choose Your Mask';

        const titleText = this.add.text(width / 2, titleY, titleMessage, {
            fontSize: '32px',
            color: titleColor,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setAlpha(1);

        // Mask configurations - larger and more spread out
        const masks = [
            {
                key: 'mask_joy',
                scene: 'JoyScene',
                name: 'Joy',
                maskId: 'joy',
                desc: 'A smile that never ends.',
                x: width / 2 - 200,
                y: height / 2 - 20
            },
            {
                key: 'mask_rage',
                scene: 'RageScene',
                name: 'Rage',
                maskId: 'rage',
                desc: 'Anger feels powerful.',
                x: width / 2 - 100,
                y: height / 2 - 20
            },
            {
                key: 'mask_sorrow',
                scene: 'SorrowScene',
                name: 'Sorrow',
                maskId: 'sorrow',
                desc: 'Memories without faces.',
                x: width / 2,
                y: height / 2 - 20
            },
            {
                key: 'mask_truth',
                scene: 'TruthScene',
                name: 'Truth',
                maskId: 'truth',
                desc: 'See what should not be seen.',
                x: width / 2 + 100,
                y: height / 2 - 20
            },
            {
                key: 'mask_silence',
                scene: 'SilenceScene',
                name: 'Silence',
                maskId: 'silence',
                desc: 'Words disappear here.',
                x: width / 2 + 200,
                y: height / 2 - 20
            }
        ];

        // Create mask buttons
        masks.forEach((mask) => {
            this.createMaskButton(mask);
        });

        // Hunger mask (locked or unlocked) - positioned lower
        this.createHungerMask(width / 2, height / 2 + 100);

        // Reset idle timer on interaction
        this.resetIdleTimer();
        this.input.on('pointerdown', () => this.resetIdleTimer());
        this.input.on('pointermove', () => this.resetIdleTimer());
    }

    createMaskButton(mask) {
        const container = this.add.container(mask.x, mask.y);

        // Mask image - use setScale instead of setDisplaySize
        const maskImage = this.add.image(0, 0, mask.key);
        // Calculate scale to fit 100x100 (larger size)
        const targetSize = 100;
        const scaleX = targetSize / maskImage.width;
        const scaleY = targetSize / maskImage.height;
        const uniformScale = Math.min(scaleX, scaleY);
        maskImage.setScale(uniformScale);
        maskImage.setInteractive({ useHandCursor: true });

        // Glow effect (initially hidden) - larger to match bigger mask
        const glow = this.add.circle(0, 0, 65, 0xd4af37, 0);
        container.add([glow, maskImage]);

        // Mask name
        const nameText = this.add.text(0, 70, mask.name, {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5);
        container.add(nameText);

        // Description (shown on hover)
        const descText = this.add.text(0, 100, mask.desc, {
            fontSize: '13px',
            color: '#aaaaaa',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);
        container.add(descText);

        // Track hover state
        let isHovered = false;

        // Hover effects - use direct scale multiplication
        maskImage.on('pointerover', () => {
            if (isHovered) return;
            isHovered = true;
            glow.setFillStyle(0xd4af37, 0.3);
            maskImage.setScale(uniformScale * 1.15);
            descText.setAlpha(1);
        });

        maskImage.on('pointerout', () => {
            isHovered = false;
            glow.setFillStyle(0xd4af37, 0);
            maskImage.setScale(uniformScale);
            descText.setAlpha(0);
        });

        // Click to select mask
        maskImage.on('pointerdown', () => {
            this.selectMask(mask.scene, mask.maskId);
        });
    }

    createHungerMask(x, y) {
        // New unlock logic: Truth + Silence + 2 of (Joy/Rage/Sorrow)
        const shouldUnlock = GameState.shouldUnlockHunger();

        // Additional condition for dramatic unlock
        const hasSecondaryCondition = GameState.flags.joy_removed || GameState.flags.name_lost;
        const isUnlocked = shouldUnlock && hasSecondaryCondition;

        // If unlocked for first time, persist it
        if (isUnlocked && !GameState.persistent.hunger_unlocked) {
            GameState.unlockHunger();
        }

        const container = this.add.container(x, y);

        // Calculate scale for 100x100 (larger size to match other masks)
        const targetSize = 100;

        if (isUnlocked) {
            // Unlocked Hunger mask - use proper hunger mask texture
            const maskImage = this.add.image(0, 0, 'mask_hunger');
            const scaleX = targetSize / maskImage.width;
            const scaleY = targetSize / maskImage.height;
            const uniformScale = Math.min(scaleX, scaleY);
            maskImage.setScale(uniformScale);
            maskImage.setInteractive({ useHandCursor: true });

            // Dark red glow (pulsing)
            const glow = this.add.circle(0, 0, 65, 0x881111, 0);
            container.add([glow, maskImage]);

            // Pulsing glow animation - faster for returning players
            const pulseSpeed = GameState.isReturningPlayer() ? 800 : 1500;
            this.tweens.add({
                targets: glow,
                alpha: 0.3,
                duration: pulseSpeed,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const nameText = this.add.text(0, 70, 'Hunger', {
                fontSize: '18px',
                color: '#aa3333',
                fontFamily: 'Georgia, serif'
            }).setOrigin(0.5);
            container.add(nameText);

            const descText = this.add.text(0, 100, 'The final mask.', {
                fontSize: '13px',
                color: '#664444',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);
            container.add(descText);

            let isHovered = false;

            maskImage.on('pointerover', () => {
                if (isHovered) return;
                isHovered = true;
                glow.setFillStyle(0xaa2222, 0.4);
                maskImage.setScale(uniformScale * 1.15);
                descText.setAlpha(1);
            });

            maskImage.on('pointerout', () => {
                isHovered = false;
                glow.setFillStyle(0x881111, 0.3);
                maskImage.setScale(uniformScale);
                descText.setAlpha(0);
            });

            maskImage.on('pointerdown', () => {
                // Don't update last_mask for Hunger - it uses the previous value
                this.selectMask('HungerScene', null);
            });
        } else {
            // Locked Hunger mask
            const maskImage = this.add.image(0, 0, 'mask_hunger_locked');
            const scaleX = targetSize / maskImage.width;
            const scaleY = targetSize / maskImage.height;
            const uniformScale = Math.min(scaleX, scaleY);
            maskImage.setScale(uniformScale);
            maskImage.setAlpha(0.5);
            maskImage.setTint(0x333333);

            const lockIcon = this.add.text(0, 0, '🔒', {
                fontSize: '28px'
            }).setOrigin(0.5);

            container.add([maskImage, lockIcon]);

            const lockedText = this.add.text(0, 70, 'Locked', {
                fontSize: '16px',
                color: '#444444',
                fontFamily: 'Georgia, serif'
            }).setOrigin(0.5);
            container.add(lockedText);

            // Show different hints based on progress
            let hintMessage = 'Not yet.';
            if (shouldUnlock && !hasSecondaryCondition) {
                hintMessage = 'Something is still missing.';
            } else if (!GameState.flags.truth_completed || !GameState.flags.silence_completed) {
                hintMessage = 'Seek truth. Embrace silence.';
            }

            const hintText = this.add.text(0, 95, hintMessage, {
                fontSize: '12px',
                color: '#333333',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5);
            container.add(hintText);
        }
    }

    selectMask(sceneKey, maskId = null) {
        // Track last_mask for ending resolution (unless entering Hunger)
        if (maskId) {
            GameState.setFlag('last_mask', maskId);
        }

        // Fade out with breath effect
        this.cameras.main.fadeOut(800, 0, 0, 0);

        // Simulate breath sound with visual
        const { width, height } = this.scale;
        const breathOverlay = this.add.rectangle(0, 0, width, height, 0xffffff, 0);
        breathOverlay.setOrigin(0);

        this.tweens.add({
            targets: breathOverlay,
            alpha: 0.2,
            duration: 400,
            yoyo: true,
            onComplete: () => {
                this.scene.start(sceneKey);
            }
        });
    }

    resetIdleTimer() {
        if (this.idleTimer) this.idleTimer.remove();

        this.idleTimer = this.time.delayedCall(30000, () => {
            if (!this.easterEggShown) {
                this.showEasterEgg();
            }
        });
    }

    showEasterEgg() {
        this.easterEggShown = true;
        const { width, height } = this.scale;

        const easterEggText = this.add.text(width / 2, height / 2, '"Nano Banana is still painting reality..."', {
            fontSize: '16px',
            color: '#666666',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: easterEggText,
            alpha: 1,
            duration: 2000,
            onComplete: () => {
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: easterEggText,
                        alpha: 0,
                        duration: 2000
                    });
                });
            }
        });

        GameState.setFlag('nano_banana_eg', true);
    }
}
