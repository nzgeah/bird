import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitalSky,SKY_ORBIT_SECONDS,EARTH_DIRECTION} from '../src/orbit-sky.js';
import {createGame} from '../src/model.js';
import {updateRaftPower} from '../src/energy.js';
import {OrbitalSky} from '../src/sky-visual.js';
import * as THREE from '../vendor/three.module.js';
test('orbit starts in sunlight and passes through Earth shadow each cycle',()=>{
 assert.equal(orbitalSky(0).sunlight,1);assert.equal(orbitalSky(SKY_ORBIT_SECONDS/2).sunlight,0);assert.equal(orbitalSky(SKY_ORBIT_SECONDS).sunlight,1);
 const middle=orbitalSky(SKY_ORBIT_SECONDS/2);for(const axis of ['x','y','z'])assert.ok(Math.abs(middle.sun[axis]-EARTH_DIRECTION[axis])<1e-8);
 for(let t=0;t<600;t++){const s=orbitalSky(t);assert.ok(s.sunlight>=0&&s.sunlight<=1);assert.ok(Math.abs(Math.hypot(s.sun.x,s.sun.y,s.sun.z)-1)<1e-8);}
});
test('eclipse uses a smooth transition and solar panels share the same cycle',()=>{
 assert.ok(Array.from({length:6000},(_,i)=>orbitalSky(i/10).sunlight).some(x=>x>0&&x<1));
 const g=createGame();g.ship.objects.push({type:'solar'});g.ship.power=50;g.time=300;updateRaftPower(g,1);assert.equal(g.ship.power,50);
 g.time=600;updateRaftPower(g,1);assert.ok(Math.abs(g.ship.power-50.9)<1e-8);
});
test('sky follows view rotation but ignores arbitrarily large player translation',()=>{
 const sky=Object.create(OrbitalSky.prototype);Object.assign(sky,{camera:new THREE.PerspectiveCamera(),sun:new THREE.Object3D(),halo:new THREE.Object3D(),sunLight:new THREE.Object3D(),moon:new THREE.Object3D(),earth:new THREE.Object3D(),stars:new THREE.Object3D()});sky.halo.material={};
 const camera=new THREE.PerspectiveCamera();sky.update(camera,40);const sun=sky.sun.position.clone();
 camera.position.set(1e8,-2e8,3e8);camera.rotation.set(.2,.8,0);sky.update(camera,40);
 assert.deepEqual(sky.camera.position.toArray(),[0,0,0]);assert.deepEqual(sky.sun.position.toArray(),sun.toArray());assert.ok(sky.camera.quaternion.equals(camera.quaternion));
});
