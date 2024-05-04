import {forwardRef, useEffect, useLayoutEffect, useRef, useState} from 'react';
import StartGame from './main';
import { EventBus } from './EventBus';

export const PhaserGame = forwardRef(function PhaserGame({currentActiveScene, startGame}, ref)
{
    const game = useRef();
    const [gameHeight, setGameHeight] = useState(0);
    const [gameWidth, setGameWidth] = useState(0);

    //We create the game inside a useLayoutEffect hook to make sure the game is created only once in the DOM
    useLayoutEffect(()=>{

        if(game.current === undefined)
        {
            game.current = StartGame("gameContainer");
            const configs = game.current.config;
            setGameHeight(configs.height);
            setGameWidth(configs.width);
            console.log('Game created with: ', gameHeight, gameWidth);

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
    },[ref, gameHeight, gameWidth]);

    useEffect(() => {
        EventBus.on('current-scene-ready', (currentScene) => {
            if(currentActiveScene instanceof Function)
            {
                currentActiveScene(currentScene);
            }
            ref.current.scene = currentScene;
        });

        EventBus.on('start-game', () => {
            if(startGame instanceof Function)
            {
                startGame();
            
            }
        });

        return () => {
            EventBus.off('current-scene-ready');
            EventBus.off('start-game');
        }

    }, [currentActiveScene, startGame, ref]);



    return  <div ref = {ref} id="gameContainer"/>;
});