const canvas  = document.getElementById('hero-canvas');
const ctx     = canvas.getContext('2d');
const stage   = document.querySelector('.scroll-container');
const dpr     = Math.min(window.devicePixelRatio || 1, 2);

const SCENES = [
  { id: 0, folder: 'scenes/scene1', count: 120, start: 0.000, end: 0.125, images: [], align: {x: 0.5, y: 0.5} },
  { id: 1, folder: 'scenes/scene2', count: 48,  start: 0.125, end: 0.250, images: [], align: {x: 0.5, y: 0.8} },
  { id: 2, folder: 'scenes/scene3', count: 48,  start: 0.250, end: 0.375, images: [], align: {x: 0.8, y: 0.5} },
  { id: 3, folder: 'scenes/scene4', count: 48,  start: 0.375, end: 0.500, images: [], align: {x: 0.5, y: 0.5} },
  { id: 4, folder: 'scenes/scene5', count: 48,  start: 0.500, end: 0.625, images: [], align: {x: 0.5, y: 0.5} },
  { id: 5, folder: 'scenes/scene6', count: 48,  start: 0.625, end: 0.750, images: [], align: {x: 0.5, y: 0.5} },
  { id: 6, folder: 'scenes/scene7', count: 48,  start: 0.750, end: 0.875, images: [], align: {x: 0.5, y: 0.5} },
  { id: 7, folder: 'scenes/scene8', count: 48,  start: 0.875, end: 1.000, images: [], align: {x: 0.5, y: 0.2} }
];

let totalLoaded = 0;
let totalToLoad = SCENES.reduce((acc, s) => acc + s.count, 0);
let ready = false;

function preload() {
  SCENES.forEach(scene => {
    for (let i = 1; i <= scene.count; i++) {
      const img = new Image();
      img.src = `${scene.folder}/frame_${String(i).padStart(3, '0')}.jpg`;
      img.onload = () => {
        totalLoaded++;
        if (totalLoaded === 1) {
          resizeCanvas();
          drawFrame(scene, 0); // draw very first frame immediately
        }
        if (totalLoaded === totalToLoad) ready = true;
      };
      scene.images.push(img);
    }
  });
}

function resizeCanvas() {
  const isMobile = window.innerWidth <= 768;
  const h = isMobile ? window.innerHeight * 0.55 : window.innerHeight;
  canvas.width  = Math.round(window.innerWidth  * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resizeCanvas);

function drawSceneFrame(scene, idx, opacity) {
  const img = scene.images[idx];
  if (!img || !img.complete || !img.naturalWidth) return;

  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale, dh = ih * scale;
  
  const isPortrait = ch > cw;
  const alignX = isPortrait ? scene.align.x : 0.5;
  const alignY = isPortrait ? scene.align.y : 0.5;
  
  const dx = (cw - dw) * alignX;
  const dy = (ch - dh) * alignY;

  ctx.globalAlpha = opacity;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.globalAlpha = 1.0;
}

let smoothScroll = 0;
const scrollContainer = document.querySelector('.scroll-container');

function render() {
  const containerRect = scrollContainer.getBoundingClientRect();
  // Ne kadar kaydırdığımızı hesapla (viewport tepesinden container tepesine)
  const scrollPos = -containerRect.top; 
  // Container içindeki toplam kaydırılabilir mesafe
  const maxScroll = containerRect.height - window.innerHeight;
  
  let targetScroll = maxScroll > 0 ? scrollPos / maxScroll : 0;
  targetScroll = Math.max(0, Math.min(1, targetScroll));
  
  // Aslanlar gibi pürüzsüz global atalet (Inertia)
  smoothScroll += (targetScroll - smoothScroll) * 0.08;
  const progress = Math.max(0, Math.min(1, smoothScroll));

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fade = 0.04; // Sahneler arası %4'lük sinematik crossfade alanı

  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    
    // Sahne sınırlarını yumuşat
    const extStart = s.start - fade/2;
    const extEnd = s.end + fade/2;
    
    if (progress >= extStart && progress <= extEnd) {
      let opacity = 1.0;
      
      // Fade In
      if (progress < s.start + fade/2 && i !== 0) {
        opacity = (progress - extStart) / fade;
      }
      // Fade Out
      else if (progress > s.end - fade/2 && i !== SCENES.length - 1) {
        opacity = 1 - ((progress - (s.end - fade/2)) / fade);
      }
      
      opacity = Math.max(0, Math.min(1, opacity));
      
      let localProgress = (progress - extStart) / (extEnd - extStart);
      localProgress = Math.max(0, Math.min(1, localProgress));
      
      const idx = Math.floor(localProgress * (s.count - 1));
      drawSceneFrame(s, idx, opacity);
    }
  }

  // Metinlerin pürüzsüz giriş çıkışı
  document.querySelectorAll('.panel').forEach((panel, index) => {
    const s = SCENES[index];
    let panelOpacity = 0;
    let transformY = 20;
    let display = 'none';

    if (progress >= s.start && progress <= s.end) {
      display = 'flex';
      let localProgress = (progress - s.start) / (s.end - s.start);
      
      if (localProgress < 0.15 && index !== 0) {
        panelOpacity = localProgress / 0.15;
        transformY = 20 * (1 - panelOpacity);
      } else if (localProgress > 0.85 && index !== SCENES.length - 1) {
        panelOpacity = 1 - ((localProgress - 0.85) / 0.15);
        transformY = -20 * (1 - panelOpacity);
      } else {
        panelOpacity = 1;
        transformY = 0;
      }
    }

    panel.style.display = display;
    if (display === 'flex') {
      panel.style.opacity = panelOpacity;
      panel.style.transform = `translateY(${transformY}px)`;
    }
  });

  window.requestAnimationFrame(render);
}

// Ensure first render sets initial panel states
render();
preload();

// ── Stats Animation ──────────────────────────────────
const statNums = document.querySelectorAll('.stat .num');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      // İlk gördüğünde asıl sayıyı kaydet, sonra hep onu hedefle
      if (!el.dataset.val) {
        el.dataset.val = el.innerText;
      }
      const finalVal = parseFloat(el.dataset.val);
      // Her ekrana girişinde tekrar saysın
      animateValue(el, 0, finalVal, 2500);
    }
  });
}, { threshold: 0.5 });

statNums.forEach(num => statObserver.observe(num));

function animateValue(obj, start, end, duration) {
  if (obj.animationFrameId) window.cancelAnimationFrame(obj.animationFrameId);
  
  let startTimestamp = null;
  // If the dataset value had a dot, it's a float
  const isFloat = !Number.isInteger(end) && obj.dataset.val.includes('.');
  
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    const easeProgress = 1 - Math.pow(1 - progress, 4); 
    
    const current = start + easeProgress * (end - start);
    obj.innerHTML = isFloat ? current.toFixed(1) : Math.floor(current);
    
    if (progress < 1) {
      obj.animationFrameId = window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = isFloat ? end.toFixed(1) : end;
    }
  };
  obj.animationFrameId = window.requestAnimationFrame(step);
}
