let current = 0, selectedPack = null, data = { identities: [], egos: [], packs: [] };

const track = document.getElementById("track");
const slides = document.querySelectorAll(".slide");
const dotsBox = document.getElementById("dots");

slides.forEach((_, i) => {
  const b = document.createElement("button");
  b.className = "dot" + (!i ? " active" : "");
  b.onclick = () => {
    current = i;
    updateCarousel();
  };
  dotsBox.appendChild(b);
});

function updateCarousel() {
  track.style.transform = `translateX(-${current * 100}%)`;
  [...dotsBox.children].forEach((d, i) => d.classList.toggle("active", i === current));
}

prev.onclick = () => {
  current = (current - 1 + slides.length) % slides.length;
  updateCarousel();
};

next.onclick = () => {
  current = (current + 1) % slides.length;
  updateCarousel();
};

async function loadTSV(path) {
  const r = await fetch(path);
  if (!r.ok) throw Error(path);
  const lines = (await r.text()).trim().split(/\r?\n/);
  const h = lines.shift().split("\t");
  return lines.filter(Boolean).map(x => {
    const v = x.split("\t");
    const o = {};
    h.forEach((k, i) => o[k] = v[i] || "");
    return o;
  });
}

async function loadData() {
  try {
    data.identities = await loadTSV("data/identity.tsv");
    data.egos = await loadTSV("data/ego.tsv");
    data.packs = await loadTSV("data/packs.tsv");
  } catch (e) {
    console.error("データの読み込みに失敗しました:", e);
    data = { identities: [], egos: [], packs: [] };
  }
}

function openPackSelector() {
  packList.innerHTML = data.packs.map(p => `
    <div class="pack-card" onclick="openPackDetail('${p.id}')">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description || "")}</p>
    </div>
  `).join("");
  packModal.classList.add("open");
}

function closePackSelector() {
  packModal.classList.remove("open");
}

function openPackDetail(id) {
  selectedPack = data.packs.find(p => p.id === id);
  detailTitle.textContent = selectedPack.name;
  detailDescription.textContent = selectedPack.description || "";
  
  // パックに含まれる人格とE.G.Oを取得
  const matchedIdentities = data.identities.filter(x => (x.pack || "").split(",").map(p => p.trim()).includes(id));
  const matchedEgos = data.egos.filter(x => (x.pack || "").split(",").map(p => p.trim()).includes(id));
  
  const allItems = [
    ...matchedIdentities.map(x => ({ ...x, label: x.type === "special" ? "特異人格" : "通常人格" })),
    ...matchedEgos.map(x => ({ ...x, label: "E.G.O" }))
  ];
  
  detailItems.innerHTML = allItems.length
    ? allItems.map(x => `
        <div class="item">
          ${esc(x.name)}
          <span class="rarity">${esc(x.label)}</span>
        </div>
      `).join("")
    : `<div class="item">登録データなし</div>`;
    
  closePackSelector();
  detailModal.classList.add("open");
  
  packExtractButton.onclick = () => {
    closeDetail();
    startExtraction("pack", id);
  };
}

function closeDetail() {
  detailModal.classList.remove("open");
}

function weighted(pool) {
  let n = pool.reduce((s, x) => s + Number(x.weight || 1), 0);
  let r = Math.random() * n;
  for (const x of pool) {
    r -= Number(x.weight || 1);
    if (r <= 0) return x;
  }
  return pool.at(-1);
}

function rarityClass(x) {
  let r = String(x.rarity || "");
  return r.includes("4") ? "legendary" : r.includes("3") ? "epic" : r.includes("2") ? "rare" : "common";
}

function rankClass(x) {
  return String(x.danger || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function resultLabel(x) {
  if (String(x.type || "") === "ego") return String(x.danger || "-");
  return String(x.type || "normal") === "special" ? "特異人格" : "通常人格";
}

function formatList(value) {
  return esc(value || "-").replace(/\s*\/\s*/g, "<br>");
}

function startExtraction(type, pack) {
  let p = [];

  if (type === "ego") {
    p = data.egos.map(x => ({ ...x, type: "ego" }));
  } else if (type === "special") {
    p = data.identities.filter(x => x.type === "special");
  } else if (type === "pack") {
    const packIdentities = data.identities.filter(x => 
      (x.pack || "").split(",").map(p => p.trim()).includes(pack)
    );
    const packEgos = data.egos.filter(x => 
      (x.pack || "").split(",").map(p => p.trim()).includes(pack)
    ).map(x => ({ ...x, type: "ego" }));

    p = [...packIdentities, ...packEgos];
  } else {
    p = data.identities.filter(x => x.type === "normal" || !x.type);
  }

  if (!p.length) return alert("抽出対象がありません。");

  const result = weighted(p);
  runGacha({ ...result, type: result.type || (type === "ego" ? "ego" : "normal") });
}

function runGacha(result) {
  const screen = animationScreen, card = summonCard, front = cardFront, scene = resultScene;
  const isEgo = String(result.type || "") === "ego";

  screen.className = "animation-screen active";
  scene.className = "result-scene";
  card.className = "summon-card";
  front.className = "card-front";
  front.innerHTML = "";

  tapMessage.textContent = "抽出中……";
  resultInfo.className = "result-info";
  resultName.textContent = "";
  resultRarity.textContent = "";
  resultPerformance.innerHTML = "";
  shareStatus.textContent = "";

  setTimeout(() => {
    card.classList.add(isEgo ? "rank-" + rankClass(result) : "identity-" + (result.type === "special" ? "special" : "normal"));
    card.classList.add("rarity-" + rarityClass(result));
    tapMessage.textContent = "カードをクリックして確認";
  }, 2200);

  card.onclick = () => {
    front.classList.add("show");

    // TSV内に image 列があれば優先指定。なければ images/cards/{id}.jpg を参照
    // const imgSrc = result.image || `images/cards/${result.id}.jpg`;
    const imgSrc = result.image || `images/cards/test.png`;

    // カード上にはテキストを一切配置せず、画像のみを表示
    front.innerHTML = `
      <div class="card-image-wrap">
        <img src="${imgSrc}" alt="${esc(result.name)}" class="card-img" onerror="this.classList.add('img-error');">
      </div>
    `;

    tapMessage.textContent = "";

    setTimeout(() => {
      scene.classList.add("revealed");
      resultName.textContent = result.name;
      resultRarity.textContent = isEgo ? (result.danger || "-") : resultLabel(result);
      resultRarity.className = "result-rarity " + (isEgo ? "rank-text-" + rankClass(result) : "identity-type");

      if (isEgo) {
        resultPerformance.innerHTML = `
        <div class="identity-detail ego-detail">
          <div class="identity-section"><div class="identity-label">[必要資源]</div><div class="identity-value">${formatList(result.resource)}</div></div>
          <div class="identity-section"><div class="identity-label">[主要キーワード]</div><div class="identity-value">${formatList(result.keywords)}</div></div>
          <div class="ego-rank-line">ランク：<strong>${esc(result.danger || "-")}</strong></div>
          <div class="identity-section description-section"><div class="identity-label">簡易説明</div><div class="identity-description">${esc(result.description || "このE.G.Oについての説明はありません。")}</div></div>
        </div>`;
      } else {
        resultPerformance.innerHTML = `
        <div class="identity-detail">
          <div class="identity-section"><div class="identity-label">[所属]</div><div class="identity-value">${esc(result.affiliation || "-")}</div></div>
          <div class="identity-section"><div class="identity-label">[主要キーワード]</div><div class="identity-value">${esc(result.keywords || "-")}</div></div>
          <div class="identity-status">
            <div class="identity-status-left">
              <div>HP：<strong>${esc(result.hp || "-")}</strong></div>
              <div>SAN：<strong>${esc(result.san || "-")}</strong></div>
              <div>速度：<strong>${esc(result.speed || "-")}</strong></div>
              ${String(result.bullets || "").trim() ? `<div>弾丸：<strong>${esc(result.bullets)}</strong></div>` : ""}
            </div>
            <div class="identity-status-right">
              <div>斬撃：<strong>${esc(result.slash || "-")}</strong></div>
              <div>貫通：<strong>${esc(result.pierce || "-")}</strong></div>
              <div>打撃：<strong>${esc(result.blunt || "-")}</strong></div>
            </div>
          </div>
          <div class="identity-section description-section"><div class="identity-label">簡易説明</div><div class="identity-description">${esc(result.description || "この人格についての説明はありません。")}</div></div>
        </div>`;
      }
    }, 500);
  };

  shareButton.onclick = () => shareResult(result);
  okButton.onclick = closeGacha;
}

function shareResult(r) {
  // IDとタイプのみをクエリパラメータにセットして短縮化
  const params = new URLSearchParams({
    id: r.id,
    type: String(r.type || "").includes("ego") ? "ego" : (r.type || "normal")
  });
  
  const u = `${location.origin}${location.pathname}?${params.toString()}`;
  
  navigator.clipboard?.writeText(u)
    .then(() => shareStatus.textContent = "結果リンクをコピーしました。")
    .catch(() => prompt("結果リンクをコピーしてください。", u));
}

function closeGacha() {
  animationScreen.className = "animation-screen";
  if (location.search) history.replaceState({}, document.title, location.pathname);
}

function showShared() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const type = params.get("type");
  const legacyResult = params.get("result");

  // 旧方式（?result=...）への後方互換対応
  if (legacyResult) {
    try {
      const r = JSON.parse(decodeURIComponent(escape(atob(legacyResult))));
      setTimeout(() => {
        runGacha(r);
        setTimeout(() => { summonCard.click(); }, 80);
      }, 100);
    } catch (e) { }
    return;
  }

  if (!id) return;

  // 短縮URL方式（?id=...&type=...）：読み込み済みデータから検索して再構成
  const pool = type === "ego" ? data.egos : data.identities;
  const item = pool.find(x => x.id === id);

  if (item) {
    setTimeout(() => {
      runGacha({ ...item, type: type || item.type || "normal" });
      setTimeout(() => { summonCard.click(); }, 80);
    }, 100);
  }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") {
    current = (current + 1) % slides.length;
    updateCarousel();
  }
  if (e.key === "ArrowLeft") {
    current = (current - 1 + slides.length) % slides.length;
    updateCarousel();
  }
  if (e.key === "Escape") {
    closePackSelector();
    closeDetail();
  }
});

loadData().then(showShared);
