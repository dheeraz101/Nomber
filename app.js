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

let isHolding = false
let lastHoldTick = 0
let lastTapTime = 0

let tapForce = 0
let tapVelocity = 0

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
const shareBtn = document.getElementById("shareBtn")
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

let rollOffset = 0

function renderNumber() {

  displayValue += (state.count - displayValue) * 0.18
  const rounded = Math.round(displayValue)

  if (countEl.dataset.last != rounded) {

    rollOffset = -4

    setTimeout(()=>{
      countEl.textContent = rounded.toLocaleString()
      rollOffset = 0
    },40)

    countEl.dataset.last = rounded
  }

  /* physics */

  tapVelocity += tapForce
  tapVelocity *= 0.75
  tapForce *= 0.65

  const scale = 1 - Math.abs(tapVelocity) * 0.04

  countEl.style.transform = `translateY(${rollOffset}px) scale(${scale})`

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

  const rect = tapArea.getBoundingClientRect()
  ripple(rect.width / 2, rect.height / 2)

  countEl.classList.add("tap")

  countEl.style.transform = "scale(0.96)"

  setTimeout(()=>{
    countEl.style.transform = "scale(1)"
  },80)

  tapForce += 0.4

  setTimeout(() => {
    countEl.classList.remove("tap")
  }, 100)

  save()

}

/* =========================
HOLD TAP
========================= */

let holdInterval = null

tapArea.addEventListener("pointerdown", (e) => {

  isHolding = true

  increment(e.clientX, e.clientY)

  holdInterval = setInterval(() => {

    if(!isHolding) return

    increment(e.clientX, e.clientY)

  }, 120)

})

function stopHold(){

  isHolding = false

  if(holdInterval){
    clearInterval(holdInterval)
    holdInterval = null
  }

}

window.addEventListener("pointerup", stopHold)
window.addEventListener("pointercancel", stopHold)
window.addEventListener("pointerleave", stopHold)
window.addEventListener("blur", stopHold)
document.addEventListener("visibilitychange", stopHold)

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

    return

  }

  state.count = Math.ceil(remaining / 1000)

}

ctx.globalCompositeOperation = "lighter"

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

  requestAnimationFrame(loop)

}

loop()

/* =========================
SHARE
========================= */

shareBtn.onclick = async (e) => {

  ripple(e.clientX, e.clientY)

  vibrate(10)

  const shareData = {
    title: "Nomber • Minimal Counter",
    text: "A next generation innovative counter from 1 second to 10000 with a unique tap system and real time countdown. Check it out!",
    url: window.location.href
  }

  if (navigator.share) {

    try {
      await navigator.share(shareData)
    } catch (err) {
      console.log("Share cancelled")
    }

  } else {

    /* fallback for desktop */

    navigator.clipboard.writeText(window.location.href)

    alert("Link copied to clipboard")

  }

}

/* =========================
SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => {
        console.log("Service Worker registered", reg)
      })
      .catch(err => {
        console.log("Service Worker failed", err)
      })
  })
}

/* =========================
PWA INSTALL
========================= */

let deferredPrompt
const installBtn = document.getElementById("installBtn")

window.addEventListener("beforeinstallprompt", (e) => {

  e.preventDefault()

  deferredPrompt = e

  installBtn.classList.remove("hidden")

})

installBtn.onclick = async () => {

  if(!deferredPrompt) return

  deferredPrompt.prompt()

  const choice = await deferredPrompt.userChoice

  if(choice.outcome === "accepted"){
    console.log("PWA installed")
  }

  deferredPrompt = null
  installBtn.classList.add("hidden")

}