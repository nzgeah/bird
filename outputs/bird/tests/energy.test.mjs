import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,tick} from '../src/model.js';
import {updateEnergy,updateRaftPower} from '../src/energy.js';
import {damageLevel,DamageVision} from '../src/damage-vision.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
test('full health has no damaged display, including alternative maximums',()=>{
 const g=createGame();assert.equal(g.player.hp,100);assert.equal(damageLevel(g.player.hp,g.player.maxHp),0);
 assert.equal(damageLevel(50,50),0);assert.equal(damageLevel(25,50),.5);
 const vision=Object.create(DamageVision.prototype);Object.assign(vision,{previous:100,shock:0,overlay:{},world:{style:{}}});
 vision.update(50,0,.016,true,50);assert.equal(vision.overlay.hidden,true);assert.equal(vision.shock,0);
});
test('full robot continuously consumes raft power and capacity is five robot batteries',()=>{
 const g=createGame();assert.equal(g.ship.power,500);assert.equal(g.ship.maxPower,500);
 updateEnergy(g,{},10);close(g.energy,100);close(g.ship.power,493);
});
test('charging draws exactly operating demand plus energy stored in the robot',()=>{
 const g=createGame();g.energy=20;updateEnergy(g,{},1);
 close(g.energy,26);close(g.ship.power,493.3);
 g.energy=99.9;g.ship.power=50;updateEnergy(g,{},1);close(g.energy,100);close(g.ship.power,49.2);
});
test('leaving the raft stops power transfer immediately and doubles space drain',()=>{
 const g=createGame();g.player.x=500;updateEnergy(g,{},10);
 close(g.energy,93);close(g.ship.power,500);
 updateEnergy(g,{x:1,sprint:true},10);close(g.energy,69.4);close(g.ship.power,500);
});
test('limited or missing raft battery cannot create energy',()=>{
 const g=createGame();g.energy=50;g.ship.power=.2;updateEnergy(g,{},1);
 close(g.energy,49.5);close(g.ship.power,0);
 g.ship.power=500;g.ship.battery.installed=false;updateEnergy(g,{},1);close(g.energy,48.8);
});
test('station powers robot directly and can rescue a depleted robot',()=>{
 const g=createGame();Object.assign(g.player,g.station);g.energy=0;g.energyDepleted=true;
 updateEnergy(g,{},1);close(g.energy,11.3);close(g.player.hp,100);close(g.ship.power,500);assert.equal(g.energyDepleted,false);
});
test('remote station does not charge raft just because robot visits it',()=>{
 const g=createGame();g.ship.power=50;Object.assign(g.player,g.station);updateRaftPower(g,1);close(g.ship.power,50);
});
test('solar generates without robot aboard and offsets idle robot operating demand',()=>{
 const g=createGame();g.ship.objects.push({type:'solar'});g.ship.power=50;
 updateRaftPower(g,1);updateEnergy(g,{},1);close(g.ship.power,50.2);
 g.player.x=500;updateRaftPower(g,1);close(g.ship.power,51.1);
});
test('zero robot charge only damages health when no external supply is available',()=>{
 const g=createGame();g.energy=0;g.ship.power=0;const hp=g.player.hp;
 updateEnergy(g,{},.5);close(g.player.hp,hp-8);assert.equal(g.energyDepleted,true);
 g.ship.power=10;updateEnergy(g,{},1);assert.ok(g.energy>0);close(g.player.hp,hp-8);
});
test('tick charges once, and zero health ends the game',()=>{
 const g=createGame();tick(g,{},.04);close(g.ship.power,500-.7*.04);
 g.player.x=500;g.energy=0;g.player.hp=.1;tick(g,{},.04);close(g.player.hp,0);assert.equal(g.over,true);
});
