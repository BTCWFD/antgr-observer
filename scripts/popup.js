const State = {
    isScanning: false,
    progress: 0,
    tokens: 0,
    cost: 0,
    securityScore: 100,
    uxScore: 100,
    activePlugins: ['github-sync', 'cost-optimizer'],
    logs: [],
    securityAlerts: [],
    bridgeStatus: 'OFFLINE',
    telemetry: { cpu: 0, memory: 0 },
    recommendations: []
};

/**
 * UXExpert: Pro-active design and integration advisor.
 */
class UXExpert {
    constructor(containerId, scoreId) {
        this.container = document.getElementById(containerId);
        this.scoreEl = document.getElementById(scoreId);

        Bus.on('ux_audit_start', () => this.reset());
        Bus.on('ux_recommend', (data) => this.addRecommendation(data));
        Bus.on('ux_score_update', (score) => this.updateScore(score));
    }

    reset() {
        this.container.innerHTML = '<div class="ux-placeholder">Analyzing visual flow...</div>';
        State.recommendations = [];
        State.uxScore = 100;
        this.updateScore(100);
    }

    addRecommendation(rec) {
        // rec: { id, label, action, type: 'button'|'plugin'|'style' }
        if (State.recommendations.find(r => r.id === rec.id)) return;

        State.recommendations.push(rec);
        const card = document.createElement('div');
        card.className = `ux-rec-card ${rec.type}`;
        card.innerHTML = `
            <div class="ux-rec-content">
                <span class="ux-rec-icon">${this.getIcon(rec.type)}</span>
                <span class="ux-rec-label">${rec.label}</span>
            </div>
            <button class="ux-action-btn" data-id="${rec.id}">DEPLOY</button>
        `;

        if (this.container.querySelector('.ux-placeholder')) {
            this.container.innerHTML = '';
        }

        this.container.appendChild(card);
        card.querySelector('.ux-action-btn').addEventListener('click', () => this.executeAction(rec));

        // Auto-scroll to latest
        this.container.scrollTop = this.container.scrollHeight;
    }

    getIcon(type) {
        switch (type) {
            case 'plugin': return '🔌';
            case 'button': return '⚡';
            case 'style': return '🎨';
            default: return '◈';
        }
    }

    updateScore(score) {
        State.uxScore = score;
        if (this.scoreEl) {
            this.scoreEl.textContent = `${score}%`;
            this.scoreEl.style.color = score < 90 ? '#ff00ff' : '#bc00ff';
        }
    }

    executeAction(rec) {
        Bus.emit('log', { msg: `UX Action: Deploying ${rec.label}...`, type: 'system' });
        // Simulate execution
        const btn = this.container.querySelector(`button[data-id="${rec.id}"]`);
        if (btn) {
            btn.textContent = 'ACTIVE';
            btn.disabled = true;
            btn.classList.add('deployed');
        }
    }

    async askAI(context) {
        const prompt = `Como experto UX en una misión crítica, analiza este log: "${context}". Da una recomendación técnica corta de diseño o UX. Formato: { "label": "...", "type": "plugin|button|style" }`;
        Bridge.sendAIRequest('UX', prompt);
    }
}

/**
 * BridgeClient: Manages WebSocket connection to the local Agent Bridge.
 */
class BridgeClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.reconnectInterval = 5000;
    }

    connect() {
        const token = "antgr_secret_v1_99";
        try {
            this.socket = new WebSocket(`${this.url}?token=${token}`);

            this.socket.onopen = () => {
                State.bridgeStatus = 'ONLINE';
                Bus.emit('log', { msg: 'Connected to Local Agent Bridge.', type: 'system' });
                updateUI();
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'TELEMETRY') {
                    State.telemetry = data.data;
                    this.handleTelemetry(data.data);
                } else if (data.type === 'LLM_RESPONSE') {
                    Bus.emit('ai_response', data);
                } else if (data.type === 'SYSTEM') {
                    Bus.emit('log', { msg: `Bridge: ${data.msg}`, type: 'system' });
                }
            };

            this.socket.onclose = () => {
                State.bridgeStatus = 'OFFLINE';
                updateUI();
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.socket.onerror = () => {
                this.socket.close();
            };
        } catch (e) {
            console.error('Bridge connection failed', e);
        }
    }

    sendAIRequest(agent, prompt) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'LLM_PROMPT',
                agent: agent,
                prompt: prompt
            }));
            return true;
        }
        return false;
    }

    handleTelemetry(data) {
        if (!State.isScanning) {
            // Ambient telemetry in terminal
            if (Math.random() > 0.8) {
                Terminal.stream(`CPU: ${data.cpu}% | MEM: ${data.memory}% | DSK: ${data.disk}%`);
            }
        }
    }
}

const Bridge = new BridgeClient('ws://localhost:3001');

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
        this.container.scrollTop = this.container.scrollHeight;
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

    async askAI(context) {
        const prompt = `Como CTO de Antigravity, analiza este evento: "${context}". Dame una recomendación técnica crítica y corta (máximo 15 palabras).`;
        Bridge.sendAIRequest('CTO', prompt);
    }
}

let Logger, Terminal, Auditor, UX;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    Logger = new MissionLogger('log-container');
    Terminal = new TerminalManager('terminal-container');
    Auditor = new CTOAuditor('cto-panel', 'cto-status');
    UX = new UXExpert('ux-recommendations', 'ux-score');

    Bus.on('ai_response', (data) => {
        if (data.error) {
            Bus.emit('log', { msg: `Brain Bridge Error: ${data.error}`, type: 'warning' });
            return;
        }

        if (data.agent === 'CTO') {
            Auditor.report('BRAIN', data.response);
        } else if (data.agent === 'UX') {
            try {
                // Try to parse JSON recommendation if AI followed format
                const rec = JSON.parse(data.response);
                UX.addRecommendation({ id: `ai-${Date.now()}`, ...rec });
            } catch (e) {
                // Fallback to simple button if not JSON
                UX.addRecommendation({ id: `ai-${Date.now()}`, label: data.response, type: 'button' });
            }
        }
    });

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

    // Start Bridge Connection
    Bridge.connect();

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

    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const view = document.getElementById(`${tabName}-view`);

    if (tabBtn) tabBtn.classList.add('active');
    if (view) view.classList.add('active');
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
    Bus.emit('ux_audit_start');

    const sequence = [
        { msg: 'Initiating deep-scan protocol...', type: 'system', delay: 400, tokens: 450, term: 'IO_INIT_0xFA32' },
        {
            msg: 'Checking Ethical Guardrails...',
            type: 'system', delay: 600, tokens: 200, term: 'POLICY_MV_21_OK',
            cto: { type: 'Governance', msg: 'Ethical patterns match Global AI Policy v2.' },
            ux: { id: 'ux-1', label: 'Connect Slack Notifications', type: 'plugin' }
        },
        {
            msg: 'Analyzing prompt injection risks...',
            type: 'default', delay: 1200, tokens: 500, term: 'TOKEN_SCAN_RUN',
            cto: { type: 'Security', msg: 'Zero-day injection vectors audited.' },
            ux: { id: 'ux-2', label: 'Enable High-Contrast Alerts', type: 'style' }
        },
        {
            msg: 'Scanning for exposed credentials...',
            type: 'warning', delay: 1500, tokens: 300, risk: 15, term: 'CRIT_SEC_WARN',
            cto: { type: 'Risk', msg: 'Critical PII leak detected in local buffer.' },
            ux: { id: 'ux-3', label: 'Freeze Sync on Leak Detection', type: 'button' }
        },
        {
            msg: 'Predicting resource bottlenecks...',
            type: 'system', delay: 1000, tokens: 400, term: 'RESC_LENT_0.02',
            cto: { type: 'Scalability', msg: 'O(n²) detected in artifact parser.' },
            ux: { id: 'ux-4', label: 'Deploy Lightweight Parser', type: 'plugin' }
        },
        {
            msg: 'Optimizing artifact observation...',
            type: 'system', delay: 500, tokens: 2100, term: 'GEMINI_SYNC_100%',
            cto: { type: 'Architecture', msg: 'Event-driven sync pipeline verified.' },
            ux: { id: 'ux-5', label: 'Mission Completed Animation', type: 'style' }
        }
    ];

    State.securityScore = 100;
    State.tokens = 0;
    State.progress = 0;

    for (const step of sequence) {
        await wait(step.delay);
        Bus.emit('log', { msg: step.msg, type: step.type });

        // Inject real telemetry into terminal during sync
        const telemetryLine = `SYS_CPU: ${State.telemetry.cpu}% | SYS_MEM: ${State.telemetry.memory}%`;
        Terminal.stream(telemetryLine);
        Terminal.stream(step.term);

        if (step.cto) {
            if (State.bridgeStatus === 'ONLINE') {
                Auditor.askAI(step.cto.msg);
            } else {
                Auditor.report(step.cto.type, step.cto.msg);
            }
        }

        if (step.ux) {
            if (State.bridgeStatus === 'ONLINE') {
                UX.askAI(step.msg);
            } else {
                UX.addRecommendation(step.ux);
            }
            State.uxScore -= 2;
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
    const ctoStatus = document.getElementById('cto-status');
    const uxScore = document.getElementById('ux-score');

    if (fill) fill.style.width = `${State.progress}%`;
    if (text) text.textContent = `${Math.round(State.progress)}%`;
    if (tokens) tokens.textContent = State.tokens.toLocaleString();

    if (security) {
        security.textContent = `${State.securityScore}%`;
        security.style.color = State.securityScore < 90 ? '#ffaa00' : '#00ff88';
    }

    if (uxScore) {
        uxScore.textContent = `${State.uxScore}%`;
        uxScore.style.color = State.uxScore < 90 ? '#ff00ff' : '#bc00ff';
    }

    if (ctoStatus && !State.isScanning) {
        ctoStatus.textContent = `BRIDGE: ${State.bridgeStatus}`;
        ctoStatus.style.color = State.bridgeStatus === 'ONLINE' ? '#00ff88' : '#ff5555';
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
            if (State.bridgeStatus === 'OFFLINE') {
                Terminal.stream(`HD_BUSY_${Math.random().toString(16).slice(2, 6).toUpperCase()}`);
            }
        }
    }, 3000);
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));
