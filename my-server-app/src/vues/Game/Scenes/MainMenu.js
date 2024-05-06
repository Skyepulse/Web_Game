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
        this.POINT_RADIUS = 45;
        this.mainCircleGraphics = null;

        //Cover Circle
        this.coverCircleContainer = null;
        this.COVER_CIRCLE_RADIUS = 320;
        this.coverCircleGraphics = null;
        this.MIN_ANGLE = 0;
        this.MAX_ANGLE = 180;

        this.openTimer = 0;
        this.openTime = 1; //Seconds
        this.goalAngle = 180;
        this.isCoverOpen = false;

        //Cover Bottom
        this.coverBottomContainer = null;
        this.COVER_BOTTOM_RADIUS = 320;
        this.coverBottomGraphics = null;

        //Picker
        this.pickerContainer = null;
        this.pickerGraphics = null;
        this.PICKER_BASE = 50;
        this.PICKER_HEIGHT = 50;
        this.PICKER_BASE_RADIUS = 340;
        this.pickerVisible = true;
        
        this.mouse = {mouseX: 0, mouseY: 0, rotation: 0};
    }

    create()
    {
        this.screenX = this.registry.get('gameWidth');
        this.screenY = this.registry.get('gameHeight');
        
        this.mainCircleGraphics = this.add.graphics();
        this.mainCircleContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.mainCircleGraphics.fillStyle(0xffffff, 1);
        this.mainCircleGraphics.fillCircle(0, 0, this.MAIN_CIRCLE_RADIUS);
        this.mainCircleGraphics.fillStyle(0xffff00, 1);
        this.mainCircleGraphics.slice(0,0, this.MAIN_CIRCLE_RADIUS, Math.DegToRad(-90 + this.POINT_RADIUS/2), Math.DegToRad(-90 - this.POINT_RADIUS/2), true);
        this.mainCircleGraphics.fillPath();
        this.mainCircleGraphics.slice(0,0, this.MAIN_CIRCLE_RADIUS, Math.DegToRad(90 + this.POINT_RADIUS/2), Math.DegToRad(90 - this.POINT_RADIUS/2), true);
        this.mainCircleGraphics.fillPath();
        this.mainCircleGraphics.fillStyle(0xeb9e34, 1);
        this.mainCircleGraphics.slice(0,0, this.MAIN_CIRCLE_RADIUS, Math.DegToRad(-90 + (1.5/6)*this.POINT_RADIUS), Math.DegToRad(-90 - (1.5/6)*this.POINT_RADIUS), true);
        this.mainCircleGraphics.fillPath();
        this.mainCircleGraphics.slice(0,0, this.MAIN_CIRCLE_RADIUS, Math.DegToRad(90 + (1.5/6)*this.POINT_RADIUS), Math.DegToRad(90 - (1.5/6)*this.POINT_RADIUS), true);
        this.mainCircleGraphics.fillPath();
        this.mainCircleGraphics.fillStyle(0xeb5934, 1);
        this.mainCircleGraphics.slice(0,0, this.MAIN_CIRCLE_RADIUS, Math.DegToRad(-90 + (1/12)*this.POINT_RADIUS), Math.DegToRad(-90 - (1/12)*this.POINT_RADIUS), true);
        this.mainCircleGraphics.fillPath();
        this.mainCircleGraphics.slice(0,0, this.MAIN_CIRCLE_RADIUS, Math.DegToRad(90 + (1/12)*this.POINT_RADIUS), Math.DegToRad(90 - (1/12)*this.POINT_RADIUS), true);
        this.mainCircleGraphics.fillPath();
        this.mainCircleContainer.add(this.mainCircleGraphics);

        this.coverCircleGraphics = this.add.graphics();
        this.coverCircleContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.coverCircleGraphics.fillStyle(0xff000f, 1);
        this.coverCircleGraphics.slice(0,0, this.COVER_CIRCLE_RADIUS, Math.DegToRad(0), Math.DegToRad(180), true);
        this.coverCircleGraphics.fillPath();
        this.coverCircleContainer.add(this.coverCircleGraphics);

        this.coverBottomGraphics = this.add.graphics();
        this.coverBottomContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.coverBottomGraphics.fillStyle(0x125a99, 1);
        this.coverBottomGraphics.slice(0,0, this.COVER_BOTTOM_RADIUS, Math.DegToRad(180), Math.DegToRad(0), true);
        this.coverBottomGraphics.fillPath();
        this.coverBottomContainer.add(this.coverBottomGraphics);

        this.pickerGraphics = this.add.graphics();
        this.pickerContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.pickerGraphics.fillStyle(0x000000, 1);
        this.pickerGraphics.fillTriangle(this.PICKER_BASE/2, this.PICKER_BASE_RADIUS, -this.PICKER_BASE/2, this.PICKER_BASE_RADIUS, 0, this.PICKER_BASE_RADIUS - this.PICKER_HEIGHT);
        this.pickerContainer.add(this.pickerGraphics);


        this.input.on('pointermove', (pointer) => {
            this.mouse = this.setMousePosition(pointer);
            this.movePicker();
        });
        this.input.on('pointerdown', (pointer) => {
            EventBus.emit('send-server-message', {type: 'nextTurn'});

            let success = -1;
            if(this.isCoverOpen) success = this.closeCoverCircle();
            else  success = this.openCoverCircle();
            if(success < 0) return;

            this.isCoverOpen = !this.isCoverOpen;
        
            if(this.isCoverOpen) this.goalAngle = this.MIN_ANGLE;
            else this.goalAngle = this.MAX_ANGLE;
        });

        EventBus.emit('current-scene-ready', this);
    }

    update(time, delta){

        //Update Cover Circle
        if(this.openTimer > 0){
            this.openTimer -= delta;
            if(this.openTimer <= 0) this.openTimer = 0;
            switch(this.goalAngle){
                case this.MIN_ANGLE:
                    this.redrawCoverCirle(this.MAX_ANGLE - this.MAX_ANGLE*(this.openTimer/(this.openTime*1000)));
                    break;
                case this.MAX_ANGLE:
                    this.redrawCoverCirle(this.MAX_ANGLE*(this.openTimer/(this.openTime*1000)));
                    break;
                default:
                    break;
            }
        }

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

    redrawCoverCirle(degRotation){
        this.coverCircleGraphics.clear();
        this.coverCircleGraphics.fillStyle(0xff000f, 1);
        this.coverCircleGraphics.slice(0,0, this.COVER_CIRCLE_RADIUS, Math.DegToRad(360-degRotation), Math.DegToRad(180), true);
        this.coverCircleGraphics.fillPath();
    }

    openCoverCircle(){
        if(this.openTimer > 0) return -1;
        this.openTimer += this.openTime*1000;
        this.goalAngle = 180;
        return 0;
    }

    closeCoverCircle(){
        if(this.openTimer > 0) return -1;
        this.openTimer += this.openTime*1000;
        this.goalAngle = 0;
        return 0;
    }

    movePicker(){
        if(!this.pickerVisible) return;
        this.pickerContainer.rotation = this.mouse.rotation <= 0 ? this.mouse.rotation  - Math.DegToRad(90): Math.DegToRad(180);
    }

    movePickerToAngle(degRotation){
        if(!this.pickerVisible) return;
        this.pickerContainer.rotation = degRotation <= 0 ? degRotation  - Math.DegToRad(90): Math.DegToRad(180);
    }
}