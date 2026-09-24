export const SCRAP_VARIANTS=['01_torn_sheet','02_broken_beam','03_pipe_fragment','04_armor_panel','05_rotor_scrap','06_solar_fragment'];
export const ASTEROID_VARIANTS=['asteroid_01_round','asteroid_02_long','asteroid_03_flat','asteroid_04_large','asteroid_05_fragment','asteroid_06_irregular'];
export const ASTEROID_SIZES=[100,145,115,240,48,130];

// Fixed positions keep the starting deck and station approach clear.
export function createAsteroids(){
  const asteroids=ASTEROID_VARIANTS.map((variant,i)=>({variant,x:[-430,620,-850,980,340,-620][i],y:[160,320,-220,-340,-120,520][i],z:[-610,-950,-1400,-1800,-510,350][i],size:ASTEROID_SIZES[i]}));
  // Seeded world positions: the field never follows or respawns around the camera.
  let seed=4917;
  const random=()=>((seed=seed*16807%2147483647)/2147483647);
  for(let layer=0;layer<3;layer++)for(let i=0;i<32;i++){
    const index=Math.floor(random()*ASTEROID_VARIANTS.length);
    const angle=random()*Math.PI*2,radius=[2400,6500,13000][layer]+random()*[3500,5500,5500][layer];
    const size=(.65+random()*1.8)*ASTEROID_SIZES[index]*[1,2,3.5][layer];
    asteroids.push({variant:ASTEROID_VARIANTS[index],x:Math.cos(angle)*radius,
      y:(random()-.5)*radius*.65+350,z:Math.sin(angle)*radius,size});
  }
  return asteroids.map(a=>{
    const shape=ASTEROID_VARIANTS.indexOf(a.variant);
    const speed=12*Math.sqrt(100/a.size),angle=random()*Math.PI*2;
    const axes=[[.3,1,.2],[.2,.3,1],[0,1,.1],[.5,1,.3],[1,.4,.6],[.7,.5,1]];
    const axis=axes[shape],length=Math.hypot(...axis);
    return {...a,vx:Math.cos(angle)*speed,vy:(random()-.5)*speed*.4,vz:Math.sin(angle)*speed,
      spinAxis:axis.map(v=>v/length),spinRate:(.07+random()*.05)*100/a.size*(random()<.5?-1:1),spinAngle:random()*Math.PI*2};
  });
}
