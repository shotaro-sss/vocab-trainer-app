let words = [];
let current = null;
let answering = false;
const DAILY_TARGET = 3;  // 本番では30に変更

let characters = [];
let gachaTickets = 0;

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

// characters.json 読み込み
fetch("characters.json")
  .then(r => r.json())
  .then(data => { characters = data; })
  .catch(() => console.warn("characters.json load failed"));

// words.json 読み込み + 初回表示
fetch("words.json")
  .then(r => r.json())
  .then(data => {
    words = data;
    next();
    updateTimer();
    updateWarningImage();
    updateGachaButton();  // 初回チェック
  })
  .catch(err => {
    console.error("Failed to load words.json", err);
    document.getElementById("question").innerText = "単語データの読み込みに失敗しました";
  });

function next() {
  current = words[Math.floor(Math.random() * words.length)];
  document.getElementById("question").innerText = current.q;

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
  updateGachaButton();
}

function answer(selected) {
  if (answering) return;
  answering = true;

  const result = document.getElementById("question");
  const isCorrect = selected === current.a;

  result.classList.remove('correct', 'wrong', 'bonus');

  if (isCorrect) {
    const oldSolved = solved;
    solved++;
    saveCount(solved);

    // ガチャチケット付与
    if (oldSolved < DAILY_TARGET && solved >= DAILY_TARGET) {
      gachaTickets += 1;
    } else if (solved > DAILY_TARGET && (solved - DAILY_TARGET) % 10 === 0) {
      gachaTickets += 1;
    }

    result.classList.add('correct');

    if (solved === DAILY_TARGET) {
      result.innerText = "🎉 目標達成！おめでとう！";
      result.style.color = "#FFD700";
    } else if (solved > DAILY_TARGET) {
      result.innerText = "⭕ 正解！🎉";
      result.style.color = "#10b981";
      result.classList.add('bonus');
    } else {
      result.innerText = "⭕ 正解！";
      result.style.color = "green";
    }
  } else {
    result.innerText = `❌ 不正解 → ${current.a}`;
    result.style.color = "red";
    result.classList.add('wrong');
  }

  document.querySelectorAll(".choiceBtn").forEach(b => b.disabled = true);

  updateBar();
  updateWarningImage();
  updateGachaButton();

  setTimeout(() => {
    result.style.color = "var(--text)";
    result.classList.remove('correct', 'wrong', 'bonus');
    result.innerText = current.q;
    answering = false;
    next();
  }, 1400);
}

function updateBar() {
  const pct = Math.min(100, (solved / DAILY_TARGET) * 100);
  document.getElementById("bar").style.width = `${pct}%`;

  const progressText = document.getElementById("progressText");
  progressText.innerText = `${solved} / ${DAILY_TARGET}`;

  if (solved >= DAILY_TARGET) {
    progressText.classList.add("over-achieved");
    document.getElementById("bar").classList.add("bar-over");
  } else {
    progressText.classList.remove("over-achieved");
    document.getElementById("bar").classList.remove("bar-over");
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
  document.getElementById("timer").innerText = `残り ${h}時間 ${m}分 ${sec}秒`;
}

let lastWarningHour = -1;

function updateWarningImage() {
  const img = document.getElementById("warningImg");
  if (solved >= DAILY_TARGET) {
    img.style.display = "none";
  } else {
    const hour = new Date().getHours();
    if (hour === lastWarningHour) return;
    let path = hour >= 18 ? "24h" : hour >= 12 ? "18h" : hour >= 6 ? "12h" : "6h";
    img.src = `images/${path}.png`;
    img.style.display = "block";
    lastWarningHour = hour;
  }
}

function updateGachaButton() {
  const imgPlaceholder = document.getElementById("warningImg");
  let btn = document.getElementById("gachaButton");

  if (solved < DAILY_TARGET) {
    if (btn) btn.style.display = "none";
    return;
  }

  // 達成済み → ボタン存在確認・作成
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "gachaButton";
    btn.innerHTML = `<img src="images/complete.png" alt="ガチャを引く！">`;
    btn.onclick = openGacha;
    imgPlaceholder.insertAdjacentElement("afterend", btn);
  }

  // チケット数で有効/無効
  btn.style.display = "block";
  btn.disabled = gachaTickets <= 0;
  btn.style.opacity = gachaTickets > 0 ? "1" : "0.5";
  btn.style.cursor = gachaTickets > 0 ? "pointer" : "not-allowed";
}

function openGacha() {
  if (gachaTickets <= 0) return;
  gachaTickets--;
  updateGachaButton();  // 即時反映

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

function drawOneCharacter() {
  const rand = Math.random() * 100;
  let rarity;
  if (rand < 50) rarity = "rare";
  else if (rand < 78) rarity = "super";
  else if (rand < 93) rarity = "hyper";
  else if (rand < 98) rarity = "ultra";
  else rarity = "legend";

  const candidates = characters.filter(c => c.rarity === rarity);
  if (candidates.length === 0) return { name: "?", rarity: "rare", image: "" };
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// モーダル閉じる
document.getElementById("closeGachaBtn").onclick = () => {
  document.getElementById("gachaModal").style.display = "none";
};

// 1秒ごとのタイマー更新
setInterval(updateTimer, 1000);