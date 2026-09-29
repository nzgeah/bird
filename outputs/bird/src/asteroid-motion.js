import {orbitalAcceleration} from './physics.js';
export function updateAsteroids(g,elapsed){
 const steps=Math.max(1,Math.ceil(elapsed*120)),dt=elapsed/steps;
 for(const a of g.asteroids??[])for(let i=0;i<steps;i++){
  const acceleration=orbitalAcceleration(a,{x:a.vx??0,y:a.vy??0,z:a.vz??0});
  for(const axis of ['x','y','z']){a['v'+axis]=(a['v'+axis]??0)+acceleration[axis]*dt;a[axis]+=a['v'+axis]*dt;}
  a.spinAngle=((a.spinAngle??0)+(a.spinRate??0)*dt)%(Math.PI*2);
 }
}

