import Game = require('./game/game');
import GameState = require('./game/gameState');
import THREE = require('three');
import m = require('mithril');

class MainController {

    game: Game;

    constructor(){
        this.game = new Game();
        this.game.onStateChange = ()=>{
            m.redraw();
        };
    }

    initCanvas(element:HTMLElement){
        element.appendChild( this.game.element );
    }

    start(){
        this.game.start();
    }

    restart(){
        this.game.reload();
        this.game.start()
    }
}

var welcomeView = function (c:MainController) {
    return m('div', [
        m('h1', 'Virtual Roads'),
        m('p', 'Use Arrows to move, Space to jump.'),
        m('p', [
           m('button', { onclick: () => c.start() }, 'Start')
        ])
    ]);
};

var failedView = function (c:MainController) {
    return m('div', [
        m('p', 'Never mind, try again.'),
        m('p', [
            m('button', { onclick: () => c.restart() }, 'Restart')
        ])
    ]);
};

var finishView = function (c:MainController) {
    return m('div', [
        m('p', 'Congratulations you finished all levels !!!')
    ]);
};

var mainView = function (c:MainController) {
    var overlays: any = {};

    overlays[GameState.Welcome] = welcomeView;
    overlays[GameState.Finished] = finishView;
    overlays[GameState.Failed] = failedView;
    overlays[GameState.Playing] = () => null;

    return m('.main', [
        m('.game', {
            key: 'canvas',
            config: (element:HTMLElement, isInitialized:boolean, context:any) =>
                isInitialized ? null : c.initCanvas(element)
        }),
        m('.overlay', [
            overlays[c.game.state](c)
        ])
    ]);
};

m.module(document.body, { controller: MainController, view: mainView });