const sky = document.getElementById("sky");
const addStarBtn = document.getElementById("addStar");

/* ===== 定数 ===== */
const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;

/* 感情 × 色 定義 */
const emotions = [
  { color: "#6fa8ff", label: "悲" }, // 青：悲しい・寂しい
  { color: "#ff9acb", label: "嬉" }, // ピンク：嬉しい
  { color: "#ff5c5c", label: "燃" }, // 赤：燃えてる
  { color: "#ffd966", label: "暖" }, // 黄色：暖かい
  { color: "#93c47d", label: "穏" }  // 緑：穏やか
];

/* ===== データ ===== */
let stars = JSON.parse(localStorage.getItem("stargarden-stars")) || [];
let memories = JSON.parse(localStorage.getItem("stargarden-memories")) || [];
let lastStarElement = null;

/* ===== 初期処理 ===== */
cleanupStars();
stars.forEach(drawStar);
createHamburger();

/* ===== ＋ボタン ===== */
addStarBtn.addEventListener("click", () => {
  openEmotionPicker();
});

/* ===== 星を描画 ===== */
function drawStar(star) {
  const el = document.createElement("div");
  el.className = "star";
  el.style.left = `${star.x}px`;
  el.style.top = `${star.y}px`;
  el.style.width = `${star.size}px`;
  el.style.height = `${star.size}px`;
  el.style.opacity = star.opacity;
  el.style.background = star.color;

  el.addEventListener("click", (e) => {
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
  `;

  emotions.forEach(e => {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 10px;
      color: rgba(255,255,255,0.7);
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

    dot.onclick = () => {
      createStar(e);
      picker.remove();
    };

    const label = document.createElement("div");
    label.textContent = e.label;

    wrap.appendChild(dot);
    wrap.appendChild(label);
    picker.appendChild(wrap);
  });

  document.body.appendChild(picker);

  setTimeout(() => {
    document.addEventListener("click", () => {
      if (picker.parentNode) picker.remove();
    }, { once: true });
  }, 0);
}

/* ===== 星を作る（スマホ端対策込み） ===== */
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

  /* 前の星の強調を解除 */
  if (lastStarElement) {
    lastStarElement.style.boxShadow = "";
    lastStarElement.style.transform = "";
  }

  /* 新しい星を描画して強調 */
  const el = drawStar(star);
  el.style.boxShadow = `0 0 14px 5px ${star.color}`;
  el.style.transform = "scale(1.6)";
  lastStarElement = el;
}

/* ===== メモ入力（スマホでも隠れにくい） ===== */
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
  `;

  input.onblur = () => {
    star.memo = input.value;
    saveStars();
    saveMemory(star);
    input.remove();
  };

  document.body.appendChild(input);
  input.focus();
}

/* ===== 3日経過した星を削除 ===== */
function cleanupStars() {
  const now = Date.now();
  stars = stars.filter(s => now - s.createdAt < THREE_DAYS);
  saveStars();
}

/* ===== 履歴保存 ===== */
function saveMemory(star) {
  if (!star.memo) return;

  memories.push({
    color: star.color,
    label: star.label,
    memo: star.memo,
    createdAt: Date.now()
  });

  localStorage.setItem("stargarden-memories", JSON.stringify(memories));
}

/* ===== 保存 ===== */
function saveStars() {
  localStorage.setItem("stargarden-stars", JSON.stringify(stars));
}

/* ===== ハンバーガーメニュー ===== */
function createHamburger() {
  const btn = document.createElement("div");
  btn.textContent = "☰";
  btn.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    color: white;
    cursor: pointer;
    font-size: 20px;
    z-index: 10;
  `;

  btn.onclick = openHistory;
  document.body.appendChild(btn);
}

/* ===== 履歴表示（日時付き） ===== */
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
    z-index: 20;
  `;

  memories.slice().reverse().forEach(m => {
    const row = document.createElement("div");
    row.style.marginBottom = "14px";
    row.innerHTML = `
      <span style="color:${m.color}">●</span>
      ${m.label}「${m.memo}」
      <div style="font-size:10px;opacity:.6">
        ${formatDateTime(m.createdAt)}
      </div>
    `;
    panel.appendChild(row);
  });

  panel.onclick = () => panel.remove();
  document.body.appendChild(panel);
}

/* ===== 日時フォーマット ===== */
function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${h}:${min}`;
}

/* ===== 流れ星 ===== */
function createShootingStar() {
  const star = document.createElement("div");
  star.className = "shooting-star";
  star.style.top = Math.random() * window.innerHeight * 0.3 + "px";
  star.style.left = Math.random() * window.innerWidth * 0.3 + "px";
  sky.appendChild(star);
  setTimeout(() => star.remove(), 1200);
}

setInterval(() => {
  if (Math.random() < 0.15) createShootingStar();
}, 8000);
