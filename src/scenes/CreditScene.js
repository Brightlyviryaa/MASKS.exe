import { GameState } from '../state.js';

/**
 * Credit Scene - Curtain Call
 * Theatrical credits with easter eggs and replay functionality.
 */
export class CreditScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CreditScene' });
        this.idleTimer = null;
        this.inputBuffer = '';
        this.creditsPhase = 0; // 0: intro, 1: credits, 2: quote, 3: buttons
        this.easterEggShown = false;
        this.creditElements = []; // Store references to credit text elements
    }

    init(data) {
        this.endingType = data.ending || 'A_generic';
        this.isGlitchEnding = GameState.flags.ending_glitch || false;

        // NOTE: incrementPlayCount is called in HungerScene, not here
        // This prevents double counting

        // Track returning player status
        this.playCount = GameState.getPlayCount();
    }

    create() {
        const { width, height } = this.scale;

        // Start with black, fade in
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Choose background based on ending type
        const bgKey = this.isGlitchEnding ? 'bg_credits_void' : 'bg_credits_curtain';
        this.creditsBg = this.add.image(width / 2, height / 2, bgKey);
        this.creditsBg.setDisplaySize(width, height);

        // Start credits after fade
        this.time.delayedCall(1200, () => {
            this.showCredits();
        });

        // Setup keyboard for easter egg
        this.setupKeyboardInput();
    }

    setupKeyboardInput() {
        this.input.keyboard.on('keydown', (event) => {
            // Track input for BANANA easter egg
            this.inputBuffer += event.key.toUpperCase();

            // Keep only last 6 characters
            if (this.inputBuffer.length > 6) {
                this.inputBuffer = this.inputBuffer.slice(-6);
            }

            // Check for BANANA
            if (this.inputBuffer === 'BANANA') {
                this.showBananaEasterEgg();
                this.inputBuffer = '';
            }

            // Reset idle timer on any key
            this.resetIdleTimer();
        });

        // Also reset on pointer activity
        this.input.on('pointerdown', () => {
            this.resetIdleTimer();
        });
    }

    showCredits() {
        const { width, height } = this.scale;
        this.creditsPhase = 1;
        this.creditElements = [];

        // Different "Special Thanks" message for returning players
        let specialThanksLine = 'The audience that was never here';
        const isScriptDeleted = GameState.isScriptDeleted();

        if (isScriptDeleted) {
            specialThanksLine = 'The stage restores what you tried to erase';
        } else if (this.playCount >= 3) {
            specialThanksLine = 'The theater will not let you go';
        } else if (this.playCount >= 2) {
            specialThanksLine = 'The audience is still waiting';
        }

        // Credits content blocks - show sequentially, then fade out
        const creditsBlocks = [
            {
                lines: ['MASK.EXE'],
                style: { fontSize: '48px', color: '#ffffff', fontFamily: 'Georgia, serif' },
                delay: 0,
                duration: 2500
            },
            {
                lines: ['A Global Game Jam 2026 Entry', 'Theme: MASK'],
                style: { fontSize: '20px', color: '#aaaaaa', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
                delay: 2500,
                duration: 2500
            },
            {
                lines: ['— Story & Code —', 'Brightly Virya'],
                style: { fontSize: '22px', color: '#dddddd', fontFamily: 'Georgia, serif' },
                delay: 5000,
                duration: 2500
            },
            {
                lines: ['— Art Assets —', 'Nano Banana Pro (AI-assisted)'],
                style: { fontSize: '22px', color: '#dddddd', fontFamily: 'Georgia, serif' },
                delay: 7500,
                duration: 2500
            },
            {
                lines: ['— Special Thanks —', specialThanksLine],
                style: { fontSize: '20px', color: this.playCount >= 2 ? '#aa6666' : '#888888', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
                delay: 10000,
                duration: 2500
            }
        ];

        // Show each block one at a time (not stacking)
        creditsBlocks.forEach((block) => {
            this.time.delayedCall(block.delay, () => {
                // Clear previous credit elements
                this.creditElements.forEach(el => {
                    if (el && el.destroy) {
                        this.tweens.add({
                            targets: el,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => el.destroy()
                        });
                    }
                });
                this.creditElements = [];

                // Show new block centered
                block.lines.forEach((line, lineIndex) => {
                    const text = this.add.text(width / 2, height / 2 - 30 + (lineIndex * 40), line, block.style)
                        .setOrigin(0.5)
                        .setAlpha(0);

                    this.creditElements.push(text);

                    this.tweens.add({
                        targets: text,
                        alpha: 1,
                        duration: 500,
                        ease: 'Power2'
                    });
                });
            });
        });

        // Clear credits and show ending quote
        this.time.delayedCall(12500, () => {
            // Fade out remaining credit elements
            this.creditElements.forEach(el => {
                if (el && el.destroy) {
                    this.tweens.add({
                        targets: el,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => el.destroy()
                    });
                }
            });
            this.creditElements = [];

            // Show quote after fade out
            this.time.delayedCall(600, () => {
                this.showEndingQuote();
            });
        });
    }

    showEndingQuote() {
        const { width, height } = this.scale;
        this.creditsPhase = 2;

        // Get quote based on ending (using new ending IDs)
        let quote = '';
        let quoteColor = '#cccccc';

        switch (this.endingType) {
            case 'A1': // Eternal Smile (Joy + Wear)
                quote = 'The party never ends.';
                quoteColor = '#ffaaaa';
                break;
            case 'A2': // Arena Loop (Rage + Wear)
                quote = 'The crowd demands more.';
                quoteColor = '#ff6666';
                break;
            case 'B1': // Forgotten Name (Sorrow + Destroy)
                quote = 'Even your name is gone.';
                quoteColor = '#8888aa';
                break;
            case 'B2': // Script Breaker (Truth + Destroy in Hunger)
                quote = 'ERROR: NARRATIVE UNDEFINED';
                quoteColor = '#88aaff';
                break;
            case 'T0_SCRIPT_BREAK_EARLY': // Early Script Break (Delete mask in Truth)
                quote = 'ERROR: SCENE NOT FOUND';
                quoteColor = '#ff4444';
                break;
            case 'C': // True Release
                quote = 'Choice was always real.';
                quoteColor = '#ddaa66';
                break;
            case 'A_generic':
                quote = 'The mask remains.';
                quoteColor = '#aa4444';
                break;
            case 'B_generic':
                quote = 'Nothing was underneath.';
                quoteColor = '#888888';
                break;
            default:
                quote = 'The performance ends.';
        }

        // Quote text - centered on screen
        const quoteText = this.add.text(width / 2, height / 2 - 20, quote, {
            fontSize: '32px',
            color: quoteColor,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: quoteText,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });

        // Small separator below quote
        const separator = this.add.text(width / 2, height / 2 + 30, '— — —', {
            fontSize: '18px',
            color: '#444444',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setAlpha(0);

        this.time.delayedCall(800, () => {
            this.tweens.add({
                targets: separator,
                alpha: 1,
                duration: 500
            });
        });

        // Check for auto-restart condition (Script Break endings at high play count)
        if (GameState.isScriptBreakEnding(this.endingType) && this.playCount >= 2) {
            // Auto-restart loop for Script Break endings
            this.time.delayedCall(5000, () => {
                this.autoRestartLoop();
            });
        } else {
            // Show GGJ splash, then buttons
            this.time.delayedCall(2500, () => {
                this.showGGJSplash(() => {
                    this.showExitButtons();
                });
            });

            // Start idle timer for easter egg
            this.startIdleTimer();
        }
    }

    /**
     * Display GGJ 2026 splash in credits with elegant fade
     */
    showGGJSplash(onComplete) {
        const { width, height } = this.scale;

        // Semi-transparent light overlay for contrast
        const splashBg = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0);

        // Add the splash image - scale to fit nicely (smaller in credits)
        const splash = this.add.image(width / 2, height / 2, 'ggj_splash').setAlpha(0);

        // Scale splash to fit within 70% of screen height (smaller for credits)
        const maxHeight = height * 0.7;
        const scale = Math.min(maxHeight / splash.height, (width * 0.8) / splash.width);
        splash.setScale(scale);

        // Fade in background and splash
        this.tweens.add({
            targets: splashBg,
            alpha: 0.95,
            duration: 400,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: splash,
            alpha: 1,
            duration: 600,
            delay: 200,
            ease: 'Power2',
            onComplete: () => {
                // Hold for a moment, then fade out
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: [splash, splashBg],
                        alpha: 0,
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => {
                            splash.destroy();
                            splashBg.destroy();
                            if (onComplete) onComplete();
                        }
                    });
                });
            }
        });
    }

    showExitButtons() {
        const { width, height } = this.scale;
        this.creditsPhase = 3;

        const buttonY = height * 0.88;

        // Play Again button
        const playAgainBg = this.add.rectangle(width / 2 - 100, buttonY, 160, 40, 0x333333)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

        const playAgainText = this.add.text(width / 2 - 100, buttonY, 'Play Again', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setAlpha(0);

        // Quit button
        const quitBg = this.add.rectangle(width / 2 + 100, buttonY, 160, 40, 0x222222)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

        const quitText = this.add.text(width / 2 + 100, buttonY, 'Quit', {
            fontSize: '18px',
            color: '#888888',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in buttons
        this.tweens.add({
            targets: [playAgainBg, playAgainText, quitBg, quitText],
            alpha: 1,
            duration: 500
        });

        // Hover effects
        playAgainBg.on('pointerover', () => {
            playAgainBg.setFillStyle(0x444444);
            playAgainBg.setStrokeStyle(2, 0x888888);
        });
        playAgainBg.on('pointerout', () => {
            playAgainBg.setFillStyle(0x333333);
            playAgainBg.setStrokeStyle(0);
        });
        playAgainBg.on('pointerdown', () => {
            this.restartGame(false);
        });

        quitBg.on('pointerover', () => {
            quitBg.setFillStyle(0x333333);
        });
        quitBg.on('pointerout', () => {
            quitBg.setFillStyle(0x222222);
        });
        quitBg.on('pointerdown', () => {
            this.quitGame();
        });

        this.exitButtons = { playAgainBg, playAgainText, quitBg, quitText };
    }

    startIdleTimer() {
        this.idleTimer = this.time.delayedCall(20000, () => {
            if (!this.easterEggShown) {
                this.showIdleEasterEgg();
            }
        });
    }

    resetIdleTimer() {
        if (this.idleTimer) {
            this.idleTimer.remove();
        }
        // Only restart if we haven't shown the easter egg
        if (!this.easterEggShown && this.creditsPhase >= 2) {
            this.startIdleTimer();
        }
    }

    showIdleEasterEgg() {
        const { width, height } = this.scale;
        this.easterEggShown = true;

        GameState.setFlag('final_eg', true);

        // Subtle flicker effect
        this.cameras.main.flash(100, 20, 20, 20);

        this.time.delayedCall(500, () => {
            // First message
            const msg1 = this.add.text(width / 2, height * 0.6, '"…the play will restart."', {
                fontSize: '18px',
                color: '#666666',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: msg1,
                alpha: 1,
                duration: 800
            });

            // Second message
            this.time.delayedCall(2500, () => {
                const msg2 = this.add.text(width / 2, height * 0.65, '"But the mask will remember."', {
                    fontSize: '18px',
                    color: '#aa6666',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic'
                }).setOrigin(0.5).setAlpha(0);

                this.tweens.add({
                    targets: msg2,
                    alpha: 1,
                    duration: 800
                });

                // Show special replay button
                this.time.delayedCall(2000, () => {
                    this.showMemoryReplayButton();
                });
            });
        });
    }

    showMemoryReplayButton() {
        const { width, height } = this.scale;

        const memoryBtnBg = this.add.rectangle(width / 2, height * 0.78, 280, 50, 0x441111)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0)
            .setStrokeStyle(2, 0x882222);

        const memoryBtnText = this.add.text(width / 2, height * 0.78, 'REPLAY WITH MEMORY', {
            fontSize: '20px',
            color: '#cc6666',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in with pulse
        this.tweens.add({
            targets: [memoryBtnBg, memoryBtnText],
            alpha: 1,
            duration: 800
        });

        // Pulsing glow
        this.tweens.add({
            targets: memoryBtnBg,
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        memoryBtnBg.on('pointerover', () => {
            memoryBtnBg.setFillStyle(0x662222);
            memoryBtnText.setColor('#ffaaaa');
        });

        memoryBtnBg.on('pointerout', () => {
            memoryBtnBg.setFillStyle(0x441111);
            memoryBtnText.setColor('#cc6666');
        });

        memoryBtnBg.on('pointerdown', () => {
            this.restartGame(true);
        });
    }

    showBananaEasterEgg() {
        const { width, height } = this.scale;

        // Flash effect
        this.cameras.main.flash(200, 255, 200, 0);

        const bananaText = this.add.text(width / 2, height * 0.55, 'Nano Banana is still painting.', {
            fontSize: '20px',
            color: '#ffdd00',
            fontFamily: 'Courier New',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: bananaText,
            alpha: 1,
            duration: 500,
            hold: 3000,
            yoyo: true
        });
    }

    /**
     * Auto-restart loop for Script Breaker ending at high play count
     * Creates an eerie infinite loop effect for Script Break endings
     */
    autoRestartLoop() {
        const { width, height } = this.scale;

        // Glitch flash
        this.cameras.main.flash(100, 80, 80, 120);

        // Meta message - "The curtain falls. Then rises again."
        const curtainText = this.add.text(width / 2, height * 0.80, 'The curtain falls.', {
            fontSize: '20px',
            color: '#888888',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: curtainText,
            alpha: 1,
            duration: 500
        });

        this.time.delayedCall(1500, () => {
            const risingText = this.add.text(width / 2, height * 0.85, 'Then rises again.', {
                fontSize: '18px',
                color: '#666666',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: risingText,
                alpha: 1,
                duration: 500
            });

            // Auto-restart after delay (don't increment play count again)
            this.time.delayedCall(2000, () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // Reset session state but keep memory
                    GameState.resetRunState(true);
                    this.scene.start('HubScene');
                });
            });
        });
    }

    restartGame(withMemory) {
        if (withMemory) {
            // Use new resetRunState method
            GameState.resetRunState(true);
        }

        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (withMemory) {
                // Go to hub directly with memory intact
                this.scene.start('HubScene');
            } else {
                // Full restart
                window.location.reload();
            }
        });
    }

    quitGame() {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Try to close tab, or go to start
            try {
                window.close();
            } catch (e) {
                // If can't close, reload to start
                window.location.reload();
            }
        });
    }
}
