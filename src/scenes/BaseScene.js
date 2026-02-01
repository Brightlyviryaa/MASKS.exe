import { TEXT_STYLES, FADE_DURATION } from '../state.js';

/**
 * Base Scene with common UI helpers and lifecycle management
 */
export class BaseScene extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    /**
     * Cleanup method - called when scene shuts down
     * Prevents memory leaks by removing event listeners and timers
     */
    shutdown() {
        this.time.removeAllEvents();
        this.tweens.killAll();
        this.input.off('pointerdown');
        this.input.off('pointermove');
    }

    /**
     * Transition to another scene with fade effect
     * @param {string} sceneKey - Key of the scene to transition to
     * @param {object} data - Optional data to pass to the scene
     */
    transitionToScene(sceneKey, data = {}) {
        this.cameras.main.fadeOut(FADE_DURATION.FAST, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(sceneKey, data);
        });
    }

    /**
     * Return to HubScene with fade effect
     */
    returnToHub() {
        this.transitionToScene('HubScene');
    }

    /**
     * Create a typewriter text effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Full text to display
     * @param {object} style - Phaser text style
     * @param {number} speed - Delay between characters in ms
     * @returns {Phaser.GameObjects.Text}
     */
    createTypewriterText(x, y, text, style = {}, speed = 50) {
        const mergedStyle = { ...TEXT_STYLES.BODY, ...style };
        const textObj = this.add.text(x, y, '', mergedStyle).setOrigin(0.5);

        let charIndex = 0;
        const timer = this.time.addEvent({
            delay: speed,
            callback: () => {
                textObj.text += text[charIndex];
                charIndex++;
                if (charIndex >= text.length) {
                    timer.remove();
                }
            },
            callbackScope: this,
            loop: true
        });

        return textObj;
    }

    /**
     * Create a semi-transparent textbox at bottom of screen
     */
    createTextbox() {
        const { width, height } = this.scale;
        const boxHeight = 120;
        const boxPadding = 40;

        const textbox = this.add.rectangle(
            width / 2,
            height - boxHeight / 2 - 20,
            width - boxPadding * 2,
            boxHeight,
            0x000000,
            0.7
        );
        textbox.setStrokeStyle(1, 0x444444);

        return {
            container: textbox,
            x: width / 2,
            y: height - boxHeight / 2 - 20,
            width: width - boxPadding * 2
        };
    }

    createChoice(title, choices) {
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

        const choiceGroup = this.add.group();

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
                overlay.destroy();
                dialog.destroy();
                titleText.destroy();
                choiceGroup.clear(true, true);
                choice.callback();
            });

            choiceGroup.add(btnBg);
            choiceGroup.add(btnText);
        });
    }

    createReturnButton() {
        const { width } = this.scale;
        const btn = this.add.text(width - 20, 20, 'Kembali ke Hub', {
            fontSize: '16px',
            color: '#aaaaaa',
            fontFamily: 'Georgia, serif'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => this.scene.start('HubScene'));
    }
}
