import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * Mask of Sorrow - Room Without Faces
 * A childhood room scene where memories have lost their faces.
 */
export class SorrowScene extends BaseScene {
    constructor() {
        super({ key: 'SorrowScene' });
        this.idleTimer = null;
        this.interactionPhase = 0; // 0: intro, 1: narration, 2: choices, 3: exit
    }

    create() {
        const { width, height } = this.scale;

        // Start with black screen for transition
        this.cameras.main.fadeIn(400, 0, 0, 0);

        // Phase 1: "You chose Sorrow" intro text
        this.showIntroText();
    }

    showIntroText() {
        const { width, height } = this.scale;

        // Check for returning player recognition
        const wasUsedBefore = GameState.wasMaskUsed('sorrow');

        if (wasUsedBefore) {
            // Show recognition line first
            const recognitionText = this.add.text(width / 2, height / 2, '"You remembered this room."', {
                fontSize: '22px',
                color: '#8888aa',
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

        const introText = this.add.text(width / 2, height / 2, 'You chose Sorrow.', {
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
                this.showSorrowWorld();
            }
        });
    }

    showSorrowWorld() {
        const { width, height } = this.scale;
        this.interactionPhase = 1;

        // Background: Sorrow room scene
        this.sorrowBg = this.add.image(width / 2, height / 2, 'bg_sorrow_room');
        this.sorrowBg.setDisplaySize(width, height);
        this.sorrowBg.setAlpha(0);

        // Fade in background
        this.tweens.add({
            targets: this.sorrowBg,
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
        const maskIndicator = this.add.image(width - 50, 50, 'mask_sorrow');
        const targetSize = 50;
        const scale = targetSize / Math.max(maskIndicator.width, maskIndicator.height);
        maskIndicator.setScale(scale);
        maskIndicator.setAlpha(0.7);

        // Subtle vignette effect (dark edges)
        this.createVignette();

        // Textbox at bottom
        this.textbox = this.createTextbox();
    }

    /**
     * Create a subtle vignette overlay for atmosphere
     */
    createVignette() {
        const { width, height } = this.scale;

        // Top and bottom darker edges
        const topVignette = this.add.rectangle(width / 2, 0, width, 100, 0x000000, 0.3)
            .setOrigin(0.5, 0);
        const bottomVignette = this.add.rectangle(width / 2, height, width, 100, 0x000000, 0.3)
            .setOrigin(0.5, 1);

        this.vignetteElements = [topVignette, bottomVignette];
    }

    startNarration() {
        const narrationLines = [
            "The air is cold.",
            "This room feels familiar.",
            "Like something you once called home.",
            "A photograph hangs on the wall.",
            "Everyone is there…",
            "Except their faces."
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
        // Start idle timer for easter egg
        this.resetIdleTimer();

        // Store choice elements for potential cleanup
        this.choiceElements = this.createSorrowChoices();
    }

    createSorrowChoices() {
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
            { text: "Look closer at the photo", callback: () => this.handleLookAtPhoto() },
            { text: "Close your eyes", callback: () => this.handleCloseEyes() },
            { text: "Say your own name", callback: () => this.handleSayName() }
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

            // Soft glow effect on hover (slower than Rage)
            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0x444444);
                btnBg.setStrokeStyle(2, 0x6699cc); // Blue-gray glow for sorrow
            });

            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0x333333);
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

    handleLookAtPhoto() {
        const { width, height } = this.scale;

        // Change background to close-up of the photo
        if (this.sorrowBg) {
            this.sorrowBg.setTexture('bg_sorrow_photo_closeup');
        }

        // Subtle zoom-in effect via vignette intensification
        this.intensifyVignette();

        GameState.setFlag('sorrow_photo_seen', true);

        this.showDialogue([
            "You step closer.",
            "The faces are blank.",
            "Smooth as porcelain.",
            "Someone has been erased."
        ], () => this.exitScene());
    }

    handleCloseEyes() {
        const { width, height } = this.scale;

        // Darken screen slightly (vignette intensification)
        this.intensifyVignette();

        GameState.setFlag('sorrow_closed_eyes', true);

        this.showDialogue([
            "You shut your eyes.",
            "For a moment…",
            "you almost remember warmth.",
            "But the memory slips away."
        ], () => this.exitScene());
    }

    handleSayName() {
        const { width, height } = this.scale;

        // Change background to alternate sorrow room
        if (this.sorrowBg) {
            this.sorrowBg.setTexture('bg_sorrow_room_alt');
        }

        // Brief flicker effect
        this.doGlitchFlicker(() => {
            // Critical flag for Hunger mask unlock
            GameState.setFlag('name_lost', true);

            this.showDialogue([
                "You whisper your name.",
                "The room does not answer.",
                "The speaker crackles:",
                "\"That name is not yours anymore.\""
            ], () => this.exitScene());
        });
    }

    /**
     * Intensify vignette for atmospheric effect
     */
    intensifyVignette() {
        if (this.vignetteElements) {
            this.vignetteElements.forEach(element => {
                this.tweens.add({
                    targets: element,
                    alpha: 0.5,
                    duration: 500
                });
            });
        }
    }

    /**
     * Simple 1-2 frame alpha flicker effect (gentler than Rage)
     */
    doGlitchFlicker(onComplete) {
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0);

        this.tweens.add({
            targets: overlay,
            alpha: 0.6,
            duration: 80,
            yoyo: true,
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
        this.cancelIdleTimer();

        // Exit narration
        this.showDialogue([
            "\"Enough sorrow.\"",
            "\"Return.\""
        ], () => {
            // Set completed flag
            GameState.setFlag('sorrow_completed', true);

            // Fade out and return to hub
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HubScene');
            });
        });
    }

    // ========== Easter Egg: Idle Timer ==========

    resetIdleTimer() {
        this.cancelIdleTimer();

        // 12 second idle triggers easter egg (as per spec)
        this.idleTimer = this.time.delayedCall(12000, () => {
            if (this.scene.isActive() && this.interactionPhase === 2 && !GameState.flags.sorrow_idle_eg) {
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

        GameState.setFlag('sorrow_idle_eg', true);

        const hintText = this.add.text(width / 2, height / 2 + 180, '"Some memories wear masks too."', {
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
        this.cancelIdleTimer();
    }
}
