import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Paw Paw Picnic 5.4 — habitat-specific harvesting, based on 5.3.
// 全部模型、格纹、文字均由程序创建；不加载参考图片。
const $ = s => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#faeee9');
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 650 ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
$('#game').appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.1, -.5);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 13;
controls.maxDistance = 30;
controls.minPolarAngle = .35;
controls.maxPolarAngle = Math.PI / 2.15;
function view() { camera.position.set(8.6, 14.8, 20.8).multiplyScalar(innerWidth < 650 ? 1.35 : 1); controls.update(); }
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

// Continuous rounded outlines, including matching inner holes: no cylinder corner seams.
function outline(w,h,r){
  const p=new THREE.Shape(),x=-w/2,y=-h/2;
  p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);
  p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);
  p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);return p;
}
function slab(parent,color,w,d,r,bottom,height,z=0){
  const geo=new THREE.ExtrudeGeometry(outline(w,d,r),{depth:height,bevelEnabled:false,curveSegments:16,steps:1});
  geo.rotateX(-Math.PI/2);return mesh(geo,color,parent,0,bottom,z);
}
function rim(parent,color,w,d,r,t,bottom,height,z=0){
  const shape=outline(w,d,r),inner=outline(w-2*t,d-2*t,r-t);
  shape.holes.push(new THREE.Path(inner.getPoints(96).reverse()));
  const geo=new THREE.ExtrudeGeometry(shape,{depth:height,steps:1,curveSegments:16,bevelEnabled:true,bevelSegments:3,bevelSize:.045,bevelThickness:.045});
  geo.rotateX(-Math.PI/2);return mesh(geo,color,parent,0,bottom,z);
}
function ink(text,w=1024,h=512,bg='#fff5e8',color='#a66d62'){
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#ecc1b7';ctx.lineWidth=12;ctx.strokeRect(22,22,w-44,h-44);
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';const lines=text.split('\n');
  ctx.font=`bold ${Math.min(w*.13,h/(lines.length+1)*.7)}px Georgia, serif`;
  lines.forEach((s,i)=>ctx.fillText(s,w/2,h*(i+1)/(lines.length+1)));
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:tex,roughness:1});
}
function checkMaterial(a,b,c,n=16){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){ctx.fillStyle=i%2&&j%2?c:(i+j)%2?b:a;ctx.fillRect(i*512/n,j*512/n,512/n,512/n);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return new THREE.MeshStandardMaterial({map:texture,roughness:.95});
}
function panel(parent,x,y,z,w,h,material){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(x,y,z);parent.add(m);return m;}
function petFace(parent,x,y,s=1,glasses=false){
 const g=group(parent,x,y,.1);g.scale.setScalar(s);
 ball(g,'#fff1dc',0,0,0,.65,.60,.16);
 for(const side of [-1,1]){ball(g,'#caa17f',side*.48,.20,.08,.21,.37,.09);ball(g,'#51423b',side*.25,.01,.19,.075,.09,.04);ball(g,'#efb6ad',side*.36,-.23,.16,.12,.06,.03);}
 ball(g,'#fff7e6',0,-.24,.16,.30,.22,.06);ball(g,'#8c6254',0,-.18,.24,.065,.047,.025);
 for(const side of [-1,1]){const m=mesh(new THREE.TorusGeometry(.085,.018,6,12,Math.PI),'#8c6254',g,side*.075,-.25,.23);m.rotation.z=Math.PI;}
 if(glasses){for(const side of [-1,1]){const sh=outline(.61,.46,.09);sh.holes.push(new THREE.Path(outline(.47,.32,.055).getPoints(32).reverse()));mesh(new THREE.ExtrudeGeometry(sh,{depth:.055,bevelEnabled:false}),'#ce5b61',g,side*.32,.02,.25);}box(g,'#ce5b61',0,.10,.28,.16,.055,.06,.02);}
 return g;
}
function bunny(parent,x,y,s=1){const g=group(parent,x,y,.10);g.scale.setScalar(s);ball(g,'#fff0de',0,0,0,.40,.34,.12);for(const side of [-1,1]){ball(g,'#fff0de',side*.18,.39,0,.14,.32,.10);ball(g,'#efc0b6',side*.18,.42,.09,.065,.21,.035);ball(g,'#926b59',side*.13,-.03,.13,.035,.048,.025);}ball(g,'#d69194',0,-.13,.14,.05,.035,.02);return g;}
function stickerFlower(parent,x,y,s,color='#ffe3a0'){
 const g=group(parent,x,y,.1);g.scale.setScalar(s);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,color,Math.sin(a)*.24,Math.cos(a)*.24,0,.18,.19,.065);}ball(g,'#e9b964',0,0,.08,.13,.13,.045);return g;
}
function bow(parent,x,y,s=1){const g=group(parent,x,y,.25);g.scale.setScalar(s);for(const side of [-1,1]){
 const loop=ball(g,'#eaa0af',side*.45,.08,0,.50,.31,.13);loop.rotation.z=side*.35;
 const ribbon=box(g,'#e6a0af',side*.28,-.43,0,.34,.75,.12,.07);ribbon.rotation.z=side*-.35;
 for(let j=0;j<3;j++){const crease=box(g,'#f4b2bc',side*.46,.04+(j-1)*.13,.13,.55,.024,.026,.01);crease.rotation.z=side*(j-1)*.22;}}
 ball(g,'#eeadb8',0,0,.13,.21,.22,.14);return g;
}
const ground=mesh(new THREE.PlaneGeometry(200,200),'#f5e8dc',scene,0,-2.05,0);ground.rotation.x=-Math.PI/2;
const cloth=panel(scene,0,-2.01,0,30,26,checkMaterial('#fff0de','#f1cbd0','#e5b6c1',32));cloth.rotation.x=-Math.PI/2;
slab(scene,'#e4a0b4',11.7,9.7,1.30,-1.91,.25);
rim(scene,'#efafbe',11.7,9.7,1.30,.36,-1.66,2.22);
rim(scene,'#ffd7db',11.73,9.73,1.32,.36,.51,.15);
rim(scene,'#ffe6cb',10.98,8.98,.95,.09,-.08,.65);
slab(scene,'#bfd68e',10.79,8.79,.84,-.13,.24);
// A lightly mottled meadow, with no texture images.
for(let i=0;i<180;i++){const x=Math.sin(i*79.7)*4.9,z=Math.cos(i*37.3)*3.9;const patch=mesh(new THREE.CircleGeometry(.06+(i%5)*.04,6),i%3?'#cbdc9a':'#afc87f',scene,x,.115,z);patch.rotation.x=-Math.PI/2;}
const front=group(scene,0,-.75,4.88);
box(front,'#f4d58f',0,.20,.05,2.70,1.24,.29,.23);box(front,'#ffe7a3',0,.61,.15,2.62,.35,.29,.13);
const strap=panel(front,0,-.65,.02,1.65,1.35,checkMaterial('#fff1dc','#f1c9bc','#e9b4a9',8));
bunny(front,0,-.13,1.20);stickerFlower(front,1.70,-.75,.95,'#fff0d5');
for(const [x,y,s,c] of [[-3.7,-.18,1.1,'#becd96'],[-2.5,.12,.70,'#ffe09c'],[3.25,-.35,.95,'#f5d7ae'],[4.4,-.2,.55,'#f2c1bb']])stickerFlower(front,x,y,s,c);
for(const x of [-4.65,4.65])for(const z of [-3.55,3.55])ball(scene,'#c68b95',x,-1.91,z,.35,.13,.35);
const lid=group(scene,0,.84,-4.5);
slab(lid,'#ecadbd',11.65,9.58,1.3,.10,.25,4.5);
rim(lid,'#f2b6c6',11.65,9.58,1.3,.40,-.45,.55,4.5);
rim(lid,'#ffd5d8',11.53,9.46,1.25,.13,-.51,.09,4.5);
// Local XY decoration plane faces the inside (-Y) of the lid, +Y points toward its top.
const decor=group(lid,0,.075,4.5);decor.rotation.x=Math.PI/2;
const lining=new THREE.Mesh(new THREE.ShapeGeometry(outline(10.69,8.62,.87)),checkMaterial('#d5d4e9','#bfc1dc','#a7afd1',18));
// ShapeGeometry's UVs are world coordinates; normalize for the checked fabric.
const uv=lining.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+5.345)/10.69,(uv.getY(i)+4.31)/8.62);decor.add(lining);
const photo=group(decor,-2.25,.15,.15);photo.rotation.z=.13;
box(photo,'#fff0d8',0,0,0,2.80,2.95,.14,.08);box(photo,'#c7b8b8',0,.10,.10,2.38,2.45,.07,.04);petFace(photo,0,.05,1.55,true);
const note=group(decor,2.85,.12,.19);note.rotation.z=-.16;
box(note,'#efc0bd',0,0,0,2.75,3.50,.12,.08);panel(note,0,0,.08,2.49,3.22,ink('Good\nFood\nGood Friends\nGood Day.\n~ ♥',768,1024));bunny(note,1.15,1.25,.82);
bow(decor,-3.25,-1.50,1.1);bow(decor,1.15,2.70,1.05);
for(const [x,y,s,c] of [[-4.25,2.8,.85,'#fff0c1'],[-3.45,2.2,.7,'#f6d49c'],[-4.4,1.7,.7,'#ffe7a7'],[.7,-.8,.9,'#f7da9e'],[1.35,-1.3,.7,'#bfcea4'],[4.25,-1.2,.8,'#f7d3a0'],[3.8,-2.0,.65,'#fff1d4']])stickerFlower(decor,x,y,s,c);
// Padded bunny applique at the center and a small gingham ribbon below the card.
bunny(decor,.35,.45,1.15);const tape=panel(decor,2.6,-1.95,.40,2.60,.45,checkMaterial('#fff2e8','#efb9c3','#df9daf',12));tape.rotation.z=-.10;
for(const x of [-3.6,3.6]){const hinge=mesh(new THREE.CylinderGeometry(.12,.12,.66,16),'#ddb477',scene,x,.73,-4.43);hinge.rotation.z=Math.PI/2;}
const boxShell=new Set(scene.children);
const obstacles=[];
function obstacle(x,z,r){obstacles.push({x,z,r});}

const sceneryTrees=[];
function tree(x,z,color,size=1){const g=group(scene,x,.12,z);mesh(new THREE.CylinderGeometry(.18,.29,1.6,7),'#c69970',g,0,.8,0);const crown=mesh(new THREE.IcosahedronGeometry(1.02,1),color,g,0,2.0,0);crown.scale.set(1,1.15,.92);g.scale.setScalar(size);sceneryTrees.push({g,size});obstacle(x,z,.55*size);return g;}
const leftTree=tree(-4,-2.75,'#9fc889',1.05);tree(3.95,-2.8,'#9dc68f',1.12);tree(-4.2,2.7,'#b9ce83',.65);
function chick(parent,x,y,z){ball(parent,'#ffe29a',x,y,z,.23,.20,.20);ball(parent,'#ffe9a8',x,y+.17,z+.1,.16);ball(parent,'#e7a855',x,y+.15,z+.25,.07,.035,.05);for(const dx of [-.07,.07])ball(parent,'#6e5b41',x+dx,y+.21,z+.23,.018);}
chick(leftTree,0,3.12,0);
const touchFlowers=[];
function flower(x,z,color,size=1){const g=group(scene,x,.15,z);mesh(new THREE.CylinderGeometry(.025,.03,.38,5),'#80ab7e',g,0,.19,0);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,color,Math.cos(a)*.13,.42+Math.sin(a)*.13,0,.105,.1,.06);}ball(g,'#eaca81',0,.42,.05,.07);g.scale.setScalar(size);touchFlowers.push({g,shake:0});return g;}
for(let i=0;i<42;i++){const side=i%2?-1:1;const x=side*(4.5+(i%3)*.16);const z=-3.8+(i/42)*7.6;flower(x,z,['#fff5df','#edafc1','#d4bcdf'][i%3],.7+(i%4)*.12);}
for(const [x,z] of [[-2.9,-3.1],[2.5,3.5],[-3.6,1],[3.8,1.9]]){flower(x,z,'#fff6dc',1.3);flower(x+.3,z+.18,'#edafc1');}
function mushroom(x,z,s){const g=group(scene,x,.12,z);mesh(new THREE.CylinderGeometry(.1,.14,.36,10),'#fff1d7',g,0,.18,0);ball(g,'#d998a8',0,.43,0,.32,.19,.32);for(let i=0;i<5;i++){const a=i*2.4;ball(g,'#fff0dd',Math.cos(a)*.21,.55,Math.sin(a)*.2,.045,.02,.045);}g.scale.setScalar(s);}
mushroom(-3.6,-1.5,1);mushroom(-3.2,-1.7,.7);mushroom(4,3.3,1.2);
// 两侧边缘的小花圃：全部避开中央的收集路线。
for(let i=0;i<54;i++){
  const x=(i%2?-1:1)*(4.03+(i%4)*.19);
  const z=-3.35+((i*17)%53)/53*6.7;
  const col=['#fff9e6','#f1b7d0','#d9c8f2','#f6d6a2'][i%4];
  if(i%7===0)mushroom(x,z,.43+(i%3)*.1);
  else flower(x,z,col,.42+(i%5)*.095);
}
// 低矮的糖果色灌木与彩色石子。
for(let i=0;i<22;i++){
  const z=-3.5+(i%11)*.67, x=(i<11?-1:1)*4.1;
  ball(scene,i%3===0?'#e9c5d9':'#bcd7ac',x,.24,z,.22,.20,.23);
}
for(let i=0;i<34;i++){
  const x=-3.6+((i*13)%37)/37*7.2;
  const z=-3.25+((i*19)%41)/41*6.5;
  // 只在边缘摆放石子，避免遮住草莓和小狗。
  if(Math.abs(x)>3.25)ball(scene,i%2?'#fff0dc':'#eac9d7',x,.15,z,.10,.035,.075);
}

// Round scalloped gingham rug, low wooden picnic table and tea service.
const rugMat=checkMaterial('#fff3e4','#f4c2bf','#e9a6ad',14);
const rug=new THREE.Mesh(new THREE.CircleGeometry(1.62,64),rugMat);rug.rotation.x=-Math.PI/2;rug.position.set(1.35,.135,-1.35);rug.receiveShadow=true;scene.add(rug);
for(let i=0;i<24;i++){const a=i*Math.PI/12;ball(scene,i%2?'#f6c5c4':'#fff0de',1.35+Math.cos(a)*1.5,.145,-1.35+Math.sin(a)*1.5,.23,.03,.23);}
const picnic=group(scene,1.35,.17,-1.35);
for(const x of [-.65,.65])for(const z of [-.5,.5])box(picnic,'#c99165',x,.30,z,.17,.60,.17,.04);
mesh(new THREE.CylinderGeometry(1.04,1.06,.17,48),'#e6b77e',picnic,0,.65,0);
for(let i=-2;i<=2;i++)box(picnic,'#d9aa74',i*.32,.739,0,.012,.008,Math.sqrt(1-(i*.32)**2)*1.92,.002);
const cake=group(picnic,0,.75,-.18);
mesh(new THREE.CylinderGeometry(.53,.53,.055,36),'#fff7e5',cake,0,.04,0);
for(let i=0;i<3;i++){mesh(new THREE.CylinderGeometry(.40-i*.025,.42-i*.025,.15,32),'#eec57f',cake,0,.16+i*.17,0);mesh(new THREE.CylinderGeometry(.41-i*.025,.41-i*.025,.065,32),'#fff6df',cake,0,.245+i*.17,0);}
ball(cake,'#fff9ef',0,.64,0,.30,.095,.29);
const topper=strawberry(cake,0,0);topper.scale.setScalar(.45);topper.position.y=.81;
for(const [x,z] of [[-.55,.43],[.22,.57]]){
 mesh(new THREE.CylinderGeometry(.23,.23,.035,24),'#fff4df',picnic,x,.76,z);
 mesh(new THREE.CylinderGeometry(.14,.105,.19,24),'#fff1da',picnic,x,.87,z);
 mesh(new THREE.CylinderGeometry(.117,.117,.008,24),'#b98765',picnic,x,.968,z);
 const h=mesh(new THREE.TorusGeometry(.08,.025,8,18),'#fff1da',picnic,x+.15,.88,z);h.rotation.y=Math.PI/2;
}
obstacle(1.35,-1.35,1.04);
// Bench at back left.
const bench=group(scene,-2.65,.16,-2.9);bench.rotation.y=.12;
for(const x of [-.66,.66])for(const z of [-.24,.24])box(bench,'#be9065',x,.26,z,.13,.52,.13,.03);
for(let i=0;i<3;i++)box(bench,'#e3b581',0,.55,-.26+i*.24,1.9,.11,.20,.035);
for(const x of [-.75,.75])box(bench,'#c99b70',x,.88,-.35,.12,1.05,.12,.03);
for(let i=0;i<2;i++)box(bench,'#e5b887',0,.91+i*.26,-.36,1.95,.18,.11,.025);
const cushion=panel(bench,0,.62,.03,1.3,.48,checkMaterial('#fff1de','#f0bdbe','#df9ca8',10));cushion.rotation.x=-Math.PI/2;obstacle(-2.65,-2.9,.70);
// Pink mailbox and paw sign.
const mail=group(scene,-4,.15,-.45);box(mail,'#c49a72',0,.30,0,.16,.60,.16,.03);box(mail,'#efb5bd',0,.89,0,.86,1.03,.68,.22);box(mail,'#ffe4cd',0,.87,.36,.65,.76,.06,.15);box(mail,'#b78b76',0,1.00,.405,.38,.055,.03,.015);stickerFlower(mail,0,.72,.42);obstacle(-4,-.45,.40);
const sign=group(scene,4.25,.14,-1.0);box(sign,'#c5996b',0,.62,0,.16,1.24,.16,.02);box(sign,'#deb18a',0,1.36,0,.85,.77,.14,.12);petFace(sign,0,1.37,.48);box(sign,'#dda97f',0,.83,.01,.85,.3,.15,.05);panel(sign,0,.83,.10,.68,.25,ink('← →',512,192,'#e4b48a','#ffe1d3'));obstacle(4.25,-1,.4);
// Fence clusters, keeping entry gaps and the central collecting route clear.
function fence(x,z,n,angle=0){const g=group(scene,x,.15,z);g.rotation.y=angle;for(let i=0;i<n;i++){box(g,'#fff2d4',i*.38,.40,0,.16,.80,.14,.04);const cap=mesh(new THREE.ConeGeometry(.125,.16,4),'#fff2d4',g,i*.38,.87,0);cap.rotation.y=Math.PI/4;}for(const y of [.25,.58])box(g,'#f2dfb8',(n-1)*.19,y,-.04,(n-1)*.38+.15,.08,.10,.025);}
fence(-1.8,-3.8,5);fence(-3.65,1.15,3,Math.PI/2);fence(-2.8,3.65,4);fence(2.15,3.65,4);fence(4.65,.5,4,Math.PI/2);
for(let i=0;i<9;i++){const z=3.65-i*.65,x=.30+Math.sin(i*.9)*.65;const stone=mesh(new THREE.CylinderGeometry(.31,.34,.055,7),'#eed5b7',scene,x,.15,z);stone.scale.z=.72;stone.rotation.y=i*.7;}
for(const [x,z,s] of [[4,1.8,.38],[4.6,2.3,.24],[-4.8,3,.23]]){mesh(new THREE.CylinderGeometry(s,s*1.08,.65,9),'#ce9d78',scene,x,.43,z);mesh(new THREE.CylinderGeometry(s*.87,s*.87,.015,16),'#e5b993',scene,x,.765,z);obstacle(x,z,s);}
const basket=group(scene,3.55,.16,3.0);box(basket,'#dbab78',0,.32,0,1.25,.65,.78,.09);box(basket,'#ebc28e',0,.67,0,1.40,.12,.91,.05);const napkin=panel(basket,0,.74,0,1.13,.69,checkMaterial('#fff1dd','#f0c5c2','#e7a9af',8));napkin.rotation.x=-Math.PI/2;obstacle(3.55,3,.65);
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
// 小狗的奶油眉毛、额头毛、爪垫和胸前小铃铛。
for(const x of [-.23,.23])ball(head,'#fff9ed',x,.38,.39,.13,.055,.065);
ball(head,'#fff9e7',0,.55,.02,.21,.13,.16);
ball(dog,'#fff9e8',0,.47,.49,.29,.28,.13);
ball(dog,'#f6d99d',.21,.60,.56,.105,.105,.09);
for(const x of [-.28,.28])ball(dog,'#f5c5c7',x,.10,.47,.095,.035,.07);
const tail=group(dog,0,.7,-.49);const tailMesh=ball(tail,'#bd9479',0,.15,-.13,.13,.3,.13);tailMesh.rotation.x=-.65;
// 草莓使用旋转曲面：圆润肩部、收尖底端，独立叶片及表面种子。
function strawberry(parent,x,z){const g=group(parent,x,.55,z);const points=[];for(let i=0;i<=20;i++){const t=i/20;points.push(new THREE.Vector2(.37*Math.pow(Math.sin(Math.PI*t),.8)*(.45+.55*t),-.33+t*.66));}mesh(new THREE.LatheGeometry(points,24),'#e87779',g);for(let row=1;row<5;row++){const t=row/5,r=.37*Math.pow(Math.sin(Math.PI*t),.8)*(.45+.55*t);for(let j=0;j<7;j++){const a=j*Math.PI*2/7+row*.45;const seed=ball(g,'#ffdfab',Math.sin(a)*(r+.006),-.33+t*.66,Math.cos(a)*(r+.006),.018,.032,.012);seed.rotation.y=a;}}for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=ball(g,'#80ab77',Math.sin(a)*.13,.32,Math.cos(a)*.13,.075,.035,.2);leaf.rotation.y=a;}return g;}
const berries=[[-3,2],[-2,-1.3],[.2,2.9],[3.8,.5],[1.8,-3.1]].map(([x,z],i)=>({mesh:strawberry(scene,x,z),x,z,phase:i,taken:false}));
// Level 1: soft collection bursts and a berry that hops into the picnic basket.
const pickupFX=[];
function pickupBurst(x,z){
  const particles=[];
  for(let i=0;i<13;i++){const a=i*Math.PI*2/13;const m=mesh(new THREE.IcosahedronGeometry(i%3===0?.075:.045,0),['#fff1b7','#f5a8b9','#d7e8b5'][i%3],scene,x,.65,z);particles.push({m,vx:Math.cos(a)*(1.1+i%3*.25),vz:Math.sin(a)*(1.1+i%3*.25),vy:1.4+(i%4)*.3});}
  const flying=strawberry(scene,x,z);flying.position.y=.55;pickupFX.push({age:0,particles,flying,x,z});
}
// Pointer interactions: berries, flowers and apple tree only. No petting mechanic.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let appleTree=null;
renderer.domElement.addEventListener('pointerup',e=>{
  if(transition!=='play'||opening<2.3||won||level!==5)return;
  const r=renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const targets=[...touchFlowers.map(f=>f.g)];
  if(level===1)targets.push(...berries.filter(b=>!b.taken).map(b=>b.mesh));
  if(level===2)targets.push(appleTree.g);
  if(level===3)targets.push(...hiddenMushrooms.filter(m=>!m.found).map(m=>m.grass));
  const hits=raycaster.intersectObjects(targets,true);
  if(!hits.length)return;
  let obj=hits[0].object;
  while(obj&&obj!==scene){
    const flower=touchFlowers.find(f=>f.g===obj);
    if(flower){flower.shake=1;return;}
    if(level===1){const berry=berries.find(b=>b.mesh===obj);if(berry){collect(berry);return;}}
    if(level===2&&obj===appleTree.g){shakeAppleTree();return;}
    if(level===3){const m=hiddenMushrooms.find(m=>m.grass===obj);if(m){discoverMushroom(m);return;}}
    obj=obj.parent;
  }
});
const served=group(scene);served.visible=false;for(let i=0;i<5;i++){const b=strawberry(served,.7+(i%3)*.32,-.8+Math.floor(i/3)*.3);b.scale.setScalar(.45);b.position.y=.98;}
const butterflies=[];for(let i=0;i<4;i++){const g=group(scene);const wings=[ball(g,'#e9c0dc',-.13,0,0,.18,.035,.23),ball(g,'#fff0bb',.13,0,0,.18,.035,.23)];ball(g,'#ad8b93',0,0,0,.035,.05,.2);butterflies.push({g,wings,phase:i*1.8});}
const confetti=group(scene);confetti.visible=false;for(let i=0;i<70;i++){const m=mesh(new THREE.BoxGeometry(.08,.16,.025),['#df9eb5','#d9c179','#aac8a0'][i%3],confetti);m.userData={x:Math.sin(i*12.3)*4,z:Math.cos(i*7.4)*3,speed:.7+(i%7)*.15};}
// Level 2 — shake the tree, watch each apple fall and bounce.
const orchard=group(scene);orchard.visible=false;
const appleTrunk=mesh(new THREE.CylinderGeometry(.23,.34,1.85,8),'#bd906d',orchard,0,1.04,0);
const appleCrown=mesh(new THREE.IcosahedronGeometry(1.15,1),'#a7cc87',orchard,0,2.35,0);
appleCrown.scale.set(1.18,.94,1.05);
const applePositions=[[-.67,2.43,.58],[.56,2.64,.48],[-.13,2.92,-.68],[.76,2.11,-.45]];
const apples=applePositions.map(([x,y,z],i)=>{
 const g=group(orchard,x,y,z);
 ball(g,'#c85b71',0,0,0,.18,.18,.18);
 const stem=mesh(new THREE.CylinderGeometry(.025,.025,.15,6),'#99724e',g,0,.31,0);stem.rotation.z=.3;
 const leaf=ball(g,'#8fac77',.12,.35,0,.12,.045,.075);leaf.rotation.z=.45;
 return {g,origin:new THREE.Vector3(x,y,z),fallen:false,vy:0,bounces:0,phase:i};
});
appleTree={g:orchard,apples};
// Level 3 — hidden mushrooms: rustle the soft grass to reveal each surprise.
const forest=group(scene);forest.visible=false;
const mushroomSpots=[[-3.05,1.95],[-2.65,-1.2],[.1,2.75],[3.35,.95],[2.65,-2.65]];
const hiddenMushrooms=mushroomSpots.map(([x,z],i)=>{
 const g=group(forest,x,.12,z);
 const grass=group(g);
 for(let j=0;j<7;j++){
  const a=j*Math.PI*2/7;
  const leaf=mesh(new THREE.ConeGeometry(.25,.75+(j%3)*.11,5),'#9fc48a',grass,Math.cos(a)*.29,.38,Math.sin(a)*.29);
  leaf.rotation.z=Math.sin(a)*.30;leaf.rotation.x=Math.cos(a)*.30;
 }
 const shroom=group(g,0,0,0);shroom.scale.setScalar(.001);
 mesh(new THREE.CylinderGeometry(.12,.17,.45,9),'#fff0d8',shroom,0,.24,0);
 const cap=mesh(new THREE.SphereGeometry(.40,12,8),'#e5a4ae',shroom,0,.51,0);cap.scale.y=.48;
 for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ball(shroom,'#fff5dc',Math.cos(a)*.23,.64,Math.sin(a)*.23,.065,.028,.055);}
 return {g,grass,shroom,x,z,found:false,reveal:0,phase:i};
});


const ingredientCatalog={
 strawberry:['🍓','草莓',1,'#dc7182'],blueberry:['🫐','蓝莓',7,'#747eaf'],
 raspberry:['🍇','覆盆子',1,'#bf6380'],mint:['🌿','薄荷',7,'#8ab58b'],
 apple:['🍎','苹果',2,'#d97765'],cherry:['🍒','樱桃',2,'#b9546c'],
 peach:['🍑','桃子',8,'#e9aa8c'],lemon:['🍋','柠檬',8,'#e9d279'],
 mushroom:['🍄','蘑菇',3,'#e0b49b'],honey:['🍯','蜂蜜',9,'#d8a75c'],
 hazelnut:['🌰','榛子',3,'#ad8867'],tomato:['🍅','番茄',6,'#d97468'],
 pumpkin:['🎃','南瓜',10,'#d99b65'],wheat:['🌾','小麦',10,'#d6bb79'],
 carrot:['🥕','胡萝卜',6,'#e3a06c']
};

// 15 kinds of independent low-poly collectibles across four gathering zones.
const gatherWorlds=Object.fromEntries([1,2,3,6,7,8,9,10].map(n=>[n,group(scene)]));
const gatherItems=[];
const spots=[[-3.3,1.9],[-2.0,-2.0],[.1,2.9],[3.3,.6],[2.8,-2.6],[1.2,-1.5]];
const RESPAWN_MS=30000;
function collectibleModel(parent,id){
 const [emoji,name,area,color]=ingredientCatalog[id];
 const g=group(parent);
 if(['mint','wheat'].includes(id)){
  mesh(new THREE.CylinderGeometry(.025,.035,.5,5),'#8ca77b',g,0,.26,0);
  for(let i=0;i<3;i++){const l=mesh(new THREE.ConeGeometry(.13,.27,5),color,g,(i-1)*.12,.30+i*.11,0);l.rotation.z=(i-1)*.65;}
 }else if(['carrot','lemon','strawberry','raspberry'].includes(id)){
  const body=mesh(new THREE.ConeGeometry(.22,.42,7),color,g,0,.30,0);
  body.rotation.z=id==='lemon'?Math.PI/2:Math.PI;
  ball(g,'#84b282',0,.54,0,.12,.045,.12);
 }else if(['mushroom','hazelnut'].includes(id)){
  mesh(new THREE.CylinderGeometry(.075,.10,.27,6),'#fff0da',g,0,.23,0);
  mesh(new THREE.ConeGeometry(.25,.20,7),color,g,0,.46,0);
 }else if(id==='honey'){
  mesh(new THREE.CylinderGeometry(.19,.21,.33,8),color,g,0,.28,0);
  mesh(new THREE.CylinderGeometry(.21,.21,.065,8),'#fff1ca',g,0,.47,0);
 }else if(id==='pumpkin'){
  for(let j=-1;j<=1;j++)ball(g,color,j*.12,.28,0,.17,.23,.21);
  mesh(new THREE.CylinderGeometry(.04,.05,.14,6),'#8ea97b',g,0,.54,0);
 }else if(id==='tomato'){
  ball(g,color,0,.30,0,.23,.21,.23);
  mesh(new THREE.ConeGeometry(.13,.10,5),'#83ad80',g,0,.54,0);
 }else if(id==='blueberry'){
  for(let j=0;j<3;j++)ball(g,color,(j-1)*.16,.27+(j%2)*.14,0,.13,.13,.13);
 }else{
  ball(g,color,0,.30,0,.23,.24,.22);
  mesh(new THREE.CylinderGeometry(.025,.025,.12,5),'#8da579',g,0,.58,0);
 }
 return g;
}
// Each harvest point retains its plant / hive after the produce is collected.
const harvestProfiles={
 strawberry:['摘下成熟果实'],raspberry:['摘下成熟果实'],blueberry:['摘下果串'],mint:['剪取嫩叶'],
 apple:['转动果实，松开果柄','摘下苹果'],cherry:['剪下带柄果串'],peach:['托住果实，轻转果柄','摘下桃子'],lemon:['剪断果柄'],
 mushroom:['拨开落叶','轻转菌柄采下'],hazelnut:['拨开落叶','捡起成熟落果'],
 honey:['轻施烟，安抚蜂群','提起成熟蜜框','刮取封盖蜂蜜'],
 tomato:['托住果实','剪断果柄'],pumpkin:['剪断瓜藤','抱起南瓜'],wheat:['割下麦穗','收拢麦束'],carrot:['松开根部泥土','握住叶柄向上拔']
};
const habitatObstacles=[];
let harvestBusy=null, harvestNotice='', harvestNoticeUntil=0;
function leaf(parent,x,y,z,size=.3,color='#83a779'){
 const m=mesh(new THREE.IcosahedronGeometry(size,0),color,parent,x,y,z);m.scale.set(1,.35,.65);return m;
}
function stem(parent,x,z,h=1){return mesh(new THREE.CylinderGeometry(.045,.06,h,5),'#7a9464',parent,x,h/2,z);}
function lowTree(parent,x,z,h=2.4,color='#96b382'){
 const g=group(parent,x,0,z);mesh(new THREE.CylinderGeometry(.12,.22,h*.65,6),'#a47d5d',g,0,h*.325,0);
 for(let k=0;k<3;k++)mesh(new THREE.IcosahedronGeometry(.65,0),color,g,(k-1)*.42,h*.7+(k%2)*.36,0);
 return g;
}
function plantPoint(g,id){
 const support=group(g), model=collectibleModel(g,id);let cover=null;
 const tool=group(g);tool.visible=false;let smoke=null;
 if(['mint','cherry','lemon','tomato','pumpkin'].includes(id)){
  for(const side of [-1,1]){const blade=box(tool,'#b8c4c2',side*.08,0,0,.04,.43,.035,.01);blade.rotation.z=side*.32;const handle=mesh(new THREE.TorusGeometry(.08,.025,5,8),'#b57973',tool,side*.1,-.24,0);}
 }else if(id==='wheat'){
  box(tool,'#ac855d',0,-.1,0,.08,.4,.08,.02);mesh(new THREE.TorusGeometry(.22,.035,5,12,Math.PI),'#bcc6bd',tool,.18,.12,0);
 }else if(id==='carrot'){
  box(tool,'#aa825d',0,.15,0,.07,.36,.06,.02);mesh(new THREE.ConeGeometry(.12,.25,4),'#b6bdb2',tool,0,-.12,0);
 }else if(id==='honey'){
  mesh(new THREE.CylinderGeometry(.12,.12,.25,6),'#aeb6b1',tool,0,0,0);
  mesh(new THREE.ConeGeometry(.13,.17,6),'#bcc3bc',tool,0,.2,0);
 }else{mesh(new THREE.IcosahedronGeometry(.14,1),'#fff0d2',tool);}

 if(['apple','cherry','peach','lemon'].includes(id)){
  lowTree(support,0,-.25,2.2,id==='peach'?'#a9b783':'#88a672');model.position.set(.48,1.25,.4);
 }else if(['strawberry','raspberry','blueberry','mint'].includes(id)){
  const h=id==='strawberry'?.3:id==='mint'?.45:.85;
  for(let k=0;k<5;k++){const a=k*1.256;stem(support,Math.cos(a)*.25,Math.sin(a)*.25,h);leaf(support,Math.cos(a)*.32,h,Math.sin(a)*.32,.38);}
  model.position.set(.2,h-.08,.33);
 }else if(id==='tomato'){
  box(support,'#bd9875',0,.8,0,.07,1.6,.07,.01);stem(support,0,0,1.2);
  for(let k=0;k<4;k++)leaf(support,(k%2?1:-1)*.22,.35+k*.23,0,.32);
  model.position.set(.25,.66,.16);
 }else if(id==='carrot'){
  mesh(new THREE.CylinderGeometry(.46,.52,.16,7),'#98785d',support,0,.07,0);
  model.position.y=-.38;
  for(let k=0;k<4;k++){const l=leaf(model,(k-1.5)*.09,.7,0,.25);l.rotation.z=k*.5;}
 }else if(id==='pumpkin'){
  for(let k=0;k<5;k++){stem(support,(k-2)*.23,0,.12);leaf(support,(k-2)*.3,.12,.15,.24);}
  model.scale.setScalar(1.4);
 }else if(id==='wheat'){
  model.clear();for(let k=0;k<7;k++){
   const x=(k%3-1)*.17,z=Math.floor(k/3)*.15;
   stem(model,x,z,.8);for(let j=0;j<3;j++)mesh(new THREE.ConeGeometry(.09,.2,5),'#d9b66b',model,x,.8+j*.1,z);
  }
  for(let k=0;k<5;k++)stem(support,(k-2)*.13,0,.13);
 }else if(id==='honey'){
  smoke=group(g);smoke.visible=false;for(let k=0;k<4;k++){const puff=mesh(new THREE.IcosahedronGeometry(.13+k*.03,1),'#e4ded0',smoke,.32+Math.sin(k)*.1,.9+k*.18,.15);puff.material=puff.material.clone();puff.material.transparent=true;puff.material.opacity=.45;}
  box(support,'#d4ad72',0,.48,0,.85,.8,.7,.03);
  for(let k=0;k<3;k++)box(support,'#ae8759',0,.25+k*.22,.356,.85,.035,.02,.005);
  box(support,'#8c7051',0,.2,.38,.38,.08,.06,.01);
  box(support,'#e6c99b',0,.94,0,1.02,.14,.9,.03);
  model.clear();box(model,'#ae8250',0,.42,0,.62,.74,.09,.02);box(model,'#e4b751',0,.42,.06,.48,.58,.06,.01);model.position.y=.25;
 }else if(['mushroom','hazelnut'].includes(id)){
  if(id==='hazelnut'){model.clear();for(let k=0;k<3;k++)mesh(new THREE.IcosahedronGeometry(.13,1),'#a78055',model,(k-1)*.18,.16,.08*(k%2));}
  cover=group(g);for(let k=0;k<8;k++){const l=leaf(cover,Math.sin(k*2)*.32,.44,Math.cos(k*2)*.26,.32,['#ac9064','#c1a06d','#849268'][k%3]);l.rotation.y=k;}
 }
 tool.position.copy(model.position).add(new THREE.Vector3(.3,.4,.2));
 return {support,model,cover,tool,smoke};
}
Object.entries(ingredientCatalog).forEach(([id,meta],i)=>{
 const area=meta[2],localIndex=Object.keys(ingredientCatalog).filter(k=>ingredientCatalog[k][2]===area).indexOf(id);
 for(let j=0;j<3;j++){
  const [x,z]=[[-3,1.5],[-3,-1.6],[-.9,-2.1],[2.6,1.5],[2.8,-1.4],[.9,-1.9]][localIndex*3+j];
  const g=group(gatherWorlds[area],x,.16,z),parts=plantPoint(g,id);
  g.userData.ingredientId=id;
  gatherItems.push({id,area,x,z,g,...parts,origin:parts.model.position.clone(),taken:false,readyAt:0,phase:i+j,step:0});
  habitatObstacles.push({area,x,z,r:['apple','cherry','peach','lemon','honey'].includes(id)?.48:.23});
 }
});
function resetPoint(item){
 item.tool.visible=false;if(item.smoke)item.smoke.visible=false;item.step=0;item.model.position.copy(item.origin);item.model.rotation.set(0,0,0);item.model.visible=true;
 item.support.rotation.z=0;if(item.cover){item.cover.visible=true;item.cover.rotation.z=0;}
}
function notifyHarvest(text){harvestNotice=text;harvestNoticeUntil=Date.now()+2000;}
function gatherIngredient(item){
 if(!item||item.area!==level||item.taken||transition!=='play'||harvestBusy)return;
 if(Math.hypot(dog.position.x-item.x,dog.position.z-item.z)>1.65){notifyHarvest('先走近植株或采集点');return;}
 const steps=harvestProfiles[item.id];
 harvestBusy={item,age:0,duration:1.0,final:item.step===steps.length-1,base:item.model.position.clone()};
 item.tool.visible=true;notifyHarvest(steps[item.step]+'…');
}
function animateHarvest(dt){
 if(!harvestBusy)return;
 const h=harvestBusy,i=h.item;h.age+=dt;const t=Math.min(1,h.age/h.duration);
 i.tool.rotation.z=Math.sin(t*Math.PI*2)*.4;
 if(i.cover&&i.step===0)i.cover.rotation.z=t*1.5;
 else if(i.id==='honey'){i.smoke.visible=i.step===0;i.smoke.position.y=t*.3;if(i.step===1)i.model.position.y=h.base.y+Math.sin(t*Math.PI/2)*.7;i.tool.position.y=.9+Math.sin(t*Math.PI)*.15;}
 else if(i.id==='carrot'){
  if(h.final)i.model.position.y=h.base.y+t*.85;else i.model.rotation.z=Math.sin(t*Math.PI*6)*.14;
 }else if(['wheat','mint','lemon','cherry','tomato','pumpkin'].includes(i.id)){
  i.model.rotation.z=Math.sin(t*Math.PI)*.35;if(h.final)i.model.position.y=h.base.y+Math.sin(t*Math.PI/2)*.35;
 }else{i.model.rotation.y=t*Math.PI*.6;if(h.final)i.model.position.y=h.base.y+Math.sin(t*Math.PI)*.35;}
 if(t<1)return;
 harvestBusy=null;i.tool.visible=false;if(i.smoke)i.smoke.visible=false;i.step++;
 if(i.cover)i.cover.visible=false;
 if(h.final){
  i.taken=true;i.readyAt=Date.now()+RESPAWN_MS;i.model.visible=false;pantry[i.id]++;
  updateHUD();notifyHarvest(`${ingredientCatalog[i.id][0]} ${ingredientCatalog[i.id][1]} +1 · 30 秒后再生`);
 }else notifyHarvest('再按 E / 点击：'+harvestProfiles[i.id][i.step]);
}
// Eight environments have distinct silhouettes, ground surfaces and landmarks.
const habitatThemes={1:['#c7d4a1','花篱小院'],7:['#a9c1ae','溪畔小径'],2:['#bdc68b','晴风果园'],8:['#d8c3ad','暖石庭院'],3:['#939a79','苔影森林'],9:['#d4ce9b','风铃花谷'],6:['#bca183','篱边菜圃'],10:['#c8b177','金穗农场']};
for(const [key,root] of Object.entries(gatherWorlds)){
 const area=+key;box(root,habitatThemes[area][0],0,.10,0,9.55,.10,7.55,.08);
 const decor=group(root);
 function stone(x,z,r=.3,color='#b1ada0'){const m=mesh(new THREE.IcosahedronGeometry(r,0),color,decor,x,.22,z);m.scale.y=.45;}
 function flower(x,z,color){stem(decor,x,z,.35);for(let k=0;k<5;k++)mesh(new THREE.IcosahedronGeometry(.11,0),color,decor,x+Math.sin(k*1.257)*.12,.4,z+Math.cos(k*1.257)*.12);}
 function rail(z,color='#e6d6b4'){for(let k=0;k<10;k++)box(decor,color,-4+k*.88,.48,z,.10,.72,.12,.02);box(decor,color,0,.55,z,8.1,.10,.10,.01);}
 if(area===1){
  rail(-3.4);for(const x of [-4.3,4.3]){box(decor,'#bd927a',x,1.05,2.8,.15,1.9,.15,.02);for(let k=0;k<7;k++)flower(x, -2.7+k*.7,'#d999ac');}
  box(decor,'#bd927a',0,2.0,3.2,2.0,.16,.16,.02);for(const x of [-1,1])box(decor,'#bd927a',x,1.03,3.2,.13,1.94,.13,.02);
  for(let k=0;k<8;k++)stone(Math.sin(k)*.25,3-k*.75,.26,'#e0c7b3');
 }else if(area===7){
  for(let k=0;k<12;k++){box(decor,'#87b9bb',-4.1+Math.sin(k*.6)*.2,.17,-3.2+k*.57,.65,.06,.65,.03);stone(-3.65+Math.sin(k*.6)*.2,-3.2+k*.57,.18);}
  for(let k=0;k<7;k++)box(decor,'#bd9674',-4.0,.29,.6+k*.16,1.2,.10,.13,.01);
  for(let k=0;k<5;k++)lowTree(decor,-3.8+k*1.7,-3.4,1.4,'#81a89a');
 }else if(area===2){
  rail(-3.4);rail(3.4);for(const x of [-4.2,4.2])for(let k=0;k<5;k++)stone(x,-2.7+k*1.2,.28,'#d9c59c');
  for(let k=0;k<3;k++)box(decor,'#bc9169',-1+k,.35,-3.15,.65,.5,.55,.04);
 }else if(area===8){
  for(let x=-4;x<=4;x++)for(let z=-3;z<=3;z++)box(decor,(x+z)%2?'#ddc9b6':'#cdb9a5',x,.17,z,.93,.06,.93,.02);
  for(const x of [-4.2,4.2]){box(decor,'#c0a793',x,.45,-2.0,.3,.7,2.8,.03);mesh(new THREE.CylinderGeometry(.38,.25,.48,7),'#be8c75',decor,x,.4,2.8);lowTree(decor,x,2.8,1.5,'#c0b4a0');}
 }else if(area===3){
  for(let k=0;k<7;k++)lowTree(decor,-4.1+k*1.35,-3.3,2.4+(k%3)*.4,'#6f8973');
  for(let k=0;k<24;k++)leaf(decor,Math.sin(k*7.3)*4.2,.2,Math.cos(k*4.1)*3.1,.18,k%2?'#ae926d':'#b8a179');
  const log=mesh(new THREE.CylinderGeometry(.3,.34,1.8,7),'#93755a',decor,4,.4,-.4);log.rotation.x=Math.PI/2;
  for(let k=0;k<5;k++)stone(-4.2+k*.18,.3+k*.35,.38,'#78947a');
 }else if(area===9){
  for(let k=0;k<40;k++)flower(Math.sin(k*2.4)*4.4,-3+Math.cos(k*1.8)*.35,k%2?'#c5a8d0':'#ebd79b');
  for(let k=0;k<12;k++)flower(4.1,-2.6+k*.5,'#cab0ce');
  box(decor,'#b99b77',3.9,1.3,2.7,.13,2.3,.13,.02);box(decor,'#b99b77',3.5,2.4,2.7,.9,.12,.13,.02);
  for(let k=0;k<3;k++)mesh(new THREE.CylinderGeometry(.035,.035,.3+k*.12,6),'#d5bc7c',decor,3.2+k*.2,2.05,2.7);
 }else if(area===6){
  for(const x of [-3,2.7]){box(decor,'#86684e',x,.19,0,1.5,.17,5.8,.05);for(let k=0;k<6;k++)box(decor,'#a78361',x,.30,-2.5+k,1.3,.11,.17,.02);}
  rail(-3.4);box(decor,'#b7c6bb',4.1,.43,2.7,.7,.55,.5,.07);
 }else if(area===10){
  for(const x of [-3,2.7])box(decor,'#aa8657',x,.18,0,1.5,.14,6,.05);
  box(decor,'#bd8b6d',0,.85,-3.1,1.3,1.4,.9,.03);const roof=mesh(new THREE.ConeGeometry(1.03,.7,4),'#8d7972',decor,0,1.88,-3.1);roof.rotation.y=Math.PI/4;
  for(let k=0;k<3;k++)box(decor,'#e2c17b',4,.45,-2+k*1.15,.7,.6,.8,.04);rail(3.5,'#b89769');
 }
}
function nearestIngredient(){
 let best=null,d=1.65;
 for(const item of gatherItems){const v=Math.hypot(dog.position.x-item.x,dog.position.z-item.z);if(item.area===level&&!item.taken&&v<d){best=item;d=v;}}
 return best;
}
let harvestPointer=null;
renderer.domElement.addEventListener('pointerdown',e=>{harvestPointer={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!harvestPointer||Math.hypot(e.clientX-harvestPointer.x,e.clientY-harvestPointer.y)>7)return;
 if(![1,2,3,6,7,8,9,10].includes(level)||transition!=='play')return;
 const r=renderer.domElement.getBoundingClientRect();
 pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(gatherItems.filter(i=>i.area===level&&!i.taken).map(i=>i.g),true);
 if(!hits.length)return;
 let obj=hits[0].object;
 while(obj&&!obj.userData.ingredientId)obj=obj.parent;
 if(obj){const item=gatherItems.find(i=>i.g===obj);gatherIngredient(item);}
});

// Level 4 — free-form low-poly pudding / pizza studio.
const kitchen=group(scene);kitchen.visible=false;
const counter=group(kitchen,0,.14,.15);
box(counter,'#eac49f',0,.40,0,5.9,.70,3.25,.24);
box(counter,'#fff1d9',0,.83,0,6.1,.20,3.45,.10);
for(const x of [-2.5,2.5])box(counter,'#e8b9b3',x,.09,0,.36,.56,2.6,.08);
mesh(new THREE.CylinderGeometry(1.16,1.20,.12,32),'#f9e7d9',counter,0,1.00,-.18);
const foodRoot=group(counter,0,1.07,-.18);
const pudding=group(foodRoot),pizza=group(foodRoot);
const puddingBody=mesh(new THREE.CylinderGeometry(.70,.88,.80,12),'#e9b870',pudding,0,.43,0);
mesh(new THREE.CylinderGeometry(.72,.78,.13,12),'#a96743',pudding,0,.86,0);
ball(pudding,'#fff9ed',0,1.00,0,.43,.20,.43);
for(const x of [-.24,.24])ball(pudding,'#5e403b',x,.57,.67,.058,.07,.04);
ball(pudding,'#d88e89',-.44,.43,.52,.13,.07,.055);
ball(pudding,'#d88e89',.44,.43,.52,.13,.07,.055);
const smile=mesh(new THREE.TorusGeometry(.12,.021,6,12,Math.PI),'#5e403b',pudding,0,.47,.72);
smile.rotation.z=Math.PI;
for(const x of [-.63,.63]){const ear=mesh(new THREE.ConeGeometry(.27,.43,4),'#e9b870',pudding,x,.95,0);ear.rotation.y=Math.PI/4;}
const pizzaCrust=mesh(new THREE.CylinderGeometry(1.05,1.05,.17,18),'#e9b76e',pizza,0,.13,0);
mesh(new THREE.CylinderGeometry(.89,.89,.025,18),'#d97858',pizza,0,.235,0);
mesh(new THREE.CylinderGeometry(.82,.82,.03,18),'#f5d98e',pizza,0,.262,0);
pizza.visible=false;
const toppings=group(foodRoot);
let recipe=null,selectedTopping=null,placedCount=0;

const pantry=Object.fromEntries(Object.keys(ingredientCatalog).map(k=>[k,0]));
const recipes={
 pudding:{name:'🐱 动物布丁',need:{strawberry:2,cherry:1,blueberry:1}},
 pizza:{name:'🍕 森林披萨',need:{mushroom:2,tomato:2,wheat:1}},
 cake:{name:'🍓 草莓甜品',need:{strawberry:3,raspberry:1,honey:1}}
};
let desiredRecipe=null,finishedRecipe=null;

const toppingOptions={
 pudding:[
  {id:'strawberry',label:'🍓 草莓',color:'#e87e8d'},
  {id:'cherry',label:'🍒 樱桃',color:'#ba5367'},
  {id:'cream',label:'☁️ 奶油',color:'#fff6e6'},
  {id:'waffle',label:'🧇 华夫饼',color:'#e9b86e'},
  {id:'candy',label:'🎀 糖果',color:'#bca5e7'},
  {id:'blueberry',label:'🫐 蓝莓',color:'#747eaf'},
  {id:'raspberry',label:'🍇 覆盆子',color:'#bf6380'},
  {id:'mint',label:'🌿 薄荷',color:'#8ab58b'},
  {id:'peach',label:'🍑 桃子',color:'#e9aa8c'},
  {id:'honey',label:'🍯 蜂蜜',color:'#d8a75c'}
 ],
 cake:[
  {id:'strawberry',label:'🍓 草莓',color:'#e87e8d'},
  {id:'cream',label:'☁️ 奶油',color:'#fff6e6'},
  {id:'cherry',label:'🍒 樱桃',color:'#ba5367'},
  {id:'candy',label:'🎀 糖果',color:'#bca5e7'},
  {id:'blueberry',label:'🫐 蓝莓',color:'#747eaf'},
  {id:'raspberry',label:'🍇 覆盆子',color:'#bf6380'},
  {id:'mint',label:'🌿 薄荷',color:'#8ab58b'},
  {id:'peach',label:'🍑 桃子',color:'#e9aa8c'},
  {id:'honey',label:'🍯 蜂蜜',color:'#d8a75c'}
 ],
 pizza:[
  {id:'cheese',label:'🧀 芝士',color:'#f6df8c'},
  {id:'tomato',label:'🍅 番茄',color:'#e77767'},
  {id:'mushroom',label:'🍄 蘑菇',color:'#e7cbb1'},
  {id:'pepper',label:'🫑 彩椒',color:'#91b980'},
  {id:'olive',label:'🫒 橄榄',color:'#554e4b'},
  {id:'tomato',label:'🍅 番茄',color:'#d97468'},
  {id:'carrot',label:'🥕 胡萝卜',color:'#e3a06c'},
  {id:'pumpkin',label:'🎃 南瓜',color:'#d99b65'}
 ]
};
const cookUI=document.createElement('div');cookUI.id='cook-ui';
cookUI.innerHTML=`<div id="recipe-choose" class="cook-card"><div class="cook-title">今天做什么？</div><div class="cook-choice"><button type="button" data-recipe="pudding">🍮<span>动物布丁</span></button><button type="button" data-recipe="pizza">🍕<span>披萨</span></button><button type="button" data-recipe="cake">🍓<span>草莓甜品</span></button></div></div><div id="cook-work" hidden><div id="cook-palette" aria-label="食材选择"></div><div class="cook-actions"><span id="cook-count">点击配料，再点食物装饰</span><button id="cook-finish" type="button">✨ 完成制作</button></div></div>`;
document.body.appendChild(cookUI);
const cookChoice=cookUI.querySelector('#recipe-choose');
const cookWork=cookUI.querySelector('#cook-work');
const cookPalette=cookUI.querySelector('#cook-palette');
const cookFinish=cookUI.querySelector('#cook-finish');
function showCookingUI(){
 cookUI.hidden=level!==4||transition!=='play'||opening<2.3||won;
 if(!cookUI.hidden){cookChoice.hidden=!!recipe;cookWork.hidden=!recipe;}
}
function chooseRecipe(type){
 desiredRecipe=type;
 if(!hasIngredients(type)){recipe=null;updateHUD();$('#hint').textContent='食谱已选好！点击上方场景去采集 🌿';return;}
 recipe=type;selectedTopping=null;placedCount=0;updateHUD();
 pudding.visible=type!=='pizza';pizza.visible=type==='pizza';
 toppings.clear();cookPalette.replaceChildren();
 for(const option of toppingOptions[type]){
  const btn=document.createElement('button');btn.type='button';btn.textContent=option.label;
  btn.addEventListener('click',()=>{
   selectedTopping=option;
   for(const el of cookPalette.children)el.classList.toggle('chosen',el===btn);
   $('#hint').textContent=`${option.label} · 点击食物添加`;
  });
  cookPalette.appendChild(btn);
 }
 cookPalette.firstElementChild?.click();
 cookChoice.hidden=true;cookWork.hidden=false;
 $('#hint').textContent='选择配料，点击食物自由装饰';
}
cookChoice.querySelectorAll('[data-recipe]').forEach(btn=>btn.addEventListener('click',()=>chooseRecipe(btn.dataset.recipe)));
function addTopping(x,z){
 if(!selectedTopping||!recipe||won)return;
 const id=selectedTopping.id;
 if(id in pantry&&pantry[id]<1){$('#hint').textContent='这个食材用完啦，去采集更多吧';return;}
 if(id in pantry)pantry[id]--;
 const g=group(toppings,x,recipe==='pudding'?1.02:.31,z);
 const c=selectedTopping.color;
 if(id==='strawberry'){
  const b=mesh(new THREE.ConeGeometry(.16,.28,8),c,g,0,.10,0);b.rotation.z=Math.PI;
  ball(g,'#89b887',0,.26,0,.11,.04,.10);
 }else if(id==='cherry'){
  ball(g,c,0,.11,0,.15,.15,.15);
  const stem=mesh(new THREE.CylinderGeometry(.018,.018,.19,5),'#83aa78',g,.04,.28,0);stem.rotation.z=.32;
 }else if(id==='cream'){
  for(let i=0;i<3;i++)ball(g,c,0,.06+i*.09,0,.19-i*.045,.11,.19-i*.045);
 }else if(id==='waffle'){
  const w=box(g,c,0,.13,0,.32,.10,.30,.025);w.rotation.y=Math.PI/4;
  for(const t of [-.09,.09])box(g,'#ce9555',t,.19,0,.018,.012,.25,.004);
 }else if(id==='candy'){
  ball(g,c,0,.10,0,.17,.12,.12);
  for(const side of [-1,1])mesh(new THREE.ConeGeometry(.11,.18,4),'#f4b4ce',g,side*.22,.10,0).rotation.z=side*Math.PI/2;
 }else if(id==='cheese'){
  for(let i=0;i<3;i++)ball(g,c,Math.sin(i*2.2)*.12,.025,Math.cos(i*2.2)*.12,.12,.04,.09);
 }else if(id==='tomato'){
  mesh(new THREE.CylinderGeometry(.16,.16,.035,9),c,g,0,.03,0);
  ball(g,'#f6c3a5',0,.056,0,.065,.008,.065);
 }else if(id==='mushroom'){
  mesh(new THREE.CylinderGeometry(.055,.065,.13,7),'#fff1dc',g,0,.08,0);
  const cap=ball(g,c,0,.17,0,.19,.10,.17);cap.rotation.y=.3;
 }else if(id==='pepper'){
  const arc=mesh(new THREE.TorusGeometry(.16,.045,5,10,Math.PI*1.35),c,g,0,.045,0);arc.rotation.x=Math.PI/2;
 }else if(id==='olive'){
  const ring=mesh(new THREE.TorusGeometry(.10,.04,6,10),'#514b47',g,0,.04,0);ring.rotation.x=Math.PI/2;
 }else{
  const item=mesh(new THREE.IcosahedronGeometry(.15,0),c,g,0,.13,0);
  item.scale.set(1,.65,1);
 }
 g.rotation.y=Math.random()*Math.PI*2;
 placedCount++;updateHUD();
 cookUI.querySelector('#cook-count').textContent=`已添加 ${placedCount} 个装饰 · 可以继续`;
 pickupBurst(counter.position.x+x,counter.position.z+z);
}
function cookPointer(e){
 if(level!==4||!recipe||won||transition!=='play'||opening<2.3)return;
 const r=renderer.domElement.getBoundingClientRect();
 pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects([puddingBody,pizzaCrust],true);
 if(!hit.length)return;
 const pt=foodRoot.worldToLocal(hit[0].point.clone());
 // Top-down placement works on the entire food surface.
 const maxRadius=recipe==='pudding'?.64:.82;
 const len=Math.hypot(pt.x,pt.z)||1;
 const f=Math.min(1,maxRadius/len);
 addTopping(pt.x*f,pt.z*f);
}
renderer.domElement.addEventListener('pointerup',cookPointer);
cookFinish.addEventListener('click',()=>{
 if(placedCount<1){$('#hint').textContent='至少添加一个喜欢的装饰 ✨';return;}
 finishedRecipe=recipe;
 if(picnic.userData.finishedFood)picnic.remove(picnic.userData.finishedFood);
 const foodDisplay=foodRoot.clone(true);
 foodDisplay.position.set(0,.92,-.18);
 foodDisplay.scale.setScalar(.72);
 picnic.add(foodDisplay);
 picnic.userData.finishedFood=foodDisplay;
 cake.visible=false;
 completeLevel();
 showCookingUI();
});
orchard.position.set(-1.0,.14,.15);

// Free-roam recipe system: choose a dish, gather only its ingredients,
// return to the kitchen whenever you want. All supplies persist between trips.
let level=4,count=0,opening=0,won=false,nearest=null,partyTime=0;
let transition='opening',transitionAge=0,treeShake=0,shakeCount=0;
let pendingLevel=null;
const keys=new Set();
const TOTAL=5;
const worldNames={1:'花篱小院',7:'溪畔小径',2:'晴风果园',8:'暖石庭院',3:'苔影森林',9:'风铃花谷',6:'篱边菜圃',10:'金穗农场',4:'创意厨房',5:'野餐草地'};
const nav=document.createElement('nav');nav.id='world-nav';nav.setAttribute('aria-label','地点导航');
nav.innerHTML=[4,1,7,2,8,3,9,6,10,5].map(n=>`<button type="button" data-world="${n}">${worldNames[n]}</button>`).join('');
document.body.appendChild(nav);
const recipeCard=document.createElement('section');recipeCard.id='recipe-card';
recipeCard.innerHTML='<div class="recipe-head">🍮 今日食谱</div><div id="recipe-detail"></div><div id="pantry-count"></div>';
document.body.appendChild(recipeCard);
const curtain=document.createElement('div');curtain.id='scene-curtain';document.body.appendChild(curtain);
function hasIngredients(type){return Object.entries(recipes[type].need).every(([k,n])=>pantry[k]>=n);}
function recipeNeeds(){
 const type=desiredRecipe||'pudding',r=recipes[type];
 return `${r.name}<br>${Object.entries(r.need).map(([k,n])=>`${ingredientCatalog[k][0]} ${pantry[k]}/${n}${pantry[k]>=n?' ✓':''}`).join(' · ')}`;
}
function updateHUD(){
 $('#score').textContent=worldNames[level];
 $('#progress').max=5;$('#progress').value=Math.min(5,Object.values(pantry).reduce((a,b)=>a+b,0));
 $('#instructions').innerHTML=level===4?'点击食谱选择 · 点击食物装饰':level===5?'欣赏你的作品':'WASD / 方向键移动 · 靠近后按 E 或点击 · 按提示分步采集';
 $('#collect').textContent='互动 E';
 recipeCard.querySelector('#recipe-detail').innerHTML=recipeNeeds();
 recipeCard.querySelector('#pantry-count').innerHTML=`背包 · 15种食材<br>${Object.entries(ingredientCatalog).map(([k,v])=>`${v[0]}${pantry[k]}`).join('  ')}`;
 nav.querySelectorAll('[data-world]').forEach(b=>b.classList.toggle('active',+b.dataset.world===level));
}
function clearFX(){pickupFX.splice(0).forEach(f=>{f.particles.forEach(p=>scene.remove(p.m));scene.remove(f.flying);});}
const boxContents=scene.children.filter(o=>!boxShell.has(o));
// These are scene children, not the box shell or lid. Hide all while the lid moves.
function hideContents(){for(const o of boxContents)o.visible=false;}
function revealContents(){
 for(const o of boxContents)o.visible=level===5;
 dog.visible=level!==4;picnic.visible=level===5;kitchen.visible=level===4;
 berries.forEach(b=>b.mesh.visible=false);orchard.visible=false;forest.visible=false;
 for(const [n,g] of Object.entries(gatherWorlds)){g.visible=Number(n)===level;for(const item of gatherItems.filter(i=>i.area===+n)){item.g.visible=true;item.model.visible=!item.taken;}}
 served.visible=level===5;confetti.visible=level===5&&!!finishedRecipe;
}
function enterLevel(n){
 level=n;won=false;nearest=null;partyTime=0;keys.clear();
 dog.position.set(-1,.15,2);dog.rotation.y=0;
 controls.minDistance=n===4?8:13;
 cookUI.hidden=true;$('#finish').hidden=true;
 revealContents();updateHUD();
 if(n===4&&desiredRecipe&&!recipe&&hasIngredients(desiredRecipe))chooseRecipe(desiredRecipe);
 if(n===5){$('#hint').textContent=finishedRecipe?`你的${recipes[finishedRecipe].name}完成啦！✨`:'先去厨房制作一份美食吧 🍮';}
}
function travel(n){
 if(![1,2,3,4,5,6,7,8,9,10].includes(n)||transition!=='play'||n===level)return;
 if(n===5&&!finishedRecipe){$('#hint').textContent='先做一份美食，再去野餐吧';return;}
 if(harvestBusy){notifyHarvest('请等当前采集动作完成');return;}
 clearFX();pendingLevel=n;transition='fadeout';transitionAge=0;keys.clear();cookUI.hidden=true;
 curtain.classList.add('on');
}
nav.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>travel(+b.dataset.world)));
function reset(){
 harvestBusy=null;harvestNoticeUntil=0;clearFX();Object.keys(pantry).forEach(k=>pantry[k]=0);
 desiredRecipe=null;finishedRecipe=null;recipe=null;selectedTopping=null;placedCount=0;
 toppings.clear();pudding.visible=true;pizza.visible=false;
 if(picnic.userData.finishedFood){picnic.remove(picnic.userData.finishedFood);picnic.userData.finishedFood=null;}
 cake.visible=true;
 berries.forEach(b=>{b.taken=false;b.mesh.visible=false;});
 apples.forEach(a=>{a.fallen=false;a.vy=0;a.bounces=0;a.g.position.copy(a.origin);a.g.rotation.set(0,0,0);});
 gatherItems.forEach(item=>{item.taken=false;item.readyAt=0;resetPoint(item);item.g.visible=true;});
 hiddenMushrooms.forEach(m=>{m.found=false;m.reveal=0;m.grass.scale.setScalar(1);m.shroom.scale.setScalar(.001);});
 transition='opening';transitionAge=0;opening=0;level=4;pendingLevel=null;
 hideContents();view();updateHUD();$('#finish').hidden=true;curtain.classList.remove('on');
}
function completeLevel(){
 won=true;partyTime=0;keys.clear();
 if(level===4){$('#hint').textContent='料理完成！去野餐草地看看吧 🧺';setTimeout(()=>{if(level===4&&won){won=false;travel(5);}},1100);}
}
function collect(target=nearest){
 if(level!==1||transition!=='play'||opening<2.3||!target||target.taken||Math.hypot(dog.position.x-target.x,dog.position.z-target.z)>1.35)return;
 target.taken=true;target.mesh.visible=false;pickupBurst(target.x,target.z);
 pantry.strawberry++;nearest=null;updateHUD();
 if(berries.every(b=>b.taken))setTimeout(()=>{berries.forEach(b=>{b.taken=false;b.mesh.visible=level===1&&transition==='play';});},1800);
}
function shakeAppleTree(){
 if(level!==2||transition!=='play'||opening<2.3)return;
 if(Math.hypot(dog.position.x-orchard.position.x,dog.position.z-orchard.position.z)>2.7){$('#hint').textContent='先靠近果树 🍒';return;}
 treeShake=1;const a=apples.find(a=>!a.fallen);
 if(a){a.fallen=true;a.vy=.8;pantry.cherry++;updateHUD();}
 if(apples.every(a=>a.fallen))setTimeout(()=>{apples.forEach(a=>{a.fallen=false;a.vy=0;a.bounces=0;a.g.position.copy(a.origin);});},2200);
}
function discoverMushroom(target){
 if(level!==3||transition!=='play'||opening<2.3||!target||target.found)return;
 if(Math.hypot(dog.position.x-target.x,dog.position.z-target.z)>1.65){$('#hint').textContent='先靠近草丛 🍄';return;}
 target.found=true;target.reveal=.001;pickupBurst(target.x,target.z);
 pantry.mushroom++;updateHUD();
 if(hiddenMushrooms.every(m=>m.found))setTimeout(()=>{gatherItems.forEach(item=>{item.taken=false;item.readyAt=0;resetPoint(item);item.g.visible=true;});
 hiddenMushrooms.forEach(m=>{m.found=false;m.reveal=0;m.grass.scale.setScalar(1);m.shroom.scale.setScalar(.001);});},2400);
}
function action(){
 if(transition!=='play'||harvestBusy)return;
 if([1,2,3,6,7,8,9,10].includes(level)){const item=nearestIngredient();if(item)gatherIngredient(item);else notifyHarvest('走近其他采集点；已采过的食材 30 秒后恢复');}
 else if(level===4)$('#hint').textContent='选择食材，再点击甜品';
 else travel(4);
}
const moveCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
addEventListener('keydown',e=>{if(moveCodes.includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='KeyE'&&!e.repeat)action();});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>keys.clear());
for(const b of document.querySelectorAll('[data-key]')){
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));
}
$('#collect').onclick=action;$('#replay').onclick=reset;$('#again').onclick=()=>{reset();$('#replay').focus();};
$('#lidReplay').onclick=()=>{if(transition==='play')travel(level===4?1:4);};
$('#finish').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();$('#again').focus();}});
const clock=new THREE.Clock();let elapsed=0;
const forward=new THREE.Vector3(),right=new THREE.Vector3(),motion=new THREE.Vector3();
function blocked(x,z){
 const solids=gatherWorlds[level]?habitatObstacles.filter(o=>o.area===level):obstacles;
 return solids.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.32);
}
function tick(){
 for(const item of gatherItems){
  if(item.taken&&Date.now()>=item.readyAt){
   item.taken=false;item.readyAt=0;resetPoint(item);
  }
 }

 requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 animateHarvest(dt);
 // No scale or spiral growth: fade the whole stage, then animate the lid
 // while every prop is hidden. Reveal complete props only after the lid opens.
 if(transition==='fadeout'){
   transitionAge+=dt;
   if(transitionAge>=.42){hideContents();transition='closing';transitionAge=0;}
 }else if(transition==='closing'){
   opening=Math.max(0,opening-dt*1.65);
   if(opening===0){level=pendingLevel;pendingLevel=null;transition='opening';transitionAge=0;enterLevel(level);hideContents();}
 }else if(transition==='opening'){
   opening=Math.min(2.3,opening+dt*1.45);
   if(opening>=2.3){transition='fadein';transitionAge=0;revealContents();curtain.classList.remove('on');}
 }else if(transition==='fadein'){
   transitionAge+=dt;
   if(transitionAge>.45)transition='play';
 }
 const p=THREE.MathUtils.clamp(opening/2.3,0,1);
 lid.rotation.x=-1.95*(1-Math.pow(1-p,3));
 if(!won&&transition==='play'&&p>=1&&level!==4&&level!==5){
   camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();
   const vertical=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
   const horizontal=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
   motion.copy(forward).multiplyScalar(vertical).addScaledVector(right,horizontal);
   if(motion.lengthSq()>0&&!harvestBusy){
     motion.normalize();const nx=THREE.MathUtils.clamp(dog.position.x+motion.x*dt*2.65,-4.85,4.85);
     if(!blocked(nx,dog.position.z))dog.position.x=nx;
     const nz=THREE.MathUtils.clamp(dog.position.z+motion.z*dt*2.65,-3.85,3.85);
     if(!blocked(dog.position.x,nz))dog.position.z=nz;
     const angle=Math.atan2(motion.x,motion.z);
     dog.rotation.y+=Math.atan2(Math.sin(angle-dog.rotation.y),Math.cos(angle-dog.rotation.y))*Math.min(dt*12,1);
     dog.position.y=.15+Math.abs(Math.sin(elapsed*12))*.055;
     legs.forEach((l,i)=>l.rotation.x=Math.sin(elapsed*12+i*Math.PI)*.3);
   }else{dog.position.y=.15;legs.forEach(l=>l.rotation.x=0);}
   const target=nearestIngredient();
   const label=target?harvestProfiles[target.id][target.step]:'走近植株、果树或采集点探索';
   $('#collect').textContent=harvestBusy?'采集中…':target?label:'互动 E';
   $('#hint').textContent=Date.now()<harvestNoticeUntil?harvestNotice:target?`${ingredientCatalog[target.id][1]} · E / 点击：${label}`:'自由探索 · 采下的食材会消失 30 秒，植株会保留';
 }else if(transition!=='play')$('#hint').textContent='正在切换小世界…';
 else if(level===4)$('#hint').textContent='选择食谱，准备材料，再自由装饰';
 else if(level===5)$('#hint').textContent='享受你的野餐时光';
 tail.rotation.z=Math.sin(elapsed*9)*.3;ears.forEach((e,i)=>e.rotation.x=Math.sin(elapsed*4+i)*.05);
 for(let i=pickupFX.length-1;i>=0;i--){const f=pickupFX[i];f.age+=dt;const t=f.age;
   f.flying.position.set(THREE.MathUtils.lerp(f.x,3.55,Math.min(t,1)),.55+Math.sin(Math.min(t,1)*Math.PI)*1.45,THREE.MathUtils.lerp(f.z,3,Math.min(t,1)));
   f.flying.scale.setScalar(Math.max(.01,1-t*.85));f.flying.rotation.y+=dt*7;
   f.particles.forEach(p=>{p.m.position.x+=p.vx*dt;p.m.position.z+=p.vz*dt;p.m.position.y+=p.vy*dt;p.vy-=3.8*dt;p.m.scale.setScalar(Math.max(.001,1-t));});
   if(t>1.1){f.particles.forEach(p=>scene.remove(p.m));scene.remove(f.flying);pickupFX.splice(i,1);}
 }
 touchFlowers.forEach(f=>{f.shake=Math.max(0,f.shake-dt*1.5);f.g.rotation.z=Math.sin(elapsed*13)*f.shake*.22;});
 berries.forEach(b=>{b.mesh.position.y=.55+Math.sin(elapsed*2+b.phase)*.06;b.mesh.rotation.y=elapsed*.35;b.mesh.scale.setScalar(b===nearest?1.16:1);});
 // Trees and all other props keep their original scale and orientation.
 hiddenMushrooms.forEach(m=>{
   if(m.found){m.reveal=Math.min(1,m.reveal+dt*2.1);m.shroom.scale.setScalar(Math.max(.001,m.reveal));m.grass.scale.setScalar(Math.max(.02,1-m.reveal*.90));}
   else{m.grass.rotation.z=Math.sin(elapsed*2.1+m.phase)*.045;}
 });
 // Shake crown and trunk together; apples detach and bounce on the grass.
 treeShake=Math.max(0,treeShake-dt*1.3);
 appleTrunk.rotation.z=Math.sin(elapsed*23)*treeShake*.11;
 appleCrown.rotation.z=Math.sin(elapsed*23)*treeShake*.17;
 apples.forEach(a=>{
   if(a.fallen){a.vy-=5.7*dt;a.g.position.y+=a.vy*dt;
     const floor=.33;if(a.g.position.y<floor){a.g.position.y=floor;a.vy=Math.abs(a.vy)*.42;a.bounces++;if(a.bounces>3)a.vy=0;}
     a.g.rotation.z+=dt*2;
   }else a.g.position.x=a.origin.x+Math.sin(elapsed*23)*treeShake*.12;
 });
 butterflies.forEach(({g,wings,phase})=>{g.position.set(Math.sin(elapsed*.35+phase)*3,2+Math.sin(elapsed+phase)*.3,Math.cos(elapsed*.3+phase)*2);wings[0].rotation.z=Math.sin(elapsed*12+phase)*.7;wings[1].rotation.z=-wings[0].rotation.z;});
 if(won&&level===5){partyTime+=dt;dog.position.y=.15+Math.abs(Math.sin(partyTime*6))*.20;
   confetti.children.forEach((m,i)=>{const d=m.userData;m.position.set(d.x+Math.sin(elapsed+i)*.2,5-((partyTime*d.speed+i*.07)%5),d.z);m.rotation.set(elapsed+i,elapsed*2,elapsed*.7);});
   
 }
 showCookingUI();controls.update();renderer.render(scene,camera);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
// Compact HUD: only level, count and controls. Remove the long side explanation.
const style43=document.createElement('style');style43.textContent=`
header{top:3.5%;left:3%;z-index:1}header h1{font-family:Arial Rounded MT Bold,Trebuchet MS,sans-serif;font-size:clamp(34px,5.4vw,79px);font-weight:1000;line-height:.95;max-width:340px;color:#eaa396;letter-spacing:-3px;-webkit-text-stroke:8px #fffaf4;paint-order:stroke fill;filter:drop-shadow(0 3px 0 #e4b8aa)}header p,.eyebrow{display:none}.mission{width:150px;top:5%;right:3%;padding:8px 14px;border-radius:24px}.mission small,.mission progress{display:none}#score{font-weight:bold;color:#bd7771;margin:6px;font-size:24px}.tools{font-size:10px;margin:5px 0}.tools button{padding:5px 8px}#instructions{left:3%;top:34%;bottom:auto;transform:none;width:165px;white-space:normal;text-align:left;padding:10px 12px;font-size:13px;line-height:1.6;border:2px solid #edc6ba;border-radius:12px;background:#fff7e9e0;color:#996d56}#hint{bottom:20px;font-size:12px;background:#fff8e8dc}
@media(max-width:650px){header h1{font-size:38px;max-width:180px;-webkit-text-stroke:4px #fffaf4;letter-spacing:-1px}.mission{top:18px;right:12px;width:125px;padding:6px}#score{font-size:19px}.tools{flex-wrap:wrap}#instructions{top:auto;bottom:10px;left:5%;width:auto;max-width:210px;font-size:10px;padding:5px 9px;line-height:1.4;transform:none;text-align:left}#hint{bottom:62px}#touch{bottom:110px}#collect{bottom:125px}}

#cook-ui{position:fixed;inset:0;z-index:20;pointer-events:none;font-family:Trebuchet MS,Arial,sans-serif}
#cook-ui[hidden],#cook-ui [hidden]{display:none!important}
#cook-ui button{cursor:pointer;touch-action:manipulation;border:2px solid #edc4b5;background:#fff8ed;color:#9b6b62;border-radius:18px;font-weight:800}
#recipe-choose{pointer-events:auto;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:22px 26px;background:#fff8edee;border:3px solid #f1c7c0;border-radius:26px;text-align:center;box-shadow:0 12px 35px #9c797644}
.cook-title{font-size:22px;font-weight:900;color:#ab7770;margin-bottom:15px}
.cook-choice{display:flex;gap:14px}
.cook-choice button{font-size:38px;min-width:126px;min-height:125px;display:flex;align-items:center;justify-content:center;flex-direction:column}
.cook-choice span{font-size:16px;margin-top:10px}
#cook-work{pointer-events:none}
#cook-palette{pointer-events:auto;position:absolute;bottom:75px;left:50%;transform:translateX(-50%);display:flex;gap:9px;padding:10px;background:#fff8edee;border:2px solid #efc6bd;border-radius:20px;max-width:94vw;overflow-x:auto;scrollbar-width:thin}
#cook-palette button{flex:none;min-width:90px;min-height:52px;font-size:14px;padding:9px}
#cook-palette button.chosen{background:#f4d4ce;border-color:#c78d84}
.cook-actions{pointer-events:auto;position:absolute;bottom:15px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:15px;background:#fff8edee;border-radius:18px;padding:7px 12px;color:#996b63;white-space:nowrap;font-size:12px}
#cook-finish{padding:10px 16px;font-size:14px}
@media(max-width:650px){#cook-palette{bottom:135px}#cook-palette button{min-width:75px;font-size:12px}.cook-actions{bottom:85px;max-width:95vw;white-space:normal}.cook-choice button{min-width:105px}.cook-title{font-size:18px}}

#world-nav{position:fixed;z-index:25;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;padding:7px;background:#fff9f0e8;border:2px solid #eac5b8;border-radius:20px;max-width:94vw;overflow-x:auto;scrollbar-width:thin}
#world-nav button{white-space:nowrap;font-size:12px;font-weight:800;padding:9px 12px}
#world-nav button.active{background:#f0cfbf}
#recipe-card{position:fixed;z-index:12;right:15px;top:112px;max-width:215px;background:#fff9efed;border:2px solid #ebc7b8;border-radius:16px;padding:10px 12px;color:#9d7068;font-size:12px;line-height:1.65}
.recipe-head{font-size:14px;font-weight:900}
#pantry-count{margin-top:7px;font-size:11px;line-height:1.9;max-height:180px;overflow:auto}
#scene-curtain{position:fixed;inset:0;background:#faeee9;opacity:0;pointer-events:none;z-index:15;transition:opacity .4s ease}
#scene-curtain.on{opacity:1}
#cook-ui{z-index:22}
#recipe-choose{top:53%}
.cook-choice{flex-wrap:wrap;justify-content:center}
.cook-choice button{min-width:100px;min-height:110px}
.mission{display:none}
@media(max-width:650px){#world-nav{top:6px;gap:2px;padding:4px}#world-nav button{font-size:10px;padding:7px}#recipe-card{top:65px;right:8px;font-size:10px;padding:7px;max-width:145px}header{top:105px}#recipe-choose{top:52%;max-width:95vw}.cook-choice button{min-width:80px;min-height:85px;font-size:25px}}
`;document.head.appendChild(style43);
const title43=document.querySelector('header h1');if(title43)title43.innerHTML='Paw Paw<br>Picnic';
const winCopy=document.querySelector('#finish .card p');if(winCopy)winCopy.innerHTML='✨ 创意料理完成！<br>下一关：完美野餐。';
document.title='Paw Paw Picnic 5.4 · 自由采集';
reset();$('#loading').hidden=true;tick();
