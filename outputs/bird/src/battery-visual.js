import * as THREE from '../vendor/three.module.js';
let template;
export function setBatteryTemplate(scene){template=scene;}
export function batteryMesh(){
 const root=new THREE.Group();
 if(!template)return root;
 const model=template.clone(true);
 // The exported display is a sample; replace it with the live instrument.
 model.traverse(o=>{if(/^(Digit|Charge_segment|Percent)/.test(o.name))o.visible=false;});
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(.65,.40),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
 screen.position.set(0,1.07,.514);model.add(screen);
 model.scale.setScalar(12);model.rotation.y=Math.PI;
 root.add(model);root.userData.batteryDisplay={canvas,texture,screen,last:''};
 updateBatteryDisplay(root,100,100,0);
 return root;
}
export function updateBatteryDisplay(root,charge,maxCharge,time){
 const d=root.userData.batteryDisplay;if(!d)return;
 const ratio=Math.max(0,Math.min(1,maxCharge>0?charge/maxCharge:0)),percent=Math.round(ratio*100);
 const blink=ratio<=.05&&Math.floor(time*3)%2===1;
 const key=percent+':'+blink;if(d.last===key)return;d.last=key;
 const c=d.canvas.getContext('2d'),color=ratio<=.05?'#ff5952':ratio<.2?'#ffcc59':'#8bffe0';
 c.fillStyle='#061b20';c.fillRect(0,0,512,320);c.globalAlpha=blink?.28:1;
 c.fillStyle=color;c.font='bold 24px monospace';c.fillText('RAFT POWER',28,38);
 c.font='bold 130px monospace';c.fillText(String(percent).padStart(3,' '),20,178);c.font='bold 48px monospace';c.fillText('%',376,171);
 for(let i=0;i<10;i++){c.fillStyle=i<Math.ceil(ratio*10)?color:'#173b3e';c.fillRect(28+i*46,215,36,52);}
 c.fillStyle=color;c.font='18px monospace';c.fillText(ratio<=.05?'LOW POWER':'BATTERY / DC',28,302);c.globalAlpha=1;d.texture.needsUpdate=true;
}
