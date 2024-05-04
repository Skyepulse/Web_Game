import { EventBus } from '../EventBus';
import { Scene, Math } from 'phaser';

export class MainMenu extends Scene
{
    constructor()
    {
        super('MainMenu');
        this.screenX = 0;
        this.screenY = 0;

        //Main Circle
        this.mainCircleContainer = null;
        this.MAIN_CIRCLE_RADIUS = 300;
        this.mainCircleGraphics = null;

        //Cover Circle
        this.coverCircleContainer = null;
        this.COVER_CIRCLE_RADIUS = 300;
        this.coverCircleGraphics = null;
        
        this.mouse = {mouseX: 0, mouseY: 0, rotation: 0};
    }

    create()
    {
        this.screenX = this.registry.get('gameWidth');
        this.screenY = this.registry.get('gameHeight');
        
        this.mainCircleGraphics = this.add.graphics();
        this.mainCircleContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.mainCircleGraphics.fillStyle(0xffff00, 1);
        this.mainCircleGraphics.fillCircle(0, 0, this.MAIN_CIRCLE_RADIUS);
        this.mainCircleContainer.add(this.mainCircleGraphics);

        this.coverCircleGraphics = this.add.graphics();
        this.coverCircleContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.coverCircleGraphics.fillStyle(0xff000f, 1);
        this.coverCircleGraphics.slice(0,0, this.COVER_CIRCLE_RADIUS, Math.DegToRad(0), Math.DegToRad(180), true);
        this.coverCircleGraphics.fillPath();
        this.coverCircleContainer.add(this.coverCircleGraphics);

        this.input.on('pointermove', (pointer) => {
            this.mouse = this.setMousePosition(pointer);
            this.redrawCoverCirle();
        });
        EventBus.emit('current-scene-ready', this);
    }

    update(time, delta){
        
    }

    changeScene ()
    {
        console.log('Changing scene TO THE SUPPOSED MAIN GAME SCENE');
    }

    setMousePosition(pointer)
    {
        let mouseX = pointer.x;
        let mouseY = pointer.y;
        let rotation = Math.Angle.Between(this.screenX/2, this.screenY/2, mouseX, mouseY);
        return {mouseX: mouseX, mouseY: mouseY, rotation: rotation};
    }

    redrawCoverCirle(){
        let degRotation = Math.RadToDeg(this.mouse.rotation);
        let startAngle = 0;
        let endAngle = 0;
        if(degRotation > 0){
            startAngle = Math.DegToRad(0);
            endAngle = Math.DegToRad(180);
        } else {
            startAngle = Math.DegToRad(0 + degRotation);
            endAngle = Math.DegToRad(180);
        }
        this.coverCircleGraphics.clear();
        this.coverCircleGraphics.fillStyle(0xff000f, 1);
        this.coverCircleGraphics.slice(0,0, this.COVER_CIRCLE_RADIUS, startAngle, endAngle, true);
        this.coverCircleGraphics.fillPath();
    }
}