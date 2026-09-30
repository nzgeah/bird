// Apparent proximity only: the sky camera never follows player translation.
export const EARTH_DISTANCE=12000,EARTH_RADIUS=11200;
const normalize=v=>{const n=Math.hypot(v.x,v.y,v.z);return {x:v.x/n,y:v.y/n,z:v.z/n};};
export const EARTH_DIRECTION=normalize({x:-.12,y:-.96,z:-.25});
const lightDirection=normalize({x:-.6,y:.6,z:-.45});
// Fixed lighting; no visible Sun, Moon, rotation or day/night cycle.
export function orbitalSky(){return {sun:{...lightDirection},sunlight:1};}
