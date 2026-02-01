import { BaseScene } from './BaseScene.js';
import { GameState } from '../state.js';

/**
 * Dev Room Easter Egg
 */
export class DevRoomScene extends BaseScene {
    constructor() { super({ key: 'DevRoomScene' }); }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.add.text(width / 2, height / 2, 'Welcome to Dev Room\nKENNEY was here.', {
            fontSize: '24px',
            color: '#00ff00',
            align: 'center',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.createReturnButton();
    }
}

/**
 * Ending Scene - Brief transition before Credits
 */
export class EndingScene extends Phaser.Scene {
    constructor() { super({ key: 'EndingScene' }); }

    init(data) {
        this.endingType = data.type || 'Ending';
        // Parse ending type to flag format
        this.endingFlag = this.parseEndingFlag(data.type);
    }

    parseEndingFlag(type) {
        if (!type) return 'unknown';

        const typeLower = type.toLowerCase();
        if (typeLower.includes('stay') || typeLower.includes('masked')) {
            return 'stay_masked';
        } else if (typeLower.includes('unmasked') || typeLower.includes('destroy')) {
            return 'unmasked';
        } else if (typeLower.includes('give') || typeLower.includes('away')) {
            return 'give_away';
        }
        return 'unknown';
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Brief ending title display
        const endingText = this.add.text(width / 2, height / 2, this.endingType, {
            fontSize: '36px',
            align: 'center',
            color: '#ffffff',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in ending title
        this.tweens.add({
            targets: endingText,
            alpha: 1,
            duration: 1000,
            hold: 2000,
            yoyo: true,
            onComplete: () => {
                // Transition to credits
                this.cameras.main.fadeOut(1000, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // Brief silence pause
                    this.time.delayedCall(500, () => {
                        this.scene.start('CreditScene', { ending: this.endingFlag });
                    });
                });
            }
        });
    }
}
