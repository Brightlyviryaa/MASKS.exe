import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * Mask of Hunger - The True Route
 * The final mask that lies beneath all masks.
 * Features heartbeat effects, vignette, and pattern-based endings.
 */
export class HungerScene extends BaseScene {
    constructor() {
        super({ key: 'HungerScene' });
        this.interactionPhase = 0; // 0: intro, 1: narration, 2: encounter, 3: choice, 4: ending
        this.heartbeatTimer = null;
        this.vignetteElements = [];
        this.heartbeatIntensity = 0.3;
    }

    create() {
        const { width, height } = this.scale;

        // Mark hunger as completed (entered the route)
        GameState.setFlag('hunger_completed', true);

        // Start with longer black screen transition
        this.cameras.main.fadeIn(800, 0, 0, 0);

        // Phase 1: Intro text
        this.showIntroText();
    }

    showIntroText() {
        const { width, height } = this.scale;

        // Check for returning player recognition - Hunger is more aware
        const wasUsedBefore = GameState.wasMaskUsed('hunger');
        const isReturning = GameState.isReturningPlayer();
        const isScriptDeleted = GameState.isScriptDeleted();

        // Hunger pulses faster for returning players
        if (isReturning) {
            this.heartbeatIntensity = 0.4;
        }

        // Start heartbeat effect immediately
        this.startHeartbeat();

        // Check if script was previously deleted - special recognition
        if (isScriptDeleted) {
            const scriptDeletedText = this.add.text(width / 2, height / 2, '"Deleting the script didn\'t free you."', {
                fontSize: '20px',
                color: '#662222',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            const subText = this.add.text(width / 2, height / 2 + 35, '"It only made the masks hungrier."', {
                fontSize: '18px',
                color: '#aa2222',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: [scriptDeletedText, subText],
                alpha: 1,
                duration: 800,
                hold: 2500,
                yoyo: true,
                onComplete: () => {
                    scriptDeletedText.destroy();
                    subText.destroy();
                    this.showDynamicIntro();
                }
            });
        } else if (wasUsedBefore) {
            // Show recognition line first for players who completed Hunger before
            const recognitionText = this.add.text(width / 2, height / 2, '"It never stopped waiting."', {
                fontSize: '24px',
                color: '#aa2222',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: recognitionText,
                alpha: 1,
                duration: 600,
                hold: 1500,
                yoyo: true,
                onComplete: () => {
                    recognitionText.destroy();
                    this.showDynamicIntro();
                }
            });
        } else {
            this.showDynamicIntro();
        }
    }

    /**
     * Show dynamic intro based on last_mask
     */
    showDynamicIntro() {
        const { width, height } = this.scale;
        const lastMask = GameState.flags.last_mask;

        // Dynamic line based on last_mask
        let dynamicLine = null;
        let dynamicColor = '#aa3333';

        switch (lastMask) {
            case 'joy':
                dynamicLine = '"Still smiling, even here?"';
                dynamicColor = '#ffaaaa';
                break;
            case 'rage':
                dynamicLine = '"Do you hear them cheering?"';
                dynamicColor = '#ff6666';
                break;
            case 'sorrow':
                dynamicLine = '"You brought your loss with you."';
                dynamicColor = '#8888aa';
                break;
            case 'truth':
                dynamicLine = '"You saw the script… and came anyway."';
                dynamicColor = '#88aacc';
                break;
            case 'silence':
                dynamicLine = '"No words left. Only hunger."';
                dynamicColor = '#888888';
                break;
            default:
                // No last_mask or 'none' - skip dynamic line
                break;
        }

        if (dynamicLine) {
            const dynamicText = this.add.text(width / 2, height / 2, dynamicLine, {
                fontSize: '22px',
                color: dynamicColor,
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: dynamicText,
                alpha: 1,
                duration: 600,
                hold: 1800,
                yoyo: true,
                onComplete: () => {
                    dynamicText.destroy();
                    this.showNormalIntro();
                }
            });
        } else {
            this.showNormalIntro();
        }
    }

    showNormalIntro() {
        const { width, height } = this.scale;

        const introLines = [
            '"At last…"',
            '"The final mask."'
        ];

        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < introLines.length) {
                currentText = this.add.text(width / 2, height / 2, introLines[lineIndex], {
                    fontSize: '28px',
                    color: '#aa3333',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic'
                }).setOrigin(0.5).setAlpha(0);

                this.tweens.add({
                    targets: currentText,
                    alpha: 1,
                    duration: 800,
                    hold: 1500,
                    yoyo: true,
                    onComplete: () => {
                        if (currentText) currentText.destroy();
                        lineIndex++;
                        showNextLine();
                    }
                });
            } else {
                this.showHungerWorld();
            }
        };

        this.time.delayedCall(500, showNextLine);
    }

    showHungerWorld() {
        const { width, height } = this.scale;
        this.interactionPhase = 1;

        // Background: Hunger stage
        this.hungerBg = this.add.image(width / 2, height / 2, 'bg_hunger_stage');
        this.hungerBg.setDisplaySize(width, height);
        this.hungerBg.setAlpha(0);

        // Apply tint based on last_mask for dynamic visual effect
        const lastMask = GameState.flags.last_mask;
        switch (lastMask) {
            case 'joy':
                this.hungerBg.setTint(0xffeeee);
                break;
            case 'rage':
                this.hungerBg.setTint(0xffdddd);
                break;
            case 'sorrow':
                this.hungerBg.setTint(0xddddee);
                break;
            case 'truth':
                this.hungerBg.setTint(0xddeeff);
                break;
            case 'silence':
                this.hungerBg.setTint(0xdddddd);
                break;
        }

        // Fade in background
        this.tweens.add({
            targets: this.hungerBg,
            alpha: 1,
            duration: 1500,
            onComplete: () => {
                this.setupUI();
                this.createVignette();
                this.startNarration();
            }
        });
    }

    setupUI() {
        const { width } = this.scale;

        // Mask indicator (top-right corner) - use hunger mask
        const maskIndicator = this.add.image(width - 50, 50, 'mask_hunger');
        const targetSize = 50;
        const scale = targetSize / Math.max(maskIndicator.width, maskIndicator.height);
        maskIndicator.setScale(scale);
        maskIndicator.setAlpha(0.8);

        // Add pulsing to mask indicator
        this.tweens.add({
            targets: maskIndicator,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Textbox at bottom (thinner for Hunger)
        this.textbox = this.createTextbox();
    }

    createVignette() {
        const { width, height } = this.scale;

        const vignetteConfig = [
            { x: 0, y: 0, w: width, h: 80, originX: 0, originY: 0 },
            { x: 0, y: height, w: width, h: 80, originX: 0, originY: 1 },
            { x: 0, y: 0, w: 80, h: height, originX: 0, originY: 0 },
            { x: width, y: 0, w: 80, h: height, originX: 1, originY: 0 }
        ];

        vignetteConfig.forEach(config => {
            const rect = this.add.rectangle(config.x, config.y, config.w, config.h, 0x000000, 0.4)
                .setOrigin(config.originX, config.originY);
            this.vignetteElements.push(rect);
        });
    }

    intensifyVignette(targetAlpha = 0.6) {
        this.vignetteElements.forEach(element => {
            this.tweens.add({
                targets: element,
                alpha: targetAlpha,
                duration: 1000,
                ease: 'Power2'
            });
        });
    }

    startHeartbeat() {
        const { width, height } = this.scale;

        this.heartbeatOverlay = this.add.rectangle(0, 0, width, height, 0x330000, 0)
            .setOrigin(0)
            .setDepth(100);

        const doPulse = () => {
            if (!this.scene.isActive()) return;

            this.tweens.add({
                targets: this.heartbeatOverlay,
                alpha: this.heartbeatIntensity,
                duration: 150,
                yoyo: true,
                onComplete: () => {
                    this.time.delayedCall(100, () => {
                        if (!this.scene.isActive()) return;
                        this.tweens.add({
                            targets: this.heartbeatOverlay,
                            alpha: this.heartbeatIntensity * 0.7,
                            duration: 100,
                            yoyo: true
                        });
                    });
                }
            });
        };

        this.heartbeatTimer = this.time.addEvent({
            delay: 1500,
            callback: doPulse,
            loop: true
        });

        doPulse();
    }

    intensifyHeartbeat() {
        this.heartbeatIntensity = Math.min(this.heartbeatIntensity + 0.1, 0.5);
    }

    startNarration() {
        const narrationLines = [
            "The theater remembers you.",
            "Joy was a performance.",
            "Rage was applause.",
            "Sorrow was an echo.",
            "Truth was a crack in the script.",
            "Silence was the space between.",
            "...",
            "But Hunger…",
            "Hunger is what remains underneath."
        ];

        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < narrationLines.length) {
                const line = narrationLines[lineIndex];
                const holdTime = line === "..." ? 2000 : 2500;
                const color = lineIndex >= 7 ? '#cc4444' : '#aa8888';

                currentText = this.createTypewriterText(
                    this.textbox.x,
                    this.textbox.y,
                    line,
                    {
                        fontSize: '20px',
                        color: color,
                        fontStyle: 'italic'
                    },
                    45
                );
                lineIndex++;
                this.time.delayedCall(holdTime, showNextLine);
            } else {
                if (currentText) currentText.destroy();
                this.interactionPhase = 2;
                this.showEncounter();
            }
        };

        this.time.delayedCall(800, showNextLine);
    }

    showEncounter() {
        this.intensifyVignette(0.7);
        this.intensifyHeartbeat();

        const encounterLines = [
            '"Do you understand now?"',
            '"You never wore the masks…"',
            '"You fed them."'
        ];

        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < encounterLines.length) {
                currentText = this.createTypewriterText(
                    this.textbox.x,
                    this.textbox.y,
                    encounterLines[lineIndex],
                    {
                        fontSize: '22px',
                        color: '#cc3333'
                    },
                    40
                );
                lineIndex++;
                this.time.delayedCall(3000, showNextLine);
            } else {
                if (currentText) currentText.destroy();
                this.interactionPhase = 3;
                this.showFinalChoice();
            }
        };

        this.time.delayedCall(1000, showNextLine);
    }

    showFinalChoice() {
        const { width, height } = this.scale;

        this.intensifyVignette(0.8);

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
        const dialog = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1a0a0a).setStrokeStyle(2, 0x882222);
        const titleText = this.add.text(width / 2, height / 2 - 150, "What will you do with the Hunger Mask?", {
            fontSize: '24px',
            color: '#cc4444',
            align: 'center',
            wordWrap: { width: 550 },
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5);

        // Check if "Give Away" should be shown (only if Truth + Silence completed)
        const canGive = GameState.canGiveAway();

        // Build choices - only include "Give" if conditions are met
        const choices = [
            { text: "Wear the Hunger Mask", choice: 'wear' },
            { text: "Destroy the Hunger Mask", choice: 'destroy' }
        ];

        // Only add "Give" option if Truth and Silence are completed
        if (canGive) {
            choices.push({ text: "Give the Mask Away", choice: 'give' });
        }

        const buttons = [];

        choices.forEach((choiceData, index) => {
            const btnBg = this.add.rectangle(width / 2, height / 2 - 50 + (index * 60), 500, 50, 0x331111);
            btnBg.setInteractive({ useHandCursor: true });

            const btnText = this.add.text(width / 2, height / 2 - 50 + (index * 60), choiceData.text, {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: 'Georgia, serif'
            }).setOrigin(0.5);

            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0x442222);
                btnBg.setStrokeStyle(2, 0xaa4444);
            });

            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0x331111);
                btnBg.setStrokeStyle(0);
            });

            btnBg.on('pointerdown', () => {
                // Set final choice and resolve ending
                GameState.setFlag('final_choice', choiceData.choice);

                // Stop heartbeat
                if (this.heartbeatTimer) {
                    this.heartbeatTimer.remove();
                }

                // Destroy choice UI
                overlay.destroy();
                dialog.destroy();
                titleText.destroy();
                buttons.forEach(btn => btn.destroy());

                // Execute ending based on resolver
                this.executeEnding();
            });

            buttons.push(btnBg, btnText);
        });

        this.choiceElements = { overlay, dialog, titleText, buttons };
    }

    /**
     * Execute ending based on GameState.resolveEnding()
     */
    executeEnding() {
        const endingId = GameState.resolveEnding();
        GameState.setFlag('ending', endingId);

        // Increment play count (guarded)
        GameState.incrementPlayCount();

        // Sync completed masks to persistent storage
        GameState.syncCompletedMasks();

        switch (endingId) {
            case 'A1':
                this.endingA1_EternalSmile();
                break;
            case 'A2':
                this.endingA2_ArenaLoop();
                break;
            case 'B1':
                this.endingB1_ForgottenName();
                break;
            case 'B2':
                this.endingB2_ScriptBreaker();
                break;
            case 'C':
                this.endingC_TrueRelease();
                break;
            case 'A_generic':
                this.endingA_Generic();
                break;
            case 'B_generic':
                this.endingB_Generic();
                break;
            default:
                console.warn('Unknown ending:', endingId);
                this.endingA_Generic();
        }
    }

    // ========== ENDING A1: Eternal Smile (Joy + Wear) ==========
    endingA1_EternalSmile() {
        const { width, height } = this.scale;
        this.interactionPhase = 4;

        const pastelOverlay = this.add.rectangle(0, 0, width, height, 0xffcccc, 0).setOrigin(0);

        this.tweens.add({
            targets: pastelOverlay,
            alpha: 0.4,
            duration: 1500,
            onComplete: () => {
                if (this.heartbeatOverlay) this.heartbeatOverlay.setAlpha(0);

                this.showEndingDialogue([
                    "You put it on.",
                    "The party returns.",
                    "Everyone smiles.",
                    "...",
                    "Forever."
                ], 'Ending A1: Eternal Smile');
            }
        });
    }

    // ========== ENDING A2: Arena Loop (Rage + Wear) ==========
    endingA2_ArenaLoop() {
        const { width, height } = this.scale;
        this.interactionPhase = 4;

        const redOverlay = this.add.rectangle(0, 0, width, height, 0x440000, 0).setOrigin(0);

        this.tweens.add({
            targets: redOverlay,
            alpha: 0.5,
            duration: 1000,
            onComplete: () => {
                if (this.heartbeatOverlay) this.heartbeatOverlay.setAlpha(0);

                this.showEndingDialogue([
                    "Applause erupts.",
                    "The arena never ends.",
                    "You are rage's performer.",
                    "...",
                    "The crowd will never stop cheering."
                ], 'Ending A2: Arena Loop');
            }
        });
    }

    // ========== ENDING B1: Forgotten Name (Sorrow + Destroy) ==========
    endingB1_ForgottenName() {
        const { width, height } = this.scale;
        this.interactionPhase = 4;

        this.tweens.add({
            targets: this.hungerBg,
            alpha: 0.3,
            tint: 0x666688,
            duration: 1500,
            onComplete: () => {
                if (this.heartbeatOverlay) this.heartbeatOverlay.setAlpha(0);

                this.showEndingDialogue([
                    "You shatter it.",
                    "The photograph loses even its emptiness.",
                    "Your name is gone.",
                    "...",
                    "No one remembers you were here."
                ], 'Ending B1: Forgotten Name');
            }
        });
    }

    // ========== ENDING B2: Script Breaker (Truth + Destroy) ==========
    endingB2_ScriptBreaker() {
        const { width, height } = this.scale;
        this.interactionPhase = 4;

        GameState.setFlag('ending_glitch', true);

        // Glitch effect
        this.cameras.main.flash(100, 100, 100, 100);

        this.time.delayedCall(200, () => {
            // Apply scanline/glitch tint
            if (this.hungerBg) {
                this.hungerBg.setTint(0x88aaff);
            }

            if (this.heartbeatOverlay) this.heartbeatOverlay.setAlpha(0);

            this.showEndingDialogue([
                "You erase the mask.",
                "The script collapses.",
                "The game does not know what to say.",
                "...",
                "ERROR: PLAYER UNDEFINED"
            ], 'Ending B2: Script Breaker');
        });
    }

    // ========== ENDING C: True Release (Silence + Truth + Give) ==========
    endingC_TrueRelease() {
        const { width, height } = this.scale;
        this.interactionPhase = 4;

        if (this.heartbeatTimer) {
            this.heartbeatTimer.remove();
        }

        // Slow final heartbeat
        this.tweens.add({
            targets: this.heartbeatOverlay,
            alpha: 0.1,
            duration: 500,
            yoyo: true,
            onComplete: () => {
                if (this.heartbeatOverlay) this.heartbeatOverlay.setAlpha(0);
            }
        });

        // Warm light returns
        const warmLight = this.add.rectangle(0, 0, width, height, 0xffdd88, 0).setOrigin(0);

        this.tweens.add({
            targets: warmLight,
            alpha: 0.15,
            duration: 2000,
            onComplete: () => {
                this.vignetteElements.forEach(el => {
                    this.tweens.add({
                        targets: el,
                        alpha: 0.2,
                        duration: 1000
                    });
                });

                this.showEndingDialogue([
                    "You set it down.",
                    "Not for yourself…",
                    "but to let it go.",
                    "...",
                    "For the first time, the stage feels real."
                ], 'Ending C: True Release');
            }
        });
    }

    // ========== ENDING A_Generic: Stay Masked (Fallback) ==========
    endingA_Generic() {
        const { width, height } = this.scale;
        this.interactionPhase = 4;

        const redOverlay = this.add.rectangle(0, 0, width, height, 0x330000, 0).setOrigin(0);

        this.tweens.add({
            targets: redOverlay,
            alpha: 0.6,
            duration: 1000,
            onComplete: () => {
                if (this.heartbeatOverlay) this.heartbeatOverlay.setAlpha(0);

                this.showEndingDialogue([
                    "You put it on.",
                    "The world becomes quiet.",
                    "The mask fits perfectly.",
                    "...",
                    "You smile forever."
                ], 'Ending A: Stay Masked');
            }
        });
    }

    // ========== ENDING B_Generic: Unmasked (Fallback) ==========
    endingB_Generic() {
        const { width, height } = this.scale;
        this.interactionPhase = 4;

        const whiteFlash = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0);

        this.tweens.add({
            targets: whiteFlash,
            alpha: 1,
            duration: 100,
            yoyo: true,
            hold: 50,
            onComplete: () => {
                if (this.heartbeatOverlay) this.heartbeatOverlay.setAlpha(0);

                this.tweens.add({
                    targets: this.hungerBg,
                    alpha: 0.3,
                    duration: 500,
                    onComplete: () => {
                        this.showEndingDialogue([
                            "You shatter it.",
                            "The pieces fall like teeth.",
                            "Behind it… there is no face.",
                            "...",
                            "Without masks, you are unfinished."
                        ], 'Ending B: Unmasked');
                    }
                });
            }
        });
    }

    /**
     * Show ending dialogue and then transition to CreditScene
     */
    showEndingDialogue(lines, endingTitle) {
        let lineIndex = 0;
        let currentText = null;

        const showNextLine = () => {
            if (currentText) {
                currentText.destroy();
            }

            if (lineIndex < lines.length) {
                const line = lines[lineIndex];
                const holdTime = line === "..." ? 2000 : 2800;
                const isQuote = line.startsWith('"');

                currentText = this.createTypewriterText(
                    this.textbox.x,
                    this.textbox.y,
                    line,
                    {
                        fontSize: isQuote ? '22px' : '20px',
                        color: isQuote ? '#ddaa88' : '#cccccc',
                        fontStyle: 'italic'
                    },
                    50
                );
                lineIndex++;
                this.time.delayedCall(holdTime, showNextLine);
            } else {
                if (currentText) currentText.destroy();
                // Transition to credit scene
                this.time.delayedCall(1000, () => {
                    this.cameras.main.fadeOut(1500, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('CreditScene', { ending: GameState.flags.ending });
                    });
                });
            }
        };

        showNextLine();
    }

    shutdown() {
        super.shutdown();
        if (this.heartbeatTimer) {
            this.heartbeatTimer.remove();
        }
    }
}

