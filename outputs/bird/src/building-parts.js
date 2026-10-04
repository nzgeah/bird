// Shared solid panels for both rendering and collision; openings stay empty.
// Each panel: [width, height, depth, x, y, z].
export const WALL_TYPES=['wall','windowWall','arch','fence','door','glass','damagedPanel'];
export function buildingParts(type,open=false){
 if(type==='slope')return Array.from({length:12},(_,i)=>[60,6,5,0,3+i*4.5,-27.5+i*5]);
 if(type==='corner')return Array.from({length:12},(_,i)=>[5+i*5,6,5,27.5-i*2.5,3+i*4.5,-27.5+i*5]);
 if(type==='door')return [[8,60,6,-26,30,0],[8,60,6,26,30,0],[44,10,6,0,55,0],...(open?[]:[[44,50,5,0,25,0]])];
 if(type==='glass')return [[5,60,6,-27.5,30,0],[5,60,6,27.5,30,0],[50,5,6,0,2.5,0],[50,5,6,0,57.5,0],[50,50,2,0,30,0]];
 if(type==='damagedPanel')return [[15,60,6,-22.5,30,0],[15,60,6,22.5,30,0],[30,14,6,0,53,0],[14,8,6,8,4,0]];
 if(type==='windowWall')return [[10,60,6,-25,30,0],[10,60,6,25,30,0],[40,16,6,0,8,0],[40,12,6,0,54,0]];
 if(type==='arch')return [[10,60,6,-25,30,0],[10,60,6,25,30,0],[40,12,6,0,54,0]];
 if(type==='fence')return [[6,28,6,-27,14,0],[6,28,6,27,14,0],[48,5,6,0,25.5,0],[48,5,6,0,10,0]];
 if(type==='roof')return Array.from({length:12},(_,i)=>{const x=-27.5+i*5;return [5,6,60,x,63+(30-Math.abs(x))*.6,0];});
 return null;
}
export function partBounds(object){
 const parts=buildingParts(object.type,object.open);if(!parts)return null;
 const c=Math.round(Math.cos(object.rotation??0)),s=Math.round(Math.sin(object.rotation??0));
 return parts.map(([w,h,d,x,y,z])=>{
  const cx=object.x+x*c+z*s,cz=object.z-x*s+z*c;
  const width=Math.abs(w*c)+Math.abs(d*s),depth=Math.abs(w*s)+Math.abs(d*c);
  return {minX:cx-width/2,maxX:cx+width/2,minZ:cz-depth/2,maxZ:cz+depth/2,bottom:y-h/2,height:y+h/2};
 });
}

