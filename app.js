let words = [];
let current = null;
let answering = false;
let totalAttempts = 0;  // 総回答回数（正解＋不正解）
const DAILY_TARGET = 30;  // 本番では30に変更

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
    // 出題範囲に重みをつける
    let selectedIndex;
    const rand = Math.random() * 100;  // 0〜100の乱数
    if (rand < 20) {
        // 1〜200 の範囲（20%）
        selectedIndex = Math.floor(Math.random() * 200);          // 0〜199 → id 1〜200
    } else if (rand < 50) {  // 20% + 30% = 50%まで
        // 201〜300 の範囲（30%）
        selectedIndex = 200 + Math.floor(Math.random() * 100);    // 200〜299 → id 201〜300
    } else {
        // 301以降（50%）
        const remaining = words.length - 300;
        selectedIndex = 300 + Math.floor(Math.random() * remaining);  // 300〜最後
    }
    current = words[selectedIndex];

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
  updateGachaHint();
}

function answer(selected) {
  if (answering) return;
  answering = true;
  totalAttempts++;  // ← 毎回答えるたびにカウントアップ

  const result = document.getElementById("question");
  const isCorrect = selected === current.a;

  result.classList.remove('correct', 'wrong', 'bonus');

  let timeoutDuration = 1400;  // デフォルトの待ち時間

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

    // 正解音を再生
    const audioCorrect = document.getElementById("soundCorrect");
    if (audioCorrect) {
        audioCorrect.currentTime = 0; // 最初から再生
        audioCorrect.play().catch(e => console.log("音再生エラー:", e));
    }

    if (solved === DAILY_TARGET) {
        const audioComplete = document.getElementById("soundComplete");
        if (audioComplete) {
        audioComplete.currentTime = 0;
        audioComplete.play().catch(e => console.log("達成音エラー:", e));
        }
        const accuracy = totalAttempts > 0 ? Math.round((solved / totalAttempts) * 100) : 0;        result.innerText = `🎉 目標達成！おめでとう！\n正答率 ${accuracy}%！`;        result.style.color = "#FFD700";
        result.style.whiteSpace = "pre-line";  // 改行を有効にする
        timeoutDuration = 3000;  // ← 達成時は3秒表示
    } else if (solved > DAILY_TARGET) {
        result.innerText = "⭕ 正解！🎉";
        result.style.color = "#10b981";
        result.classList.add('bonus');
    } else {
        result.innerText = "⭕ 正解！";
        result.style.color = "green";
    }
    } else {
        const audioWrong = document.getElementById("soundWrong");
        if (audioWrong) {
            audioWrong.currentTime = 0;
            audioWrong.play().catch(e => console.log("不正解音エラー:", e));
        }
        result.innerText = `❌ ${current.q} → ${current.a}`;
        result.style.color = "red";
        result.classList.add('wrong');
        timeoutDuration = 3000;  // ← 誤答時は3秒表示
    }

    document.querySelectorAll(".choiceBtn").forEach(b => b.disabled = true);

    updateBar();
    updateWarningImage();
    updateGachaButton();

    setTimeout(() => {
        result.style.color = "var(--text)";
        result.style.whiteSpace = "normal";  // 元に戻す
        result.classList.remove('correct', 'wrong', 'bonus');
        result.innerText = current.q;
        answering = false;
        next();
    }, timeoutDuration);
    updateGachaHint();
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
  updateGachaHint();
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

  if (!btn) {
    btn = document.createElement("button");
    btn.id = "gachaButton";
    btn.innerHTML = `<img src="images/complete.png" alt="ガチャを引く！">`;
    btn.onclick = openGacha;
    imgPlaceholder.insertAdjacentElement("afterend", btn);
  }

  btn.style.display = "block";

  const isSpecial = (solved % 50 === 0) && (solved >= 50);

  if (isSpecial) {
    btn.classList.add("special-gacha");
    btn.disabled = gachaTickets <= 0;
    btn.style.opacity = gachaTickets > 0 ? "1" : "0.6";
    btn.style.cursor = gachaTickets > 0 ? "pointer" : "not-allowed";
  } else {
    btn.classList.remove("special-gacha");
    btn.disabled = gachaTickets <= 0;
    btn.style.opacity = gachaTickets > 0 ? "1" : "0.5";
    btn.style.cursor = gachaTickets > 0 ? "pointer" : "not-allowed";
  }
}

function openGacha() {
  if (gachaTickets <= 0) return;
  gachaTickets--;
  updateGachaButton();  // 即時反映

  // ガチャ音を再生
  const audioGacha = document.getElementById("soundGacha");
  if (audioGacha) {
    audioGacha.currentTime = 0;
    audioGacha.play().catch(e => console.log("ガチャ音エラー:", e));
  }

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
  const isSpecial = (solved % 50 === 0) && (solved >= 50);  // 50, 100, 150... 正解達成時

  let rand = Math.random() * 100;
  let rarity;

  if (isSpecial) {
    // 50正解ごとの特別確率（uとlを大幅アップ）
    if (rand < 35)      rarity = "ultra";     // 通常5% → 35%
    else if (rand < 55) rarity = "legend";    // 通常2% → 20%
    else if (rand < 75) rarity = "hyper";     // 15% → 20%
    else if (rand < 90) rarity = "super";     // 28% → 15%
    else                rarity = "rare";      // 50% → 10%
    
    console.log(`特別ガチャ！ (正解${solved}回目)`);  // デバッグ用
  } else {
    // 通常確率
    if (rand < 50) rarity = "rare";
    else if (rand < 78) rarity = "super";
    else if (rand < 93) rarity = "hyper";
    else if (rand < 98) rarity = "ultra";
    else rarity = "legend";
  }

  const candidates = characters.filter(c => c.rarity === rarity);
  if (candidates.length === 0) {
    return { name: "?", rarity: "rare", image: "" };
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function updateGachaHint() {
  const hintElement = document.getElementById("gachaHint");
  if (!hintElement) return;

  const isSpecialTime = (solved % 50 === 0) && (solved >= 50);

  if (isSpecialTime) {
    // 50回目（特別確率アップ時）はヒント全体を非表示
    hintElement.style.display = "none";
  } else {
    // 通常時は表示
    hintElement.style.display = "block";
    
    document.getElementById("solvedCount").innerText = solved;
    
    const next = 50 - (solved % 50);
    document.getElementById("toNextSpecial").innerText = next === 0 ? "今がチャンス！" : next;
    
    // 残り10回以内なら色を強調（オプション）
    hintElement.style.color = next <= 10 ? "#ec4899" : "#64748b";
  }
}

// モーダル閉じる
document.getElementById("closeGachaBtn").onclick = () => {
  document.getElementById("gachaModal").style.display = "none";
};

// 1秒ごとのタイマー更新
setInterval(updateTimer, 1000);