import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitalSky,EARTH_DISTANCE,EARTH_RADIUS} from '../src/orbit-sky.js';
import {createGame} from '../src/model.js';
import {updateRaftPower} from '../src/energy.js';
import {OrbitalSky} from '../src/sky-visual.js';
import * as THREE from '../vendor/three.module.js';
test('Earth fills the lower sky while viewer remains outside the globe',()=>{
 assert.ok(EARTH_RADIUS<EARTH_DISTANCE);assert.ok(2*Math.asin(EARTH_RADIUS/EARTH_DISTANCE)>Math.PI*.7);
});
test('lighting and solar generation remain constant as time passes',()=>{
 for(const time of [0,300,600,86400]){assert.deepEqual(orbitalSky(time),orbitalSky(0));const g=createGame();g.ship.objects.push({type:'solar'});g.ship.power=50;g.time=time;updateRaftPower(g,1);assert.ok(Math.abs(g.ship.power-50.9)<1e-8);}
});
test('sky follows view rotation but ignores player translation and time',()=>{
 const sky=Object.create(OrbitalSky.prototype);Object.assign(sky,{camera:new THREE.PerspectiveCamera(),sunLight:new THREE.Object3D(),earth:new THREE.Object3D(),stars:new THREE.Object3D()});
 const camera=new THREE.PerspectiveCamera();sky.update(camera,0);const earth=sky.earth.rotation.clone();
 camera.position.set(1e8,-2e8,3e8);camera.rotation.set(.2,.8,0);sky.update(camera,86400);
 assert.deepEqual(sky.camera.position.toArray(),[0,0,0]);assert.ok(sky.earth.rotation.equals(earth));assert.ok(sky.camera.quaternion.equals(camera.quaternion));assert.equal(sky.stars.rotation.y,0);
});
