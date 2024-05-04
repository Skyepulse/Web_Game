import { Boot } from './Scenes/Boot';
import { MainMenu } from './Scenes/MainMenu';
import Phaser from 'phaser';
import { Preloader } from './Scenes/Preloader';

// Find out more information about the Game Config at:
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    input: {
        mouse : true,
    },
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: 'gameContainer',
    backgroundColor: '#c1a7a7',
    scene: [
        Boot,
        Preloader,
        MainMenu
    ]
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });

}

export default StartGame;
