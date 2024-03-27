import {forwardRef, useEffect, useLayoutEffect, useRef} from 'react';
import StartGame from './main';
import { EventBus } from './EventBus';

export const PhaserGame = forwardRef(function PhaserGame({currentActiveScene}, ref)
{
    const game = useRef();

    //We create the game inside a useLayoutEffect hook to make sure the game is created only once in the DOM
    useLayoutEffect(()=>{

        if(game.current === undefined)
        {
            game.current = StartGame("gameContainer");
            if(ref !== null)
            {
                ref.current = {game: game.current, scene: null};
            }
        }
    
        return () => {
            if(game.current)
            {
                game.current.destroy(true);
                game.current = undefined;
            }
        }
    },[ref]);

    useEffect(() => {
        EventBus.on('current-scene-ready', (currentScene) => {
            console.log('RECEIVED CURRENT SCENE READY EVENT');
            if(currentActiveScene instanceof Function)
            {
                console.log('CALLING CURRENT ACTIVE SCENE');
                currentActiveScene(currentScene);
            }
            console.log(ref.current);
            ref.current.scene = currentScene;
            console.log(ref.current);
        });

        return () => {
            EventBus.off('current-scene-ready');
        }
    }, [currentActiveScene, ref]);

    return(
        <div id="gameContainer"></div>
    );
});