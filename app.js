let words = []
let current = null

fetch("words.json")
  .then(r => r.json())
  .then(data => {
    words = data
    next()
  })

function next() {
  current = words[Math.floor(Math.random()*words.length)]

  document.getElementById("question").innerText = current.q

  let choices = [current.a]

  while (choices.length < 4) {
    let r = words[Math.floor(Math.random()*words.length)].a
    if (!choices.includes(r)) choices.push(r)
  }

  choices.sort(() => Math.random() - 0.5)

  const box = document.getElementById("choices")
  box.innerHTML = ""

  choices.forEach(c => {
    const btn = document.createElement("button")
    btn.className = "choiceBtn"
    btn.innerText = c
    btn.onclick = () => answer(c)
    box.appendChild(btn)
  })
}

function answer(c) {
  const result = document.getElementById("question")

  if (c === current.a) {
    result.innerText = "⭕ Correct!"
    result.style.color = "green"
  } else {
    result.innerText = "❌ Wrong → " + current.a
    result.style.color = "red"
  }

  // ボタン無効化（連打防止）
  document.querySelectorAll(".choiceBtn").forEach(b => b.disabled = true)

  // 1秒後に次の問題
  setTimeout(() => {
    result.style.color = "black"
    next()
  }, 1000)
}