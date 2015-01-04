import THREE = require('three');
import m = require('mithril');

class Model {
    loaded = false;
    sceneObject: THREE.Object3D;

    private url: string;

    constructor(url:string){
        this.url = url;
    }

    load(){
        var d = m.deferred();
        var loader = new THREE.ObjectLoader();
        loader.load(this.url, (object) => {
            this.loaded = true;
            this.sceneObject = object;
            d.resolve();
        });
        return d.promise;
    }

    traverseGeometry(
        boundingTest: (boundingSphere: THREE.Sphere) => boolean,
        faceAction: (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, normal: THREE.Vector3, material: string) => void
    ){
        this.sceneObject.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
                var mesh = <THREE.Mesh>obj;
                var geometry = mesh.geometry;
                if (!mesh.geometry.boundingSphere) {
                    mesh.geometry.computeBoundingSphere();
                }
                if(boundingTest(mesh.geometry.boundingSphere)){
                    geometry.faces.forEach(f => {
                        var v1 = mesh.localToWorld(geometry.vertices[f.a].clone());
                        var v2 = mesh.localToWorld(geometry.vertices[f.b].clone());
                        var v3 = mesh.localToWorld(geometry.vertices[f.c].clone());
                        faceAction(v1,v2,v3, f.normal, mesh.material.name);
                    })
                }
            }
        });
    }

    enableShadows(){
        this.sceneObject.traverse(obj => {
            obj.receiveShadow = true;
            obj.castShadow = true;
        });
    }
}
export = Model;
