
enum Keys {
    Left = 37,
    Up = 38,
    Right = 39,
    Down = 40,
    Space = 32
}


interface KeyboardState { [s: string]: boolean }

class Keyboard {
    state: KeyboardState = {};
    changeCallback: ( state:KeyboardState ) => void;

    constructor(element: HTMLElement, callback: ( state:KeyboardState ) => void ){
        this.changeCallback = callback;
        element.onkeydown = this.onKeyDown.bind(this);
        element.onkeyup = this.onKeyUp.bind(this);
    }
    onKeyDown(e: KeyboardEvent){
        this.state[e.keyCode] = true;
        this.changeCallback(this.state);
    }
    onKeyUp(e: KeyboardEvent){
        this.state[e.keyCode] = false;
        this.changeCallback(this.state);
    }
}

class Input {
    accelerating = 0;
    sideSpeed = 0;
    jump = false;

    constructor(element?: HTMLElement ){
        if(element) {
            new Keyboard(element, this.onKeybordChange.bind(this));
        }
    }

    onKeybordChange(state: KeyboardState) {
        this.accelerating = (state[Keys.Up] ? 0 : 1) + (state[Keys.Down] ? 0 : -1);
        this.sideSpeed = (state[Keys.Left] ? 0 : 1) + (state[Keys.Right] ? 0 : -1);
        this.jump = state[Keys.Space];
    }
}

export = Input;