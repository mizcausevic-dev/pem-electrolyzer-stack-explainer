import './style.css'

const TOTAL=1020, FPS=30, W=1280, H=720
type Chapter={start:number,end:number,title:string,sub:string,scale:string,time:string,camera:{x:number,y:number,z:number},body:string}
const CHAPTERS:Chapter[]=[
 {start:0,end:149,title:'Reveal MEA and plates',sub:'The repeating cell, shown in section',scale:'SCALE: SECTIONAL VIEW · NOT TO SCALE',time:'TIME: REAL-TIME REVEAL',camera:{x:640,y:360,z:1.25},body:'One cell repeats across the stack: end plate, bipolar plate, gas diffusion layer, catalyst, membrane, catalyst, gas diffusion layer, bipolar plate. The membrane electrode assembly (MEA) is where the reaction happens. Everything else moves water, gas, electrons, and heat to or from it.'},
 {start:150,end:299,title:'Show water feed',sub:'Water reaches the anode side',scale:'SCALE: FLOW PATHWAY · SCHEMATIC',time:'TIME: COMPRESSED',camera:{x:520,y:330,z:1.05},body:'Deionized water is fed to the anode side of the cell. Flow fields in the bipolar plate distribute it across the active area instead of letting it channel through one path. No reaction has happened yet. This is delivery.'},
 {start:300,end:509,title:'Trace gas evolution',sub:'Protons cross. Electrons take the long way.',scale:'SCALE: MICRO · MEMBRANE DETAIL ENLARGED',time:'SLOW MOTION · ION TRANSPORT',camera:{x:640,y:360,z:1.55},body:'At the anode catalyst, water splits into oxygen, protons, and electrons. Protons cross the membrane. Electrons cannot. They travel through the external circuit, which is the electrical work the system is built around. At the cathode catalyst, protons and electrons recombine as hydrogen.'},
 {start:510,end:749,title:'Show cooling',sub:'Heat leaves through coolant channels',scale:'SCALE: STACK + COOLANT LOOP · SCHEMATIC',time:'TIME: COMPRESSED',camera:{x:640,y:360,z:.92},body:'Not all input energy leaves as chemical energy in hydrogen. Some becomes heat in the stack. Coolant channels and an external loop carry that heat to a heat exchanger. Temperature sensing closes the loop. Cooling is not an accessory. It protects the membrane and keeps the stack in its operating window.'},
 {start:750,end:1019,title:'Pull back to balance of plant',sub:'The stack is one component in a system',scale:'SCALE: SYSTEM VIEW · SCHEMATIC',time:'TIME: COMPRESSED · STEADY STATE',camera:{x:640,y:360,z:.68},body:'The stack needs a plant around it: water purification and feed, power conversion, gas separation, drying, cooling, controls, and safety sensing. Pull back far enough and the electrolyzer stops looking like a single device. It is a small chemical plant with the stack at its center.'},
]
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
const smooth=(t:number)=>t*t*(3-2*t)
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
function chapterAt(f:number){return CHAPTERS.findIndex(c=>f>=c.start&&f<=c.end)}
function cameraAt(f:number){
 const i=chapterAt(f), c=CHAPTERS[i]
 if(i===0) return c.camera
 const prev=CHAPTERS[i-1].camera, t=smooth(clamp((f-c.start)/45,0,1))
 return {x:lerp(prev.x,c.camera.x,t),y:lerp(prev.y,c.camera.y,t),z:lerp(prev.z,c.camera.z,t)}
}
function seeded(n:number){const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x)}

const app=document.querySelector<HTMLDivElement>('#app')!
app.innerHTML=`
<header class="topbar"><div class="brand">KINETIC GAIN <b>◈ MOTION EXPLAINER</b></div><nav><a href="#player">Player</a><a href="#how">How it works</a><a href="#article">Article</a><a href="./article-Cursor.md">Medium draft</a></nav></header>
<section class="hero"><div class="eyebrow">Hydrogen & Fuel Cell Systems · Generic PEM · No efficiency claims</div>
<h1>How a PEM electrolyzer <em>actually</em> splits water.</h1>
<p class="lede">Water in. Hydrogen and oxygen out. In between is a repeating electrochemical cell thinner than the plates that compress it. This 34-second, frame-driven explainer opens that cell in section, follows the water, traces the gases, removes the heat, then pulls back to the plant the stack cannot run without.</p>
<div class="meta-row"><span class="pill">1,020 FRAMES · 0–1019</span><span class="pill">30 FPS · 34 SECONDS</span><span class="pill">DETERMINISTIC TIMELINE</span><span class="pill">SCHEMATIC · NOT A SIMULATION</span><span class="pill">SOURCE: DOE HYDROGEN PRODUCTION</span></div></section>

<main class="stage-wrap" id="player"><div class="stage"><canvas id="stage" width="${W}" height="${H}" aria-label="Animated sectional diagram of a PEM electrolyzer stack"></canvas>
<div class="controls">
<button class="btn primary" id="play">Pause</button><button class="btn" id="restart">Restart</button>
<span class="frame-readout" id="readout">FRAME 0000 / 1019 · 00.0s</span>
<input type="range" id="scrub" min="0" max="1019" value="0" aria-label="Scrub frame"/>
<select id="speed" class="btn" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select>
<button class="btn" id="download">Export PNG frame</button>
</div></div>
<div class="chapters" id="chapters">${CHAPTERS.map((c,i)=>`<button class="chapter" data-i="${i}"><strong>${i+1}. ${c.title}</strong><span>F ${c.start}–${c.end} · ${(c.start/30).toFixed(0)}–${((c.end+1)/30).toFixed(0)}s</span></button>`).join('')}</div>
<p style="color:var(--muted);font-size:12px;line-height:1.6">Deterministic playback: the same frame number always renders the same image. Scrub to any frame to inspect it. Motion is illustrative. Bubbles, ion hops, and flow pulses show direction and sequence, not measured rates.</p>
</main>

<section class="grid" id="how">
<div class="card"><h2 id="chapter-title">Reveal MEA and plates</h2><p id="chapter-body"></p><div class="eq">ANODE&nbsp;&nbsp;2H₂O → O₂ + 4H⁺ + 4e⁻<br>CATHODE&nbsp;4H⁺ + 4e⁻ → 2H₂<br>OVERALL&nbsp;2H₂O → 2H₂ + O₂</div>
<p>Reading the colors: cyan marks the primary pathway under discussion, gold marks electrical energy and actuation, violet marks sensing and state change. These are explanatory overlays, not literal emission colors. Structural hardware stays muted so the overlays remain readable.</p></div>
<div class="card"><h3>Legend</h3><div class="legend">
<div><span class="sw" style="background:#00E5FF"></span><p><strong>Cyan.</strong> Primary pathway: water feed, proton path, hydrogen route.</p></div>
<div><span class="sw" style="background:#FFD166"></span><p><strong>Gold.</strong> Energy and actuation: DC power, electron flow, pumps, valves.</p></div>
<div><span class="sw" style="background:#9D4EDD"></span><p><strong>Violet.</strong> Sensing and state: temperature, pressure, level, control.</p></div>
<div><span class="sw" style="background:#344257"></span><p><strong>Slate.</strong> Structure: plates, frames, housings, piping.</p></div></div>
<h3 style="margin-top:22px">What this product is</h3><p>A reusable, code-driven explainer for hydrogen systems education. Product: deterministic motion explainer. Audience: engineers, students, investors, and technical buyers who need the mechanism before the market claim. It wins by showing causality in sequence instead of narrating over a static cutaway. Discovery: search, Medium, and GitHub Pages. Engagement: scrub, chapter jump, frame export. Conversion: explainer licensing, technical content engagements, and hydrogen program briefings. Monetization: productized explainer packages. Launch: GitHub Pages plus Medium. Improvement: add narrated audio, language captions, and vertical-specific variants from the same frame engine.</p>
<div class="kpis"><div class="kpi"><b>34s</b><span>Runtime</span></div><div class="kpi"><b>1,020</b><span>Deterministic frames</span></div><div class="kpi"><b>5</b><span>Causal chapters</span></div></div></div>
</section>

<article class="article" id="article"><img src="./hero-Cursor.png" alt="PEM electrolyzer stack anatomy hero diagram"/>
<h2>The stack is a repeating argument</h2>
<p>Every PEM electrolyzer makes the same argument, cell after cell: give water a catalyst, a membrane that only protons may cross, and an external path for electrons, and the chemistry has nowhere else to go. Oxygen leaves the anode. Hydrogen leaves the cathode. The full article is shipped in this repository as a publish-ready Medium draft, with SEO title, dek, tags, and image notes.</p>
<p><a href="./article-Cursor.md">Read the full Medium article draft →</a> · <a href="https://www.energy.gov/eere/fuelcells/hydrogen-production" target="_blank" rel="noreferrer">DOE reference: Hydrogen Production</a></p>
<h2>Accuracy boundaries</h2><p>This is a generic PEM explainer. It makes no efficiency claim, names no commercial stack, and publishes no invented specification. Where a mechanism cannot be drawn faithfully at this scale, the player labels it as a schematic, enlarged, in slow motion, or time-compressed. Verify subject-specific details before publication or engineering use.</p></article>
<footer>Built in code. Deterministic frame timeline, 0–1019 at 30 fps. Reference supports the underlying electrolysis process. Camera moves, palette, cutaways, and timing are original illustrative directions, not experimentally validated observations. Not a certified design, simulation result, or claim about a specific commercial implementation.<br>GitHub About: Code-driven 34-second anatomy motion explainer of a generic PEM electrolyzer stack. Topics: pem-electrolyzer, hydrogen, electrolysis, fuel-cells, motion-design, canvas-animation, technical-explainer, green-hydrogen, energy-systems, typescript</footer>
`

const canvas=document.querySelector<HTMLCanvasElement>('#stage')!
const ctx=canvas.getContext('2d')!
let frame=0, playing=true, last=performance.now(), speed=1
const readout=document.querySelector('#readout')!, scrub=document.querySelector<HTMLInputElement>('#scrub')!, playBtn=document.querySelector<HTMLButtonElement>('#play')!
const titleEl=document.querySelector('#chapter-title')!, bodyEl=document.querySelector('#chapter-body')!
const chapterBtns=[...document.querySelectorAll<HTMLButtonElement>('.chapter')]

function label(x:number,y:number,text:string,color:string,align:CanvasTextAlign='left',size=15){
 ctx.font=`700 ${size}px "Space Grotesk",sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(text,x,y)
 ctx.font=`11px "JetBrains Mono",monospace`
}
function leader(x1:number,y1:number,x2:number,y2:number,color:string){ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x1,y1,3.5,0,7);ctx.fill()}
function box(x:number,y:number,w:number,h:number,fill:string,stroke='#24334D',r=10){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();ctx.stroke()}
function arrow(x1:number,y1:number,x2:number,y2:number,color:string,w=3){ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-10*Math.cos(a-.45),y2-10*Math.sin(a-.45));ctx.lineTo(x2-10*Math.cos(a+.45),y2-10*Math.sin(a+.45));ctx.fill()}

function drawStack(f:number,ci:number){
 const cx=640,cy=380
 // BOP backdrop in ch4
 if(ci===4){
   const items:[string,number,number,string][]=[['DI WATER\nFEED',150,470,'#00E5FF'],['PUMP',330,470,'#FFD166'],['DC POWER',330,180,'#FFD166'],['GAS-LIQUID\nSEPARATOR',930,180,'#00E5FF'],['DRYER',1080,300,'#9D4EDD'],['H₂ OUT',1080,470,'#00E5FF'],['HEAT\nEXCHANGER',930,470,'#9D4EDD'],['CONTROLS\n+ SENSING',150,180,'#9D4EDD']]
   ctx.strokeStyle='#24334D';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(230,500);ctx.lineTo(520,430);ctx.moveTo(400,210);ctx.lineTo(540,300);ctx.moveTo(740,300);ctx.lineTo(930,220);ctx.moveTo(740,430);ctx.lineTo(930,500);ctx.stroke()
   items.forEach(([t,x,y,c])=>{box(x-70,y-38,140,76,'#111A2A',c,12);ctx.fillStyle='#E8EEF7';ctx.font='700 13px "Space Grotesk"';ctx.textAlign='center';t.split('\n').forEach((ln,i)=>ctx.fillText(ln,x,y-6+i*16))})
   label(640,92,'BALANCE OF PLANT · THE STACK DOES NOT RUN ALONE','#E8EEF7','center',22)
 }
 // stack body
 const spread=ci===0? (0.55+0.45*smooth(clamp(f/110,0,1))) : 1
 const layers:[string,string,number][]=[
  ['END PLATE','#2A364C',54],['BIPOLAR PLATE','#344257',30],['GDL · ANODE','#46586F',18],['CATALYST · ANODE','#FFD166',10],['MEMBRANE','#E8EEF7',12],['CATALYST · CATHODE','#FFD166',10],['GDL · CATHODE','#46586F',18],['BIPOLAR PLATE','#344257',30],['END PLATE','#2A364C',54]]
 let x=cx-((layers.reduce((s,l)=>s+l[2],0))*spread)/2
 const top=cy-125
 layers.forEach(([_name,color,w],idx)=>{ void _name;
   const ww=w*spread
   box(x,top,ww,250,idx===4?'#DCE9F5':color,idx===4?'#00E5FF':'#0B1019',4)
   if(idx===1||idx===7){ctx.fillStyle='#0B1019';for(let i=0;i<5;i++)ctx.fillRect(x+5,top+24+i*44,ww-10,16)}
   x+=ww
   if(ci===0&&f>35){ if(idx===4) {leader(cx,top-6,860,150,'#00E5FF');label(866,146,'MEMBRANE (MEA CORE)','#00E5FF')} if(idx===3){leader(cx-22,top+250,300,610,'#FFD166');label(296,626,'ANODE CATALYST','#FFD166','right')} if(idx===5){leader(cx+22,top+250,980,610,'#FFD166');label(984,626,'CATHODE CATALYST','#FFD166')} if(idx===1){leader(430,top+8,250,150,'#93A4BC');label(244,146,'BIPOLAR PLATE · FLOW FIELD','#93A4BC','right')}}
 })
 // tie rods
 ctx.fillStyle='#5A6B84';[-150,150].forEach(dy=>{ctx.fillRect(cx-235,cy+dy-6,470,12)})
 label(cx,top-28,ci===4?'PEM STACK (REPEATING CELLS)':'SINGLE CELL · SECTIONAL VIEW','#E8EEF7','center',16)

 // water feed
 if(ci>=1){
   const p=smooth(clamp((f-CHAPTERS[1].start)/60,0,1))
   ctx.strokeStyle='#00E5FF';ctx.lineWidth=5;ctx.setLineDash([14,10]);ctx.lineDashOffset=-f*1.2;ctx.beginPath();ctx.moveTo(90,470);ctx.lineTo(360,470);ctx.lineTo(430,430);ctx.stroke();ctx.setLineDash([])
   if(p>0) arrow(300,470,395,470,'#00E5FF',4)
   label(92,450,'DI WATER IN','#00E5FF');leader(430,430,300,220,'#00E5FF');label(294,216,'FLOW FIELD DISTRIBUTES WATER','#00E5FF','right',13)
   // moving pulses deterministic
   for(let i=0;i<6;i++){const t=((f*0.008+i/6)%1);ctx.fillStyle='#00E5FF';ctx.beginPath();ctx.arc(90+t*330,470,5,0,7);ctx.fill()}
 }
 // gas evolution
 if(ci===2){
   for(let i=0;i<26;i++){const s=seeded(i*3+1), bx=560+s*60, by=560-((f*(0.7+s)+i*37)%300);ctx.strokeStyle='#93A4BC';ctx.beginPath();ctx.arc(bx,by,4+s*5,0,7);ctx.stroke()}
   for(let i=0;i<26;i++){const s=seeded(i*7+2), bx=660+s*60, by=560-((f*(0.9+s)+i*29)%300);ctx.strokeStyle='#00E5FF';ctx.beginPath();ctx.arc(bx,by,4+s*5,0,7);ctx.stroke()}
   for(let i=0;i<5;i++){const t=((f*0.012+i/5)%1);ctx.fillStyle='#00E5FF';ctx.beginPath();ctx.arc(590+t*100,380+(seeded(i)-.5)*10,5,0,7);ctx.fill();label(594,350,'H⁺','#00E5FF','left',12)}
   arrow(700,250,880,180,'#00E5FF',4);label(884,176,'H₂ OUT','#00E5FF')
   arrow(580,250,390,180,'#93A4BC',4);label(386,176,'O₂ OUT','#93A4BC','right')
   // electron external circuit gold
   ctx.strokeStyle='#FFD166';ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.lineDashOffset=-f*1.4;ctx.beginPath();ctx.moveTo(560,255);ctx.lineTo(560,130);ctx.lineTo(720,130);ctx.lineTo(720,255);ctx.stroke();ctx.setLineDash([]);label(640,118,'e⁻ · EXTERNAL CIRCUIT · DC POWER','#FFD166','center',13)
   box(920,360,250,120,'#111A2A','#FFD166',12);ctx.fillStyle='#E8EEF7';ctx.font='700 13px "Space Grotesk"';ctx.textAlign='left';ctx.fillText('HALF-REACTIONS',940,392);ctx.font='12px "JetBrains Mono"';ctx.fillStyle='#93A4BC';ctx.fillText('ANODE  2H₂O → O₂+4H⁺+4e⁻',940,422);ctx.fillText('CATHODE 4H⁺+4e⁻ → 2H₂',940,446)
 }
 // cooling
 if(ci===3){
   ctx.strokeStyle='#9D4EDD';ctx.lineWidth=4;ctx.setLineDash([16,10]);ctx.lineDashOffset=-f;ctx.beginPath();ctx.moveTo(410,560);ctx.lineTo(870,560);ctx.lineTo(980,470);ctx.stroke();ctx.setLineDash([])
   arrow(760,560,860,560,'#9D4EDD',4);label(700,590,'COOLANT LOOP','#9D4EDD','center')
   box(950,410,180,110,'#111A2A','#9D4EDD',12);label(1040,452,'HEAT','#E8EEF7','center',16);label(1040,474,'EXCHANGER','#E8EEF7','center',16)
   const pulse=.5+.5*Math.sin(f*.08);ctx.strokeStyle=`rgba(157,78,221,${.4+.4*pulse})`;ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(cx,cy,150+i*22,0,7);ctx.stroke()}
   leader(760,300,1010,220,'#9D4EDD');label(1014,216,'TEMPERATURE SENSING','#9D4EDD')
   label(240,220,'HEAT LEAVES THE STACK','#E8EEF7','left',16);label(240,244,'IT DOES NOT LEAVE AS H₂','#93A4BC','left',12)
 }
 // steady system flow in ch4
 if(ci===4){ctx.strokeStyle='#00E5FF';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.lineDashOffset=-f;ctx.beginPath();ctx.moveTo(740,430);ctx.lineTo(1010,500);ctx.stroke();ctx.setLineDash([])}
}

function render(f:number){
 const ci=chapterAt(f), cam=cameraAt(f), ch=CHAPTERS[ci]
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#0B1019';ctx.fillRect(0,0,W,H)
 // grid
 ctx.strokeStyle='rgba(255,255,255,.045)';ctx.lineWidth=1;for(let x=0;x<W;x+=44){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=44){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 ctx.save();ctx.translate(W/2,H/2);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);drawStack(f,ci);ctx.restore()
 // HUD
 box(22,18,430,86,'rgba(17,26,42,.92)','#24334D',12);label(40,46,`0${ci+1} / 05 · ${ch.title.toUpperCase()}`,'#00E5FF','left',15);ctx.fillStyle='#93A4BC';ctx.font='13px "Space Grotesk"';ctx.textAlign='left';ctx.fillText(ch.sub,40,70);ctx.fillStyle='#FFD166';ctx.font='11px "JetBrains Mono"';ctx.fillText(ch.scale,40,92)
 box(908,18,350,86,'rgba(17,26,42,.92)','#24334D',12);label(926,46,ch.time,'#9D4EDD','left',12);ctx.fillStyle='#E8EEF7';ctx.font='700 20px "JetBrains Mono"';ctx.fillText(`F ${String(f).padStart(4,'0')} / 1019`,926,74);ctx.fillStyle='#93A4BC';ctx.font='11px "JetBrains Mono"';ctx.fillText(`${(f/30).toFixed(1)}s · 30 FPS · DETERMINISTIC`,926,92)
 // progress segments
 CHAPTERS.forEach((c,i)=>{const x=22+i*248,w=236;ctx.fillStyle='#24334D';ctx.fillRect(x,676,w,8);ctx.fillStyle=i<ci?'#344257':i===ci?'#00E5FF':'#24334D';const p=i===ci?clamp((f-c.start)/(c.end-c.start),0,1):i<ci?1:0;ctx.fillRect(x,676,w*p,8)})
 ctx.fillStyle='#93A4BC';ctx.font='11px "JetBrains Mono"';ctx.textAlign='left';ctx.fillText('GENERIC PEM · SCHEMATIC · NO EFFICIENCY CLAIMS · VERIFY BEFORE PUBLICATION',22,664)
 readout.textContent=`FRAME ${String(f).padStart(4,'0')} / 1019 · ${(f/30).toFixed(1)}s · CH ${ci+1}/5`
 if(document.activeElement!==scrub) scrub.value=String(f)
 titleEl.textContent=`${ci+1}. ${ch.title}`;bodyEl.textContent=ch.body
 chapterBtns.forEach((b,i)=>b.classList.toggle('active',i===ci))
}
function loop(now:number){
 if(playing){frame=(frame+Math.floor((now-last)/ (1000/FPS) * speed))%TOTAL; if(frame<0)frame+=TOTAL}
 last=now;render(frame);requestAnimationFrame(loop)
}
playBtn.onclick=()=>{playing=!playing;playBtn.textContent=playing?'Pause':'Play'}
document.querySelector('#restart')!.addEventListener('click',()=>frame=0)
scrub.addEventListener('input',()=>frame=Number(scrub.value))
document.querySelector('#speed')!.addEventListener('change',e=>speed=Number((e.target as HTMLSelectElement).value))
chapterBtns.forEach(b=>b.onclick=()=>frame=CHAPTERS[Number(b.dataset.i)].start)
document.querySelector('#download')!.addEventListener('click',()=>{const a=document.createElement('a');a.download=`pem-frame-${String(frame).padStart(4,'0')}.png`;a.href=canvas.toDataURL('image/png');a.click()})
addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();playBtn.click()} if(e.key==='ArrowRight')frame=(frame+1)%TOTAL; if(e.key==='ArrowLeft')frame=(frame+TOTAL-1)%TOTAL})
requestAnimationFrame(loop)
