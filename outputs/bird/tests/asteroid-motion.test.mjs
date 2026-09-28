import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAsteroids} from '../src/variants.js';
import {updateAsteroids} from '../src/asteroid-motion.js';
test('asteroids have repeatable, size-dependent speeds and normalized spin axes',()=>{
 const a=createAsteroids();assert.deepEqual(a,createAsteroids());
 for(const rock of a){assert.ok(Math.abs(Math.hypot(...rock.spinAxis)-1)<1e-10);assert.ok(Math.hypot(rock.vx,rock.vz)>0);}
 const small=a[4],large=a[3];assert.ok(Math.abs(small.spinRate)>Math.abs(large.spinRate));assert.ok(Math.hypot(small.vx,small.vz)>Math.hypot(large.vx,large.vz));
});
test('orbital asteroid flight and rotation advance consistently across frame rates',()=>{
 const simulate=hz=>{const g={asteroids:createAsteroids()};for(let i=0;i<hz*2;i++)updateAsteroids(g,1/hz);return g.asteroids;};
 const initial=createAsteroids(),a=simulate(30),b=simulate(120);
 for(let i=0;i<a.length;i++){
 assert.ok(Math.hypot(a[i].x-initial[i].x,a[i].y-initial[i].y,a[i].z-initial[i].z)>1);
 for(const key of ['x','y','z','spinAngle'])assert.ok(Math.abs(a[i][key]-b[i][key])<1e-8);
 }
});
