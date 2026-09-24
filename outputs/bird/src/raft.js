import {objectBounds} from './placement.js';
import {snakeSpheres} from './snake-hitbox.js';
// One shared layout drives both visible geometry and collision detection.
export const TILE=80, DECK_TOP=8, EYE_HEIGHT=24, BODY_RADIUS=8;
export function initialTiles(){return [{x:0,z:0},{x:1,z:0},{x:0,z:1},{x:1,z:1}];}
export function deckAt(g,x,z){return g.ship.tiles?.some(t=>Math.abs(x-g.ship.x-t.x*TILE)<=TILE/2+1e-7&&Math.abs(z-g.ship.z-t.z*TILE)<=TILE/2+1e-7);}
export function onRaft(g){
 if(!deckAt(g,g.player.x,g.player.z))return false;
 const feet=g.player.y-EYE_HEIGHT;
 if(Math.abs(feet-(g.ship.y+DECK_TOP))<.6)return true;
 return (g.ship.objects??[]).some(o=>{const b=objectBounds(o),x=g.player.x-g.ship.x,z=g.player.z-g.ship.z;return x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ&&Math.abs(feet-(g.ship.y+DECK_TOP+b.height))<.6;});
}
export function nextTile(g,direction={x:0,z:-1}){
 const tiles=g.ship.tiles??[],occupied=new Set(tiles.map(t=>`${t.x},${t.z}`)),candidates=new Map();
 for(const t of tiles)for(const [x,z] of [[t.x+1,t.z],[t.x-1,t.z],[t.x,t.z+1],[t.x,t.z-1]])if(!occupied.has(`${x},${z}`))candidates.set(`${x},${z}`,{x,z});
 return [...candidates.values()].sort((a,b)=>{
   const score=t=>Math.hypot(t.x,t.z)*.8-(t.x*direction.x+t.z*direction.z);
   return score(a)-score(b);
 })[0];
}
export function raftColliders(g){
 const boxes=(g.ship.tiles??[]).map(t=>({min:{x:g.ship.x+t.x*TILE-TILE/2,y:g.ship.y-8,z:g.ship.z+t.z*TILE-TILE/2},max:{x:g.ship.x+t.x*TILE+TILE/2,y:g.ship.y+DECK_TOP,z:g.ship.z+t.z*TILE+TILE/2}}));
 for(const o of g.ship.objects??[]){const b=objectBounds(o);boxes.push({min:{x:g.ship.x+b.minX,y:g.ship.y+DECK_TOP+b.bottom,z:g.ship.z+b.minZ},max:{x:g.ship.x+b.maxX,y:g.ship.y+DECK_TOP+b.height,z:g.ship.z+b.maxZ}});}
 return boxes;
}
// Translating the deck and player introduces round-off at touching faces.
// A microscopic floor overlap must not be resolved as a side-wall collision.
const CONTACT_EPSILON=1e-6;
function overlaps(p,b){return p.x+BODY_RADIUS>b.min.x+CONTACT_EPSILON&&p.x-BODY_RADIUS<b.max.x-CONTACT_EPSILON&&p.z+BODY_RADIUS>b.min.z+CONTACT_EPSILON&&p.z-BODY_RADIUS<b.max.z-CONTACT_EPSILON&&p.y+4>b.min.y+CONTACT_EPSILON&&p.y-EYE_HEIGHT<b.max.y-CONTACT_EPSILON;}
export function moveWithCollisions(g,delta){
 const contacts=new Set();
 const steps=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.y,delta.z)/4)),boxes=raftColliders(g);
 // Preserve the safe deck; outside it the head and visible body are solid.
 if(g.enemy&&!onRaft(g))for(const p of snakeSpheres(g.enemy))boxes.push({min:{x:p.x-p.radius,y:p.y-p.radius,z:p.z-p.radius},max:{x:p.x+p.radius,y:p.y+p.radius,z:p.z+p.radius}});
 for(let step=0;step<steps;step++)for(const axis of ['x','z','y']){
   const amount=delta[axis]/steps;if(!amount)continue;
   const p=g.player;p[axis]+=amount;
   for(const b of boxes)if(overlaps(p,b)){
     contacts.add(axis);
     if(axis==='y')p.y=amount>0?b.min.y-4:b.max.y+EYE_HEIGHT;
     else p[axis]=amount>0?b.min[axis]-BODY_RADIUS:b.max[axis]+BODY_RADIUS;
   }
 }
 // Magnetic boots only snap from just above the physical upper surface.
 const height=g.ship.y+DECK_TOP+EYE_HEIGHT;
 if(delta.y<0&&deckAt(g,g.player.x,g.player.z)&&g.player.y>=height&&g.player.y<height+3){g.player.y=height;contacts.add('y');}
 return contacts;
}
