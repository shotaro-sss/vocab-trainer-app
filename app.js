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

  if (isCorrect) {
    solved++;
    saveCount(solved);

    if (solved === DAILY_TARGET) {
      result.innerText = "🎉 30問達成！おめでとう！";
      result.style.color = "#FFD700"; // 金色
      // 必要なら音やアニメーションをここで追加可能
    } else if (solved > DAILY_TARGET) {
      result.innerText = "⭕ 正解！（今日の目標クリア済み）";
      result.style.color = "green";
    } else {
      result.innerText = "⭕ 正解！";
      result.style.color = "green";
    }
  } else {
    result.innerText = `❌ 不正解 → ${current.a}`;
    result.style.color = "red";
  }

  // ボタン無効化
  document.querySelectorAll(".choiceBtn").forEach(b => b.disabled = true);

  updateBar();
  updateWarningImage();

  setTimeout(() => {
    result.style.color = "black";
    result.innerText = current.q;
    answering = false;
    next();
  }, 1400);  // 達成メッセージが見やすいよう少し長めに
}

function updateBar() {
    const pct = Math.min(100, (solved / DAILY_TARGET) * 100);
    document.getElementById("bar").style.width = `${pct}%`;
    document.getElementById("progressText").innerText = `${solved} / ${DAILY_TARGET}`;
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