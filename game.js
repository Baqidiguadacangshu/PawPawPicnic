import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// 全部场景与角色均为程序建模，无外部图片或模型。
const $ = s => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#faeee9');
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
$('#game').appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 13;
controls.maxDistance = 30;
controls.minPolarAngle = .35;
controls.maxPolarAngle = Math.PI / 2.15;
function view() { camera.position.set(13, 15, 18).multiplyScalar(innerWidth < 650 ? 1.35 : 1); controls.update(); }
view();
scene.add(new THREE.HemisphereLight('#fffbeb', '#b49cae', 2.6));
const sun = new THREE.DirectionalLight('#fff4dd', 4);
sun.position.set(-6, 16, 9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
sun.shadow.normalBias = .035; scene.add(sun);
const mats = new Map();
function mat(color) { if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: .78 })); return mats.get(color); }
function mesh(geo, color, parent, x=0, y=0, z=0) {
  const m = new THREE.Mesh(geo, mat(color)); m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent,color,x,y,z,w,h,d,r=.1) { return mesh(new RoundedBoxGeometry(w,h,d,2,r),color,parent,x,y,z); }
function ball(parent,color,x,y,z,sx,sy=sx,sz=sx) { const m=mesh(new THREE.SphereGeometry(1,20,14),color,parent,x,y,z); m.scale.set(sx,sy,sz); return m; }
function group(parent,x=0,y=0,z=0) { const g=new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g; }
const ground=mesh(new THREE.PlaneGeometry(200,200),'#faeee9',scene,0,-1.03,0); ground.rotation.x=-Math.PI/2;
box(scene,'#eaa8b8',0,-.48,0,11.4,.95,9.4,.25);
box(scene,'#bfdaa6',0,.02,0,10.7,.2,8.7,.18);
for(const x of [-5.5,5.5]) box(scene,'#f5bac8',x,.22,0,.32,.8,9.3);
for(const z of [-4.5,4.5]) box(scene,'#f5bac8',0,.22,z,11.3,.8,.32);
box(scene,'#fbe7bf',0,-.28,4.73,2.5,.42,.08);
for(const x of [-4.7,4.7]) for(const z of [-3.7,3.7]) ball(scene,'#d08b9e',x,-.92,z,.35,.16,.35);
// 铰链位于盒后沿，盒盖从水平向后打开。
const lid=group(scene,0,.68,-4.5);
box(lid,'#f2b4c5',0,0,4.5,11.35,.28,9.25,.22);
box(lid,'#ffecd8',0,-.17,4.5,10.55,.08,8.45,.12);
for(let i=0;i<11;i++) ball(lid,i%2?'#e8c4d7':'#d8deb2',-4.5+i*.9,-.24,1.1,.12,.035,.12);
// 盒盖内侧的立体花朵，开盖后面向玩家。
for(const [x,z] of [[-3,3.5],[3,3.5],[0,6.4]]) {
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(lid,'#efb6be',x+Math.cos(a)*.42,-.25,z+Math.sin(a)*.42,.3,.08,.3);}
  ball(lid,'#e8ca88',x,-.34,z,.22,.07,.22);
}
const obstacles=[];
function obstacle(x,z,r){obstacles.push({x,z,r});}
function tree(x,z,color,size=1){const g=group(scene,x,.12,z);mesh(new THREE.CylinderGeometry(.16,.23,1.6,9),'#c99b7c',g,0,.8,0);for(const [a,b,c,s] of [[0,2,0,.95],[-.48,1.7,.1,.62],[.5,1.8,.06,.65],[0,2.7,0,.65]])ball(g,color,a,b,c,s);g.scale.setScalar(size);obstacle(x,z,.52*size);}
tree(-4,-2.7,'#c6d4a2',1.1);tree(3.9,-2.9,'#e9b7c9');tree(-4,2.6,'#c1d7b6',.75);
function flower(x,z,color,size=1){const g=group(scene,x,.15,z);mesh(new THREE.CylinderGeometry(.025,.03,.38,5),'#80ab7e',g,0,.19,0);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,color,Math.cos(a)*.13,.42+Math.sin(a)*.13,0,.105,.1,.06);}ball(g,'#eaca81',0,.42,.05,.07);g.scale.setScalar(size);}
for(let i=0;i<42;i++){const side=i%2?-1:1;const x=side*(4.5+(i%3)*.16);const z=-3.8+(i/42)*7.6;flower(x,z,['#fff5df','#edafc1','#d4bcdf'][i%3],.7+(i%4)*.12);}
for(const [x,z] of [[-2.9,-3.1],[2.5,3.5],[-3.6,1],[3.8,1.9]]){flower(x,z,'#fff6dc',1.3);flower(x+.3,z+.18,'#edafc1');}
function mushroom(x,z,s){const g=group(scene,x,.12,z);mesh(new THREE.CylinderGeometry(.1,.14,.36,10),'#fff1d7',g,0,.18,0);ball(g,'#d998a8',0,.43,0,.32,.19,.32);for(let i=0;i<5;i++){const a=i*2.4;ball(g,'#fff0dd',Math.cos(a)*.21,.55,Math.sin(a)*.2,.045,.02,.045);}g.scale.setScalar(s);}
mushroom(-3.6,-1.5,1);mushroom(-3.2,-1.7,.7);mushroom(4,3.3,1.2);
// 格纹野餐布与甜点。
for(let i=0;i<6;i++)for(let j=0;j<5;j++)box(scene,(i+j)%2?'#f7d2cc':'#fff3df',.5+i*.42,.15,-2.4+j*.42,.42,.035,.42,.01);
const picnic=group(scene,1.6,.2,-1.5);
mesh(new THREE.CylinderGeometry(.48,.48,.065,32),'#fef4df',picnic,0,.04,0);
mesh(new THREE.CylinderGeometry(.3,.35,.32,20),'#d6a17c',picnic,0,.22,0);
ball(picnic,'#fff5e1',0,.4,0,.32,.12,.32);ball(picnic,'#e8899a',0,.54,0,.1);
box(picnic,'#d5a77f',.75,.25,.2,.6,.5,.5);
const handle=mesh(new THREE.TorusGeometry(.23,.045,8,20,Math.PI),'#b48666',picnic,.75,.5,.2);
box(picnic,'#eeb5bd',-.65,.18,.3,.28,.35,.28);
obstacle(1.6,-1.5,.5);obstacle(2.35,-1.3,.42);
for(let i=0;i<6;i++)ball(scene,'#e9e1c9',-1.1+Math.sin(i)*.25,.15,3.6-i*.55,.28,.035,.18);
for(let i=0;i<7;i++){box(scene,'#fff0d7',-2.8+i*.7,.48,-3.8,.13,.75,.13);}
box(scene,'#fff0d7',-.7,.64,-3.8,4.4,.11,.1);box(scene,'#fff0d7',-.7,.33,-3.8,4.4,.11,.1);
// 大头、短腿、垂耳的小狗，面向本地 +Z。
const dog=group(scene,-1,.15,2);
ball(dog,'#f5dfb8',0,.57,0,.43,.48,.58);
const legs=[];for(const x of [-.28,.28])for(const z of [-.3,.3])legs.push(ball(dog,'#fff0d2',x,.23,z,.17,.23,.19));
const head=group(dog,0,1.06,.3);
ball(head,'#fff0d2',0,.12,0,.61,.57,.5);
const ears=[];for(const x of [-.55,.55]){const e=ball(head,'#bd9479',x,.02,-.02,.22,.48,.24);e.rotation.z=x>0?.2:-.2;ears.push(e);}
ball(head,'#fff8e7',0,-.08,.44,.34,.23,.18);
for(const x of [-.22,.22]){ball(head,'#493d3e',x,.2,.445,.067,.085,.045);ball(head,'#ffffff',x-.017,.226,.48,.019);ball(head,'#edb3b4',x*1.65,-.035,.39,.1,.055,.04);}
ball(head,'#9a6570',0,.005,.61,.09,.065,.05);ball(head,'#eeb0ad',0,-.2,.565,.055,.075,.025);
const scarf=mesh(new THREE.TorusGeometry(.32,.085,8,24),'#cf8d9e',dog,0,.82,.14);scarf.rotation.x=Math.PI/2;
box(dog,'#cf8d9e',.2,.65,.48,.16,.32,.09);
const tail=group(dog,0,.7,-.49);const tailMesh=ball(tail,'#bd9479',0,.15,-.13,.13,.3,.13);tailMesh.rotation.x=-.65;
// 草莓使用旋转曲面：圆润肩部、收尖底端，独立叶片及表面种子。
function strawberry(parent,x,z){const g=group(parent,x,.55,z);const points=[];for(let i=0;i<=20;i++){const t=i/20;points.push(new THREE.Vector2(.37*Math.pow(Math.sin(Math.PI*t),.8)*(.45+.55*t),-.33+t*.66));}mesh(new THREE.LatheGeometry(points,24),'#e88397',g);for(let row=1;row<5;row++){const t=row/5,r=.37*Math.pow(Math.sin(Math.PI*t),.8)*(.45+.55*t);for(let j=0;j<7;j++){const a=j*Math.PI*2/7+row*.45;const seed=ball(g,'#ffdfab',Math.sin(a)*(r+.006),-.33+t*.66,Math.cos(a)*(r+.006),.018,.032,.012);seed.rotation.y=a;}}for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=ball(g,'#80ab77',Math.sin(a)*.13,.32,Math.cos(a)*.13,.075,.035,.2);leaf.rotation.y=a;}return g;}
const berries=[[-3,2],[-2,-1.3],[.2,2.9],[3.8,.5],[1.8,-3.1],[3.4,2.8]].map(([x,z],i)=>({mesh:strawberry(scene,x,z),x,z,phase:i,taken:false}));
const served=group(scene);served.visible=false;for(let i=0;i<6;i++){const b=strawberry(served,.7+(i%3)*.32,-.8+Math.floor(i/3)*.3);b.scale.setScalar(.45);b.position.y=.36;}
const butterflies=[];for(let i=0;i<4;i++){const g=group(scene);const wings=[ball(g,'#e9c0dc',-.13,0,0,.18,.035,.23),ball(g,'#fff0bb',.13,0,0,.18,.035,.23)];ball(g,'#ad8b93',0,0,0,.035,.05,.2);butterflies.push({g,wings,phase:i*1.8});}
const confetti=group(scene);confetti.visible=false;for(let i=0;i<70;i++){const m=mesh(new THREE.BoxGeometry(.08,.16,.025),['#df9eb5','#d9c179','#aac8a0'][i%3],confetti);m.userData={x:Math.sin(i*12.3)*4,z:Math.cos(i*7.4)*3,speed:.7+(i%7)*.15};}
let count=0,opening=0,won=false,nearest=null,partyTime=0;
const keys=new Set();
function reset(){count=0;won=false;nearest=null;partyTime=0;opening=0;keys.clear();dog.position.set(-1,.15,2);dog.rotation.y=0;berries.forEach(b=>{b.taken=false;b.mesh.visible=true;});served.visible=false;confetti.visible=false;$('#finish').hidden=true;$('#score').textContent='🍓 0 / 6';$('#progress').value=0;view();}
function collect(){if(won||opening<2.3||!nearest)return;nearest.taken=true;nearest.mesh.visible=false;count++;$('#score').textContent=`🍓 ${count} / 6`;$('#progress').value=count;nearest=null;if(count===berries.length){won=true;partyTime=0;served.visible=true;confetti.visible=true;keys.clear();$('#hint').textContent='野餐准备好了！';}}
const moveCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
addEventListener('keydown',e=>{if(moveCodes.includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='KeyE'&&!e.repeat)collect();});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>keys.clear());
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));}
$('#collect').onclick=collect;$('#replay').onclick=reset;$('#again').onclick=()=>{reset();$('#replay').focus();};$('#lidReplay').onclick=()=>{if(!won){opening=0;keys.clear();}};
$('#finish').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();$('#again').focus();}});
const clock=new THREE.Clock();let elapsed=0;const forward=new THREE.Vector3(),right=new THREE.Vector3(),motion=new THREE.Vector3();
function blocked(x,z){return obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.32);}
function tick(){requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;opening+=dt;const p=THREE.MathUtils.clamp(opening/2.3,0,1);lid.rotation.x=-1.95*(1-Math.pow(1-p,3));
  if(!won&&p===1){camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();const vertical=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));const horizontal=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));motion.copy(forward).multiplyScalar(vertical).addScaledVector(right,horizontal);if(motion.lengthSq()>0){motion.normalize();const nx=THREE.MathUtils.clamp(dog.position.x+motion.x*dt*2.65,-4.85,4.85);if(!blocked(nx,dog.position.z))dog.position.x=nx;const nz=THREE.MathUtils.clamp(dog.position.z+motion.z*dt*2.65,-3.85,3.85);if(!blocked(dog.position.x,nz))dog.position.z=nz;const angle=Math.atan2(motion.x,motion.z);dog.rotation.y+=Math.atan2(Math.sin(angle-dog.rotation.y),Math.cos(angle-dog.rotation.y))*Math.min(dt*12,1);dog.position.y=.15+Math.abs(Math.sin(elapsed*12))*.055;legs.forEach((l,i)=>l.rotation.x=Math.sin(elapsed*12+i*Math.PI)*.3);}else{dog.position.y=.15;legs.forEach(l=>l.rotation.x=0);}
    nearest=null;let distance=1.05;for(const b of berries){const d=Math.hypot(dog.position.x-b.x,dog.position.z-b.z);if(!b.taken&&d<distance){nearest=b;distance=d;}}
    $('#hint').textContent=nearest?'按 E / 点击收集，把草莓放进野餐篮 🍓':'带小狗找齐 6 颗草莓，准备今天的野餐';
  }else if(!won)$('#hint').textContent='正在打开你的小花园…';
  tail.rotation.z=Math.sin(elapsed*9)*.3;ears.forEach((e,i)=>e.rotation.x=Math.sin(elapsed*4+i)*.05);
  berries.forEach(b=>{b.mesh.position.y=.55+Math.sin(elapsed*2+b.phase)*.06;b.mesh.rotation.y=elapsed*.35;b.mesh.scale.setScalar(b===nearest?1.16:1);});
  butterflies.forEach(({g,wings,phase})=>{g.position.set(Math.sin(elapsed*.35+phase)*3,2+Math.sin(elapsed+phase)*.3,Math.cos(elapsed*.3+phase)*2);wings[0].rotation.z=Math.sin(elapsed*12+phase)*.7;wings[1].rotation.z=-wings[0].rotation.z;});
  if(won){partyTime+=dt;dog.position.y=.15+Math.abs(Math.sin(partyTime*6))*.25;confetti.children.forEach((m,i)=>{const d=m.userData;m.position.set(d.x+Math.sin(elapsed+i)*.2,5-((partyTime*d.speed+i*.07)%5),d.z);m.rotation.set(elapsed+i,elapsed*2,elapsed*.7);});if(partyTime>1.8&&$('#finish').hidden){$('#finish').hidden=false;$('#again').focus();}}
  controls.update();renderer.render(scene,camera);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
reset();$('#loading').hidden=true;tick();
