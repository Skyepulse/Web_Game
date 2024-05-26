import {forwardRef, useEffect, useLayoutEffect, useRef, useState} from 'react';
import StartGame from './main';
import { EventBus } from './EventBus';

export const PhaserGame = forwardRef(function PhaserGame({currentActiveScene, sendServerMessage}, ref)
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

        EventBus.on('send-server-message', (message) => {
            if(sendServerMessage instanceof Function)
            {
                sendServerMessage(message);
            }
        });

        EventBus.on('your-turn', () => {
            game.current.scene.scenes[2].showTurnButton();
        });

        EventBus.on('your-guess-turn', () => {
            game.current.scene.scenes[2].showPicker();
        });

        EventBus.on('reveal-score', (response) => {
            game.current.scene.scenes[2].revealScore(response);
        });

        return () => {
            EventBus.off('current-scene-ready');
            EventBus.off('send-server-message');
            EventBus.off('your-turn');
            EventBus.off('your-guess-turn');
            EventBus.off('reveal-score');
        }

    }, [currentActiveScene, sendServerMessage, ref]);



    return  <div ref = {ref} id="gameContainer"/>;
});