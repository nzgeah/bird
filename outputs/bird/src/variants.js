export const SCRAP_VARIANTS=['01_torn_sheet','02_broken_beam','03_pipe_fragment','04_armor_panel','05_rotor_scrap','06_solar_fragment'];
export const ASTEROID_VARIANTS=['asteroid_01_round','asteroid_02_long','asteroid_03_flat','asteroid_04_large','asteroid_05_fragment','asteroid_06_irregular'];
export const ASTEROID_SIZES=[100,145,115,240,48,130];

// Fixed positions keep the starting deck and station approach clear.
export function createAsteroids(){
  return ASTEROID_VARIANTS.map((variant,i)=>({variant,x:[-430,620,-850,980,340,-620][i],y:[160,320,-220,-340,-120,520][i],z:[-610,-950,-1400,-1800,-510,350][i],size:ASTEROID_SIZES[i]}));
}
