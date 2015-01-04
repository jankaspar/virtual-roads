import THREE = require('three');
import Input = require('./input');
import Level = require('./level');
import GameState = require('./gameState');

class Game {

	element: HTMLElement;

	state = GameState.Welcome;
	onStateChange: () => void;
	private levels = ['level1', 'level2'];
	private currentLevel = 0;

	private renderer: THREE.WebGLRenderer;
	private clock: THREE.Clock;

	private level: Level;

	private input: Input;

	constructor() {

		this.renderer = new THREE.WebGLRenderer({
			precision: 'highp',
			devicePixelRatio: window.devicePixelRatio || 1
		});

		this.renderer.shadowMapEnabled = true;
		this.renderer.shadowMapCullFace = THREE.CullFaceBack;
		this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

		this.element = this.renderer.domElement;

		window.onresize = () => this.resize();
		this.resize();

		this.reload();
		this.loop();
	}

	private loop(){
		if(this.level) {
			this.renderer.render(this.level.scene, this.level.camera);
			if(this.state != GameState.Welcome) {
				this.level.update(this.clock.getDelta(), this.input);
			}
		}
		requestAnimationFrame( () =>  this.loop() );
	}

	private resize() {
		this.renderer.setSize( window.innerWidth, window.innerHeight);

		if(this.level) {
			this.level.camera.aspect = window.innerWidth / window.innerHeight;
			this.level.camera.updateProjectionMatrix();
		}
	}

	loadLevel(name:string) {
		this.level = new Level(name);
		this.level.load();
		this.level.onFail = () => this.onFail();
		this.level.onSuccess = () => this.onSuccess();
		this.resize();
	}

	reload (){
		var level = this.levels[this.currentLevel];
		if (level) {
			this.loadLevel(level);
		} else {
			this.changeState(GameState.Finished);
		}
	}

	start() {
		this.changeState(GameState.Playing);
		this.input = new Input(document.body);
		this.clock = new THREE.Clock();
		this.level.paused = false;
	}

	onFail() {
		this.changeState(GameState.Failed);
	}

	onSuccess() {
		this.currentLevel++;
		this.reload();
		if(this.state != GameState.Finished){
			this.start();
		}
	}

	changeState( state: GameState) {
		this.state = state;
		this.onStateChange && this.onStateChange();
	}
}
export = Game;