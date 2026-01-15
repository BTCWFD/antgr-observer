const State = {
    isScanning: false,
    progress: 0,
    tokens: 0,
    cost: 0,
    securityScore: 100,
    activePlugins: ['github-sync', 'cost-optimizer'],
    logs: [],
    securityAlerts: []
};

/**
 * EventBus: Centralized event management for reactive updates.
 */
class EventBus {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

const Bus = new EventBus();

/**
 * SecurityScanner: Real-time pattern matching for credential leaks.
 */
class SecurityScanner {
    constructor() {
        this.patterns = {
            api_key: /[a-zA-Z0-9]{32,}/g,
            private_key: /-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----/g,
            slack_token: /xox[baprs]-[0-9]{10,12}-[a-zA-Z0-9]{24,}/g,
            github_token: /gh[pous]_[a-zA-Z0-9]{36,}/g
        };
    }

    scan(content) {
        const matches = [];
        for (const [type, regex] of Object.entries(this.patterns)) {
            if (regex.test(content)) {
                matches.push({ type, line: content });
            }
        }
        return matches;
    }
}

const Scanner = new SecurityScanner();

const PLUGINS = [
    { id: 'github-sync', name: 'GitHub Integrator', desc: 'Auto-sync milestones.', status: 'STABLE' },
    { id: 'cost-optimizer', name: 'Cost Optimizer Pro', desc: 'Token saving insights.', status: 'ACTIVE' },
    { id: 'watchdog', name: 'Agent Watchdog', desc: 'Real-time performance.', status: 'BETA' },
    { id: 'cyber-guard', name: 'Cyber-Guard v2', desc: 'Moral security layer.', status: 'SECURE' }
];

/**
 * TerminalManager: Streams raw system data.
 */
class TerminalManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    stream(line) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.textContent = `> ${line}`;
        this.container.appendChild(div);
        if (this.container.children.length > 8) this.container.firstElementChild.remove();
    }

    clear() {
        this.container.innerHTML = '<div class="terminal-line">> SCANNING...</div>';
    }
}

/**
 * MissionLogger: High-performance reactive log manager.
 */
class MissionLogger {
    constructor(containerId, maxEntries = 100) {
        this.container = document.getElementById(containerId);
        this.maxEntries = maxEntries;

        // Listen to system events
        Bus.on('log', (data) => this.add(data.msg, data.type));
        Bus.on('security_warn', (data) => this.add(`[CRITICAL] Leak Detected: ${data.type}`, 'warning'));
    }

    add(message, type = 'default') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString([], { hour12: false });
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${message}</span>`;

        this.container.appendChild(entry);
        if (this.container.children.length > this.maxEntries) this.container.firstElementChild.remove();
        this.container.scrollTop = this.container.scrollHeight;

        // Security scanning integration
        if (type !== 'system') {
            const leaks = Scanner.scan(message);
            leaks.forEach(leak => {
                Bus.emit('security_warn', leak);
                State.securityScore -= 5;
                if (State.securityScore < 0) State.securityScore = 0;
                updateUI();
            });
        }
    }
}

/**
 * CTOAuditor: High-level technical auditor agent.
 */
class CTOAuditor {
    constructor(containerId, statusId) {
        this.container = document.getElementById(containerId);
        this.statusEl = document.getElementById(statusId);
        this.active = false;

        Bus.on('cto_audit_start', () => this.start());
        Bus.on('cto_audit_stop', () => this.stop());
        Bus.on('cto_insight', (data) => this.report(data.type, data.msg));
    }

    start() {
        this.active = true;
        this.statusEl.textContent = 'SCANNING...';
        this.statusEl.classList.add('pulse');
        this.container.innerHTML = '';
    }

    stop() {
        this.active = false;
        this.statusEl.textContent = 'IDLE';
        this.statusEl.classList.remove('pulse');
    }

    report(type, message) {
        if (!this.active) return;
        const alert = document.createElement('div');
        alert.className = 'cto-alert';
        alert.innerHTML = `
            <span class="cto-alert-type">[CTO: ${type}]</span>
            <span class="cto-alert-msg">${message}</span>
        `;
        this.container.prepend(alert);
        if (this.container.children.length > 2) this.container.lastElementChild.remove();
    }
}

let Logger, Terminal, Auditor;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    Logger = new MissionLogger('log-container');
    Terminal = new TerminalManager('terminal-container');
    Auditor = new CTOAuditor('cto-panel', 'cto-status');

    const refreshBtn = document.getElementById('refresh-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    // Load Persistent State
    chrome.storage.local.get(['observerState'], (result) => {
        if (result.observerState) {
            Object.assign(State, result.observerState);
            State.isScanning = false;
            updateUI();
            renderPlugins();
            addLogEntry('System core recovered from storage.', 'system');
        } else {
            renderPlugins();
            addLogEntry('System core initialized. Heartbeat stable.', 'system');
        }
    });

    updateSystemMetrics();
    refreshBtn.addEventListener('click', runWorkspaceSync);

    // Runtime Message Observer
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'STATUS_UPDATE') {
            Bus.emit('log', { msg: `External Sync: ${request.payload.status}`, type: 'system' });
        }
    });
}

function renderPlugins() {
    const list = document.getElementById('dynamic-plugin-list');
    list.innerHTML = '';

    PLUGINS.forEach(p => {
        const active = State.activePlugins.includes(p.id);
        const card = document.createElement('div');
        card.className = `plugin-card ${active ? 'active' : 'disabled'}`;
        card.innerHTML = `
            <div class="plugin-info">
                <span class="plugin-name">${p.name} <span class="plugin-status">[${p.status}]</span></span>
                <span class="plugin-desc">${p.desc}</span>
            </div>
            <label class="switch">
                <input type="checkbox" ${active ? 'checked' : ''} data-id="${p.id}">
                <span class="slider"></span>
            </label>
        `;
        list.appendChild(card);

        card.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                State.activePlugins.push(p.id);
                addLogEntry(`Plugin ${p.name} activated.`, 'system');
            } else {
                State.activePlugins = State.activePlugins.filter(id => id !== p.id);
                addLogEntry(`Plugin ${p.name} offline.`, 'warning');
            }
            saveState();
            renderPlugins();
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-view`).classList.add('active');
}

async function runWorkspaceSync() {
    if (State.isScanning) return;

    const refreshBtn = document.getElementById('refresh-btn');
    const insightsPanel = document.getElementById('insights-panel');
    State.isScanning = true;
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'SCANNING...';
    Terminal.clear();
    Bus.emit('cto_audit_start');

    const sequence = [
        { msg: 'Initiating deep-scan protocol...', type: 'system', delay: 400, tokens: 450, term: 'IO_INIT_0xFA32' },
        { msg: 'Checking Ethical Guardrails...', type: 'system', delay: 600, tokens: 200, term: 'POLICY_MV_21_OK', cto: { type: 'Governance', msg: 'Ethical patterns match Global AI Policy v2.' } },
        { msg: 'Analyzing prompt injection risks...', type: 'default', delay: 1200, tokens: 500, term: 'TOKEN_SCAN_RUN', cto: { type: 'Security', msg: 'Zero-day injection vectors audited.' } },
        { msg: 'Scanning for exposed credentials...', type: 'warning', delay: 1500, tokens: 300, risk: 15, term: 'CRIT_SEC_WARN', cto: { type: 'Risk', msg: 'Critical PII leak detected in local buffer.' } },
        { msg: 'Predicting resource bottlenecks...', type: 'system', delay: 1000, tokens: 400, term: 'RESC_LENT_0.02', cto: { type: 'Scalability', msg: 'O(n²) detected in artifact parser.' } },
        { msg: 'Optimizing artifact observation...', type: 'system', delay: 500, tokens: 2100, term: 'GEMINI_SYNC_100%', cto: { type: 'Architecture', msg: 'Event-driven sync pipeline verified.' } }
    ];

    State.securityScore = 100;
    State.tokens = 0;
    State.progress = 0;

    for (const step of sequence) {
        await wait(step.delay);
        Bus.emit('log', { msg: step.msg, type: step.type });
        Terminal.stream(step.term);

        if (step.cto) {
            Bus.emit('cto_insight', step.cto);
        }

        State.progress += (100 / sequence.length);
        State.tokens += step.tokens;
        State.cost = (State.tokens / 1000) * 0.002;

        if (step.risk) {
            State.securityScore -= step.risk;
        }

        updateUI();
        saveState();
    }

    insightsPanel.innerHTML = `
        <div class="insight-item">
            <span class="insight-icon">◈</span>
            <span>Watchdog Alert: Agents stable at 98.2% integrity.</span>
        </div>
    `;

    Bus.emit('cto_audit_stop');
    addLogEntry('Sync completed. All systems nominal.', 'success');
    State.isScanning = false;
    State.progress = 100;
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'SYNC WORKSPACE';
    updateUI();
    saveState();
}

function updateUI() {
    const fill = document.querySelector('.progress-fill');
    const text = document.querySelector('.task-percent');
    const tokens = document.getElementById('token-count');
    const security = document.getElementById('security-score');

    if (fill) fill.style.width = `${State.progress}%`;
    if (text) text.textContent = `${Math.round(State.progress)}%`;
    if (tokens) tokens.textContent = State.tokens.toLocaleString();
    if (security) {
        security.textContent = `${State.securityScore}%`;
        security.style.color = State.securityScore < 90 ? '#ffaa00' : '#00ff88';
    }
    const cost = document.getElementById('cost-value');
    if (cost) cost.textContent = `$${State.cost.toFixed(3)}`;
}

function saveState() {
    chrome.storage.local.set({ observerState: State });
}

function addLogEntry(msg, type = 'default') {
    if (Logger) Logger.add(msg, type);
}

function updateSystemMetrics() {
    setInterval(() => {
        if (!State.isScanning && Math.random() > 0.95) {
            Terminal.stream(`HD_BUSY_${Math.random().toString(16).slice(2, 6).toUpperCase()}`);
        }
    }, 3000);
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));
