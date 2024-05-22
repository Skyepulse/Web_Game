import {Scene} from 'phaser';

export class Boot extends Scene {
    
    constructor() {
        super('Boot');
    }

    preload()
    {
        this.load.setBaseURL('/Assets/');
        this.load.image('background', 'bg.png');
    }

    create()
    {
        this.game.registry.set('gameWidth', this.game.config.width);
        this.game.registry.set('gameHeight', this.game.config.height);
        this.scene.start('Preloader');
    }
}