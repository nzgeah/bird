// Shared solid panels for both rendering and collision; openings stay empty.
// Each panel: [width, height, depth, x, y, z].
export const WALL_TYPES=['wall','windowWall','arch','fence'];
export function buildingParts(type){
 if(type==='windowWall')return [[10,60,6,-25,30,0],[10,60,6,25,30,0],[40,16,6,0,8,0],[40,12,6,0,54,0]];
 if(type==='arch')return [[10,60,6,-25,30,0],[10,60,6,25,30,0],[40,12,6,0,54,0]];
 if(type==='fence')return [[6,28,6,-27,14,0],[6,28,6,27,14,0],[48,5,6,0,25.5,0],[48,5,6,0,10,0]];
 if(type==='roof')return Array.from({length:12},(_,i)=>{const x=-27.5+i*5;return [5,6,60,x,63+(30-Math.abs(x))*.6,0];});
 return null;
}
export function partBounds(object){
 const parts=buildingParts(object.type);if(!parts)return null;
 const c=Math.round(Math.cos(object.rotation??0)),s=Math.round(Math.sin(object.rotation??0));
 return parts.map(([w,h,d,x,y,z])=>{
  const cx=object.x+x*c+z*s,cz=object.z-x*s+z*c;
  const width=Math.abs(w*c)+Math.abs(d*s),depth=Math.abs(w*s)+Math.abs(d*c);
  return {minX:cx-width/2,maxX:cx+width/2,minZ:cz-depth/2,maxZ:cz+depth/2,bottom:y-h/2,height:y+h/2};
 });
}

