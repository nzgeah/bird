// Apparent proximity only: the sky camera never follows player translation.
export const EARTH_DISTANCE=12000,EARTH_RADIUS=11200;
const normalize=v=>{const n=Math.hypot(v.x,v.y,v.z);return {x:v.x/n,y:v.y/n,z:v.z/n};};
export const EARTH_DIRECTION=normalize({x:-.12,y:-.96,z:-.25});
// Grazing western sunlight puts the eastern US beyond the terminator.
const lightDirection=normalize({x:-.9629700716,y:.1475117824,z:.2256743565});
// Fixed lighting; no visible Sun, Moon, rotation or day/night cycle.
export function orbitalSky(){return {sun:{...lightDirection},sunlight:1};}
