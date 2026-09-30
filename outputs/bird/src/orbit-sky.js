// Accelerated visual orbit, independent of player travel; not a navigation model.
export const SKY_ORBIT_SECONDS=600;
export const EARTH_DISTANCE=12000,EARTH_RADIUS=3600;
const normalize=v=>{const n=Math.hypot(v.x,v.y,v.z);return {x:v.x/n,y:v.y/n,z:v.z/n};};
export const EARTH_DIRECTION=normalize({x:-.18,y:-.58,z:-.8});
const tangent=normalize({x:-EARTH_DIRECTION.z,y:0,z:EARTH_DIRECTION.x});
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function orbitalSky(time=0){
 const phase=(time/SKY_ORBIT_SECONDS)*Math.PI*2+Math.PI;
 const sun=Object.fromEntries(['x','y','z'].map(a=>[a,EARTH_DIRECTION[a]*Math.cos(phase)+tangent[a]*Math.sin(phase)]));
 const separation=Math.acos(Math.max(-1,Math.min(1,Math.cos(phase))));
 const limb=Math.asin(EARTH_RADIUS/EARTH_DISTANCE);
 const sunlight=smooth((separation-limb+.018)/.036);
 const moonPhase=time/(SKY_ORBIT_SECONDS*12)*Math.PI*2;
 return {sun,sunlight,earthRotation:time*.00035,starRotation:time/SKY_ORBIT_SECONDS*Math.PI*2,
  moon:normalize({x:Math.cos(moonPhase+.7),y:.25,z:-Math.sin(moonPhase+.7)})};
}
