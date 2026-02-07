// ... 既存のコードの上部に追加 ...
let characters = [];

// ガチャ可能チケット数
let gachaTickets = 0;

// characters.json をロード（初回fetchと一緒に）
fetch("characters.json")
  .then(r => r.json())
  .then(data => { characters = data; })
  .catch(() => console.warn("characters.json がありません"));

// ガチャボタン（complete.pngの場所をボタンに変更）
function updateGachaButton() {
  const container = document.getElementById("warningImg").parentElement; // 適宜調整
  let btn = document.getElementById("gachaButton");

  const canGacha = solved >= DAILY_TARGET && 
                   (solved - DAILY_TARGET) % 10 === 0 || 
                   (solved === DAILY_TARGET);

  if (canGacha) {
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "gachaButton";
      btn.innerHTML = `<img src="images/complete.png" alt="ガチャを引く">`;
      btn.onclick = openGacha;
      document.getElementById("warningImg").replaceWith(btn);
    }
    btn.style.display = "block";
  } else if (btn) {
    btn.style.display = "none";
  }
}

// ガチャ画面を開く
function openGacha() {
  if (gachaTickets <= 0) return;
  gachaTickets--;

  const modal = document.getElementById("gachaModal");
  const resultArea = document.getElementById("gachaResult");
  resultArea.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const card = drawOneCharacter();
    const div = document.createElement("div");
    div.className = `gacha-card ${card.rarity}`;
    div.innerHTML = `
      <img src="${card.image}" alt="${card.name}">
      <div class="name">${card.name}</div>
    `;
    resultArea.appendChild(div);
  }

  modal.style.display = "flex";
}

// 1枚抽選
function drawOneCharacter() {
  const rand = Math.random() * 100;
  let rarity;
  if (rand < 50) rarity = "rare";
  else if (rand < 78) rarity = "super";
  else if (rand < 93) rarity = "hyper";
  else if (rand < 98) rarity = "ultra";
  else rarity = "legend";

  const candidates = characters.filter(c => c.rarity === rarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// モーダル閉じる
document.getElementById("closeGachaBtn").onclick = () => {
  document.getElementById("gachaModal").style.display = "none";
};

// updateBar() と updateWarningImage() の最後に追加
updateGachaButton();

let words = [];
let current = null;
let answering = false;
const DAILY_TARGET = 3;

function todayKey() {
  return new Date().toDateString();
}

function loadCount() {
  try {
    const data = JSON.parse(localStorage.getItem("daily") || "{}");
    if (data.date === todayKey()) {
      return Number(data.count) || 0;
    }
  } catch (e) {
    console.warn("Invalid daily data, resetting", e);
  }
  return 0;
}

function saveCount(count) {
  localStorage.setItem("daily", JSON.stringify({
    date: todayKey(),
    count: count
  }));
}

let solved = loadCount();

function next() {
  current = words[Math.floor(Math.random() * words.length)];
  document.getElementById("question").innerText = current.q;

  // 正解 + 異なる3つを選ぶ（高速化）
  let choices = [current.a];
  const others = words.filter(w => w.a !== current.a);
  while (choices.length < 4) {
    const r = others[Math.floor(Math.random() * others.length)].a;
    if (!choices.includes(r)) choices.push(r);
  }
  choices.sort(() => Math.random() - 0.5);

  const box = document.getElementById("choices");
  box.innerHTML = "";
  choices.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "choiceBtn";
    btn.innerText = c;
    btn.onclick = () => answer(c);
    box.appendChild(btn);
  });

  updateBar();
  updateWarningImage();
}

function answer(selected) {
  if (answering) return;
  answering = true;

  const result = document.getElementById("question");
  const isCorrect = selected === current.a;

  // まず既存のフィードバッククラスをすべてクリア（安全策）
  result.classList.remove('correct', 'wrong', 'bonus');

  if (isCorrect) {
    solved++;
    saveCount(solved);

    result.classList.add('correct');  // 基本の正解アニメは全員に

    if (solved === DAILY_TARGET) {
      result.innerText = "🎉 目標達成！おめでとう！";
      result.style.color = "#FFD700"; // 金色
    } else if (solved > DAILY_TARGET) {
      result.innerText = "⭕ 正解！🎉";
      result.style.color = "#10b981"; // success緑（CSS変数でも可）
      result.classList.add('bonus');   // オーバー専用クラス
    } else {
      result.innerText = "⭕ 正解！";
      result.style.color = "green";
    }
  } else {
    result.innerText = `❌ 不正解 → ${current.a}`;
    result.style.color = "red";
    result.classList.add('wrong');
  }

  // ボタン無効化
  document.querySelectorAll(".choiceBtn").forEach(b => b.disabled = true);

  updateBar();
  updateWarningImage();

  setTimeout(() => {
    // スタイルとクラスを完全にリセット
    result.style.color = "var(--text)";
    result.classList.remove('correct', 'wrong', 'bonus');
    
    // 次の問題文に戻す
    result.innerText = current.q;
    
    answering = false;
    next();
  }, 1400);
}

function updateBar() {
  const pct = Math.min(100, (solved / DAILY_TARGET) * 100); // 100%で止まる
  const bar = document.getElementById("bar");
  bar.style.width = `${pct}%`;

  const progressText = document.getElementById("progressText");
  progressText.innerText = `${solved} / ${DAILY_TARGET}`;

  // オーバー時の特別クラスを適用
  if (solved >= DAILY_TARGET) {
    progressText.classList.add("over-achieved");
    bar.classList.add("bar-over");
  } else {
    progressText.classList.remove("over-achieved");
    bar.classList.remove("bar-over");
  }
}


function secondsToMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return Math.floor((tomorrow - now) / 1000);
}

function updateTimer() {
  const s = secondsToMidnight();
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  document.getElementById("timer").innerText =
    `残り ${h}時間 ${m}分 ${sec}秒`;
}

let lastWarningHour = -1;

function updateWarningImage() {
  const imgElement = document.getElementById("warningImg");

  if (solved >= DAILY_TARGET) {
    // 30問達成したら complete.png を表示（空文字列で非表示にするのをやめる）
    const newSrc = "images/complete.png";
    if (imgElement.src.endsWith(newSrc)) return; // 同じなら再設定不要
    imgElement.src = newSrc;
    lastWarningHour = -1; // リセット（次に未達成に戻ったときにすぐ更新）
    return;
  }

  // 未達成の場合：時間帯ごとの画像
  const hour = new Date().getHours();
  if (hour === lastWarningHour) return; // 同じ時間帯ならスキップ

  let imgPath = "";
  if      (hour >= 18) imgPath = "images/24h.png";
  else if (hour >= 12) imgPath = "images/18h.png";
  else if (hour >=  6) imgPath = "images/12h.png";
  else                 imgPath = "images/6h.png";

  if (imgElement.src.endsWith(imgPath)) return;

  imgElement.src = imgPath;
  lastWarningHour = hour;
}

// 初回ロード
fetch("words.json")
  .then(r => r.json())
  .then(data => {
    words = data;
    next();
    updateTimer();
    updateWarningImage();
  })
  .catch(err => {
    console.error("Failed to load words.json", err);
    document.getElementById("question").innerText = "単語データの読み込みに失敗しました";
  });

// タイマーだけ1秒ごとに更新
setInterval(() => {
  updateTimer();
}, 1000);