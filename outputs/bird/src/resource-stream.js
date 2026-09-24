import {SCRAP_VARIANTS} from './variants.js';

const TYPES=['metal','polymer','circuit','cell'];
export const STREAM_INTERVAL=1.5, STREAM_LIMIT=140;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

export function updateResourceStream(g,dt){
  // Remove distant debris so an uncollected population cannot stop the flow.
  // Keep objects close to an exploring player as well as close to the raft.
  g.resources=g.resources.filter(r=>distance(r,g.ship)<1800||distance(r,g.player)<1000);
  g.spawn+=dt;
  while(g.spawn>=STREAM_INTERVAL){
    g.spawn-=STREAM_INTERVAL;
    for(let i=0;i<3&&g.resources.length<STREAM_LIMIT;i++){
      const index=g.streamIndex??0;g.streamIndex=index+1;
      const type=TYPES[index%TYPES.length];
      // A nearby debris orbit crosses the ship's route. Distributed in 3D,
      // without homing toward the player or forming an ocean-like plane.
      const forward={x:1/Math.sqrt(5),z:-2/Math.sqrt(5)};
      const along=480+g.random()*160,across=(g.random()-.5)*500;
      const relativeSpeed=26+g.random()*10;
      const r={type,x:g.ship.x+forward.x*along-forward.z*across,
        y:g.ship.y+35+(g.random()-.5)*200,
        z:g.ship.z+forward.z*along+forward.x*across,
        vx:(g.ship.velocity?.x??0)-forward.x*relativeSpeed,
        vy:(g.ship.velocity?.y??0)+(g.random()-.5)*2,
        vz:(g.ship.velocity?.z??0)-forward.z*relativeSpeed};
      if(type==='metal')r.variant=SCRAP_VARIANTS[Math.floor(index/4)%SCRAP_VARIANTS.length];
      g.resources.push(r);
    }
  }
}
