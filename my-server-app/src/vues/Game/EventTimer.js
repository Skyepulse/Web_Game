export class EventTimerManager{
    constructor(){
        this.timers = [];
    }

    addTimer(timer){
        this.timers.push(timer);
    }

    update(delta){
        for(let i = 0; i < this.timers.length; i++){
            let s = this.timers[i].update(delta);
            if(s === -1){
                this.timers.splice(i, 1);
                i--;
            }
        }
    }
}

export class EventTimer{
    constructor(duration, callback){
        this.duration = duration;
        this.callback = callback;
        this.elapsed = 0;
        this.finished = false;
    }

    getRemaining(){
        return this.duration - this.elapsed;
    }

    update(delta){
        if(this.finished){
            return -1;
        }

        this.elapsed += delta;

        if(this.elapsed >= this.duration){
            this.finished = true;
            this.callback();
            return 1;
        }
        return 0;
    }
}