import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * Mask of Joy - Joy World ("False Happiness")
 * A party scene that feels too perfect, too happy.
 */
export class JoyScene extends BaseScene {
    constructor() {
        super({ key: 'JoyScene' });
        this.idleTimer = null;
        this.interactionPhase = 0; // 0: intro, 1: narration, 2: choices, 3: exit
    }

    create() {
        const { width, height } = this.scale;

        // Start with black screen for transition
        this.cameras.main.fadeIn(400, 0, 0, 0);

        // Phase 1: "You chose Joy" intro text
        this.showIntroText();
    }

    showIntroText() {
        const { width, height } = this.scale;

        // Check for returning player recognition
        const wasUsedBefore = GameState.wasMaskUsed('joy');

        if (wasUsedBefore) {
            // Show recognition line first
            const recognitionText = this.add.text(width / 2, height / 2, '"Still smiling?"', {
                fontSize: '22px',
                color: '#aa8888',
                fontFamily: 'Georgia, serif',
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

        const introText = this.add.text(width / 2, height / 2, 'You chose Joy.', {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in intro text
        this.tweens.add({
            targets: introText,
            alpha: 1,
            duration: 800,
            hold: 1500,
            yoyo: true,
            onComplete: () => {
                introText.destroy();
                this.showJoyWorld();
            }
        });
    }

    showJoyWorld() {
        const { width, height } = this.scale;
        this.interactionPhase = 1;

        // Background: Joy party scene (store reference for potential swap)
        this.joyBg = this.add.image(width / 2, height / 2, 'bg_joy_party');
        this.joyBg.setDisplaySize(width, height);
        this.joyBg.setAlpha(0);

        // Fade in background
        this.tweens.add({
            targets: this.joyBg,
            alpha: 1,
            duration: 1000,
            onComplete: () => {
                this.setupUI();
                this.startNarration();
            }
        });
    }

    setupUI() {
        const { width } = this.scale;

        // Mask indicator (top-right corner)
        const maskIndicator = this.add.image(width - 50, 50, 'mask_joy');
        const targetSize = 50;
        const scale = targetSize / Math.max(maskIndicator.width, maskIndicator.height);
        maskIndicator.setScale(scale);
        maskIndicator.setAlpha(0.7);

        // Textbox at bottom
        this.textbox = this.createTextbox();
    }

    startNarration() {
        const narrationLines = [
            "The air smells like sugar.",
            "Laughter fills the room.",
            "Too much laughter.",
            "Everyone is smiling.",
            "No one is blinking."
        ];

        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < narrationLines.length) {
                currentText = this.createTypewriterText(
                    this.textbox.x,
                    this.textbox.y,
                    narrationLines[lineIndex],
                    {
                        fontSize: '20px',
                        color: '#cccccc',
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
        // Start idle timer
        this.resetIdleTimer();

        // Store choice elements for potential cleanup
        this.choiceElements = this.createChoiceWithRef("What will you do?", [
            {
                text: "Smile back",
                callback: () => {
                    this.cancelIdleTimer();
                    this.handleSmileBack();
                }
            },
            {
                text: "Ask why everyone is wearing masks",
                callback: () => {
                    this.cancelIdleTimer();
                    this.handleAskMasks();
                }
            },
            {
                text: "Remove your mask",
                callback: () => {
                    this.cancelIdleTimer();
                    this.handleRemoveMask();
                }
            }
        ]);
    }

    /**
     * Create choice dialog and return references for cleanup
     */
    createChoiceWithRef(title, choices) {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
        const dialog = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1a1a1a).setStrokeStyle(2, 0x444444);
        const titleText = this.add.text(width / 2, height / 2 - 150, title, {
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 550 },
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5);

        const buttons = [];

        choices.forEach((choice, index) => {
            const btnBg = this.add.rectangle(width / 2, height / 2 - 50 + (index * 60), 500, 50, 0x333333)
                .setInteractive({ useHandCursor: true });

            const btnText = this.add.text(width / 2, height / 2 - 50 + (index * 60), choice.text, {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: 'Georgia, serif'
            }).setOrigin(0.5);

            btnBg.on('pointerover', () => btnBg.setFillStyle(0x444444));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0x333333));
            btnBg.on('pointerdown', () => {
                this.destroyChoiceElements();
                choice.callback();
            });

            buttons.push(btnBg, btnText);
        });

        return { overlay, dialog, titleText, buttons };
    }

    /**
     * Destroy choice dialog elements
     */
    destroyChoiceElements() {
        if (this.choiceElements) {
            this.choiceElements.overlay.destroy();
            this.choiceElements.dialog.destroy();
            this.choiceElements.titleText.destroy();
            this.choiceElements.buttons.forEach(btn => btn.destroy());
            this.choiceElements = null;
        }
    }

    handleSmileBack() {
        const { width, height } = this.scale;

        // Brief brightness pulse
        const flash = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0);
        this.tweens.add({
            targets: flash,
            alpha: 0.15,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                flash.destroy();
                this.showDialogue([
                    "You smile.",
                    "The room smiles harder."
                ], () => this.continueOrExit());
            }
        });
    }

    handleAskMasks() {
        // Simple glitch flicker
        this.doGlitchFlicker(() => {
            GameState.setFlag('joy_questioned', true);
            this.showDialogue([
                "\"Why are you all wearing masks?\"",
                "\"Masks?\"",
                "\"This is our real face.\""
            ], () => this.continueOrExit());
        });
    }

    handleRemoveMask() {
        const { width, height } = this.scale;

        // Heavier glitch for this choice
        this.doGlitchFlicker(() => {
            this.doGlitchFlicker(() => {
                GameState.setFlag('joy_removed', true);

                // Swap background to alt version
                if (this.joyBg) {
                    this.joyBg.destroy();
                }
                this.joyBg = this.add.image(width / 2, height / 2, 'bg_joy_party_alt');
                this.joyBg.setDisplaySize(width, height);
                this.joyBg.setDepth(-1); // Send to back

                this.showDialogue([
                    "You reach for your face…",
                    "The laughter stops.",
                    "\"Don't.\"",
                    "\"If you take it off…\"",
                    "\"You'll remember.\""
                ], () => this.exitScene());
            });
        });
    }

    /**
     * Simple 2-frame alpha flicker effect
     */
    doGlitchFlicker(onComplete) {
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0);

        this.tweens.add({
            targets: overlay,
            alpha: 0.8,
            duration: 50,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                overlay.destroy();
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Show dialogue lines sequentially
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
                        color: '#cccccc'
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

    continueOrExit() {
        // After first interaction, go to exit
        this.exitScene();
    }

    exitScene() {
        this.interactionPhase = 3;
        this.cancelIdleTimer();

        // Exit narration
        this.showDialogue([
            "\"Enough joy.\"",
            "\"Return.\""
        ], () => {
            // Set completed flag
            GameState.setFlag('joy_completed', true);

            // Fade out and return to hub
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HubScene');
            });
        });
    }

    /**
     * Idle timer management - resets on choice click
     */
    resetIdleTimer() {
        this.cancelIdleTimer();

        this.idleTimer = this.time.delayedCall(10000, () => {
            if (this.scene.isActive() && this.interactionPhase === 2) {
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
        GameState.setFlag('joy_idle_eg', true);

        // Phase 1: Dismiss choice dialog
        this.destroyChoiceElements();
        this.interactionPhase = 3;

        // Phase 2: Show easter egg lines as typewriter text in textbox, then exit
        this.showDialogue([
            "\"Oh…\"",
            "\"You're pretending too.\""
        ], () => {
            // After easter egg, continue to exit flow
            this.showDialogue([
                "\"Enough joy.\"",
                "\"Return.\""
            ], () => {
                // Set completed flag
                GameState.setFlag('joy_completed', true);

                // Fade out and return to hub
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('HubScene');
                });
            });
        });
    }

    shutdown() {
        super.shutdown();
        this.cancelIdleTimer();
    }
}
