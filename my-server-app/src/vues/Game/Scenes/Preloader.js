import {Scene} from 'phaser';

export class Preloader extends Scene
{
    constructor()
    {
        super('Preloader');
    }

    init()
    {
        this.add.image(512, 384, 'background');
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512 - 234, 384, 0, 32);
        this.load.on('progress', (progress) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload()
    {
        this.load.setPath('/Assets/');
        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        this.load.text('cards', 'cards.txt');
    }

    create(){
        this.scene.start('MainMenu');
    }
}