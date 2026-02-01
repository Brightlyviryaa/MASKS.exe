import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * Mask of Truth - The Script Behind the Mask
 * A meta scene where the player sees behind the game's curtain.
 */
export class TruthScene extends BaseScene {
    constructor() {
        super({ key: 'TruthScene' });
        this.idleTimer = null;
        this.interactionPhase = 0; // 0: intro, 1: narration, 2: choices, 3: exit
        this.secretInput = '';
        this.scanlineGraphics = null;
    }

    create() {
        const { width, height } = this.scale;

        // Start with black screen for transition
        this.cameras.main.fadeIn(400, 0, 0, 0);

        // Phase 1: "You chose Truth" intro text with crack effect
        this.showIntroText();
    }

    showIntroText() {
        const { width, height } = this.scale;

        // Check for returning player recognition
        const wasUsedBefore = GameState.wasMaskUsed('truth');

        if (wasUsedBefore) {
            // Show recognition line first
            const recognitionText = this.add.text(width / 2, height / 2, '"You\'ve seen the code before."', {
                fontSize: '22px',
                color: '#6699aa',
                fontFamily: 'Courier New, monospace',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: recognitionText,
                alpha: 1,
                duration: 600,
                hold: 1200,
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

        const introText = this.add.text(width / 2, height / 2, 'You chose Truth.', {
            fontSize: '28px',
            color: '#88ccff',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in intro text
        this.tweens.add({
            targets: introText,
            alpha: 1,
            duration: 800,
            hold: 1000,
            onComplete: () => {
                // Screen "crack" effect
                this.doScreenCrack(() => {
                    introText.destroy();
                    this.showTruthWorld();
                });
            }
        });
    }

    /**
     * Screen crack effect - visual glitch before transitioning
     */
    doScreenCrack(onComplete) {
        const { width, height } = this.scale;

        // Create multiple short white lines to simulate cracks
        const lines = [];
        const crackPoints = [
            { x1: width / 2, y1: height / 2, x2: width / 2 + 100, y2: height / 2 - 80 },
            { x1: width / 2, y1: height / 2, x2: width / 2 - 80, y2: height / 2 + 60 },
            { x1: width / 2, y1: height / 2, x2: width / 2 + 50, y2: height / 2 + 100 }
        ];

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 0.8);

        // Animate cracks appearing
        let crackIndex = 0;
        const showNextCrack = () => {
            if (crackIndex < crackPoints.length) {
                const crack = crackPoints[crackIndex];
                graphics.lineBetween(crack.x1, crack.y1, crack.x2, crack.y2);
                crackIndex++;
                this.time.delayedCall(100, showNextCrack);
            } else {
                // Flash and fade
                this.time.delayedCall(200, () => {
                    graphics.destroy();
                    if (onComplete) onComplete();
                });
            }
        };

        showNextCrack();
    }

    showTruthWorld() {
        const { width, height } = this.scale;
        this.interactionPhase = 1;

        // Background: Truth glitch world
        this.truthBg = this.add.image(width / 2, height / 2, 'bg_truth_glitch');
        this.truthBg.setDisplaySize(width, height);
        this.truthBg.setAlpha(0);

        // Fade in background
        this.tweens.add({
            targets: this.truthBg,
            alpha: 1,
            duration: 1000,
            onComplete: () => {
                this.setupUI();
                this.startScanlineEffect();
                this.startNarration();
            }
        });
    }

    setupUI() {
        const { width } = this.scale;

        // Mask indicator (top-right corner)
        const maskIndicator = this.add.image(width - 50, 50, 'mask_truth');
        const targetSize = 50;
        const scale = targetSize / Math.max(maskIndicator.width, maskIndicator.height);
        maskIndicator.setScale(scale);
        maskIndicator.setAlpha(0.7);

        // Textbox at bottom
        this.textbox = this.createTextbox();
    }

    /**
     * Create animated scanline effect for CRT/glitch feel
     */
    startScanlineEffect() {
        const { width, height } = this.scale;

        this.scanlineGraphics = this.add.graphics();
        this.scanlineGraphics.setAlpha(0.1);

        // Draw horizontal scanlines
        this.scanlineGraphics.lineStyle(1, 0x000000, 0.3);
        for (let y = 0; y < height; y += 3) {
            this.scanlineGraphics.lineBetween(0, y, width, y);
        }

        // Subtle flicker animation
        this.tweens.add({
            targets: this.scanlineGraphics,
            alpha: 0.15,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    startNarration() {
        const narrationLines = [
            "The stage is gone.",
            "The room is gone.",
            "Only the screen remains.",
            "Words appear… before they are spoken.",
            "...",
            "You are not wearing the mask.",
            "The mask is wearing the story."
        ];

        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < narrationLines.length) {
                // Add random flicker on some lines
                if (lineIndex === 4 || lineIndex === 6) {
                    this.doGlitchFlicker();
                }

                currentText = this.createTypewriterText(
                    this.textbox.x,
                    this.textbox.y,
                    narrationLines[lineIndex],
                    {
                        fontSize: '20px',
                        color: '#88ccff',
                        fontStyle: 'italic'
                    },
                    40
                );
                lineIndex++;
                this.time.delayedCall(2500, showNextLine);
            } else {
                // Narration complete, show choices
                if (currentText) currentText.destroy();
                this.interactionPhase = 2;
                this.showChoices();
            }
        };

        // Start narration after brief pause
        this.time.delayedCall(500, showNextLine);
    }

    showChoices() {
        // Start idle timer for easter egg
        this.resetIdleTimer();

        // Setup keyboard listener for secret code
        this.setupSecretInput();

        // Store choice elements for potential cleanup
        this.choiceElements = this.createTruthChoices();
    }

    createTruthChoices() {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
        const dialog = this.add.rectangle(width / 2, height / 2, 600, 400, 0x0a0a1a).setStrokeStyle(2, 0x4488cc);
        const titleText = this.add.text(width / 2, height / 2 - 150, "What will you do?", {
            fontSize: '24px',
            color: '#88ccff',
            align: 'center',
            wordWrap: { width: 550 },
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5);

        // Check if script was previously deleted
        const isScriptDeleted = GameState.isScriptDeleted();

        // Build choices - some change if script was deleted
        const choices = [];

        if (isScriptDeleted) {
            // Script already deleted - can't read what doesn't exist
            choices.push({
                text: "Read the source code  [CORRUPTED]",
                callback: () => this.handleReadCodeCorrupted()
            });
        } else {
            choices.push({
                text: "Read the source code",
                callback: () => this.handleReadCode()
            });
        }

        choices.push({ text: "Search for your name", callback: () => this.handleSearchName() });
        choices.push({ text: "Delete the mask variable", callback: () => this.handleDeleteMask() });

        const buttons = [];

        choices.forEach((choice, index) => {
            const btnBg = this.add.rectangle(width / 2, height / 2 - 50 + (index * 60), 500, 50, 0x1a1a3a)
                .setInteractive({ useHandCursor: true });

            const btnText = this.add.text(width / 2, height / 2 - 50 + (index * 60), choice.text, {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace'
            }).setOrigin(0.5);

            // Cold glow effect on hover
            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0x2a2a4a);
                btnBg.setStrokeStyle(2, 0x88ccff);
            });

            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0x1a1a3a);
                btnBg.setStrokeStyle(0);
            });

            btnBg.on('pointerdown', () => {
                this.cancelIdleTimer();
                this.destroyChoiceElements();
                choice.callback();
            });

            buttons.push(btnBg, btnText);
        });

        return { overlay, dialog, titleText, buttons };
    }

    destroyChoiceElements() {
        if (this.choiceElements) {
            this.choiceElements.overlay.destroy();
            this.choiceElements.dialog.destroy();
            this.choiceElements.titleText.destroy();
            this.choiceElements.buttons.forEach(btn => btn.destroy());
            this.choiceElements = null;
        }
    }

    // ========== Choice Handlers ==========

    /**
     * Handler for when script was previously deleted - shows corrupted code
     */
    handleReadCodeCorrupted() {
        const { width, height } = this.scale;

        // Glitch flicker
        this.doGlitchFlicker();

        // Show corrupted code fragments
        const corruptedLines = [
            '??? masks = [███████████];',
            'let player = { emotion: ∅ };',
            'function ######() {',
            '    return null;',
            '}'
        ];

        const codeContainer = this.add.container(width / 2, height / 2 - 100);

        corruptedLines.forEach((line, i) => {
            const codeLine = this.add.text(0, i * 25, line, {
                fontSize: '14px',
                color: '#ff4444',
                fontFamily: 'Courier New, monospace'
            }).setOrigin(0.5).setAlpha(0);

            codeContainer.add(codeLine);

            this.tweens.add({
                targets: codeLine,
                alpha: 1,
                duration: 100,
                delay: i * 100
            });
        });

        this.time.delayedCall(1500, () => {
            codeContainer.destroy();
            this.showDialogue([
                "There is nothing to read.",
                "The script you deleted does not come back.",
                "Only fragments remain."
            ], () => this.exitScene());
        });
    }

    handleReadCode() {
        const { width, height } = this.scale;

        GameState.setFlag('truth_code_seen', true);

        // Show code-like text scrolling effect
        const codeLines = [
            'const masks = ["joy", "rage", "sorrow"];',
            'let player = { emotion: undefined };',
            'function choose(mask) {',
            '    return scripted_response[mask];',
            '}'
        ];

        const codeContainer = this.add.container(width / 2, height / 2 - 100);

        codeLines.forEach((line, i) => {
            const codeLine = this.add.text(0, i * 25, line, {
                fontSize: '14px',
                color: '#44ff88',
                fontFamily: 'Courier New, monospace'
            }).setOrigin(0.5).setAlpha(0);

            codeContainer.add(codeLine);

            this.tweens.add({
                targets: codeLine,
                alpha: 1,
                duration: 300,
                delay: i * 200
            });
        });

        this.time.delayedCall(2000, () => {
            codeContainer.destroy();
            this.showDialogue([
                "Lines of dialogue scroll past.",
                "Joy. Rage. Sorrow.",
                "All written in advance.",
                "\"Did you think you were choosing?\""
            ], () => this.exitScene());
        });
    }

    handleSearchName() {
        const { width, height } = this.scale;

        GameState.setFlag('truth_name_checked', true);

        // Textbox distortion effect
        if (this.textbox) {
            this.tweens.add({
                targets: this.textbox,
                x: this.textbox.x + 5,
                duration: 50,
                yoyo: true,
                repeat: 3
            });
        }

        this.showDialogue([
            "You search for yourself.",
            "There is only one entry:",
            "PLAYER = \"UNKNOWN\"",
            "\"Truth is not a face.\""
        ], () => this.exitScene());
    }

    handleDeleteMask() {
        const { width, height } = this.scale;

        // Strong glitch effect
        this.doHeavyGlitch(() => {
            // Change to void background - the game is being deleted
            if (this.truthBg) {
                this.truthBg.setTexture('bg_end_truth_void');
            }

            // Remove scanlines
            if (this.scanlineGraphics) {
                this.scanlineGraphics.destroy();
            }

            GameState.setFlag('ending_glitch', true);

            // Narrative sequence
            this.showDialogue([
                "You reach into the script.",
                "You delete the mask.",
                "The stage goes quiet.",
                "There is no story left to wear."
            ], () => {
                // Black overlay for void effect
                const blackOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

                this.time.delayedCall(1000, () => {
                    // Error message - meta breaking point
                    const errorText = this.add.text(width / 2, height / 2, 'ERROR: SCENE NOT FOUND', {
                        fontSize: '24px',
                        color: '#ff4444',
                        fontFamily: 'Courier New, monospace',
                        fontStyle: 'bold'
                    }).setOrigin(0.5).setAlpha(0);

                    const subText = this.add.text(width / 2, height / 2 + 40, 'The story has nowhere to go.', {
                        fontSize: '16px',
                        color: '#666666',
                        fontFamily: 'Georgia, serif',
                        fontStyle: 'italic'
                    }).setOrigin(0.5).setAlpha(0);

                    // Fade in error
                    this.tweens.add({
                        targets: [errorText, subText],
                        alpha: 1,
                        duration: 500
                    });

                    // Commit the Early Ending
                    GameState.commitEnding('T0_SCRIPT_BREAK_EARLY');

                    // Flash and then transition to Credits
                    this.time.delayedCall(3000, () => {
                        this.cameras.main.flash(200, 255, 255, 255);
                        this.time.delayedCall(300, () => {
                            this.cameras.main.fadeOut(1500, 0, 0, 0);
                            this.cameras.main.once('camerafadeoutcomplete', () => {
                                this.scene.start('CreditScene');
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * Simple flicker effect
     */
    doGlitchFlicker() {
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0);

        this.tweens.add({
            targets: overlay,
            alpha: 0.3,
            duration: 50,
            yoyo: true,
            onComplete: () => overlay.destroy()
        });
    }

    /**
     * Heavy glitch effect for delete action
     */
    doHeavyGlitch(onComplete) {
        const { width, height } = this.scale;

        // Multiple flicker frames
        let flickerCount = 0;
        const maxFlickers = 5;

        const doFlicker = () => {
            const overlay = this.add.rectangle(0, 0, width, height, 0xffffff, 0.7).setOrigin(0);

            this.tweens.add({
                targets: overlay,
                alpha: 0,
                duration: 80,
                onComplete: () => {
                    overlay.destroy();
                    flickerCount++;
                    if (flickerCount < maxFlickers) {
                        this.time.delayedCall(50, doFlicker);
                    } else {
                        if (onComplete) onComplete();
                    }
                }
            });
        };

        doFlicker();
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
                        color: '#88ccff'
                    },
                    35
                );
                lineIndex++;
                this.time.delayedCall(2200, showNextLine);
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

        // Exit narration
        this.showDialogue([
            "\"Enough truth.\"",
            "\"Return.\""
        ], () => {
            // Set completed flag
            GameState.setFlag('truth_completed', true);

            // Fade out with glitch static
            if (this.scanlineGraphics) {
                this.tweens.add({
                    targets: this.scanlineGraphics,
                    alpha: 0,
                    duration: 500
                });
            }

            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HubScene');
            });
        });
    }

    // ========== Easter Egg: Secret Input ==========

    setupSecretInput() {
        this.input.keyboard.on('keydown', (event) => {
            if (this.interactionPhase !== 2) return;

            this.secretInput += event.key.toUpperCase();

            // Keep only last 6 characters
            if (this.secretInput.length > 6) {
                this.secretInput = this.secretInput.slice(-6);
            }

            // Check for secret code
            if (this.secretInput === 'KENNEY' && !GameState.flags.truth_dev_room) {
                this.showDevRoomEasterEgg();
            }
        });
    }

    showDevRoomEasterEgg() {
        const { width, height } = this.scale;

        GameState.setFlag('truth_dev_room', true);

        // Destroy choice menu
        this.destroyChoiceElements();

        const devText = this.add.text(width / 2, height / 2, 'Developer Room Unlocked.\n\n"Assets are masks too."', {
            fontSize: '20px',
            color: '#44ff88',
            fontFamily: 'Courier New, monospace',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: devText,
            alpha: 1,
            duration: 500,
            hold: 3000,
            yoyo: true,
            onComplete: () => {
                devText.destroy();
                this.exitScene();
            }
        });
    }

    // ========== Idle Timer ==========

    resetIdleTimer() {
        this.cancelIdleTimer();

        // 12 second idle triggers easter egg
        this.idleTimer = this.time.delayedCall(12000, () => {
            if (this.scene.isActive() && this.interactionPhase === 2 && !GameState.flags.truth_idle_eg) {
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

        GameState.setFlag('truth_idle_eg', true);

        const hintText = this.add.text(width / 2, height / 2 + 180, '"The code watches back."', {
            fontSize: '14px',
            color: '#446688',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: hintText,
            alpha: 1,
            duration: 1000,
            hold: 2500,
            yoyo: true,
            onComplete: () => hintText.destroy()
        });
    }

    shutdown() {
        super.shutdown();
        this.cancelIdleTimer();
        if (this.scanlineGraphics) {
            this.scanlineGraphics.destroy();
        }
    }
}
