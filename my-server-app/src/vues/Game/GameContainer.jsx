import {useRef} from 'react';
import {PhaserGame} from './PhaserGame';


function GameContainer(){
    const phaserRef = useRef();
    return(
        <div className='gameApp'>
            <PhaserGame currentActiveScene={currentGameScene} ref={phaserRef} />
        </div>
    );
}

const currentGameScene = (scene) => {
    console.log('Current Scene: ', scene.scene.key);
}

export default GameContainer;