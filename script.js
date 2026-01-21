const sky = document.getElementById("sky");
const addStarBtn = document.getElementById("addStar");

/* ===== 定数 ===== */
const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;

/* ===== 感情 × 色 ===== */
const emotions = [
  { color: "#6fa8ff", label: "悲" },
  { color: "#ff9acb", label: "嬉" },
  { color: "#ff5c5c", label: "燃" },
  { color: "#ffd966", label: "暖" },
  { color: "#93c47d", label: "穏" },
  { color: "#ffffff", label: "面" },
  { color: "#999999", label: "怒" }
];

/* ===== データ ===== */
let stars = JSON.parse(localStorage.getItem("stargarden-stars")) || [];
let memories = JSON.parse(localStorage.getItem("stargarden-memories")) || [];
let lastStarElement = null;

/* ===== 初期化 ===== */
cleanupStars();
stars.forEach(drawStar);
createMoon();
updateMoon();
createHamburger();

/* ===== ＋ ===== */
addStarBtn.addEventListener("click", openEmotionPicker);

/* ===== 星描画 ===== */
function drawStar(star) {
  const el = document.createElement("div");
  el.className = "star";
  el.style.left = `${star.x}px`;
  el.style.top = `${star.y}px`;
  el.style.width = `${star.size}px`;
  el.style.height = `${star.size}px`;
  el.style.opacity = star.opacity;
  el.style.background = star.color;

  el.addEventListener("click", e => {
    e.stopPropagation();
    openMemoInput(star, el);
  });

  sky.appendChild(el);
  return el;
}

/* ===== 感情選択 ===== */
function openEmotionPicker() {
  if (document.getElementById("emotionPicker")) return;

  const picker = document.createElement("div");
  picker.id = "emotionPicker";
  picker.style.cssText = `
    position: fixed;
    bottom: 96px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
    z-index: 10000;
  `;

  emotions.forEach(e => {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 10px;
      color: rgba(255,255,255,0.75);
    `;

    const dot = document.createElement("div");
    dot.style.cssText = `
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${e.color};
      cursor: pointer;
      margin-bottom: 4px;
    `;

    dot.addEventListener("click", e2 => {
      e2.stopPropagation();
      createStar(e);
      picker.remove();
    });

    const label = document.createElement("div");
    label.textContent = e.label;

    wrap.append(dot, label);
    picker.appendChild(wrap);
  });

  document.body.appendChild(picker);

  setTimeout(() => {
    document.addEventListener("click", () => picker.remove(), { once: true });
  }, 0);
}

/* ===== 星生成 ===== */
function createStar(emotion) {
  const now = Date.now();

  const star = {
    id: now,
    x: Math.random() * (window.innerWidth - 20) + 10,
    y: Math.random() * (window.innerHeight - 20) + 10,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.6 + 0.4,
    color: emotion.color,
    label: emotion.label,
    memo: "",
    createdAt: now
  };

  stars.push(star);
  saveStars();

  if (lastStarElement) {
    lastStarElement.style.boxShadow = "";
    lastStarElement.style.transform = "";
  }

  const el = drawStar(star);
  el.style.boxShadow = `0 0 14px 5px ${star.color}`;
  el.style.transform = "scale(1.6)";
  lastStarElement = el;

  updateMoon();
}

/* ===== メモ ===== */
function openMemoInput(star, el) {
  const old = document.getElementById("memoInputBox");
  if (old) old.remove();

  const rect = el.getBoundingClientRect();
  const input = document.createElement("input");
  input.id = "memoInputBox";
  input.maxLength = 10;
  input.placeholder = "10文字まで";
  input.value = star.memo;

  input.style.cssText = `
    position: fixed;
    left: ${Math.min(rect.left + 8, window.innerWidth - 140)}px;
    top: ${Math.max(rect.top - 40, 20)}px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: none;
    padding: 6px 8px;
    font-size: 16px;
    outline: none;
    z-index: 10000;
  `;

  input.addEventListener("blur", () => {
    star.memo = input.value.trim();
    saveStars();
    saveMemory(star);
    input.remove();
  });

  document.body.appendChild(input);
  input.focus();
}

/* ===== 🌙 月 ===== */
function createMoon() {
  if (document.getElementById("moon")) return;

  const moon = document.createElement("div");
  moon.id = "moon";
  moon.style.cssText = `
    position: fixed;
    top: 24px;
    left: 24px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 9999;
    pointer-events: auto;
    background:
      radial-gradient(circle at 30% 30%,
        rgba(255,255,255,0.95) 0%,
        rgba(245,243,206,0.9) 35%,
        rgba(220,215,170,0.85) 55%,
        rgba(180,170,120,0.8) 70%,
        rgba(120,110,80,0.7) 100%
      );
    box-shadow:
      0 0 18px rgba(255,255,220,0.6),
      0 0 40px rgba(255,255,220,0.35),
      0 0 80px rgba(255,255,220,0.2);
  `;

  moon.addEventListener("click", e => {
    e.stopPropagation();
    openEmotionStats();
  });

  document.body.appendChild(moon);
}

/* ===== 月の満ち欠け ===== */
function updateMoon() {
  const moon = document.getElementById("moon");
  if (!moon) return;

  const count = stars.length;
  const offset = count === 0 ? 85 : count <= 2 ? 65 : count <= 5 ? 35 : 0;
  const glow = count === 0 ? 0.4 : count <= 2 ? 0.6 : count <= 5 ? 0.8 : 1;

  moon.style.background = `
    radial-gradient(circle at ${100 - offset}% 50%,
      rgba(255,255,255,0.95) 0%,
      rgba(245,243,206,0.9) 35%,
      rgba(220,215,170,0.85) 55%,
      rgba(180,170,120,0.8) 70%,
      rgba(120,110,80,0.7) 100%
    )
  `;

  moon.style.boxShadow = `
    0 0 ${18 * glow}px rgba(255,255,220,0.6),
    0 0 ${40 * glow}px rgba(255,255,220,0.35),
    0 0 ${80 * glow}px rgba(255,255,220,0.2)
  `;
}

/* ===== 🌙 感情統計（％表示） ===== */
function openEmotionStats() {
  if (document.getElementById("emotionStats")) return;

  const counts = {};
  stars.forEach(s => {
    if (!s.label) return;
    counts[s.label] = (counts[s.label] || 0) + 1;
  });

  const total = stars.length;

  const overlay = document.createElement("div");
  overlay.id = "emotionStats";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(6px);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background: rgba(10,15,25,0.9);
    border-radius: 18px;
    padding: 24px 20px;
    width: 90%;
    max-width: 320px;
    color: white;
    font-size: 14px;
  `;

  const title = document.createElement("div");
  title.textContent = "この空の感情";
  title.style.cssText = `
    text-align: center;
    font-size: 15px;
    margin-bottom: 16px;
    opacity: 0.9;
  `;
  box.appendChild(title);

  if (total === 0) {
    const empty = document.createElement("div");
    empty.textContent = "まだ星はありません";
    empty.style.cssText = `
      text-align: center;
      font-size: 13px;
      opacity: 0.6;
    `;
    box.appendChild(empty);
  } else {
    emotions.forEach(e => {
      const count = counts[e.label];
      if (!count) return;

      const percent = Math.round((count / total) * 100);

      const row = document.createElement("div");
      row.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      `;

      const dot = document.createElement("span");
      dot.style.cssText = `
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${e.color};
        margin-right: 10px;
      `;

      const text = document.createElement("span");
      text.innerHTML = `
        ${e.label}　${count}
        <span style="opacity:0.6;font-size:12px;">（${percent}%）</span>
      `;

      row.appendChild(dot);
      row.appendChild(text);
      box.appendChild(row);
    });
  }

  overlay.appendChild(box);
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}

/* ===== 星の掃除 ===== */
function cleanupStars() {
  const now = Date.now();
  stars = stars.filter(s => now - s.createdAt < THREE_DAYS);
  saveStars();
}

/* ===== 保存 ===== */
function saveStars() {
  localStorage.setItem("stargarden-stars", JSON.stringify(stars));
}

function saveMemory(star) {
  if (!star.memo || !star.label) return;

  memories.push({
    color: star.color,
    label: star.label,
    memo: star.memo,
    createdAt: Date.now()
  });

  localStorage.setItem("stargarden-memories", JSON.stringify(memories));
}

/* ===== ☰ 履歴 ===== */
function createHamburger() {
  const btn = document.createElement("div");
  btn.textContent = "☰";
  btn.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    z-index: 9999;
  `;
  btn.addEventListener("click", openHistory);
  document.body.appendChild(btn);
}

function openHistory() {
  if (document.getElementById("historyPanel")) return;

  const panel = document.createElement("div");
  panel.id = "historyPanel";
  panel.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    color: white;
    padding: 24px;
    overflow-y: auto;
    font-size: 14px;
    z-index: 10000;
  `;

  memories.slice().reverse().forEach(m => {
    const row = document.createElement("div");
    row.style.marginBottom = "14px";
    row.innerHTML = `
      <span style="color:${m.color}">●</span>
      ${m.label}「${m.memo}」
    `;
    panel.appendChild(row);
  });

  panel.addEventListener("click", () => panel.remove());
  document.body.appendChild(panel);
}
