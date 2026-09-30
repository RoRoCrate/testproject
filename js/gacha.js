let current=0, selectedPack=null, data={identities:[],egos:[],packs:[]};

const track=document.getElementById("track"), slides=document.querySelectorAll(".slide"), dotsBox=document.getElementById("dots");
slides.forEach((_,i)=>{const b=document.createElement("button");b.className="dot"+(!i?" active":"");b.onclick=()=>{current=i;updateCarousel()};dotsBox.appendChild(b)});
function updateCarousel(){track.style.transform=`translateX(-${current*100}%)`;[...dotsBox.children].forEach((d,i)=>d.classList.toggle("active",i===current))}
prev.onclick=()=>{current=(current-1+slides.length)%slides.length;updateCarousel()};next.onclick=()=>{current=(current+1)%slides.length;updateCarousel()};

async function loadTSV(path){const r=await fetch(path);if(!r.ok)throw Error(path);const lines=(await r.text()).trim().split(/\r?\n/),h=lines.shift().split("\t");return lines.filter(Boolean).map(x=>{const v=x.split("\t"),o={};h.forEach((k,i)=>o[k]=v[i]||"");return o})}
async function loadData(){try{data.identities=await loadTSV("data/identity.tsv");data.egos=await loadTSV("data/ego.tsv");data.packs=await loadTSV("data/packs.tsv")}catch(e){data={identities:[{id:"id001",name:"騾壼ｸｸ莠ｺ譬ｼ A",rarity:"笘�2",type:"normal",weight:"70"},{id:"id002",name:"騾壼ｸｸ莠ｺ譬ｼ B",rarity:"笘�3",type:"normal",weight:"25"},{id:"id003",name:"騾壼ｸｸ莠ｺ譬ｼ C",rarity:"笘�4",type:"normal",weight:"5"},{id:"id999",name:"迚ｹ逡ｰ莠ｺ譬ｼ A",rarity:"笘�4",type:"special",weight:"100"},{id:"id101",name:"豌ｷ邨占穐豬ｷ霍ｯ 闊ｹ蜩｡",rarity:"笘�3",type:"normal",weight:"40",pack:"pack001"},{id:"id102",name:"豌ｷ邨占穐霍ｯ 闊ｪ豬ｷ螢ｫ",rarity:"笘�3",type:"normal",weight:"35",pack:"pack001"},{id:"id103",name:"豌ｷ邨占穐霍ｯ 闊ｹ髟ｷ",rarity:"笘�4",type:"normal",weight:"25",pack:"pack001"}],egos:[{id:"ego001",name:"E.G.O A",rarity:"笘�2",weight:"70",danger:"WAW",resource:"諞､諤� ﾃ� 2 / 濶ｲ谺ｲ ﾃ� 1",keywords:"豌ｷ邨� / 髦ｲ蠕｡ / 謖ｯ蜍�",description:"縺薙�ｮE.G.O縺ｯ豌ｷ邨舌→髦ｲ蠕｡繧堤ｵ�縺ｿ蜷医ｏ縺帙◆諤ｧ雉ｪ繧呈戟縺､E.G.O縺ｧ縺吶�"},{id:"ego002",name:"E.G.O B",rarity:"笘�3",weight:"25",danger:"HE",resource:"諤�諠ｰ ﾃ� 2",keywords:"蜃ｺ陦 / 譁ｬ謦�",description:"縺薙�ｮE.G.O縺ｯ謾ｻ謦�縺ｨ迥ｶ諷狗焚蟶ｸ繧帝㍾隕悶＠縺滓ｧ雉ｪ繧呈戟縺､E.G.O縺ｧ縺吶�"},{id:"ego003",name:"E.G.O C",rarity:"笘�4",weight:"5",danger:"ALEPH",resource:"諞､諤� ﾃ� 3 / 證ｴ鬟� ﾃ� 2",keywords:"遐ｴ陬� / 謖ｯ蜍� / 蜿肴茶",description:"縺薙�ｮE.G.O縺ｯ髱槫ｸｸ縺ｫ蠑ｷ縺�諤ｧ雉ｪ繧呈戟縺､E.G.O縺ｧ縺吶�"}],packs:[{id:"pack001",name:"豌ｷ邨占穐豬ｷ霍ｯ",description:"豌ｷ邨占穐豬ｷ霍ｯ縺ｫ逋ｻ蝣ｴ縺吶ｋ莠ｺ譬ｼ繧呈歓蜃ｺ縺励∪縺吶�"}]}}}

function openPackSelector(){packList.innerHTML=data.packs.map(p=>`<div class="pack-card" onclick="openPackDetail('${p.id}')"><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p></div>`).join("");packModal.classList.add("open")}
function closePackSelector(){packModal.classList.remove("open")}
function openPackDetail(id){selectedPack=data.packs.find(p=>p.id===id);detailTitle.textContent=selectedPack.name;detailDescription.textContent=selectedPack.description||"";const a = data.identities.filter(x => (x.pack || "").split(",").map(p => p.trim()).includes(id));detailItems.innerHTML=a.length?a.map(x=>`<div class="item">${esc(x.name)}<span class="rarity">${esc(x.type==="special"?"迚ｹ逡ｰ莠ｺ譬ｼ":"騾壼ｸｸ莠ｺ譬ｼ")}</span></div>`).join(""):`<div class="item">逋ｻ骭ｲ繝�繝ｼ繧ｿ縺ｪ縺�</div>`;closePackSelector();detailModal.classList.add("open");packExtractButton.onclick=()=>{closeDetail();startExtraction("pack",id)}}
function closeDetail(){detailModal.classList.remove("open")}
function weighted(pool){let n=pool.reduce((s,x)=>s+Number(x.weight||1),0),r=Math.random()*n;for(const x of pool){r-=Number(x.weight||1);if(r<=0)return x}return pool.at(-1)}
function rarityClass(x){let r=String(x.rarity||"");return r.includes("4")?"legendary":r.includes("3")?"epic":r.includes("2")?"rare":"common"}
function rankClass(x){return String(x.danger||"").toUpperCase().replace(/[^A-Z]/g,"")}
function resultLabel(x){if(String(x.type||"")==="ego")return String(x.danger||"窶�");return String(x.type||"normal")==="special"?"迚ｹ逡ｰ莠ｺ譬ｼ":"騾壼ｸｸ莠ｺ譬ｼ"}
function formatList(value){return esc(value||"窶�").replace(/\s*\/\s*/g,"<br>")}
function startExtraction(type,pack){let p=type==="ego"?data.egos:type==="special"?data.identities.filter(x=>x.type==="special"):type === "pack" ? data.identities.filter(x => (x.pack || "").split(",").map(p => p.trim()).includes(pack)):data.identities.filter(x=>x.type==="normal"||!x.type);if(!p.length)return alert("謚ｽ蜃ｺ蟇ｾ雎｡縺後≠繧翫∪縺帙ｓ縲�");const result=weighted(p);runGacha({...result,type:type==="ego"?"ego":(result.type||"normal")})}

function runGacha(result){
  const screen=animationScreen,card=summonCard,front=cardFront,scene=resultScene;
  const isEgo=String(result.type||"")==="ego";
  screen.className="animation-screen active";scene.className="result-scene";card.className="summon-card";front.className="card-front";
  front.innerHTML="";
  tapMessage.textContent="謚ｽ蜃ｺ荳ｭ窶ｦ窶ｦ";resultInfo.className="result-info";resultName.textContent="";resultRarity.textContent="";resultPerformance.innerHTML="";shareStatus.textContent="";

  setTimeout(()=>{
    card.classList.add(isEgo?"rank-"+rankClass(result):"identity-"+(result.type==="special"?"special":"normal"));
    card.classList.add("rarity-"+rarityClass(result));
    tapMessage.textContent="繧ｫ繝ｼ繝峨ｒ繧ｯ繝ｪ繝�繧ｯ縺励※遒ｺ隱�";
  },2200);

  card.onclick=()=>{
    front.classList.add("show");
    
    // TSV蜀�縺ｫ image 蛻励′縺ゅｌ縺ｰ蜆ｪ蜈域欠螳壹ら┌縺代ｌ縺ｰ images/cards/{id}.jpg 繧貞盾辣ｧ
    //const imgSrc = result.image || `images/cards/${result.id}.jpg`;
    const imgSrc = result.image || `images/cards/test.png`;

    // 繧ｫ繝ｼ繝我ｸ翫↓縺ｯ繝�繧ｭ繧ｹ繝医ｒ荳蛻�鄂ｮ縺九★縲∫判蜒上�ｮ縺ｿ繧定｡ｨ遉ｺ
    front.innerHTML=`
      <div class="card-image-wrap">
        <img src="${imgSrc}" alt="${esc(result.name)}" class="card-img" onerror="this.classList.add('img-error');">
      </div>
    `;

    tapMessage.textContent="";
    setTimeout(()=>{
      scene.classList.add("revealed");
      resultName.textContent=result.name;
      resultRarity.textContent=isEgo?(result.danger||"窶�"):resultLabel(result);
      resultRarity.className="result-rarity "+(isEgo?"rank-text-"+rankClass(result):"identity-type");

      if(isEgo){
        resultPerformance.innerHTML=`
        <div class="identity-detail ego-detail">
          <div class="identity-section"><div class="identity-label">[蠢�隕∬ｳ�貅疹</div><div class="identity-value">${formatList(result.resource)}</div></div>
          <div class="identity-section"><div class="identity-label">[荳ｻ隕√く繝ｼ繝ｯ繝ｼ繝云</div><div class="identity-value">${formatList(result.keywords)}</div></div>
          <div class="ego-rank-line">繝ｩ繝ｳ繧ｯ�ｼ�<strong>${esc(result.danger||"窶�")}</strong></div>
          <div class="identity-section description-section"><div class="identity-label">邁｡譏楢ｪｬ譏�</div><div class="identity-description">${esc(result.description||"縺薙�ｮE.G.O縺ｫ縺､縺�縺ｦ縺ｮ隱ｬ譏弱�ｯ縺ゅｊ縺ｾ縺帙ｓ縲�")}</div></div>
        </div>`;
      }else{
        resultPerformance.innerHTML=`
        <div class="identity-detail">
          <div class="identity-section"><div class="identity-label">[謇螻枉</div><div class="identity-value">${esc(result.affiliation||"窶�")}</div></div>
          <div class="identity-section"><div class="identity-label">[荳ｻ隕√く繝ｼ繝ｯ繝ｼ繝云</div><div class="identity-value">${esc(result.keywords||"窶�")}</div></div>
          <div class="identity-status">
            <div class="identity-status-left">
              <div>HP�ｼ�<strong>${esc(result.hp||"窶�")}</strong></div>
              <div>SAN�ｼ�<strong>${esc(result.san||"窶�")}</strong></div>
              <div>騾溷ｺｦ�ｼ�<strong>${esc(result.speed||"窶�")}</strong></div>
              ${String(result.bullets||"").trim()?`<div>蠑ｾ荳ｸ�ｼ�<strong>${esc(result.bullets)}</strong></div>`:""}
            </div>
            <div class="identity-status-right">
              <div>譁ｬ謦��ｼ�<strong>${esc(result.slash||"窶�")}</strong></div>
              <div>雋ｫ騾夲ｼ�<strong>${esc(result.pierce||"窶�")}</strong></div>
              <div>謇捺茶�ｼ�<strong>${esc(result.blunt||"窶�")}</strong></div>
            </div>
          </div>
          <div class="identity-section description-section"><div class="identity-label">邁｡譏楢ｪｬ譏�</div><div class="identity-description">${esc(result.description||"縺薙�ｮ莠ｺ譬ｼ縺ｫ縺､縺�縺ｦ縺ｮ隱ｬ譏弱�ｯ縺ゅｊ縺ｾ縺帙ｓ縲�")}</div></div>
        </div>`;
      }
    },500);
  };

  shareButton.onclick=()=>shareResult(result);
  okButton.onclick=closeGacha;
}

function shareResult(r){const d=btoa(unescape(encodeURIComponent(JSON.stringify({id:r.id,name:r.name,rarity:r.rarity,type:r.type,danger:r.danger||"",resource:r.resource||"",keywords:r.keywords||"",description:r.description||"",affiliation:r.affiliation||"",hp:r.hp||"",san:r.san||"",speed:r.speed||"",slash:r.slash||"",pierce:r.pierce||"",blunt:r.blunt||"",bullets:r.bullets||"",image:r.image||""}))));const u=`${location.origin}${location.pathname}?result=${encodeURIComponent(d)}`;navigator.clipboard?.writeText(u).then(()=>shareStatus.textContent="邨先棡繝ｪ繝ｳ繧ｯ繧偵さ繝斐�ｼ縺励∪縺励◆縲�").catch(()=>prompt("邨先棡繝ｪ繝ｳ繧ｯ繧偵さ繝斐�ｼ縺励※縺上□縺輔＞縲�",u))}
function closeGacha(){animationScreen.className="animation-screen";if(location.search)history.replaceState({},document.title,location.pathname)}
function showShared(){const q=new URLSearchParams(location.search).get("result");if(!q)return;try{const r=JSON.parse(decodeURIComponent(escape(atob(q))));setTimeout(()=>{runGacha(r);setTimeout(()=>{summonCard.click()},80)},100)}catch(e){}}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
document.addEventListener("keydown",e=>{if(e.key==="ArrowRight"){current=(current+1)%slides.length;updateCarousel()}if(e.key==="ArrowLeft"){current=(current-1+slides.length)%slides.length;updateCarousel()}if(e.key==="Escape"){closePackSelector();closeDetail()}})
loadData().then(showShared);