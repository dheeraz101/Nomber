/* =========================
CONFIG
========================= */

const MAX_COUNT = 10000
const STORAGE_KEY = "nomber-counter"
const THEME_KEY = "nomber-theme"

let theme = localStorage.getItem(THEME_KEY) || "dark"
document.documentElement.setAttribute("data-theme", theme)

/* =========================
STATE
========================= */

let state = { count: 0 }

const saved = localStorage.getItem(STORAGE_KEY)
if (saved) state = JSON.parse(saved)

let countdownRunning = false
let countdownStart = 0
let countdownDuration = 0

let holdInterval = null
let lastTapTime = 0

function getThemeColor(){
  return getComputedStyle(document.body).getPropertyValue("--text").trim()
}

/* =========================
ELEMENTS
========================= */

const countEl = document.getElementById("count")
const tapArea = document.getElementById("tapArea")
const startBtn = document.getElementById("startBtn")
const resetBtn = document.getElementById("resetBtn")
const screenBtn = document.getElementById("screenBtn")
const themeBtn = document.getElementById("themeBtn")

const canvas = document.getElementById("fx")
const ctx = canvas.getContext("2d")

/* =========================
CANVAS
========================= */

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

resizeCanvas()
window.addEventListener("resize", resizeCanvas)

/* =========================
SAVE
========================= */

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

screenBtn.onclick = (e) => {

  ripple(e.clientX, e.clientY)

  if(navigator.vibrate) navigator.vibrate(15)

  screenBtn.classList.add("button-press")

  setTimeout(()=>{
    screenBtn.classList.remove("button-press")
  },150)

  if(!document.fullscreenElement){

    document.documentElement.requestFullscreen().catch(err=>{
      console.log(err)
    })

  }else{

    document.exitFullscreen()

  }

}

document.addEventListener("fullscreenchange", () => {

  if(!document.fullscreenElement){
    screenBtn.classList.remove("active")
  }else{
    screenBtn.classList.add("active")
  }

})

themeBtn.onclick = (e) => {

  ripple(e.clientX, e.clientY)

  vibrate(10)

  theme = theme === "dark" ? "light" : "dark"

  document.documentElement.setAttribute("data-theme", theme)

  localStorage.setItem(THEME_KEY, theme)

  themeBtn.classList.add("button-press")

  setTimeout(()=>{
    themeBtn.classList.remove("button-press")
  },150)

}

/* =========================
APPLE STYLE NUMBER ROLL
========================= */

let displayValue = state.count

function renderNumber() {
  displayValue += (state.count - displayValue) * 0.18
  countEl.textContent = Math.round(displayValue).toLocaleString()
}

/* =========================
PARTICLES
========================= */

let particles = []

function spawnParticles(x, y, amount = 20) {

  for (let i = 0; i < amount; i++) {

    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1,
      size: Math.random() * 3 + 2
    })

  }

}

/* screen wide ambient particles */

function spawnScreenParticles(amount = 30) {

  for (let i = 0; i < amount; i++) {

    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 1,
      size: Math.random() * 2 + 1
    })

  }

}


function drawParticles() {

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = getThemeColor()

  particles.forEach(p => {

    /* physics */

    p.vy += 0.05
    p.vx *= 0.99
    p.vy *= 0.99

    p.x += p.vx
    p.y += p.vy
    p.life -= 0.02

    ctx.globalAlpha = p.life

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()

  })

  ctx.globalAlpha = 1

  particles = particles.filter(p => p.life > 0)

}

/* =========================
RIPPLE
========================= */

function ripple(x, y) {

  const rect = tapArea.getBoundingClientRect()

  const r = document.createElement("div")
  r.className = "ripple"

  r.style.left = x - rect.left + "px"
  r.style.top = y - rect.top + "px"

  tapArea.appendChild(r)

  setTimeout(() => r.remove(), 600)

}

/* =========================
VIBRATION
========================= */

function vibrate(ms = 10) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

/* =========================
TAP SPEED CALCULATION
========================= */

function getTapMultiplier() {

  const now = Date.now()
  const delta = now - lastTapTime
  lastTapTime = now

  if (delta < 80) return 2.5
  if (delta < 140) return 1.8
  if (delta < 220) return 1.3

  return 1

}

/* =========================
TAP
========================= */

function increment(x, y) {

  if (countdownRunning) return
  if (state.count >= MAX_COUNT) return

  state.count++

  const multiplier = getTapMultiplier()

  vibrate(10)

  ripple(x, y)

  spawnParticles(x, y, Math.floor(18 * multiplier))
  spawnScreenParticles(Math.floor(6 * multiplier))

  countEl.classList.add("tap")

  setTimeout(() => {
    countEl.classList.remove("tap")
  }, 100)

  save()

}

/* =========================
HOLD TAP
========================= */

tapArea.addEventListener("pointerdown", (e) => {

  increment(e.clientX, e.clientY)

  holdInterval = setInterval(() => {
    increment(e.clientX, e.clientY)
  }, 80)

})

window.addEventListener("pointerup", () => {
  clearInterval(holdInterval)
})

/* =========================
COUNTDOWN (REAL TIME)
========================= */

startBtn.onclick = (e) => {

  startBtn.classList.add("button-press")

  setTimeout(() => {
    startBtn.classList.remove("button-press")
  }, 150)

  vibrate(20)

  if (countdownRunning) return
  if (state.count <= 0) return

  ripple(e.clientX, e.clientY)

  countdownRunning = true

  countdownDuration = state.count * 1000
  countdownStart = Date.now()

  countEl.classList.add("countdown")

}

function updateCountdown() {

  if (!countdownRunning) return

  const elapsed = Date.now() - countdownStart
  const remaining = countdownDuration - elapsed

  if (remaining <= 0) {

    state.count = 0
    displayValue = 0
    countdownRunning = false

    countEl.classList.remove("countdown")

    spawnScreenParticles(120)

    return

  }

  state.count = Math.ceil(remaining / 1000)

}

/* =========================
RESET
========================= */

resetBtn.onclick = (e) => {

  countdownRunning = false
  state.count = 0
  displayValue = 0

  countEl.classList.remove("countdown")

  ripple(e.clientX, e.clientY)

  vibrate(15)

  spawnScreenParticles(40)

  save()

}

/* =========================
MAIN LOOP (60FPS)
========================= */

function loop() {

  updateCountdown()

  renderNumber()

  drawParticles()

  /* ambient particles */

  if (particles.length < 40 && Math.random() < 0.04) {
    spawnScreenParticles(2)
  }

  requestAnimationFrame(loop)

}

loop()

