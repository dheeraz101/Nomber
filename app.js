/* ======================
   CONSTANTS
====================== */
const MAX_DAYS = 1_000_000;
const STORAGE_KEY = 'nomber-data';

/* ======================
   STATE
====================== */
let state = {
  count: 0,
  lastDay: null,
  lastTime: null,
  theme: 'light'
};

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) state = JSON.parse(saved);

/* ======================
   ELEMENTS
====================== */
const countEl = document.getElementById('count');
const tapArea = document.getElementById('tapArea');
const themeBtn = document.getElementById('themeBtn');
const shareBtn = document.getElementById('shareBtn');
const installBtn = document.getElementById('installBtn');

/* ======================
   HELPERS
====================== */
const todayKey = () => new Date().toISOString().slice(0, 10);

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateUI() {
  countEl.textContent = state.count.toLocaleString();
}

/* ======================
   ANTI-CHEAT (SOFT)
====================== */
function isClockRolledBack() {
  const now = Date.now();
  if (state.lastTime && now < state.lastTime - 60_000) {
    alert('System time manipulation detected.');
    return true;
  }
  state.lastTime = now;
  return false;
}

/* ======================
   CORE TAP
====================== */
tapArea.onclick = () => {
  if (state.count >= MAX_DAYS) return;
  if (isClockRolledBack()) return;

  const today = todayKey();
  if (state.lastDay === today) {
    alert('Already counted today.');
    return;
  }

  state.count += 1;
  state.lastDay = today;

  save();
  updateUI();

  if ([5,10,15,20,25,30,50,100,150,200,500,1000].includes(state.count)) {
    fireConfetti();
  }
};

/* ======================
   CONFETTI
====================== */
function fireConfetti() {
  import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js')
    .then(({ default: confetti }) => {
      confetti({ particleCount: 150, spread: 90 });
    });
}

/* ======================
   THEME (FIXED)
====================== */
function applyTheme() {
  document.body.classList.toggle('dark', state.theme === 'dark');
}

applyTheme();

themeBtn.onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  save();
  applyTheme();
};

/* ======================
   SHARE AS IMAGE (FIXED)
====================== */
shareBtn.onclick = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');

  const isDark = state.theme === 'dark';

  ctx.fillStyle = isDark ? '#000' : '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = isDark ? '#fff' : '#000';
  ctx.textAlign = 'center';

  ctx.font = '800 200px -apple-system';
  ctx.fillText(state.count.toLocaleString(), 540, 620);

  ctx.font = '500 48px -apple-system';
  ctx.globalAlpha = 0.7;

  const now = new Date();
  const date = now.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const time = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  ctx.fillText(
    `Nomber • ${date} • ${time}`,
    540,
    720
  );

  ctx.globalAlpha = 1;

  canvas.toBlob(blob => {
    const file = new File([blob], 'nomber.png', { type: 'image/png' });
    navigator.share?.({
      files: [file],
      title: 'Nomber'
    });
  });
};

/* ======================
   PWA INSTALL / OPEN
====================== */
// Better PWA mode detection
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  // iOS Safari fallback (older but still sometimes useful)
  ('standalone' in navigator && navigator.standalone === true);

// This is the most reliable combination for most cases in 2025–2026
const isLikelyInstalledAndRunningStandalone = isStandalone();

// We assume: if beforeinstallprompt fired → install is still possible (not yet installed)
let installPromptAvailable = false;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installPromptAvailable = true;

  // Only show "install" if we're clearly **not** in standalone mode
  if (!isLikelyInstalledAndRunningStandalone) {
    installBtn.classList.remove('hidden');
    installBtn.textContent = 'install';
  }
});

window.addEventListener('appinstalled', () => {
  // Fired when user actually installs (good moment to update UI)
  deferredPrompt = null;
  installPromptAvailable = false;

  // If still in browser → now show "open app"
  if (!isLikelyInstalledAndRunningStandalone) {
    showOpenApp();
  }
});

// Initial check on load
if (isLikelyInstalledAndRunningStandalone) {
  // Running as PWA → hide everything or show "open app" only if you want
  installBtn.classList.add('hidden');
} else if (!installPromptAvailable) {
  // In browser, prompt did NOT fire → very likely already installed
  showOpenApp();
} else {
  // Prompt is coming or already saved → show install (default case)
  // (handled by the event listener above)
}

// Your existing showOpenApp function is fine:
function showOpenApp() {
  installBtn.classList.remove('hidden');
  installBtn.textContent = 'open app';
  installBtn.style.opacity = '0.6';
  installBtn.onclick = () => {
    // Optional: try to open via scheme if you have one, otherwise just reload
    // or do nothing special — reload often works fine to trigger standalone
    window.location.reload();
    // Alternative: window.open(window.location.href, '_blank'); but reload is usually enough
  };
}

/* ======================
   INIT
====================== */
updateUI();
navigator.serviceWorker?.register('/service-worker.js');
