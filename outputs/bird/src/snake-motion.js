import {resolveSnakePoint,resolveSnakeBody} from './snake-collision.js';
import {distance} from './spatial.js';

const length=v=>Math.hypot(v.x,v.y,v.z);
const normalized=v=>{const n=length(v)||1;return {x:v.x/n,y:v.y/n,z:v.z/n};};
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});

// Limit angular speed, including a target directly behind the head.
export function turnTowards(current,target,maxAngle){
  const cosine=Math.max(-1,Math.min(1,dot(current,target)));
  const angle=Math.acos(cosine);
  if(angle<=maxAngle)return {...target};
  let tangent={x:target.x-current.x*cosine,y:target.y-current.y*cosine,z:target.z-current.z*cosine};
  if(length(tangent)<1e-6)tangent=cross(current,Math.abs(current.y)<.9?{x:0,y:1,z:0}:{x:1,y:0,z:0});
  tangent=normalized(tangent);
  const c=Math.cos(maxAngle),s=Math.sin(maxAngle);
  return normalized({x:current.x*c+tangent.x*s,y:current.y*c+tangent.y*s,z:current.z*c+tangent.z*s});
}

export function advanceSnake(enemy,target,elapsed){
  resolveSnakePoint(enemy,22,enemy.obstacles);
  const desiredSpeed=enemy.stun>0?130:144;
  const direction=()=>{
    const sign=enemy.stun>0?-1:1;
    const delta={x:(target.x-enemy.x)*sign,y:(target.y-enemy.y)*sign,z:((target.z??0)-enemy.z)*sign};
    return length(delta)>1e-5?normalized(delta):(enemy.motion?.heading??{x:0,y:0,z:1});
  };
  if(!enemy.motion||!enemy.segments.length||distance(enemy,enemy.motion.last)>200){
    enemy.motion={heading:direction(),speed:desiredSpeed,last:{x:enemy.x,y:enemy.y,z:enemy.z}};
    // A full initial trail prevents the tail popping into existence or stretching.
    enemy.segments=Array.from({length:201},(_,i)=>({x:enemy.x-enemy.motion.heading.x*i*2,y:enemy.y-enemy.motion.heading.y*i*2,z:enemy.z-enemy.motion.heading.z*i*2}));
  }
  const steps=Math.max(1,Math.ceil(elapsed*120)),dt=elapsed/steps,motion=enemy.motion;
  for(let i=0;i<steps;i++){
    motion.heading=turnTowards(motion.heading,direction(),1.8*dt);
    motion.speed+=(desiredSpeed-motion.speed)*(1-Math.exp(-5*dt));
    let blocked=false;
    for(const axis of ['x','z','y']){enemy[axis]+=motion.heading[axis]*motion.speed*dt;blocked=resolveSnakePoint(enemy,22,enemy.obstacles)||blocked;}
    if(blocked){motion.heading=turnTowards(motion.heading,{x:0,y:1,z:0},4*dt);enemy.y+=motion.speed*dt;resolveSnakePoint(enemy,22,enemy.obstacles);}
    if(distance(enemy,enemy.segments[0])>=2){enemy.segments.unshift({x:enemy.x,y:enemy.y,z:enemy.z});enemy.segments.length=Math.min(201,enemy.segments.length);}
  }
  resolveSnakeBody(enemy);
  motion.last={x:enemy.x,y:enemy.y,z:enemy.z};
}
