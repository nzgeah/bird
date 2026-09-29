import {segmentDistance} from './spatial.js';
export function snakeSpheres(enemy){
 const result=[{...enemy,radius:22}];let travelled=0,previous=enemy;
 for(const p of enemy.segments??[]){travelled+=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);previous=p;if(travelled>260)break;if(travelled<20)continue;result.push({...p,radius:Math.max(5,12-travelled/50)});}
 return result;
}
export function hitsSnake(enemy,start,end){return snakeSpheres(enemy).some(p=>segmentDistance(p,start,end)<p.radius+3);}

