/* ═══════════════════════════════════════════════════════════════
   LEARNING JOURNAL — learning.js
   Reads from:  data/learnings.js  (static seed data)
   Reads/writes via GitHub Issues API (stored as GitHub Issues)
═══════════════════════════════════════════════════════════════ */

(function () {

    // ── Config storage keys ──
    const KEY_OWNER   = 'lj_gh_owner';
    const KEY_REPO    = 'lj_gh_repo';
    const KEY_PAT     = 'lj_gh_pat';
    const KEY_HIDDEN  = 'lj_hidden_ids'; // local deletions (seed entries)
    const GH_LABEL    = 'learning-journal';

    // ── State ──
    let allEntries = [];
    let activeFilter = 'all';
    let activeType = 'daily-log';
    let searchQuery = '';
    let hiddenIds = new Set(JSON.parse(localStorage.getItem(KEY_HIDDEN) || '[]'));

    function isOwner() { return !!localStorage.getItem(KEY_PAT); }

    // ── DOM refs ──
    const grid         = document.getElementById('lj-grid');
    const countEl      = document.getElementById('lj-count');
    const searchInput  = document.getElementById('lj-search');
    const filterBtns   = document.querySelectorAll('.lj-filter');
    const overlay      = document.getElementById('lj-overlay');
    const modal        = document.getElementById('lj-modal');
    const setupStep    = document.getElementById('setup-step');
    const formStep     = document.getElementById('form-step');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawer       = document.getElementById('lj-drawer');
    const drawerContent = document.getElementById('drawer-content');

    // ── Helpers ──
    function ghConfig() {
        return {
            owner: localStorage.getItem(KEY_OWNER) || '',
            repo:  localStorage.getItem(KEY_REPO)  || '',
            pat:   localStorage.getItem(KEY_PAT)   || ''
        };
    }
    function isConfigured() {
        const c = ghConfig();
        return c.owner && c.repo && c.pat;
    }
    function today() {
        return new Date().toISOString().slice(0, 10);
    }
    function typeLabel(type) {
        return { 'daily-log': 'Daily Log', 'interview-qa': 'Interview Q&A', 'research': 'Research' }[type] || type;
    }
    function typeCatClass(type) {
        return { 'daily-log': 'daily-log', 'interview-qa': 'interview-qa', 'research': 'research' }[type] || '';
    }

    // ═════════════════════════════════════════
    //  SEED DATA from data/learnings.js
    // ═════════════════════════════════════════
    function loadSeedData() {
        const entries = [];

        if (typeof DAILY_LOG !== 'undefined') {
            DAILY_LOG.forEach(e => entries.push({
                id: 'local-' + e.date + '-' + e.topic.slice(0,10),
                type: 'daily-log',
                date: e.date,
                title: e.topic,
                category: e.category,
                tags: e.tags || [],
                summary: e.summary,
                keyPoints: e.keyPoints || [],
                resources: e.resources || [],
                source: 'local'
            }));
        }

        if (typeof INTERVIEW_QA !== 'undefined') {
            INTERVIEW_QA.forEach(group => {
                group.items.forEach((qa, i) => entries.push({
                    id: 'local-qa-' + group.category + i,
                    type: 'interview-qa',
                    date: today(),
                    title: qa.q,
                    category: group.category,
                    tags: [],
                    question: qa.q,
                    answer: qa.a,
                    source: 'local'
                }));
            });
        }

        if (typeof RESEARCH !== 'undefined') {
            RESEARCH.forEach(e => entries.push({
                id: 'local-res-' + e.date,
                type: 'research',
                date: e.date,
                title: e.title,
                category: 'Research',
                tags: e.tags || [],
                abstract: e.abstract,
                findings: e.findings || [],
                status: e.status || 'In Progress',
                source: 'local'
            }));
        }

        return entries;
    }

    // ═════════════════════════════════════════
    //  GITHUB ISSUES — fetch
    // ═════════════════════════════════════════
    async function fetchGitHubIssues() {
        const { owner, repo, pat } = ghConfig();
        if (!owner || !repo) return [];

        const headers = { 'Accept': 'application/vnd.github+json' };
        if (pat) headers['Authorization'] = 'Bearer ' + pat;

        try {
            const res = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/issues?labels=${GH_LABEL}&state=open&per_page=100`,
                { headers }
            );
            if (!res.ok) return [];
            const issues = await res.json();
            return issues.map(parseIssue).filter(Boolean);
        } catch {
            return [];
        }
    }

    function parseIssue(issue) {
        const body = issue.body || '';
        const get = (key) => {
            const m = body.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*([^\\n]+)`, 'i'));
            return m ? m[1].trim() : '';
        };
        const getBlock = (key) => {
            const m = body.match(new RegExp(`\\*\\*${key}:\\*\\*\\n([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i'));
            if (!m) return [];
            return m[1].split('\n').map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
        };

        const type = get('type') || 'daily-log';
        const tags = get('tags').split(',').map(t => t.trim()).filter(Boolean);
        const labels = issue.labels.map(l => l.name).filter(l => l !== GH_LABEL);

        const entry = {
            id: 'gh-' + issue.number,
            type,
            date: issue.created_at.slice(0, 10),
            title: issue.title,
            category: get('category') || (labels[0] || ''),
            tags,
            ghUrl: issue.html_url,
            ghNumber: issue.number,
            source: 'github'
        };

        if (type === 'daily-log') {
            entry.summary   = get('summary') || getBlock('summary').join(' ');
            entry.keyPoints = getBlock('key points');
            const resLines  = getBlock('resources');
            entry.resources = resLines.map(l => {
                const [label, url] = l.split('|').map(s => s.trim());
                return url ? { label, url } : { label: l, url: l };
            });
        } else if (type === 'interview-qa') {
            entry.question = get('question') || issue.title;
            entry.answer   = get('answer') || getBlock('answer').join('\n');
        } else if (type === 'research') {
            entry.abstract = get('abstract') || getBlock('abstract').join(' ');
            entry.findings = getBlock('findings');
            entry.status   = get('status') || 'In Progress';
        }

        return entry;
    }

    // ═════════════════════════════════════════
    //  RENDER CARDS
    // ═════════════════════════════════════════
    function filteredEntries() {
        return allEntries.filter(e => {
            if (hiddenIds.has(e.id)) return false;
            if (activeFilter !== 'all' && e.type !== activeFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const haystack = [e.title, e.category, ...(e.tags || []), e.summary || '', e.question || ''].join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }

    function renderGrid() {
        const entries = filteredEntries();
        const owner = isOwner();

        // Owner badge in count line
        countEl.innerHTML = `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}${
            owner ? ' <span class="lj-owner-badge"><i class="fa-solid fa-fire"></i> Owner mode</span>' : ''
        }`;

        grid.innerHTML = '';

        if (!entries.length) {
            grid.innerHTML = `<div class="lj-empty">
                <i class="fa-solid fa-book-open"></i>
                <p>No entries found.<br>Add your first learning note with <strong>New Entry</strong>.</p>
            </div>`;
            return;
        }

        entries.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'lj-card';
            card.dataset.cat = entry.type;
            card.dataset.id = entry.id;

            const tagsHtml = (entry.tags || []).slice(0, 3).map(t => `<span class="lj-card-tag">#${t}</span>`).join('');
            const deleteBtn = owner
                ? `<button class="lj-delete-btn" title="Delete entry" aria-label="Delete"><i class="fa-solid fa-trash-can"></i></button>`
                : '';

            card.innerHTML = `
                <div class="lj-card-bg"></div>
                <div class="lj-card-glow"></div>
                <div class="lj-card-grain"></div>
                <div class="lj-card-overlay"></div>
                ${deleteBtn}
                <div class="lj-card-content">
                    <div class="lj-card-top">
                        <span class="lj-card-type">${typeLabel(entry.type)}</span>
                        <span class="lj-card-date">${entry.date}</span>
                    </div>
                    <div class="lj-card-bottom">
                        ${entry.category ? `<div class="lj-card-category">${entry.category}</div>` : ''}
                        <div class="lj-card-title">${entry.title}</div>
                        ${tagsHtml ? `<div class="lj-card-tags">${tagsHtml}</div>` : ''}
                    </div>
                </div>`;

            // Delete click (stops propagation so drawer doesn't open)
            if (owner) {
                card.querySelector('.lj-delete-btn').addEventListener('click', e => {
                    e.stopPropagation();
                    confirmDelete(entry, card);
                });
            }

            card.addEventListener('click', () => openDrawer(entry));
            grid.appendChild(card);
        });
    }

    // ═════════════════════════════════════════
    //  DELETE
    // ═════════════════════════════════════════
    let activeToast = null;

    function confirmDelete(entry, cardEl) {
        // Remove any existing toast
        if (activeToast) activeToast.remove();

        const toast = document.createElement('div');
        toast.className = 'lj-delete-toast';
        toast.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;flex-shrink:0"></i>
            <span>Delete "<strong>${entry.title.slice(0, 40)}${entry.title.length > 40 ? '…' : ''}</strong>"?</span>
            <div class="lj-delete-toast-actions">
                <button class="lj-toast-cancel">Cancel</button>
                <button class="lj-toast-confirm">Delete</button>
            </div>`;

        document.body.appendChild(toast);
        activeToast = toast;

        toast.querySelector('.lj-toast-cancel').addEventListener('click', () => toast.remove());

        toast.querySelector('.lj-toast-confirm').addEventListener('click', async () => {
            toast.remove();
            cardEl.style.opacity = '0.4';
            cardEl.style.pointerEvents = 'none';

            if (entry.source === 'github' && entry.ghNumber) {
                await closeGitHubIssue(entry.ghNumber);
            }

            // Always hide locally too
            hiddenIds.add(entry.id);
            localStorage.setItem(KEY_HIDDEN, JSON.stringify([...hiddenIds]));

            // Remove from allEntries and re-render
            allEntries = allEntries.filter(e => e.id !== entry.id);
            renderGrid();
        });

        // Auto-dismiss after 6 s
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 6000);
    }

    async function closeGitHubIssue(number) {
        const { owner, repo, pat } = ghConfig();
        if (!pat) return;
        try {
            await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${number}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + pat,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ state: 'closed' })
            });
        } catch { /* silent fail */ }
    }

    // ═════════════════════════════════════════
    //  DRAWER
    // ═════════════════════════════════════════
    function openDrawer(entry) {
        const { owner, repo } = ghConfig();
        const ghLinkHtml = entry.ghUrl
            ? `<a class="dc-gh-link" href="${entry.ghUrl}" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> View on GitHub #${entry.ghNumber}</a>`
            : '';

        let bodyHtml = '';

        if (entry.type === 'daily-log') {
            const kp = (entry.keyPoints || []).map(p => `<li>${p}</li>`).join('');
            const res = (entry.resources || []).map(r =>
                `<a class="dc-resource-link" href="${r.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>${r.label}</a>`
            ).join('');
            bodyHtml = `
                <p class="dc-section-label">Summary</p>
                <p class="dc-summary">${entry.summary || ''}</p>
                ${kp ? `<div class="dc-divider"></div><p class="dc-section-label">Key Takeaways</p><ul class="dc-points">${kp}</ul>` : ''}
                ${res ? `<div class="dc-divider"></div><p class="dc-section-label">Resources</p><div class="dc-resources">${res}</div>` : ''}`;

        } else if (entry.type === 'interview-qa') {
            bodyHtml = `
                <p class="dc-section-label">Question</p>
                <p class="dc-question">${entry.question || entry.title}</p>
                <div class="dc-divider"></div>
                <p class="dc-section-label">Answer</p>
                <p class="dc-answer">${(entry.answer || '').replace(/\n/g, '<br>')}</p>`;

        } else if (entry.type === 'research') {
            const statusClass = (entry.status || '').toLowerCase().replace(' ', '');
            const findings = (entry.findings || []).map(f => `<li>${f}</li>`).join('');
            bodyHtml = `
                <span class="dc-status ${statusClass}">${entry.status || 'In Progress'}</span>
                <p class="dc-section-label">Abstract</p>
                <p class="dc-summary">${entry.abstract || ''}</p>
                ${findings ? `<div class="dc-divider"></div><p class="dc-section-label">Key Findings</p><ul class="dc-points">${findings}</ul>` : ''}`;
        }

        const tagsHtml = (entry.tags || []).map(t => `<span class="dc-tag">#${t}</span>`).join('');

        drawerContent.innerHTML = `
            <span class="dc-type ${typeCatClass(entry.type)}">${typeLabel(entry.type)}</span>
            <h2 class="dc-title">${entry.type === 'interview-qa' ? (entry.question || entry.title) : entry.title}</h2>
            <div class="dc-meta">
                <span><i class="fa-solid fa-calendar-day"></i> ${entry.date}</span>
                ${entry.category ? `<span><i class="fa-solid fa-tag"></i> ${entry.category}</span>` : ''}
            </div>
            ${tagsHtml ? `<div class="dc-tags">${tagsHtml}</div>` : ''}
            <div class="dc-divider"></div>
            ${bodyHtml}
            ${ghLinkHtml}`;

        drawerOverlay.classList.add('open');
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawerOverlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ═════════════════════════════════════════
    //  MODAL — open / close
    // ═════════════════════════════════════════
    function openModal() {
        if (isConfigured()) {
            setupStep.style.display = 'none';
            formStep.style.display  = 'block';
        } else {
            setupStep.style.display = 'block';
            formStep.style.display  = 'none';
            const c = ghConfig();
            if (c.owner) document.getElementById('gh-owner').value = c.owner;
            if (c.repo)  document.getElementById('gh-repo').value  = c.repo;
        }
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        document.getElementById('submit-msg').textContent = '';
        document.getElementById('submit-msg').className = 'lj-submit-msg';
    }

    // ── Save GitHub config ──
    document.getElementById('save-config-btn').addEventListener('click', () => {
        const owner = document.getElementById('gh-owner').value.trim();
        const repo  = document.getElementById('gh-repo').value.trim();
        const pat   = document.getElementById('gh-pat').value.trim();
        if (!owner || !repo || !pat) {
            alert('Please fill in all three fields.');
            return;
        }
        localStorage.setItem(KEY_OWNER, owner);
        localStorage.setItem(KEY_REPO, repo);
        localStorage.setItem(KEY_PAT, pat);
        setupStep.style.display = 'none';
        formStep.style.display  = 'block';
    });

    // ── PAT visibility toggle ──
    document.getElementById('pat-toggle').addEventListener('click', function () {
        const input = document.getElementById('gh-pat');
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        this.querySelector('i').className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    // ── Reset config ──
    document.getElementById('reset-config-btn').addEventListener('click', () => {
        [KEY_OWNER, KEY_REPO, KEY_PAT].forEach(k => localStorage.removeItem(k));
        setupStep.style.display = 'block';
        formStep.style.display  = 'none';
    });

    // ── Entry type tabs ──
    document.querySelectorAll('.lj-type-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lj-type-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeType = btn.dataset.type;
            document.querySelectorAll('.lj-type-fields').forEach(f => {
                f.style.display = f.dataset.for === activeType ? 'block' : 'none';
            });
        });
    });

    // ── Submit entry ──
    document.getElementById('submit-btn').addEventListener('click', async () => {
        const { owner, repo, pat } = ghConfig();
        if (!owner || !repo || !pat) { openModal(); return; }

        const title    = document.getElementById('f-title').value.trim();
        const category = document.getElementById('f-category').value.trim();
        const tags     = document.getElementById('f-tags').value.trim();

        if (!title) {
            showSubmitMsg('Please enter a topic / title.', 'error');
            return;
        }

        let body = `**type:** ${activeType}\n**category:** ${category}\n**tags:** ${tags}\n\n`;

        if (activeType === 'daily-log') {
            const summary   = document.getElementById('f-summary').value.trim();
            const keypoints = document.getElementById('f-keypoints').value.trim();
            const resources = document.getElementById('f-resources').value.trim();
            if (!summary) { showSubmitMsg('Please enter a summary.', 'error'); return; }
            body += `**summary:** ${summary}\n\n`;
            if (keypoints) {
                body += `**key points:**\n${keypoints.split('\n').map(l => `- ${l.trim()}`).join('\n')}\n\n`;
            }
            if (resources) {
                body += `**resources:**\n${resources.split('\n').map(l => `- ${l.trim()}`).join('\n')}\n`;
            }
        } else if (activeType === 'interview-qa') {
            const question = document.getElementById('f-question').value.trim();
            const answer   = document.getElementById('f-answer').value.trim();
            if (!question || !answer) { showSubmitMsg('Please fill in question and answer.', 'error'); return; }
            body += `**question:** ${question}\n\n**answer:**\n${answer}\n`;
        } else if (activeType === 'research') {
            const abstract = document.getElementById('f-abstract').value.trim();
            const findings = document.getElementById('f-findings').value.trim();
            const status   = document.getElementById('f-status').value;
            if (!abstract) { showSubmitMsg('Please enter an abstract.', 'error'); return; }
            body += `**abstract:** ${abstract}\n\n`;
            if (findings) {
                body += `**findings:**\n${findings.split('\n').map(l => `- ${l.trim()}`).join('\n')}\n\n`;
            }
            body += `**status:** ${status}\n`;
        }

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

        try {
            // Ensure label exists first
            await ensureLabel(owner, repo, pat);

            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + pat,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, body, labels: [GH_LABEL, activeType] })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'GitHub API error');
            }

            const issue = await res.json();
            const newEntry = parseIssue(issue);
            if (newEntry) allEntries.unshift(newEntry);

            showSubmitMsg('✓ Saved to GitHub! Refreshing…', 'success');
            setTimeout(() => {
                clearForm();
                closeModal();
                renderGrid();
            }, 1200);

        } catch (err) {
            showSubmitMsg('Error: ' + err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-brands fa-github"></i> Save to GitHub';
        }
    });

    async function ensureLabel(owner, repo, pat) {
        // Silently try to create the label — 422 means it already exists
        await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + pat,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: GH_LABEL, color: '1a6060', description: 'Learning Journal entry' })
        });
    }

    function showSubmitMsg(text, type) {
        const el = document.getElementById('submit-msg');
        el.textContent = text;
        el.className = 'lj-submit-msg ' + type;
    }

    function clearForm() {
        ['f-title','f-category','f-tags','f-summary','f-keypoints','f-resources','f-question','f-answer','f-abstract','f-findings'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    // ═════════════════════════════════════════
    //  FILTER + SEARCH
    // ═════════════════════════════════════════
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.cat;
            renderGrid();
        });
    });

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        renderGrid();
    });

    // ═════════════════════════════════════════
    //  EVENT BINDINGS
    // ═════════════════════════════════════════
    document.getElementById('new-entry-btn').addEventListener('click', openModal);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeModal(); closeDrawer(); }
    });

    // ═════════════════════════════════════════
    //  INIT — load seed + GitHub issues
    // ═════════════════════════════════════════
    async function init() {
        const seed = loadSeedData();
        allEntries = seed;
        renderGrid(); // show seed data immediately

        const ghEntries = await fetchGitHubIssues();
        if (ghEntries.length) {
            // Merge: GitHub entries first (newest), then seed
            allEntries = [...ghEntries, ...seed];
            renderGrid();
        }
    }

    init();

})();
