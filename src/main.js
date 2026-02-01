/**
 * MASK.EXE - Phaser 3 Game
 * Main entry point with modular scene imports
 */

import {
    BootScene,
    HubScene,
    JoyScene,
    RageScene,
    SorrowScene,
    TruthScene,
    SilenceScene,
    HungerScene,
    CreditScene,
    DevRoomScene,
    EndingScene
} from './scenes/index.js';

// Game Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    },
    scene: [
        BootScene,
        HubScene,
        JoyScene,
        RageScene,
        SorrowScene,
        TruthScene,
        SilenceScene,
        HungerScene,
        CreditScene,
        DevRoomScene,
        EndingScene
    ]
};

const game = new Phaser.Game(config);
window.game = game;
console.log('MASK.EXE Initialized');
