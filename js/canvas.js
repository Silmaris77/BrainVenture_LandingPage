const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let pulses = [];
let mouse = { x: null, y: null, radius: 200 };

window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
}

class Particle {
    constructor(isTemporary = false) {
        this.x = isTemporary ? 0 : Math.random() * canvas.width;
        this.y = isTemporary ? 0 : Math.random() * canvas.height;
        this.radius = Math.random() * 2 + 1;
        this.neighbors = [];
        this.glow = 0;
        this.isTemporary = isTemporary;
        this.life = 1.0;
        this.fadeRate = 1.0 / (60 * 10); // 10 seconds
    }
    draw() {
        if (this.isTemporary && this.life <= 0) return;
        const alpha = (this.isTemporary ? this.life : 1.0);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30, 115, 185, ${(0.75 + this.glow) * alpha})`;
        ctx.fill();
        if (this.glow > 0) this.glow *= 0.95;
        if (this.isTemporary) this.life -= this.fadeRate;
    }
}

class Pulse {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.progress = 0;
        this.speed = 0.01 + Math.random() * 0.02;
    }
    update() {
        this.progress += this.speed;
        if (this.progress >= 1) {
            this.p2.glow = 1.0;
            return false;
        }
        return true;
    }
    draw() {
        const alpha = Math.min(this.p1.life || 1, this.p2.life || 1);
        if (alpha <= 0) return;

        const x = this.p1.x + (this.p2.x - this.p1.x) * this.progress;
        const y = this.p1.y + (this.p2.y - this.p1.y) * this.progress;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, 6);
        grad.addColorStop(0, `rgba(30, 115, 185, ${alpha})`);
        grad.addColorStop(1, `rgba(30, 115, 185, 0)`);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
}

function init() {
    particles = [];
    pulses = [];
    const count = (canvas.width * canvas.height) / 12500;
    for (let i = 0; i < count; i++) particles.push(new Particle());

    // Establish static synapses
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const d = Math.sqrt((particles[i].x - particles[j].x) ** 2 + (particles[i].y - particles[j].y) ** 2);
            if (d < 180) {
                particles[i].neighbors.push(particles[j]);
                particles[j].neighbors.push(particles[i]);
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cleanup dead temporary particles
    particles = particles.filter(p => !p.isTemporary || p.life > 0);

    // Draw Synapses
    ctx.lineWidth = 0.5;
    particles.forEach(p => {
        const pAlpha = p.isTemporary ? p.life : 1.0;
        p.neighbors.forEach(n => {
            const nAlpha = n.isTemporary ? n.life : 1.0;
            const synapseAlpha = 0.35 * Math.min(pAlpha, nAlpha);
            if (synapseAlpha <= 0) return;

            ctx.beginPath();
            ctx.strokeStyle = `rgba(30, 115, 185, ${synapseAlpha})`;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
        });
        p.draw();
    });

    // Occasional Pulse Spawning (Increased frequency)
    if (Math.random() < 0.15 && particles.length > 0) {
        const startNode = particles[Math.floor(Math.random() * particles.length)];
        if (startNode.neighbors.length > 0) {
            const targetNode = startNode.neighbors[Math.floor(Math.random() * startNode.neighbors.length)];
            pulses.push(new Pulse(startNode, targetNode));
        }
    }

    // Update & Draw Pulses
    pulses = pulses.filter(p => {
        const active = p.update();
        p.draw();
        return active;
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
window.addEventListener('click', (e) => {
    const p = new Particle(true);
    p.x = e.clientX;
    p.y = e.clientY;
    particles.push(p);

    // Connect to nearby neurons
    particles.forEach(p2 => {
        if (p === p2) return;
        const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
        if (d < 150) {
            p.neighbors.push(p2);
            p2.neighbors.push(p);
            if (Math.random() < 0.5) pulses.push(new Pulse(p, p2));
        }
    });
});

resize(); animate();
