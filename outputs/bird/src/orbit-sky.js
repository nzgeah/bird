// Apparent proximity only: the sky camera never follows player translation.
export const EARTH_DISTANCE=12000,EARTH_RADIUS=11200;
const normalize=v=>{const n=Math.hypot(v.x,v.y,v.z);return {x:v.x/n,y:v.y/n,z:v.z/n};};
export const EARTH_DIRECTION=normalize({x:-.12,y:-.96,z:-.25});
// Most of the initial Earth view is night or twilight; only the western rim is lit.
const lightDirection=normalize({x:-.9752655230,y:.0651966978,z:.2112026283});
// Fixed lighting; no visible Sun, Moon, rotation or day/night cycle.
export function orbitalSky(){return {sun:{...lightDirection},sunlight:1};}
