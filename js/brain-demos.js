// --- Brain Effects Demo ---
const brainEffects = { stress: false, dopamine: false, amygdala: false };
let amygdalaTimer = null;

function toggleBrainEffect(name) {
    const isActive = brainEffects[name];
    // turn off all first
    turnOffBrainEffect('stress');
    turnOffBrainEffect('dopamine');
    turnOffBrainEffect('amygdala');
    if (!isActive) turnOnBrainEffect(name);
}

function turnOnBrainEffect(name) {
    brainEffects[name] = true;
    const btn = document.getElementById('btn-' + name);
    const icon = document.getElementById('icon-' + name);
    btn.classList.add('active');
    icon.className = 'fa fa-stop';

    if (name === 'stress') {
        document.documentElement.classList.add('brain-stress-mode');
    }
    if (name === 'dopamine') {
        document.body.classList.add('dopamine-full-active');
        startDopamineBurst();
    }
    if (name === 'amygdala') {
        startAmygdalaSequence();
    }
}

function turnOffBrainEffect(name) {
    brainEffects[name] = false;
    const btn = document.getElementById('btn-' + name);
    const icon = document.getElementById('icon-' + name);
    if (btn) { btn.classList.remove('active'); }
    if (icon) { icon.className = 'fa fa-play'; }

    if (name === 'stress') {
        document.documentElement.classList.remove('brain-stress-mode');
    }
    if (name === 'dopamine') {
        document.body.classList.remove('dopamine-full-active');
        stopDopamineBurst();
    }
    if (name === 'amygdala') {
        const c = document.querySelector('.container');
        c.classList.remove('amygdala-phase-1', 'amygdala-phase-2', 'amygdala-phase-3', 'amygdala-heartbeat');
        const ov = document.getElementById('amygdala-overlay');
        if (ov) ov.classList.remove('active');
        if (amygdalaTimer) { clearTimeout(amygdalaTimer); amygdalaTimer = null; }
        stopHeartbeat();
    }
}

function dopamineEnter() {
    document.getElementById('card-dopamine').classList.add('dopamine-active');
}
function dopamineLeave() {
    if (brainEffects.dopamine)
        document.getElementById('card-dopamine').classList.remove('dopamine-active');
}

// --- Dopamine Burst Engine (always-on — hover & click rewards) ---
const DOPAMINE_COLORS = ['#1E73B9', '#B10A4A', '#fbbf24', '#e879a0', '#06b6d4', '#a78bfa'];
const NEURO_SYMBOLS = ['✦', '⚡', '◆', '✸', '⊕', '❋', '◈'];

const _dCanvas = document.getElementById('dopamine-canvas');
_dCanvas.style.display = 'block';
const _dCtx = _dCanvas.getContext('2d');
let _dParticles = [];
let _dBoost = false;

function _dResize() { _dCanvas.width = window.innerWidth; _dCanvas.height = window.innerHeight; }
_dResize();
window.addEventListener('resize', _dResize);

function spawnBurstAt(x, y, baseCount, withFloater) {
    const count = _dBoost ? Math.round(baseCount * 2.2) : baseCount;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.4 + Math.random() * 3.8;
        const color = DOPAMINE_COLORS[Math.floor(Math.random() * DOPAMINE_COLORS.length)];
        _dParticles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: 1.8 + Math.random() * 3,
            color, life: 1,
            decay: 0.016 + Math.random() * 0.02
        });
    }
    if (withFloater) {
        const num = _dBoost ? 3 : 1;
        for (let i = 0; i < num; i++) {
            const sym = NEURO_SYMBOLS[Math.floor(Math.random() * NEURO_SYMBOLS.length)];
            const el = document.createElement('div');
            el.className = 'neuro-floater';
            el.textContent = sym;
            el.style.left = (x - 10 + (Math.random() - 0.5) * 50) + 'px';
            el.style.top  = (y - 10) + 'px';
            const fc = DOPAMINE_COLORS[Math.floor(Math.random() * DOPAMINE_COLORS.length)];
            el.style.color = fc;
            el.style.textShadow = '0 0 16px ' + fc + ', 0 0 32px ' + fc;
            el.style.fontSize = (0.85 + Math.random() * 1.1) + 'rem';
            el.style.fontWeight = 'bold';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2500);
        }
    }
}

// Always-running render loop
(function _dLoop() {
    _dCtx.clearRect(0, 0, _dCanvas.width, _dCanvas.height);
    _dParticles = _dParticles.filter(p => p.life > 0.01);
    for (const p of _dParticles) {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.97; p.vy *= 0.97;
        p.life -= p.decay;
        const a  = Math.max(0, Math.floor(p.life * 255)).toString(16).padStart(2, '0');
        const ga = Math.max(0, Math.floor(p.life * 45)).toString(16).padStart(2, '0');
        _dCtx.beginPath();
        _dCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        _dCtx.fillStyle = p.color + a;
        _dCtx.fill();
        _dCtx.beginPath();
        _dCtx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        _dCtx.fillStyle = p.color + ga;
        _dCtx.fill();
    }
    requestAnimationFrame(_dLoop);
})();

// Click anywhere → medium burst with floater (only when dopamine active)
document.addEventListener('click', e => {
    if (!brainEffects.dopamine) return;
    spawnBurstAt(e.clientX, e.clientY, 20, true);
    spawnCoins(e.clientX, e.clientY, 5);
    incrementDopamineCounter();
});

// Hover on interactive elements → mini burst (only when dopamine active)
document.querySelectorAll('a, button, .bento-card, .module-card, .difficulty-card, .pill-item, .demo-trigger-btn, .cta-button, .nav-link')
    .forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (!brainEffects.dopamine) return;
        });
    });

// Hover on cards → warm golden glow (only when dopamine active)
document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        if (!brainEffects.dopamine) return;
        el.classList.add('dopamine-card-hover');
        spawnCoins(el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2, el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2, 3);
    });
    el.addEventListener('mouseleave', () => {
        el.classList.remove('dopamine-card-hover');
    });
});

// --- Dollar counter ---
let _dopamineTotal = 0;
const _dopamineCounterEl = document.getElementById('dopamine-counter');

document.addEventListener('mousemove', e => {
    if (!brainEffects.dopamine) return;
    _dopamineCounterEl.style.left = e.clientX + 'px';
    _dopamineCounterEl.style.top  = e.clientY + 'px';
});

function playCoinSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;

        if (type === 'milestone') {
            // Triumfalny arpeggio przy każdym tysiącu
            const notes = [1047, 1319, 1568, 2093]; // C6, E6, G6, C7
            notes.forEach((freq, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.connect(g); g.connect(ctx.destination);
                o.frequency.setValueAtTime(freq, now + i * 0.1);
                g.gain.setValueAtTime(0.0, now + i * 0.1);
                g.gain.linearRampToValueAtTime(0.18, now + i * 0.1 + 0.01);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.52);
            });
            setTimeout(() => ctx.close(), 900);
        } else if (type === 'click') {
            // Stały brzęk monety: zawsze te same dwie częstotliwości
            const o1 = ctx.createOscillator();
            const o2 = ctx.createOscillator();
            const g1 = ctx.createGain();
            const g2 = ctx.createGain();
            o1.type = 'sine'; o1.frequency.setValueAtTime(1500, now);
            o2.type = 'sine'; o2.frequency.setValueAtTime(2250, now + 0.025);
            g1.gain.setValueAtTime(0.12, now);
            g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            g2.gain.setValueAtTime(0.07, now + 0.025);
            g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            o1.connect(g1); g1.connect(ctx.destination);
            o2.connect(g2); g2.connect(ctx.destination);
            o1.start(now); o1.stop(now + 0.22);
            o2.start(now + 0.025); o2.stop(now + 0.27);
            setTimeout(() => ctx.close(), 400);
        }
    } catch(e) {}
}

function incrementDopamineCounter() {
    _dopamineTotal += 100;
    _dopamineCounterEl.textContent = '+$' + _dopamineTotal.toLocaleString();
    _dopamineCounterEl.classList.remove('dopamine-counter-pop');
    void _dopamineCounterEl.offsetWidth; // reflow
    _dopamineCounterEl.classList.add('dopamine-counter-pop');
    if (_dopamineTotal % 1000 === 0) {
        playCoinSound('milestone');
    } else {
        playCoinSound('click');
    }
}

// --- Coin helpers ---
function spawnCoins(x, y, count) {
    const COIN_GLYPHS = ['💰', '🪙', '⭐', '✨', '💵'];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'dopamine-coin';
        el.textContent = COIN_GLYPHS[Math.floor(Math.random() * COIN_GLYPHS.length)];
        const dx = (Math.random() - 0.5) * 160;
        const dy = -(60 + Math.random() * 130);
        const rot = (Math.random() - 0.5) * 720;
        const dur = 0.7 + Math.random() * 0.6;
        el.style.left = x + 'px';
        el.style.top  = y + 'px';
        el.style.setProperty('--coin-dx', dx + 'px');
        el.style.setProperty('--coin-dy', dy + 'px');
        el.style.setProperty('--coin-rot', rot + 'deg');
        el.style.setProperty('--coin-dur', dur + 's');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), dur * 1000 + 100);
    }
}

// Brain lab button toggles boost mode + background glow
function startAmygdalaSequence() {
    const c = document.querySelector('.container');
    const ov = document.getElementById('amygdala-overlay');
    ov.classList.add('active');
    // Faza 1: delikatne drżenie (0–1s)
    c.classList.add('amygdala-phase-1');
    playHeartbeat(120);
    amygdalaTimer = setTimeout(() => {
        // Faza 2: silniejsze drżenie + bicie serca (1–2s)
        c.classList.remove('amygdala-phase-1');
        c.classList.add('amygdala-phase-2', 'amygdala-heartbeat');
        playHeartbeat(160);
        amygdalaTimer = setTimeout(() => {
            // Faza 3: maksymalne drżenie — zostaje aż user wyłączy
            c.classList.remove('amygdala-phase-2');
            c.classList.add('amygdala-phase-3');
            playHeartbeat(200);
            amygdalaTimer = null;
        }, 1000);
    }, 1000);
}

let _heartbeatInterval = null;
let _heartbeatCtx = null;
let _heartbeatActive = false;

function playHeartbeat(bpm) {
    // Stop any existing loop first
    _heartbeatActive = false;
    if (_heartbeatInterval) { clearInterval(_heartbeatInterval); _heartbeatInterval = null; }
    if (_heartbeatCtx) {
        try { _heartbeatCtx.suspend(); } catch(e) {}
        try { _heartbeatCtx.close(); } catch(e) {}
        _heartbeatCtx = null;
    }

    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        _heartbeatCtx = ctx;
        _heartbeatActive = true;

        const beat = (time, gain) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.setValueAtTime(55, time);
            o.frequency.exponentialRampToValueAtTime(35, time + 0.08);
            g.gain.setValueAtTime(gain, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            o.start(time); o.stop(time + 0.13);
        };

        const playOnce = () => {
            if (!_heartbeatActive) return;
            const now = ctx.currentTime;
            const ivl = 60 / bpm;
            beat(now, 0.7);
            beat(now + ivl * 0.15, 0.4);
        };

        playOnce();
        _heartbeatInterval = setInterval(playOnce, (60 / bpm) * 1000);
    } catch(e) {}
}

function stopHeartbeat() {
    _heartbeatActive = false;
    if (_heartbeatInterval) { clearInterval(_heartbeatInterval); _heartbeatInterval = null; }
    if (_heartbeatCtx) {
        try { _heartbeatCtx.suspend(); } catch(e) {}
        try { _heartbeatCtx.close(); } catch(e) {}
        _heartbeatCtx = null;
    }
}

function startDopamineBurst() {
    _dBoost = true;
    _dopamineTotal = 0;
    _dopamineCounterEl.style.display = 'block';
    _dopamineCounterEl.textContent = '+$0';
}

// Track cursor for stress peripheral blur
document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--stress-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--stress-y', e.clientY + 'px');
});
function stopDopamineBurst()  {
    _dBoost = false;
    _dopamineCounterEl.style.display = 'none';
    document.querySelectorAll('.neuro-floater').forEach(el => el.remove());
}
