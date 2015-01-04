import THREE = require('three');
import m = require('mithril');
import Model = require('./model');
import Input = require('./input');
import ShipPhysic = require('./shipPhysic');
import Explosion = require('./explosion');

class Level {

    name: string;

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;

    paused = true;

    onFail: () => void;
    onSuccess: () => void;

    private shipModel: Model;
    private shipPhysic: ShipPhysic;
    private shipExplosion: Explosion;

    private environment: Model;
    private dirLight:  THREE.DirectionalLight;

    constructor(name: string){
        this.name = name;
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
        this.camera.position.set(0, -5, 2);
        this.camera.lookAt(new THREE.Vector3(0,0,0));
    }

    load(){
        this.shipModel = new Model('models/ship.json');
        this.environment = new Model('models/' + this.name + '.json');
        m.sync([
            this.shipModel.load(),
            this.environment.load()
        ]).then(() => this.start());
    }

    update(delta: number, input: Input) {
        if(! this.paused) {
            if (this.shipExplosion) {
                this.shipExplosion.update(delta);
            }
            if (this.shipPhysic && !this.shipExplosion) {
                this.shipPhysic.update(delta, input);
                var p = this.shipPhysic.position;
                this.shipModel.sceneObject.position.set(p.x, p.y, p.z);
                this.shipModel.sceneObject.updateMatrix();

                if (p.z < -20) {
                    this.explodeShip();
                }

                // update camera position
                this.camera.position.set(p.x * 0.7, -10 + p.y + 0.05 * this.shipPhysic.velocity.y, 2 + p.z * 0.7);
                this.camera.fov = 65 + 0.4 * this.shipPhysic.velocity.y;
                this.camera.updateProjectionMatrix();

                // update light
                this.dirLight.position.set(3, p.y - 5, 10);
                this.dirLight.target.position.set(0, p.y, 0);
                this.dirLight.updateMatrixWorld(true);
                this.dirLight.target.updateMatrixWorld(true);
            }
        }
    }

    private start() {
        this.environment.enableShadows();
        this.shipModel.enableShadows();
        this.scene.add(this.shipModel.sceneObject);
        this.scene.add(this.environment.sceneObject);

        this.shipPhysic = new ShipPhysic(this.environment);
        this.shipPhysic.onExplode = () => this.explodeShip();
        this.shipPhysic.onFinish = () => {
            this.paused = true;
            this.onSuccess && this.onSuccess();
        };


        this.setUpLights();
        this.update(0, new Input());
    }

    private setUpLights() {

        this.scene.fog = new THREE.Fog( 0x000000, 0, 100 ); // new THREE.FogExp2( 0x000000, 0.025 );

        var hemiLight = new THREE.HemisphereLight(0xccddff, 0x663333, 0.6);
        hemiLight.position.set(100, 300, 500);
        this.scene.add(hemiLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        this.dirLight.color.setHSL(0.1, 1, 0.95);

        this.dirLight.castShadow = true;
        this.dirLight.shadowMapWidth = 1024;
        this.dirLight.shadowMapHeight = 2048;

        this.dirLight.shadowCameraLeft = -20;
        this.dirLight.shadowCameraRight = 20;
        this.dirLight.shadowCameraTop = 40;
        this.dirLight.shadowCameraBottom = -20;

        this.dirLight.shadowCameraFar = 100;
        this.dirLight.shadowCameraNear = 4;
        this.dirLight.shadowBias = -0.0001;
        this.dirLight.shadowDarkness = 0.20;
        //this.dirLight.shadowCameraVisible = true;

        this.scene.add(this.dirLight);
    }

    private explodeShip(){
        this.shipExplosion = new Explosion(this.shipModel);
        this.scene.add(this.shipExplosion.sceneObject);
        this.scene.remove(this.shipModel.sceneObject);
        this.onFail && this.onFail();
    }
}
export = Level;