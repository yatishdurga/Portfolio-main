/* === PAGE LOADER === */
(function () {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    window.addEventListener('load', () => {
        setTimeout(() => loader.classList.add('hidden'), 400);
    });
})();


/* === PARTICLES CANVAS === */
(function () {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const COUNT = 75;

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(true); }
        reset(init) {
            this.x  = Math.random() * canvas.width;
            this.y  = init ? Math.random() * canvas.height : canvas.height + 10;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.r  = Math.random() * 1.4 + 0.4;
            this.a  = Math.random() * 0.45 + 0.08;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height)  this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.a})`;
            ctx.fill();
        }
    }

    function init() {
        particles = Array.from({ length: COUNT }, () => new Particle());
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx   = particles[i].x - particles[j].x;
                const dy   = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 115) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist / 115)})`;
                    ctx.lineWidth   = 0.6;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawLines();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => { resize(); init(); });
    resize();
    init();
    animate();
})();


/* === SCROLL PROGRESS BAR === */
(function () {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const total    = document.body.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${total > 0 ? scrolled / total : 0})`;
    }, { passive: true });
})();


/* === TYPEWRITER === */
(function () {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const roles = ['Data Engineer', 'Data Scientist', 'ML Engineer', 'AI Enthusiast', 'ETL Specialist'];
    let ri = 0, ci = 0, deleting = false;

    function tick() {
        const word = roles[ri];
        el.textContent = deleting ? word.slice(0, ci - 1) : word.slice(0, ci + 1);
        deleting ? ci-- : ci++;

        if (!deleting && ci === word.length) {
            setTimeout(() => { deleting = true; tick(); }, 1800);
            return;
        }
        if (deleting && ci === 0) {
            deleting = false;
            ri = (ri + 1) % roles.length;
        }
        setTimeout(tick, deleting ? 55 : 95);
    }
    tick();
})();


/* === SCROLL REVEAL (IntersectionObserver) === */
(function () {
    // Auto-add reveal class to section headers
    document.querySelectorAll('.section-header').forEach(h => h.classList.add('reveal'));

    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('revealed');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
})();


/* === ACTIVE NAV ON SCROLL === */
(function () {
    const sections  = document.querySelectorAll('.section');
    const navLinks  = document.querySelectorAll('.nav-link');
    if (!sections.length) return;

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                const link = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
                if (link) link.classList.add('active');
            }
        });
    }, { threshold: 0.35 });

    sections.forEach(s => obs.observe(s));
})();


/* === MOBILE SIDEBAR TOGGLE === */
(function () {
    const toggle  = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function open()  { sidebar.classList.add('open'); toggle.classList.add('open'); overlay.classList.add('active'); }
    function close() { sidebar.classList.remove('open'); toggle.classList.remove('open'); overlay.classList.remove('active'); }

    toggle.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
    overlay.addEventListener('click', close);

    document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', close));
})();


/* === PROJECT FILTER === */
(function () {
    const btns  = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;

            cards.forEach(card => {
                const show = filter === 'all' || card.dataset.category === filter;
                card.classList.toggle('hidden', !show);
                if (show) {
                    card.classList.remove('fade-in');
                    void card.offsetWidth;
                    card.classList.add('fade-in');
                }
            });
        });
    });
})();


/* === EDUCATION ACCORDION === */
function toggleEdu(header) {
    const card = header.closest('.edu-card');
    const isOpen = card.classList.contains('open');
    // Close all first
    document.querySelectorAll('.edu-card.open').forEach(c => c.classList.remove('open'));
    if (!isOpen) card.classList.add('open');
}


/* === COUNTER ANIMATION === */
(function () {
    const statsRow = document.querySelector('.stats-row');
    if (!statsRow) return;

    let triggered = false;
    const obs = new IntersectionObserver(entries => {
        if (!triggered && entries[0].isIntersecting) {
            triggered = true;
            statsRow.querySelectorAll('.stat-number').forEach(el => {
                const target   = parseInt(el.dataset.count, 10);
                const duration = 1800;
                const start    = performance.now();
                function update(now) {
                    const t = Math.min((now - start) / duration, 1);
                    const v = 1 - Math.pow(1 - t, 3); // ease-out-cubic
                    el.textContent = Math.floor(v * target);
                    if (t < 1) {
                        requestAnimationFrame(update);
                    } else {
                        el.classList.add('counted');
                    }
                }
                requestAnimationFrame(update);
            });
        }
    }, { threshold: 0.5 });

    obs.observe(statsRow);
})();


/* === SMOOTH SCROLL === */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});


/* === BACK TO TOP === */
(function () {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();


/* === CUSTOM CURSOR (desktop / pointer devices only) === */
(function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mx = -100, my = -100, rx = -100, ry = -100;
    let raf;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.left  = mx + 'px';
        dot.style.top   = my + 'px';
        dot.classList.add('visible');
        ring.classList.add('visible');
    });

    (function animateRing() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        raf = requestAnimationFrame(animateRing);
    })();

    document.addEventListener('mousedown', () => dot.classList.add('clicking'));
    document.addEventListener('mouseup',   () => dot.classList.remove('clicking'));

    document.querySelectorAll('a, button, .nav-link, .filter-btn, .project-card, .cert-card, .blog-card, .orbit-badge').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });

    document.addEventListener('mouseleave', () => {
        dot.classList.remove('visible');
        ring.classList.remove('visible');
    });
})();

/* ═══════════════════════════════════════════════════════
   LEARNING JOURNAL — renderer
═══════════════════════════════════════════════════════ */
(function () {
    // ── Tab switching ──
    document.querySelectorAll('.learn-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.learn-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.learn-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
        });
    });

    // ── Helpers ──
    function tag(cls, html, elem) {
        const el = document.createElement(elem || 'div');
        el.className = cls;
        el.innerHTML = html;
        return el;
    }

    // ── Daily Log ──
    function renderDaily() {
        const wrap = document.getElementById('daily-cards');
        if (!wrap || typeof DAILY_LOG === 'undefined') return;
        DAILY_LOG.forEach(entry => {
            const card = tag('learn-card reveal', '');
            card.innerHTML = `
                <div class="learn-card-header">
                    <div class="learn-card-meta">
                        <span class="learn-date"><i class="fa-solid fa-calendar-day"></i> ${entry.date}</span>
                        <span class="learn-category">${entry.category}</span>
                    </div>
                </div>
                <div class="learn-topic">${entry.topic}</div>
                <div class="learn-tags">${entry.tags.map(t => `<span class="learn-tag">#${t}</span>`).join('')}</div>
                <div class="learn-summary">${entry.summary}</div>
                <button class="learn-toggle" aria-expanded="false">
                    Key takeaways <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="learn-details">
                    <ul class="learn-key-points">${entry.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
                    ${entry.resources && entry.resources.length ? `
                        <div class="learn-resources">
                            <span style="font-size:0.78rem;color:#6a9e9c;margin-right:0.25rem;font-weight:600;">Resources:</span>
                            ${entry.resources.map(r => `<a href="${r.url}" class="learn-resource" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>${r.label}</a>`).join('')}
                        </div>` : ''}
                </div>`;
            const toggle = card.querySelector('.learn-toggle');
            const details = card.querySelector('.learn-details');
            toggle.addEventListener('click', () => {
                const open = details.classList.toggle('open');
                toggle.classList.toggle('open', open);
                toggle.setAttribute('aria-expanded', open);
                toggle.querySelector('span') && (toggle.querySelector('span').textContent = open ? 'Hide details' : 'Key takeaways');
            });
            wrap.appendChild(card);
        });
    }

    // ── Interview Q&A ──
    function renderInterview() {
        const wrap = document.getElementById('interview-cards');
        if (!wrap || typeof INTERVIEW_QA === 'undefined') return;
        INTERVIEW_QA.forEach(group => {
            const section = tag('interview-category reveal', '');
            section.innerHTML = `<div class="interview-category-title"><i class="fa-solid fa-layer-group"></i> ${group.category}</div>`;
            group.items.forEach(qa => {
                const item = tag('qa-item', '');
                const qBtn = tag('qa-question', `${qa.q} <i class="fa-solid fa-chevron-down"></i>`, 'button');
                const ans = tag('qa-answer', qa.a);
                qBtn.addEventListener('click', () => {
                    const open = ans.classList.toggle('open');
                    qBtn.classList.toggle('open', open);
                });
                item.appendChild(qBtn);
                item.appendChild(ans);
                section.appendChild(item);
            });
            wrap.appendChild(section);
        });
    }

    // ── Research ──
    function renderResearch() {
        const wrap = document.getElementById('research-cards');
        if (!wrap || typeof RESEARCH === 'undefined') return;
        RESEARCH.forEach(entry => {
            const statusClass = entry.status === 'Completed' ? 'completed' : 'inprogress';
            const card = tag('research-card reveal', '');
            card.innerHTML = `
                <div class="research-header">
                    <div>
                        <div class="learn-date" style="margin-bottom:0.5rem"><i class="fa-solid fa-calendar-day"></i> ${entry.date}</div>
                        <div class="learn-tags">${entry.tags.map(t => `<span class="learn-tag">#${t}</span>`).join('')}</div>
                    </div>
                    <span class="research-status ${statusClass}">${entry.status}</span>
                </div>
                <div class="research-title">${entry.title}</div>
                <div class="research-abstract">${entry.abstract}</div>
                <ul class="research-findings">${entry.findings.map(f => `<li>${f}</li>`).join('')}</ul>`;
            wrap.appendChild(card);
        });
    }

    renderDaily();
    renderInterview();
    renderResearch();
})();
