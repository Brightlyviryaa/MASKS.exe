import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * Mask of Rage - Arena of Applause
 * An arena scene where anger is performed for the crowd.
 */
export class RageScene extends BaseScene {
    constructor() {
        super({ key: 'RageScene' });
        this.hoverTimer = null;
        this.interactionPhase = 0; // 0: intro, 1: narration, 2: choices, 3: exit
    }

    create() {
        const { width, height } = this.scale;

        // Start with black screen for transition
        this.cameras.main.fadeIn(400, 0, 0, 0);

        // Phase 1: "You chose Rage" intro text
        this.showIntroText();
    }

    showIntroText() {
        const { width, height } = this.scale;

        // Check for returning player recognition
        const wasUsedBefore = GameState.wasMaskUsed('rage');

        if (wasUsedBefore) {
            // Show recognition line first
            const recognitionText = this.add.text(width / 2, height / 2, '"Again? You like the applause."', {
                fontSize: '22px',
                color: '#cc8888',
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

        const introText = this.add.text(width / 2, height / 2, 'You chose Rage.', {
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
                this.showRageWorld();
            }
        });
    }

    showRageWorld() {
        const { width, height } = this.scale;
        this.interactionPhase = 1;

        // Background: Rage arena scene
        this.rageBg = this.add.image(width / 2, height / 2, 'bg_rage_arena');
        this.rageBg.setDisplaySize(width, height);
        this.rageBg.setAlpha(0);

        // Fade in background
        this.tweens.add({
            targets: this.rageBg,
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
        const maskIndicator = this.add.image(width - 50, 50, 'mask_rage');
        const targetSize = 50;
        const scale = targetSize / Math.max(maskIndicator.width, maskIndicator.height);
        maskIndicator.setScale(scale);
        maskIndicator.setAlpha(0.7);

        // Textbox at bottom
        this.textbox = this.createTextbox();
    }

    startNarration() {
        const narrationLines = [
            "Heat presses against your skin.",
            "An arena surrounds you.",
            "The crowd is loud…",
            "but their faces are not there.",
            "A voice whispers:",
            "\"Be angry. They paid for it.\""
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
        const { width, height } = this.scale;

        // Store choice elements for potential cleanup
        this.choiceElements = this.createRageChoices();
    }

    createRageChoices() {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
        const dialog = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1a1a1a).setStrokeStyle(2, 0x444444);
        const titleText = this.add.text(width / 2, height / 2 - 150, "What will you do?", {
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 550 },
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5);

        const choices = [
            { text: "Fight", callback: () => this.handleFight() },
            { text: "Refuse to fight", callback: () => this.handleRefuse() },
            { text: "Attack the crowd", callback: () => this.handleAttackCrowd() }
        ];

        const buttons = [];

        choices.forEach((choice, index) => {
            const btnBg = this.add.rectangle(width / 2, height / 2 - 50 + (index * 60), 500, 50, 0x333333)
                .setInteractive({ useHandCursor: true });

            const btnText = this.add.text(width / 2, height / 2 - 50 + (index * 60), choice.text, {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: 'Georgia, serif'
            }).setOrigin(0.5);

            // Glow effect on hover
            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0x444444);
                btnBg.setStrokeStyle(2, 0xff4444);

                // Easter egg: hover on "Refuse" for 2 seconds
                if (index === 1) {
                    this.startRefuseHoverTimer();
                }
            });

            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0x333333);
                btnBg.setStrokeStyle(0);
                this.cancelRefuseHoverTimer();
            });

            btnBg.on('pointerdown', () => {
                this.cancelRefuseHoverTimer();
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

    handleFight() {
        const { width, height } = this.scale;

        // Brightness pulse effect
        const flash = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0);
        this.tweens.add({
            targets: flash,
            alpha: 0.2,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                flash.destroy();
                GameState.setFlag('rage_fought', true);
                this.showDialogue([
                    "You raise your hands.",
                    "The crowd roars louder.",
                    "It feels good… for a second."
                ], () => this.exitScene());
            }
        });
    }

    handleRefuse() {
        // Crowd ambience drop - represented by a single flicker
        this.doGlitchFlicker(() => {
            GameState.setFlag('rage_refused', true);
            this.showDialogue([
                "You lower your hands.",
                "Silence spreads—then laughter.",
                "The speaker crackles:",
                "\"Your rage is not real enough.\""
            ], () => this.exitScene());
        });
    }

    handleAttackCrowd() {
        const { width, height } = this.scale;

        // Heavier flicker for attacking
        this.doGlitchFlicker(() => {
            this.doGlitchFlicker(() => {
                GameState.setFlag('rage_attacked', true);

                // Swap background to alt version
                if (this.rageBg) {
                    this.rageBg.destroy();
                }
                this.rageBg = this.add.image(width / 2, height / 2, 'bg_rage_arena_alt');
                this.rageBg.setDisplaySize(width, height);
                this.rageBg.setDepth(-1); // Send to back

                this.showDialogue([
                    "You lash out at the noise.",
                    "The crowd cheers harder.",
                    "They don't fear you.",
                    "They consume you."
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

    exitScene() {
        this.interactionPhase = 3;
        this.cancelRefuseHoverTimer();

        // Exit narration
        this.showDialogue([
            "\"Enough rage.\"",
            "\"Return.\""
        ], () => {
            // Set completed flag
            GameState.setFlag('rage_completed', true);

            // Fade out and return to hub
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HubScene');
            });
        });
    }

    // ========== Easter Egg: Hover on Refuse ==========

    startRefuseHoverTimer() {
        this.cancelRefuseHoverTimer();

        this.hoverTimer = this.time.delayedCall(2000, () => {
            if (this.scene.isActive() && this.interactionPhase === 2 && !GameState.flags.rage_hint) {
                this.showRefuseHint();
            }
        });
    }

    cancelRefuseHoverTimer() {
        if (this.hoverTimer) {
            this.hoverTimer.remove();
            this.hoverTimer = null;
        }
    }

    showRefuseHint() {
        const { width, height } = this.scale;

        GameState.setFlag('rage_hint', true);

        const hintText = this.add.text(width / 2, height / 2 + 180, '"They want your rage more than your victory."', {
            fontSize: '14px',
            color: '#666666',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: hintText,
            alpha: 1,
            duration: 1000,
            hold: 2500,
            yoyo: true,
            onComplete: () => {
                hintText.destroy();
            }
        });
    }

    shutdown() {
        super.shutdown();
        this.cancelRefuseHoverTimer();
    }
}
