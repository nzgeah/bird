import fs from 'node:fs';
let s=fs.readFileSync(new URL('../equipment/index.html',import.meta.url),'utf8');
s=s.replaceAll('cargoPod','polymer').replaceAll('antenna','circuit').replaceAll('engine','cell').replace('ORBITAL EQUIPMENT','SALVAGED RESOURCES').replace('CARGO MODULE / SCANNER / MANEUVERING ENGINE','POLYMER / ELECTRONICS / ENERGY CELL').replace('Cargo GLB','Polymer GLB').replace('Scanner GLB','Circuit GLB').replace('Engine GLB','Cell GLB');
s=s.replace("[['polymer',-2],['circuit',0],['cell',2]]","[['polymer',-1.4],['circuit',0],['cell',1.4]]").replace('g.scene.position.x=x;','g.scene.position.set(x,.65,0);if(type===\'circuit\')g.scene.rotation.x=.48;').replace('camera.position.set(3.0,3.1,7.6);camera.lookAt(0,1,0)','camera.position.set(1.5,3.2,5.2);camera.lookAt(0,.60,0)');
fs.writeFileSync(new URL('../resource-models/index.html',import.meta.url),s);
