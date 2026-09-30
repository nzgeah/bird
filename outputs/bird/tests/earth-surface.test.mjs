import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {geographicNormal,northAmericaOrientation} from '../src/earth-surface.js';
import {EARTH_DIRECTION,EARTH_DISTANCE,EARTH_RADIUS} from '../src/orbit-sky.js';
test('continental North America faces the initial player view with north upward',()=>{
 const q=northAmericaOrientation(),center=new THREE.Vector3().copy(EARTH_DIRECTION).multiplyScalar(EARTH_DISTANCE);
 const surface=geographicNormal(36,-100).applyQuaternion(q).multiplyScalar(EARTH_RADIUS).add(center).normalize();
 const look=new THREE.Vector3(0,Math.sin(-.52),-Math.cos(-.52));assert.ok(surface.dot(look)>.999999);
 const north=geographicNormal(37,-100).applyQuaternion(q).sub(geographicNormal(36,-100).applyQuaternion(q));
 assert.ok(north.dot(new THREE.Vector3(0,Math.cos(-.22),Math.sin(-.22)))>0);
});
test('Arctic and Antarctic circles remain beyond the visible Earth horizon',()=>{
 const q=northAmericaOrientation(),view=new THREE.Vector3().copy(EARTH_DIRECTION).negate();
 for(const lat of [66.5,80,90,-66.5,-80,-90])for(let lon=-180;lon<180;lon+=10)
 assert.ok(geographicNormal(lat,lon).applyQuaternion(q).dot(view)<EARTH_RADIUS/EARTH_DISTANCE,lat+','+lon);
});
