let words = [];
let current = null;
let answering = false;
const DAILY_TARGET = 3;  // テスト用。本番は30に変更

let characters = [];
let gachaTickets = 0;    // ガチャチケット（引ける回数）

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
  .catch(() => console.warn("characters.json 読み込み失敗"));

// ガチャ可能か判定 & ボタン更新
function updateGachaButton() {
  const placeholder = document.getElementById("warningImg");
  if (!placeholder) return;

  // 達成済みならガチャボタンに置き換え
  if (solved >= DAILY_TARGET) {
    let btn = document.getElementById("gachaButton");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "gachaButton";
      btn.innerHTML = `<img src="images/complete.png" alt="ガチャを引く！">`;
      btn.onclick = openGacha;
      placeholder.replaceWith(btn);
    }
    // チケットがあるときだけ有効
    btn.disabled = gachaTickets <= 0;
    btn.style.opacity = gachaTickets > 0 ? "1" : "0.5";
  } else {
    // 未達成なら通常の時間帯画像
    // （既存のupdateWarningImage() で処理されるのでここでは何もしない）
  }
}

function openGacha() {
  if (gachaTickets <= 0) return;
  gachaTickets--;
  updateGachaButton();  // ボタン状態更新

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
  if (candidates.length === 0) return { name: "?", rarity: "rare", image: "" }; // フォールバック
  return candidates[Math.floor(Math.random() * candidates.length)];
}

document.getElementById("closeGachaBtn").onclick = () => {
  document.getElementById("gachaModal").style.display = "none";
};

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
    solved++;
    saveCount(solved);

    // ここでガチャチケットを管理
    if (solved === DAILY_TARGET) {
      gachaTickets += 1;
      result.innerText = "🎉 目標達成！ガチャチケットGET！";
      result.style.color = "#FFD700";
    } else if (solved > DAILY_TARGET) {
      result.innerText = "⭕ 正解！🎉";
      result.style.color = "#10b981";
      result.classList.add('bonus');

      // 10問ごと（オーバー分が10の倍数）にチケット追加
      const over = solved - DAILY_TARGET;
      if (over > 0 && over % 10 === 0) {
        gachaTickets += 1;
        result.innerText += " + ガチャチケット！";
      }
    } else {
      result.innerText = "⭕ 正解！";
      result.style.color = "green";
    }

    result.classList.add('correct');
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

// updateWarningImage() を達成後はスキップするように修正
function updateWarningImage() {
  if (solved >= DAILY_TARGET) {
    // 達成後はガチャボタンに任せるので画像更新不要
    return;
  }

  const imgElement = document.getElementById("warningImg");
  if (!imgElement) return;

  const hour = new Date().getHours();
  if (hour === lastWarningHour) return;

  let imgPath = "";
  if (hour >= 18) imgPath = "images/24h.png";
  else if (hour >= 12) imgPath = "images/18h.png";
  else if (hour >= 6) imgPath = "images/12h.png";
  else imgPath = "images/6h.png";

  if (imgElement.src.endsWith(imgPath)) return;

  imgElement.src = imgPath;
  lastWarningHour = hour;
}

// 他の関数（updateBar, secondsToMidnight, updateTimer など）は変更なし

// 初回ロード
fetch("words.json")
  .then(r => r.json())
  .then(data => {
    words = data;
    next();
    updateTimer();
    updateWarningImage();
    updateGachaButton();  // 重要：初回でボタン状態をセット
  })
  .catch(err => {
    console.error("Failed to load words.json", err);
    document.getElementById("question").innerText = "単語データの読み込みに失敗しました";
  });

setInterval(updateTimer, 1000);