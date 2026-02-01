import { BaseScene } from './BaseScene.js';

/**
 * BOOT SCENE - Opening Sequence
 * Fade from black, ambience, then reveal theater
 */
export class BootScene extends BaseScene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load all assets
        this.load.image('bg_theater', 'src/assets/scene_1/bg_theater.png');
        this.load.image('bg_theater_glitch', 'src/assets/scene_1/bg_theater_glitch.png');
        this.load.image('mask_joy', 'src/assets/masks/mask_icon_joy.png');
        this.load.image('mask_rage', 'src/assets/masks/mask_icon_rage.png');
        this.load.image('mask_sorrow', 'src/assets/masks/mask_icon_sorrow.png');
        this.load.image('mask_truth', 'src/assets/masks/mask_icon_truth.png');
        this.load.image('mask_silence', 'src/assets/masks/mask_icon_silence.png');
        this.load.image('mask_hunger_locked', 'src/assets/masks/mask_icon_hunger_locked.png');

        // Joy World assets
        this.load.image('bg_joy_party', 'src/assets/scene_2/bg_joy_party.png');
        this.load.image('bg_joy_party_alt', 'src/assets/scene_2/bg_joy_party_alt.png');

        // Rage World assets
        this.load.image('bg_rage_arena', 'src/assets/scene_3/bg_rage_arena.png');
        this.load.image('bg_rage_arena_alt', 'src/assets/scene_3/bg_rage_arena_alt.png');

        // Sorrow World assets
        this.load.image('bg_sorrow_room', 'src/assets/scene_4/bg_sorrow_room.png');
        this.load.image('bg_sorrow_room_alt', 'src/assets/scene_4/bg_sorrow_room_alt.png');
        this.load.image('bg_sorrow_photo_closeup', 'src/assets/scene_4/bg_sorrow_photo_closeup.png');

        // Truth World assets
        this.load.image('bg_truth_glitch', 'src/assets/scene_5/bg_truth_glitch.png');
        this.load.image('bg_truth_glitch_alt', 'src/assets/scene_5/bg_truth_glitch_alt.png');
        this.load.image('truth_mask_used', 'src/assets/scene_5/truth_mask_used.png');
        this.load.image('bg_end_truth_void', 'src/assets/scene_5/bg_end_truth_void.png');

        // Silence World assets
        this.load.image('bg_silence_void', 'src/assets/scene_6/bg_silence_void.png');
        this.load.image('bg_silence_void_alt', 'src/assets/scene_6/bg_silence_void_alt.png');
        this.load.image('silence_mask_used', 'src/assets/scene_6/silence_mask_used.png');

        // Hunger World assets (True Route)
        this.load.image('mask_hunger', 'src/assets/masks/mask_icon_hunger.png');
        this.load.image('bg_hunger_stage', 'src/assets/scene_7/bg_hunger_stage.png');
        this.load.image('bg_hunger_end_masked', 'src/assets/scene_7/bg_hunger_end_masked.png');
        this.load.image('bg_hunger_end_unmasked', 'src/assets/scene_7/bg_hunger_end_unmasked.png');
        this.load.image('bg_hunger_end_giveaway', 'src/assets/scene_7/bg_hunger_end_giveaway.png');
        this.load.image('hunger_mask_used', 'src/assets/scene_7/hunger_mask_used.png');

        // Credit Scene assets
        this.load.image('bg_credits_curtain', 'src/assets/credits/bg_credits_curtain.png');
        this.load.image('bg_credits_void', 'src/assets/credits/bg_credits_void.png');
    }

    create() {
        const { width, height } = this.scale;

        // Start with black screen
        const blackScreen = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

        // Check if returning player
        const isReturning = GameState.isReturningPlayer();
        const playCount = GameState.getPlayCount();
        const isScriptDeleted = GameState.isScriptDeleted();

        // Opening narration lines - different variants based on history
        let openingLines;

        if (isScriptDeleted) {
            // Script was deleted - "improvisation mode"
            openingLines = [
                "…",
                "The page is missing.",
                "The stage remains.",
                "Someone stitched the curtains back together."
            ];
        } else if (playCount >= 3) {
            // Player has replayed 3+ times - final meta message
            openingLines = [
                "…",
                "Stop searching.",
                "The mask is already yours."
            ];
        } else if (isReturning) {
            // Second playthrough - recognition intro
            openingLines = [
                "…",
                "You again.",
                "The stage is exactly the same.",
                "But it feels smaller now."
            ];
        } else {
            // First playthrough - normal intro
            openingLines = [
                "You wake up standing on a stage.",
                "A theater with no audience.",
                "A play with no actors.",
                "Only dust... and silence."
            ];
        }

        let currentLine = 0;
        let textObj = null;

        // Function to show next line
        const showNextLine = () => {
            if (textObj) {
                // Stop typewriter timer first to prevent null reference
                if (textObj.typewriterTimer) {
                    textObj.typewriterTimer.remove();
                }
                textObj.destroy();
            }

            if (currentLine < openingLines.length) {
                // Different color for returning players
                const textColor = isReturning ? '#aa8888' : '#cccccc';

                textObj = this.createTypewriterText(
                    width / 2,
                    height / 2,
                    openingLines[currentLine],
                    {
                        fontSize: '24px',
                        color: textColor,
                        fontStyle: 'italic',
                        align: 'center'
                    },
                    60
                );
                currentLine++;

                // Delay before next line
                this.time.delayedCall(2500, showNextLine);
            } else {
                // All lines shown, fade to theater
                this.time.delayedCall(1000, () => {
                    if (textObj) {
                        if (textObj.typewriterTimer) {
                            textObj.typewriterTimer.remove();
                        }
                        textObj.destroy();
                    }
                    this.fadeToTheater(isReturning, playCount);
                });
            }
        };

        // Start showing lines after brief silence
        this.time.delayedCall(1500, showNextLine);
    }

    fadeToTheater(isReturning = false, playCount = 0) {
        const { width, height } = this.scale;

        // Add theater background (initially invisible)
        const theaterBg = this.add.image(width / 2, height / 2, 'bg_theater');
        theaterBg.setDisplaySize(width, height);
        theaterBg.setAlpha(0);

        // Darker tint for returning players
        if (isReturning) {
            theaterBg.setTint(0xaaaaaa);
        }

        // Fade in theater
        this.tweens.add({
            targets: theaterBg,
            alpha: 1,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {
                // Different speaker text based on player history
                let speakerText;
                let speakerColor = '#d4af37';

                if (GameState.isScriptDeleted()) {
                    // Improvisation mode - script was deleted
                    speakerText = '"You erased the lines. So we\'ll perform without them."';
                    speakerColor = '#888888';
                } else if (playCount >= 3) {
                    speakerText = '"The masks remember everything."';
                    speakerColor = '#aa4444';
                } else if (isReturning) {
                    speakerText = '"You came back. Did you think the masks would forget?"';
                    speakerColor = '#cc8888';
                } else {
                    speakerText = '"Choose your mask."';
                }

                // Show speaker text
                const chooseText = this.createTypewriterText(
                    width / 2,
                    height - 100,
                    speakerText,
                    {
                        fontSize: '20px',
                        color: speakerColor,
                        fontStyle: 'italic',
                        align: 'center',
                        wordWrap: { width: 700 }
                    },
                    80
                );

                // Calculate delay based on text length (80ms per char + buffer)
                const typingDuration = speakerText.length * 80 + 1500;

                // Then transition to HubScene
                this.time.delayedCall(typingDuration, () => {
                    this.cameras.main.fadeOut(1000, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('HubScene');
                    });
                });
            }
        });
    }
}
