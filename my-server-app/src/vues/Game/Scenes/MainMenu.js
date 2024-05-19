import { EventBus } from '../EventBus';
import { EventTimer, EventTimerManager } from '../EventTimer';
import { Scene, Math, Geom } from 'phaser';

export class MainMenu extends Scene
{
    constructor()
    {
        super('MainMenu');
        this.screenX = 0;
        this.screenY = 0;

        this.currentMaster = false;

        //Event Timer Manager
        this.eventTimerManager = new EventTimerManager();

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
        this.pickerVisible = false;
        this.pickerClickable = false;
        this.pickerMoveable = false;

        //Turn Button
        this.turnButtonContainer = null;
        this.turnButtonBackground = null;
        this.turnButtonText = null;
        this.visibleTurnButton = false;

        //Look Information Master
        this.lookAtMasterTime = 3; //Seconds
        this.lookAtMasterTimer = 0;
        
        //Look Information Reveal
        this.lookAtRevealTime = 5; //Seconds
        this.lookAtRevealTimer = 0;

        //Show text
        this.textContainer = null;
        this.text = null;
        this.textVisible = false;
        
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
        this.pickerContainer.visible = this.pickerVisible;

        this.turnButtonContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.turnButtonBackground = this.add.graphics();
        this.turnButtonBackground.fillStyle(0x000000, 1);
        this.turnButtonBackground.fillRoundedRect(-100, -50, 200, 100, 20);
        this.turnButtonContainer.add(this.turnButtonBackground);
        this.turnButtonText = this.add.text(0, 0, 'Your Turn', {fontFamily: 'Arial', fontSize: 24, color: '#ffffff'});
        this.turnButtonText.setOrigin(0.5);
        this.turnButtonContainer.add(this.turnButtonText);
        this.turnButtonContainer.setSize(200, 100);
        this.turnButtonContainer.setInteractive(new Geom.Rectangle(0, 0, 200, 100), Geom.Rectangle.Contains)
            .on('pointerdown', () => this.onClickTurnButton());
        this.turnButtonContainer.visible = this.visibleTurnButton;

        this.textContainer = this.add.container(this.screenX/2, this.screenY/2);
        this.text = this.add.text(0, 0, '', {fontFamily: 'Arial', fontSize: 24, color: '#ffffff'});
        this.textContainer.add(this.text);
        this.textContainer.visible = this.textVisible;


        this.input.on('pointermove', (pointer) => {
            this.mouse = this.setMousePosition(pointer);
            if(this.pickerMoveable) this.movePicker();
        });
        this.input.on('pointerdown', (pointer) => {
            //Picker Click
            if(this.pickerVisible && this.pickerClickable){
                let rotationChosen = this.mouse.rotation;
                if(rotationChosen <= 0  && rotationChosen >= -Math.PI2 / 2){
                    this.choiceMade(rotationChosen);
                }
            }
        });

        this.events.on('your-turn', () => {
            this.showTurnButton();
        });

        EventBus.emit('current-scene-ready', this);
    }

    destroy(){
        this.events.off('your-turn');
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

        this.eventTimerManager.update(delta);

        //Update Look Information Master
        /*
        if(this.lookAtMasterTimer > 0){
            this.lookAtMasterTimer -= delta;
            if(this.lookAtMasterTimer <= 0) this.lookAtMasterTimer = 0;
            if(this.lookAtMasterTimer === 0){
                this.changeCoverCircle();
                EventBus.emit('send-server-message', {type: 'guessTurn', mainCircleRotation: this.mainCircleContainer.rotation, pointsRadius: this.POINT_RADIUS});
            }
        }
        */

        //Update Look Information Reveal
        /*
        if(this.lookAtRevealTimer > 0){
            this.lookAtRevealTimer -= delta;
            if(this.lookAtRevealTimer <= 0) this.lookAtRevealTimer = 0;
            if(this.lookAtRevealTimer === 0){
                this.hidePickerReveal();
                this.changeCoverCircle();
                this.hideText();
                if(this.currentMaster){
                    EventBus.emit('send-server-message', {type: 'nextTurn'});
                    this.currentMaster = false;
                }
            }
        }
        */
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

    movePickerToAngle(radRotation){
        this.pickerContainer.rotation = radRotation <= 0 ? radRotation  - Math.DegToRad(90): Math.DegToRad(180);
    }

    changeCoverCircle(){
        let success = -1;
        if(this.isCoverOpen) success = this.closeCoverCircle();
        else  success = this.openCoverCircle();
        if(success < 0) return;

        this.isCoverOpen = !this.isCoverOpen;
    
        if(this.isCoverOpen) this.goalAngle = this.MIN_ANGLE;
        else this.goalAngle = this.MAX_ANGLE;
    }

    showTurnButton(){
        if(this.turnButtonContainer == null){
            this.visibleTurnButton = true;
            return;
        }
        this.turnButtonContainer.visible = true;
        this.visibleTurnButton = true;
    }

    hidePicker(){
        this.pickerContainer.visible = false;
        this.pickerVisible = false;
        this.pickerClickable = false;
        this.pickerMoveable = false;
    }

    showPicker(){
        if(this.pickerContainer == null){
            this.pickerVisible = true;
            this.pickerClickable = true;
            this.pickerMoveable = true;
            return;
        }
        this.pickerContainer.visible = true;
        this.pickerVisible = true;
        this.pickerClickable = true;
        this.pickerMoveable = true;
    }

    showPickerReveal(){
        this.pickerContainer.visible = true;
        this.pickerVisible = true;
        this.pickerClickable = false;
        this.pickerMoveable = false;
    }

    hidePickerReveal(){
        this.pickerContainer.visible = false;
        this.pickerVisible = false;
        this.pickerClickable = false;
        this.pickerMoveable = false;
    }

    hideTurnButton(){
        this.turnButtonContainer.visible = false;
        this.visibleTurnButton = false;
    }

    onClickTurnButton(){
        this.hideTurnButton();
        this.masterTurnLookInformation();
    }

    masterTurnLookInformation(){
        //We choose a random rotation for the main circle.
        //we know that the main circle points at rotation = 0 --> max points at 90.
        //We choose a random rotation between 0 and 180.
        this.currentMaster = true;
        let randomRotation = Math.DegToRad(Math.Between(0, 180));
        this.mainCircleContainer.rotation = randomRotation;
        this.changeCoverCircle();

        this.eventTimerManager.addTimer(new EventTimer(this.lookAtMasterTime*1000, () => {
            this.changeCoverCircle();
            EventBus.emit('send-server-message', {type: 'guessTurn', mainCircleRotation: this.mainCircleContainer.rotation, pointsRadius: this.POINT_RADIUS});
        }));
        this.lookAtMasterTimer = this.lookAtMasterTime*1000;
    }


    choiceMade(rotation){
        this.hidePicker();
        EventBus.emit('send-server-message', {type: 'userGuess', guessRotation: -rotation});
    }

    revealScore(response){
        let mainCircleRotation = response.mainCircleRotation;
        let guessRotation = - response.guessRotation * Math.PI2 / 360;
        let score = response.score;
        let team = response.team;
        let shouldReveal = response.shouldReveal;

        this.showText('Score: ' + score + ' Team: ' + team, team === 'red' ? '#ff0000' : '#0000ff');

        if(!shouldReveal){
            if(this.currentMaster){
                EventBus.emit('send-server-message', {type: 'nextTurn'});
                this.currentMaster = false;
            }
            return;
        }

        this.mainCircleContainer.rotation = mainCircleRotation;
        this.movePickerToAngle(guessRotation);
        this.showPickerReveal();
        this.changeCoverCircle();
        
        
        this.eventTimerManager.addTimer(new EventTimer(this.lookAtRevealTime*1000, () => {
            this.hidePickerReveal();
            this.changeCoverCircle();
            this.hideText();
            if(this.currentMaster){
                EventBus.emit('send-server-message', {type: 'nextTurn'});
                this.currentMaster = false;
            }
        }));

    }

    showText(text, color){
        this.text.setText(text);
        this.text.setColor(color);
        this.textContainer.visible = true;
        this.textVisible = true;
    }

    hideText(){
        this.textContainer.visible = false;
        this.textVisible = false;
    }
}