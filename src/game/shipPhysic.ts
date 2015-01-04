import THREE = require('three');
import Input = require('./input');
import Model = require('./model');

interface Collision{
    time: number;
    normal: THREE.Vector3;
    material: string;
}

class ShipPhysic {
    environment: Model;

    position: THREE.Vector3;
    velocity: THREE.Vector3;

    radius = 0.7;
    gravity: THREE.Vector3;

    jumpSpeed = 8;

    lastCollision: THREE.Vector3[];

    onExplode: () => void;
    onFinish: () => void;

    constructor(environment: Model){
        this.environment = environment;

        this.position = new THREE.Vector3(0,0,1);
        this.velocity = new THREE.Vector3(0,0,0);
        this.gravity = new THREE.Vector3(0, 0, -9.8 * 2);
    }

    update (delta: number, input: Input){
        this.updateSpeed(delta, input);
        this.handleJump(input);
        this.updatePosition(delta);
    }

    private updateSpeed (delta: number, input: Input){

        this.velocity.x = ( this.velocity.x + input.sideSpeed * 5 * delta * 20 ) / (1 + delta * 20);

        // apply acceleration
        var acceleration = new THREE.Vector3(0, -20, 0).multiplyScalar(input.accelerating).add(this.gravity);
        this.velocity.add(acceleration.multiplyScalar(delta));
    }

    private handleJump (input: Input){
        if(input.jump){
            input.jump = false;
            var distance = 2;

            var ray = new THREE.Ray(this.position, new THREE.Vector3(0, 0, -1));
            this.environment.traverseGeometry(sphere => ray.isIntersectionSphere(sphere),  (v1, v2, v3, n) => {
                var intersection = ray.intersectTriangle(v1,v2,v3, true);
                if(intersection) {
                    distance = Math.min(distance, intersection.distanceTo(this.position));
                }
            });
            if(distance < 1.3){
                this.velocity.z = this.jumpSpeed;
            }
        }
    }

    private updatePosition (delta: number){
        if (delta > 0) {
            var nextCollision = this.findNextCollision(delta);
            this.position.add(this.velocity.clone().multiplyScalar(nextCollision.time));

            if (nextCollision.normal) {
                delta = delta - nextCollision.time;
                // handle collision
                if(this.handleCollision(nextCollision.normal, nextCollision.material)){
                    if (delta > 0) {
                        this.updatePosition(delta);
                    }
                }
            }
        }
    }

    private handleCollision (normal: THREE.Vector3, material: string): boolean {
        if(material.indexOf('explosive') > -1){
            this.onExplode && this.onExplode();
        }else if(material.indexOf('finish') > -1){
            this.onFinish && this.onFinish();
        } else {
            this.bounce(normal);
            return true;
        }
        return false;
    }

    private bounce(normal: THREE.Vector3) {
        var bounceFactor = 1.1;
        var bounceFactorAngle = 0.4;

        var normalized = normal.normalize();

        var projectedVelocity = this.velocity.dot(normalized);
        var cos = -normalized.dot(this.velocity) / this.velocity.length();

        var bounce = normalized.multiplyScalar(projectedVelocity * (bounceFactorAngle * cos + bounceFactor));
        this.velocity.sub(bounce);
    }

    private findNextCollision (delta: number):Collision {
        // time frame movement is simplified to linear
        // simple "sliding sphere" collision model is used for the shipPhysic
        var speed = this.velocity.length();
        var sphere = new THREE.Sphere(this.position, this.radius);
        var boundingSphere = new THREE.Sphere(this.position, this.radius + speed);
        var result: Collision = {
            time: delta,
            normal: null,
            material: null
        };

        this.environment.traverseGeometry( sphere => boundingSphere.intersectsSphere(sphere) , (v1, v2, v3, n, material) => {

            var intersectionPoint = this.position.clone().sub(n.clone().normalize().multiplyScalar(this.radius));

            // collide with triangle inside
            var ray = new THREE.Ray(intersectionPoint , this.velocity);
            var collisionPoint = ray.intersectTriangle(v1, v2, v3, true);

            if(collisionPoint){
                var time = collisionPoint.sub(intersectionPoint).length() / speed;
                if(time > 0 && time < result.time){

                    //this.lastCollision = [v1,v2,v3];
                    result = {
                        time: time,
                        normal: n.clone(),
                        material: material
                    };
                    return;
                }
            }

            // collide with polygon
            var plane = new THREE.Plane();

            // find point on plane closest to sphere
            plane.setFromCoplanarPoints(v1,v2,v3);
            var planeIntersection = ray.intersectPlane(plane);
            if(!planeIntersection){
                var ray2 = new THREE.Ray(this.position, plane.normal.clone().negate());
                var possibleIntersection = ray2.intersectPlane(plane);
                if(possibleIntersection && possibleIntersection.distanceTo(this.position) < this.radius){
                    planeIntersection = possibleIntersection;
                }
            }

            if(planeIntersection){
                // find closest triangle point on plane
                var closestPoint = this.closestPointOnTriangle(v1,v2,v3, planeIntersection);
                var rayBack = new THREE.Ray(closestPoint, this.velocity.clone().negate());
                var sphereIntersection = rayBack.intersectSphere(sphere);
                if(sphereIntersection){

                    var time = sphereIntersection.clone().sub(closestPoint).length() / speed;
                    // edge collision cause unexpected jumps, pretend that these happen little bit later...
                    time *= 1.2;
                    if(time > 0 && time < result.time){
                        var tangent = this.position.clone().sub(sphereIntersection);
                        result = {
                            time: time,
                            normal: tangent,
                            material: material
                        };
                    }
                }
            }
        });

        return result;
    }

    private closestPointOnTriangle (a:THREE.Vector3, b:THREE.Vector3, c: THREE.Vector3, point:THREE.Vector3 ):THREE.Vector3
    {
        var p1 = this.closestPointOnLine(a, b, point);
        var p2 = this.closestPointOnLine(b, c, point);
        var p3 = this.closestPointOnLine(c, a, point);

        var d1 = point.distanceTo(p1);
        var d2 = point.distanceTo(p2);
        var d3 = point.distanceTo(p3);

        var min = d1;
        var result = p1;

        if (d2 < min) {
            min = d2;
            result = p2;
        }

        if (d3 < min) {
            result = p3;
        }

        return result;
    }

    private closestPointOnLine (a:THREE.Vector3, b:THREE.Vector3, point:THREE.Vector3 ):THREE.Vector3 {
        var line = new THREE.Line3(a,b);
        return line.closestPointToPoint(point, true);
    }
}
export = ShipPhysic;