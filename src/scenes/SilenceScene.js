import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * Mask of Silence - The Room With No Words
 * A minimalist, symbolic scene with a puzzle based on symbols.
 */
export class SilenceScene extends BaseScene {
    constructor() {
        super({ key: 'SilenceScene' });
        this.idleTimer = null;
        this.interactionPhase = 0; // 0: intro, 1: narration, 2: puzzle, 3: exit

        // Puzzle configuration
        this.correctSequence = ['circle', 'triangle', 'cross', 'circle'];
        this.playerSequence = [];
        this.symbolButtons = [];
        this.wrongAttempts = 0; // Track wrong attempts for threatening atmosphere
    }

    create() {
        const { width, height } = this.scale;

        // Start with black screen for slower transition
        this.cameras.main.fadeIn(700, 0, 0, 0);

        // Phase 1: "You chose Silence" intro text
        this.showIntroText();
    }

    showIntroText() {
        const { width, height } = this.scale;

        // Check for returning player recognition
        const wasUsedBefore = GameState.wasMaskUsed('silence');

        if (wasUsedBefore) {
            // Show recognition line first
            const recognitionText = this.add.text(width / 2, height / 2, '"The void remembers your shape."', {
                fontSize: '22px',
                color: '#777777',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: recognitionText,
                alpha: 1,
                duration: 800,
                hold: 1500,
                yoyo: true,
                onComplete: () => {
                    recognitionText.destroy();
                    this.showNormalIntro();
                }
            });
        } else {
            this.showNormalIntro();
        }
    }

    showNormalIntro() {
        const { width, height } = this.scale;

        const introText = this.add.text(width / 2, height / 2, 'You chose Silence.', {
            fontSize: '28px',
            color: '#999999',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in intro text (slower for silence theme)
        this.tweens.add({
            targets: introText,
            alpha: 1,
            duration: 1000,
            hold: 1500,
            yoyo: true,
            onComplete: () => {
                introText.destroy();
                this.showSilenceWorld();
            }
        });
    }

    showSilenceWorld() {
        const { width, height } = this.scale;
        this.interactionPhase = 1;

        // Background: Silence void
        this.silenceBg = this.add.image(width / 2, height / 2, 'bg_silence_void');
        this.silenceBg.setDisplaySize(width, height);
        this.silenceBg.setAlpha(0);

        // Fade in background slowly
        this.tweens.add({
            targets: this.silenceBg,
            alpha: 1,
            duration: 1500,
            onComplete: () => {
                this.setupUI();
                this.startNarration();
            }
        });
    }

    setupUI() {
        const { width } = this.scale;

        // Mask indicator (top-right corner)
        const maskIndicator = this.add.image(width - 50, 50, 'mask_silence');
        const targetSize = 50;
        const scale = targetSize / Math.max(maskIndicator.width, maskIndicator.height);
        maskIndicator.setScale(scale);
        maskIndicator.setAlpha(0.5); // Even more subtle for silence

        // Textbox at bottom
        this.textbox = this.createTextbox();
    }

    startNarration() {
        // Minimal narration - almost no words
        const narrationLines = [
            "…",
            "No laughter.",
            "No anger.",
            "No memories.",
            "…",
            "Only symbols remain."
        ];

        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < narrationLines.length) {
                // Hold longer on ellipsis for effect
                const holdTime = narrationLines[lineIndex] === "…" ? 3000 : 2200;

                currentText = this.createTypewriterText(
                    this.textbox.x,
                    this.textbox.y,
                    narrationLines[lineIndex],
                    {
                        fontSize: '20px',
                        color: '#888888',
                        fontStyle: 'italic'
                    },
                    60 // Slower typewriter for silence
                );
                lineIndex++;
                this.time.delayedCall(holdTime, showNextLine);
            } else {
                // Narration complete, show puzzle
                if (currentText) currentText.destroy();
                this.interactionPhase = 2;
                this.showSymbolPuzzle();
            }
        };

        // Start narration after brief pause
        this.time.delayedCall(800, showNextLine);
    }

    showSymbolPuzzle() {
        const { width, height } = this.scale;

        // Reset player sequence
        this.playerSequence = [];

        // Start idle timer for easter egg
        this.resetIdleTimer();

        // Create floating symbol buttons
        this.createSymbolButtons();

        // Progress indicator (subtle dots)
        this.createProgressIndicator();
    }

    createSymbolButtons() {
        const { width, height } = this.scale;

        const symbols = [
            { key: 'circle', char: '◯', x: width / 2 - 120 },
            { key: 'triangle', char: '△', x: width / 2 },
            { key: 'cross', char: '✕', x: width / 2 + 120 }
        ];

        this.symbolButtons = [];

        symbols.forEach((symbol) => {
            const container = this.add.container(symbol.x, height / 2);

            // Symbol text
            const symbolText = this.add.text(0, 0, symbol.char, {
                fontSize: '64px',
                color: '#aaaaaa',
                fontFamily: 'Georgia, serif'
            }).setOrigin(0.5);

            // Invisible hit area
            const hitArea = this.add.circle(0, 0, 50, 0xffffff, 0)
                .setInteractive({ useHandCursor: true });

            container.add([hitArea, symbolText]);

            // Gentle floating animation
            this.tweens.add({
                targets: container,
                y: height / 2 - 10,
                duration: 2000 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Hover effect - very subtle glow
            hitArea.on('pointerover', () => {
                symbolText.setColor('#ffffff');
                this.tweens.add({
                    targets: symbolText,
                    scale: 1.1,
                    duration: 150
                });
            });

            hitArea.on('pointerout', () => {
                symbolText.setColor('#aaaaaa');
                this.tweens.add({
                    targets: symbolText,
                    scale: 1,
                    duration: 150
                });
            });

            // Click handler
            hitArea.on('pointerdown', () => {
                this.resetIdleTimer();
                this.handleSymbolClick(symbol.key, symbolText);
            });

            this.symbolButtons.push({ container, symbolText, hitArea, key: symbol.key });
        });
    }

    createProgressIndicator() {
        const { width, height } = this.scale;

        this.progressDots = [];
        const dotSpacing = 20;
        const startX = width / 2 - (this.correctSequence.length - 1) * dotSpacing / 2;

        for (let i = 0; i < this.correctSequence.length; i++) {
            const dot = this.add.circle(startX + i * dotSpacing, height / 2 + 100, 5, 0x444444);
            this.progressDots.push(dot);
        }
    }

    updateProgressIndicator() {
        this.progressDots.forEach((dot, index) => {
            if (index < this.playerSequence.length) {
                dot.setFillStyle(0xffffff);
            } else {
                dot.setFillStyle(0x444444);
            }
        });
    }

    handleSymbolClick(symbolKey, symbolText) {
        // Visual feedback - brief flash
        this.tweens.add({
            targets: symbolText,
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });

        // Add to player sequence
        this.playerSequence.push(symbolKey);
        this.updateProgressIndicator();

        // Check if current sequence matches
        const currentIndex = this.playerSequence.length - 1;

        if (this.playerSequence[currentIndex] !== this.correctSequence[currentIndex]) {
            // Wrong sequence
            this.handleWrongSequence();
        } else if (this.playerSequence.length === this.correctSequence.length) {
            // Correct complete sequence!
            this.handleCorrectSequence();
        }
    }

    handleWrongSequence() {
        const { width, height } = this.scale;

        // Increment wrong attempts counter
        this.wrongAttempts++;

        // After 2 wrong attempts, switch to darker threatening background
        if (this.wrongAttempts === 2 && this.silenceBg) {
            // Flash effect for transition
            this.cameras.main.flash(150, 20, 20, 30);

            // Switch to darker alt background
            this.silenceBg.setTexture('bg_silence_void_alt');

            // Show threatening message
            const warningText = this.add.text(this.textbox.x, this.textbox.y - 40, '"The silence grows impatient."', {
                fontSize: '16px',
                color: '#664444',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: warningText,
                alpha: 1,
                duration: 500,
                hold: 1500,
                yoyo: true,
                onComplete: () => warningText.destroy()
            });
        }

        // Fade effect
        const fadeOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0);

        this.tweens.add({
            targets: fadeOverlay,
            alpha: 0.3,
            duration: 200,
            yoyo: true,
            onComplete: () => fadeOverlay.destroy()
        });

        // Reset sequence
        this.playerSequence = [];
        this.updateProgressIndicator();

        // Show subtle message
        const errorText = this.add.text(this.textbox.x, this.textbox.y, '…', {
            fontSize: '20px',
            color: '#666666',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: errorText,
            alpha: 1,
            duration: 300,
            hold: 1000,
            yoyo: true,
            onComplete: () => errorText.destroy()
        });

        // Optional flag
        GameState.setFlag('silence_failed', true);
    }

    handleCorrectSequence() {
        const { width, height } = this.scale;

        this.cancelIdleTimer();

        // Stop floating animations
        this.symbolButtons.forEach(btn => {
            this.tweens.killTweensOf(btn.container);
        });

        // All dots light up
        this.progressDots.forEach(dot => {
            this.tweens.add({
                targets: dot,
                fillColor: 0xffffff,
                scale: 1.5,
                duration: 300
            });
        });

        // Set critical flags
        GameState.setFlag('hunger_unlocked', true);
        GameState.setFlag('silence_completed', true);

        // Show revelation message
        this.time.delayedCall(500, () => {
            this.showDialogue([
                "Something awakens beneath the stage."
            ], () => {
                this.exitScene();
            });
        });
    }

    /**
     * Show dialogue lines sequentially in textbox
     */
    showDialogue(lines, onComplete) {
        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < lines.length) {
                currentText = this.createTypewriterText(
                    this.textbox.x,
                    this.textbox.y,
                    lines[lineIndex],
                    {
                        fontSize: '20px',
                        color: '#aaaaaa'
                    },
                    40
                );
                lineIndex++;
                this.time.delayedCall(2500, showNextLine);
            } else {
                if (currentText) currentText.destroy();
                if (onComplete) onComplete();
            }
        };

        showNextLine();
    }

    exitScene() {
        this.interactionPhase = 3;
        this.cancelIdleTimer();

        // Exit narration - very minimal
        this.showDialogue([
            '"Enough."',
            '"Return."'
        ], () => {
            // Fade out (slower for silence)
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HubScene');
            });
        });
    }

    // ========== Easter Egg: Idle Timer ==========

    resetIdleTimer() {
        this.cancelIdleTimer();

        // 15 second idle triggers easter egg (as per spec)
        this.idleTimer = this.time.delayedCall(15000, () => {
            if (this.scene.isActive() && this.interactionPhase === 2 && !GameState.flags.silence_idle_eg) {
                this.showIdleEasterEgg();
            }
        });
    }

    cancelIdleTimer() {
        if (this.idleTimer) {
            this.idleTimer.remove();
            this.idleTimer = null;
        }
    }

    showIdleEasterEgg() {
        const { width, height } = this.scale;

        GameState.setFlag('silence_idle_eg', true);

        const hintText = this.add.text(width / 2, height / 2 + 180, '"Even silence is a mask."', {
            fontSize: '14px',
            color: '#555555',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: hintText,
            alpha: 1,
            duration: 1500,
            hold: 3000,
            yoyo: true,
            onComplete: () => hintText.destroy()
        });
    }

    shutdown() {
        super.shutdown();
        this.cancelIdleTimer();
    }
}
