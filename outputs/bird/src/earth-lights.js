import * as THREE from '../vendor/three.module.js';

// Stylized settlement clusters at geographic locations, not satellite data.
const cities=[
 [40.71,-74.01,1.4],[42.36,-71.06,.65],[39.95,-75.17,.85],[38.91,-77.04,.9],
 [40.44,-79.99,.55],[41.88,-87.63,1.2],[42.33,-83.05,.8],[41.5,-81.69,.55],
 [43.65,-79.38,.9],[45.5,-73.57,.7],[45.42,-75.7,.4],[46.81,-71.21,.35],
 [33.75,-84.39,.85],[35.23,-80.84,.6],[35.78,-78.64,.5],[36.85,-75.98,.4],
 [30.33,-81.66,.4],[28.54,-81.38,.55],[27.95,-82.46,.5],[25.76,-80.19,.7],
 [32.78,-96.8,1],[29.76,-95.37,1],[29.42,-98.49,.5],[30.27,-97.74,.5],
 [38.63,-90.2,.65],[39.1,-94.58,.5],[44.98,-93.27,.6],[39.77,-86.16,.5],
 [36.16,-86.78,.5],[35.15,-90.05,.4],[29.95,-90.07,.5],[39.74,-104.99,.7],
 [34.05,-118.24,1.2],[37.77,-122.42,.85],[47.61,-122.33,.7],[49.28,-123.12,.6],
 [33.45,-112.07,.6],[36.17,-115.14,.45],[32.72,-117.16,.65],[40.76,-111.89,.45],
 [19.43,-99.13,1.1],[25.69,-100.32,.65],[20.67,-103.35,.65],[23.11,-82.37,.45]
];
export function earthNightTexture(anisotropy=4){
 const canvas=document.createElement('canvas');canvas.width=4096;canvas.height=2048;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,4096,2048);
 let seed=713;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const [lat,lon,size] of cities){
  const x=(lon+180)/360*4096,y=(90-lat)/180*2048,r=4*size;
  for(let i=0;i<65*size;i++){
   const a=random()*Math.PI*2,d=Math.pow(random(),1.6)*r;
   ctx.fillStyle=`rgba(255,${170+Math.floor(random()*65)},110,${.25+random()*.65})`;
   ctx.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d*.65,.3+random()*.3,.3+random()*.3);
  }
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=anisotropy;
 return texture;
}
