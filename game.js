import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = id => document.getElementById(id);
let scene,camera,renderer,boardGroup,coins=[],striker,aimLine,raycaster,plane;
let mode='bot', currentPlayer=1, scores=[0,0], power=65, aiming=false, aimStart=null, aimVector=new THREE.Vector3(), moving=false, shotMade=false, turnTimer=0, soundOn=true;
const coinRadius=.34, boardHalf=4.1, pocketRadius=.48;
const coinColors={white:0xf0e9d9,black:0x202b3d,queen:0xc91f43,striker:0x38c8ee};

function showToast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function startGame(){ $('lobby').classList.add('hidden');$('game').classList.remove('hidden');$('result').classList.add('hidden');init3D();resetGame(); }
function backLobby(){ $('game').classList.add('hidden');$('lobby').classList.remove('hidden');$('result').classList.add('hidden'); if(renderer){renderer.dispose();$('scene').innerHTML='';renderer=null;} }
function init3D(){
 const host=$('scene'); if(renderer){renderer.dispose();host.innerHTML='';}
 scene=new THREE.Scene();scene.background=new THREE.Color(0x17253b);
 camera=new THREE.PerspectiveCamera(38,host.clientWidth/host.clientHeight,.1,100);camera.position.set(0,10.8,8.7);camera.lookAt(0,0,0);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xd8edff,0x4b2b1b,2.1));
 const light=new THREE.DirectionalLight(0xffe3b3,3);light.position.set(-4,9,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
 boardGroup=new THREE.Group();scene.add(boardGroup);
 const wood=new THREE.MeshStandardMaterial({color:0x9c5c2e,roughness:.55});
 const base=new THREE.Mesh(new THREE.BoxGeometry(9.3,.48,9.3),wood);base.position.y=-.35;base.receiveShadow=true;base.castShadow=true;boardGroup.add(base);
 const surface=new THREE.Mesh(new THREE.BoxGeometry(8.3,.16,8.3),new THREE.MeshStandardMaterial({color:0xd9b77c,roughness:.78}));surface.position.y=-.05;surface.receiveShadow=true;boardGroup.add(surface);
 const borderMat=new THREE.MeshStandardMaterial({color:0x60351f,roughness:.5});
 for(let i=0;i<4;i++){let rail=new THREE.Mesh(new THREE.BoxGeometry(i%2?8.7:.38,.3,i%2?.38:8.7),borderMat);rail.position.set(i===0?0:i===1?0:i===2?-4.25:4.25,.16,i===0?-4.25:i===1?4.25:0);rail.castShadow=true;boardGroup.add(rail);}
 // pocket rings and holes
 const ringMat=new THREE.MeshStandardMaterial({color:0x24170f,roughness:.9});
 const pocketPos=[[-3.86,-3.86],[3.86,-3.86],[-3.86,3.86],[3.86,3.86]];
 pocketPos.forEach(([x,z])=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.08,32),ringMat);p.position.set(x,.055,z);boardGroup.add(p);const rim=new THREE.Mesh(new THREE.TorusGeometry(.49,.055,10,32),new THREE.MeshStandardMaterial({color:0xd99a4e,metalness:.25,roughness:.4}));rim.rotation.x=Math.PI/2;rim.position.set(x,.1,z);boardGroup.add(rim);});
 const lineMat=new THREE.MeshBasicMaterial({color:0x9a4933});
 const addLine=(x,z,sx,sz)=>{let l=new THREE.Mesh(new THREE.BoxGeometry(sx,.012,sz),lineMat);l.position.set(x,.04,z);boardGroup.add(l)};
 addLine(0,0,4.8,.025);addLine(0,0,.025,4.8);
 const circle=new THREE.Mesh(new THREE.TorusGeometry(1.12,.018,8,64),lineMat);circle.rotation.x=Math.PI/2;circle.position.y=.045;boardGroup.add(circle);
 const mat=new THREE.MeshStandardMaterial({color:0x713d26,roughness:.4});
 for(const z of [-3.15,3.15]){const l=new THREE.Mesh(new THREE.BoxGeometry(5.7,.02,.025),mat);l.position.set(0,.05,z);boardGroup.add(l);}
 plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.22);raycaster=new THREE.Raycaster();
 aimLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0x43eaff}));aimLine.visible=false;scene.add(aimLine);
 host.addEventListener('pointerdown',onPointerDown);host.addEventListener('pointermove',onPointerMove);host.addEventListener('pointerup',onPointerUp);
 window.addEventListener('resize',resize3D);animate();
}
function resize3D(){if(!renderer)return;const host=$('scene');camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);}
function makeCoin(type,x,z){const color=coinColors[type];const mat=new THREE.MeshStandardMaterial({color,metalness:type==='striker'?.35:.12,roughness:.3});const geo=new THREE.CylinderGeometry(type==='striker'?.42:coinRadius,type==='striker'?.42:coinRadius,.18,40);const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,.19,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={type,vx:0,vz:0,active:true};boardGroup.add(mesh);
 const edge=new THREE.Mesh(new THREE.TorusGeometry(type==='striker'?.36:.28,.035,8,32),new THREE.MeshStandardMaterial({color:type==='white'?0xb5a78f:type==='black'?0x68758a:type==='queen'?0xff879b:0xb9f5ff,metalness:.4}));edge.rotation.x=Math.PI/2;edge.position.y=.105;mesh.add(edge);coins.push(mesh);return mesh;}
function clearCoins(){coins.forEach(c=>boardGroup.remove(c));coins=[];}
function resetGame(){clearCoins();scores=[0,0];currentPlayer=1;moving=false;shotMade=false;$('p1score').textContent='0 POINTS';$('p2score').textContent='0 POINTS';$('p1name').textContent='YOU';$('p2name').textContent=mode==='bot'?'ROBOT':mode==='practice'?'PRACTICE':'PLAYER 2';$('result').classList.add('hidden');
 const positions=[];positions.push([0,0,'queen']);for(let i=0;i<6;i++){let a=i*Math.PI/3;positions.push([Math.cos(a)*.72,Math.sin(a)*.72,i%2?'white':'black']);}for(let i=0;i<12;i++){let a=i*Math.PI/6;positions.push([Math.cos(a)*1.38,Math.sin(a)*1.38,i%2?'black':'white']);}
 positions.forEach(p=>makeCoin(p[2],p[0],p[1]));striker=makeCoin('striker',0,2.85);updateTurn(); }
function updateTurn(){$('turnText').textContent=currentPlayer===1?'YOUR TURN':mode==='bot'?'ROBOT TURN':'PLAYER 2 TURN';$('hintText').textContent=currentPlayer===1?'Drag from striker backwards to aim':'Wait for the next shot';}
function pointerPoint(e){const rect=renderer.domElement.getBoundingClientRect();const ndc=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(ndc,camera);const hit=new THREE.Vector3();raycaster.ray.intersectPlane(plane,hit);return hit;}
function onPointerDown(e){if(moving||!striker?.userData.active||currentPlayer!==1)return;const p=pointerPoint(e);if(!p)return;const d=Math.hypot(p.x-striker.position.x,p.z-striker.position.z);if(d<1.35){aiming=true;aimStart=p;renderer.domElement.setPointerCapture(e.pointerId);}}
function onPointerMove(e){if(!aiming)return;const p=pointerPoint(e);if(!p)return;aimVector.set(striker.position.x-p.x,0,striker.position.z-p.z);if(aimVector.length()>3.2)aimVector.setLength(3.2);const end=striker.position.clone().add(aimVector.clone().normalize().multiplyScalar(2.3));aimLine.geometry.setFromPoints([new THREE.Vector3(striker.position.x,.42,striker.position.z),new THREE.Vector3(end.x,.42,end.z)]);aimLine.visible=true;}
function onPointerUp(){if(!aiming)return;aiming=false;aimLine.visible=false;if(aimVector.length()>.12)shoot(aimVector.clone().normalize());}
function shoot(dir){if(moving||currentPlayer!==1)return;const p=Number($('power').value)/100;striker.userData.vx=dir.x*(.12+p*.28);striker.userData.vz=dir.z*(.12+p*.28);moving=true;shotMade=true;showToast('SHOT!');}
function animate(){requestAnimationFrame(animate);if(!renderer)return;const dt=Math.min(renderer.info?1/60:.016,.025);if(moving)physics(dt);renderer.render(scene,camera);}
function physics(dt){let activeMoving=false;for(let i=0;i<coins.length;i++){const a=coins[i];if(!a.userData.active)continue;let u=a.userData; a.position.x+=u.vx*dt*60;a.position.z+=u.vz*dt*60;u.vx*=.986;u.vz*=.986;if(Math.abs(u.vx)+Math.abs(u.vz)>.009)activeMoving=true;else{u.vx=0;u.vz=0;}
 const limit=3.73;if(Math.abs(a.position.x)>limit){a.position.x=Math.sign(a.position.x)*limit;u.vx*=-.68;}if(Math.abs(a.position.z)>limit){a.position.z=Math.sign(a.position.z)*limit;u.vz*=-.68;}
 if(pocketed(a.position.x,a.position.z)){if(u.type==='striker'){a.position.set(0,.19,2.85);u.vx=0;u.vz=0;showToast('FOUL! Striker pocketed');}else{u.active=false;boardGroup.remove(a);if(currentPlayer===1)scores[0]+=u.type==='queen'?3:1;else scores[1]+=u.type==='queen'?3:1;updateScores();}}
 }
 // coin collision
 for(let i=0;i<coins.length;i++)for(let j=i+1;j<coins.length;j++){const a=coins[i],b=coins[j];if(!a.userData.active||!b.userData.active)continue;let dx=b.position.x-a.position.x,dz=b.position.z-a.position.z,dist=Math.hypot(dx,dz),min=(a.userData.type==='striker'?.42:coinRadius)+(b.userData.type==='striker'?.42:coinRadius);if(dist>0&&dist<min){let nx=dx/dist,nz=dz/dist,over=min-dist;a.position.x-=nx*over/2;a.position.z-=nz*over/2;b.position.x+=nx*over/2;b.position.z+=nz*over/2;let rel=(a.userData.vx-b.userData.vx)*nx+(a.userData.vz-b.userData.vz)*nz;if(rel>0){a.userData.vx-=rel*nx*.88;a.userData.vz-=rel*nz*.88;b.userData.vx+=rel*nx*.88;b.userData.vz+=rel*nz*.88;}}}
 if(!activeMoving){moving=false;if(shotMade){shotMade=false;setTimeout(nextTurn,500);}}
}
function pocketed(x,z){return [[-3.86,-3.86],[3.86,-3.86],[-3.86,3.86],[3.86,3.86]].some(([px,pz])=>Math.hypot(x-px,z-pz)<pocketRadius);}
function updateScores(){$('p1score').textContent=scores[0]+' POINTS';$('p2score').textContent=scores[1]+' POINTS';const left=coins.filter(c=>c.userData.active&&c.userData.type!=='striker').length;if(left===0)finishMatch();}
function nextTurn(){if(mode==='practice'){currentPlayer=1;striker.position.set(0,.19,2.85);updateTurn();return;}currentPlayer=currentPlayer===1?2:1;striker.position.set(0,.19,currentPlayer===1?2.85:-2.85);updateTurn();if(currentPlayer===2&&mode==='bot')setTimeout(botShot,850);}
function botShot(){if(currentPlayer!==2||moving)return;const targets=coins.filter(c=>c.userData.active&&c.userData.type!=='striker');if(!targets.length)return;const target=targets[Math.floor(Math.random()*targets.length)];const dir=new THREE.Vector3(target.position.x-striker.position.x,0,target.position.z-striker.position.z).normalize();striker.userData.vx=dir.x*.25;striker.userData.vz=dir.z*.25;moving=true;shotMade=true;}
function finishMatch(){const win=scores[0]>=scores[1];$('resultTitle').textContent=win?'YOU WIN!':'MATCH OVER';$('resultText').textContent=`Final score: ${scores[0]} - ${scores[1]}`;$('result').classList.remove('hidden');}
$('playBtn').onclick=startGame;$('homeBtn').onclick=backLobby;$('resetBtn').onclick=resetGame;$('againBtn').onclick=()=>{resetGame();};$('lobbyBtn').onclick=backLobby;
$('power').oninput=e=>{$('powerValue').textContent=e.target.value+'%';};
$('strikeBtn').onclick=()=>{if(aimVector.length()>.1)shoot(aimVector.clone().normalize());else showToast('Striker ke paas touch karke aim karo');};
$('soundBtn').onclick=()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'♫':'♪';showToast(soundOn?'Sound indicator on':'Sound indicator off');};
document.querySelectorAll('.mode-card').forEach(b=>b.onclick=()=>{document.querySelectorAll('.mode-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');mode=b.dataset.mode;});
