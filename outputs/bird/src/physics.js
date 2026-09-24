import {onRaft,deckAt,moveWithCollisions,DECK_TOP,EYE_HEIGHT} from './raft.js';
export const ORBIT={mu:3.986004418e14,radius:6_771_000}; // circular reference orbit, 400 km
ORBIT.rate=Math.sqrt(ORBIT.mu/ORBIT.radius**3);
export const GRAVITY=ORBIT.mu/ORBIT.radius**2;
const axes=['x','y','z'];
export function orbitalAcceleration(p,v){
 p={x:p.x??0,y:p.y??0,z:p.z??0};v={x:v.x??0,y:v.y??0,z:v.z??0};
 // Rotating reference orbit: +Y radial out, X along orbit, Z cross-track.
 // Exact central gravity + centrifugal + Coriolis; the raft's common fall cancels.
 const {mu,radius:R,rate:n}=ORBIT,r=Math.hypot(p.x,R+p.y,p.z),k=mu/r**3;
 return {x:-k*p.x+n*n*p.x+2*n*v.y,y:-k*(R+p.y)+n*n*(R+p.y)-2*n*v.x,z:-k*p.z};
}
export function advancePlayer(g,input,elapsed){
 const p=g.player;p.velocity??={x:0,y:0,z:0};const v=p.velocity;
 const steps=Math.max(1,Math.ceil(elapsed*120)),dt=elapsed/steps;
 for(let step=0;step<steps;step++){
   const sv=g.ship.velocity??{x:0,y:0,z:0};
   const grounded=onRaft(g)&&v.y-sv.y<=.01;
   const sa=orbitalAcceleration(g.ship,sv);
   const drift={};
   for(const axis of axes){sv[axis]+=sa[axis]*dt;drift[axis]=sv[axis]*dt;g.ship[axis]+=drift[axis];}
   const length=Math.max(1,Math.hypot(input.x??0,input.y??0,input.z??0));
   if(grounded&&(input.y??0)<=0){
     const speed=input.brake?0:input.sprint?145:85,rate=(input.x||input.z)?(input.sprint?330:220):320;
     const dx=(input.x??0)/length,dz=(input.z??0)/length;
     // Limit total horizontal acceleration, including diagonal starts and stops.
     const ex=sv.x+dx*speed-v.x,ez=sv.z+dz*speed-v.z,l=Math.hypot(ex,ez)||1,f=Math.min(1,rate*dt/l);
     v.x+=ex*f;v.z+=ez*f;v.y=sv.y-2;
     // Magnetic boots stop walking when released; free-flight inertia only
     // applies after leaving the deck. Otherwise a short step slides off it.
     if(!input.x&&!input.z){v.x=sv.x;v.z=sv.z;}
   }else{
     // Gameplay launch assist: cancel horizontal drift once on boot release.
     // Holding Space in flight must not cancel subsequent WASD acceleration.
     if(grounded){v.x=0;v.z=0;v.y=Math.max(v.y,sv.y+22);}
     const a=orbitalAcceleration(p,v);
     for(const axis of axes)v[axis]+=(a[axis]+(input[axis]??0)/length*(input.sprint?65:38))*dt;
     if(input.brake){const speed=Math.hypot(v.x,v.y,v.z),scale=Math.max(0,1-65*dt/(speed||1));for(const axis of axes)v[axis]*=scale;}
     const feet=p.y-EYE_HEIGHT-(g.ship.y+DECK_TOP);
     if(v.y<sv.y&&(input.y??0)<=0&&feet>0&&feet<12&&deckAt(g,p.x,p.z))v.y-=55*dt;
   }
   // Resolve relative travel against the deck at its new position. This
   // coordinate shift cancels exactly for airborne motion: net travel = v*dt.
   for(const axis of axes)p[axis]+=drift[axis];
   const delta=Object.fromEntries(axes.map(axis=>[axis,v[axis]*dt-drift[axis]]));
   const contact=moveWithCollisions(g,delta);
   for(const axis of contact){
     const impact=Math.abs(v[axis]-sv[axis]);
     if(impact>80&&!(p.impactCooldown>0)){p.hp=Math.max(0,p.hp-Math.min(30,(impact-80)*.2));p.impactCooldown=.4;g.log='Удар о корпус! Тормозите Shift перед посадкой.';}
     v[axis]=sv[axis];
   }
   p.impactCooldown=Math.max(0,(p.impactCooldown??0)-dt);
 }
 p.grounded=onRaft(g);
}
export function resetMotion(player){player.velocity={x:0,y:0,z:0};player.impactCooldown=0;}
