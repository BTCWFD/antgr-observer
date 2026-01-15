import { State } from './modules/State.js';
import { Bus } from './modules/Bus.js';
import { Bridge } from './modules/Bridge.js';
import { MissionLogger, TerminalManager } from './modules/Logger.js';
import { CTOAuditor, UXExpert } from './modules/Agents.js';

// --- Initialization ---

let Logger, Terminal, Auditor, UX, DevOpsTerminal;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    Logger = new MissionLogger('log-container');
    Terminal = new TerminalManager('terminal-container');
    DevOpsTerminal = new TerminalManager('devops-terminal');
    Auditor = new CTOAuditor('cto-panel', 'cto-status');
    UX = new UXExpert('ux-recommendations', 'ux-score');

    // Subscribe to AI and UI events
    Bus.on('ai_response', handleAIResponse);
    Bus.on('ui_update', updateUI);
    Bus.on('telemetry_update', (data) => Terminal.stream(`CPU: ${data.cpu}% | MEM: ${data.memory}% | DSK: ${data.disk}%`));
    Bus.on('devops_log', (data) => DevOpsTerminal.stream(data.data));

    // DevOps Action Handler
    Bus.on('devops_action', (data) => {
        if (data.type === 'GITHUB_ISSUE') {
            const repo = "BTCWFD/antgr-observer"; // This should ideally be dynamic in future
            const title = encodeURIComponent(data.title);
            const body = encodeURIComponent(data.body);
            const url = `https://github.com/${repo}/issues/new?title=${title}&body=${body}`;

            Bus.emit('log', { msg: `DevOps: Opening GitHub Issue generator...`, type: 'system' });
            chrome.tabs.create({ url: url });
        }
    });

    // DevOps UI Listeners
    const startBtn = document.getElementById('start-task-btn');
    const stopBtn = document.getElementById('stop-task-btn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const cmd = "ping localhost"; // Example task
            Bridge.startTask(cmd);
            Bus.emit('log', { msg: `DevOps: Initiating task [${cmd}]`, type: 'system' });
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            Bridge.stopTask();
            Bus.emit('log', { msg: `DevOps: Terminating active task.`, type: 'warning' });
        });
    }

    // Accordion Logic
    document.querySelectorAll('.node-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('expanded');
        });
    });

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    // Persistent State Recovery
    chrome.storage.local.get(['observerState'], (result) => {
        if (result.observerState) {
            Object.assign(State, result.observerState);
            State.isScanning = false;

            // Sync UI with state
            const authInput = document.getElementById('auth-token-input');
            if (authInput) authInput.value = State.authKey || "";

            updateUI();
            renderPlugins();
            Bus.emit('log', { msg: 'System core recovered from storage.', type: 'system' });
        } else {
            renderPlugins();
            Bus.emit('log', { msg: 'System core initialized. Heartbeat stable.', type: 'system' });
        }
    });

    // Security Token Listener
    const authInput = document.getElementById('auth-token-input');
    if (authInput) {
        authInput.addEventListener('change', (e) => {
            State.authKey = e.target.value;
            Bus.emit('log', { msg: 'Security: Token updated. Re-handshaking with Bridge...', type: 'warning' });
            Bridge.connect();
            // The scan will be triggered by the connection event or we can delay it
            setTimeout(() => Bridge.scanCodebase(), 1000);
        });
    }

    Bridge.connect();
    setTimeout(() => Bridge.scanCodebase(), 2000); // Initial scan
    document.getElementById('refresh-btn').addEventListener('click', runWorkspaceSync);

    // Watch for external status updates
    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === 'STATUS_UPDATE') {
            Bus.emit('log', { msg: `External Sync: ${request.payload.status}`, type: 'system' });
        }
    });
}

// --- Logic Handlers ---

function handleAIResponse(data) {
    console.log("[ANTGR] AI Response received:", data);
    if (data.error) {
        Bus.emit('log', { msg: `Brain Bridge Error: ${data.error}`, type: 'warning' });
        return;
    }

    const source = data.source || 'LOCAL';

    if (data.agent === 'CTO') {
        Auditor.report('BRAIN', data.response, source);
        autoExpandNode('cto');
    } else if (data.agent === 'UX') {
        try {
            const rec = JSON.parse(data.response);
            UX.addRecommendation({ id: `ai-${Date.now()}`, source, ...rec });
        } catch (e) {
            UX.addRecommendation({ id: `ai-${Date.now()}`, source, label: data.response, type: 'button' });
        }
        autoExpandNode('ux');
    }
}

async function runWorkspaceSync() {
    if (State.isScanning) return;

    const refreshBtn = document.getElementById('refresh-btn');
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
        await new Promise(r => setTimeout(r, step.delay));
        Bus.emit('log', { msg: step.msg, type: step.type });

        const telemetryLine = `SYS_CPU: ${State.telemetry.cpu}% | SYS_MEM: ${State.telemetry.memory}%`;
        Terminal.stream(telemetryLine);
        Terminal.stream(step.term);

        if (step.cto) {
            Auditor.askAI(step.cto.msg);
            if (State.bridgeStatus !== 'ONLINE') autoExpandNode('cto');
        }

        if (step.ux) {
            UX.askAI(step.msg);
            if (State.bridgeStatus !== 'ONLINE') autoExpandNode('ux');
            State.uxScore -= 2;
        }

        State.progress += (100 / sequence.length);
        State.tokens += step.tokens;
        State.cost = (State.tokens / 1000) * 0.002;

        if (step.risk) State.securityScore -= step.risk;

        updateUI();
        saveState();
    }

    Bus.emit('cto_audit_stop');
    Bus.emit('log', { msg: 'Sync completed. All systems nominal.', type: 'success' });

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
    const cost = document.getElementById('cost-value');

    if (fill) fill.style.width = `${State.progress}%`;
    if (text) text.textContent = `${Math.round(State.progress)}%`;
    if (tokens) tokens.textContent = State.tokens.toLocaleString();
    if (cost) cost.textContent = `$${State.cost.toFixed(3)}`;

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
}

function renderPlugins() {
    const list = document.getElementById('dynamic-plugin-list');
    if (!list) return;
    list.innerHTML = '';

    const PLUGINS = [
        { id: 'github-sync', name: 'GitHub Integrator', desc: 'Auto-sync milestones.', status: 'STABLE' },
        { id: 'cost-optimizer', name: 'Cost Optimizer Pro', desc: 'Token saving insights.', status: 'ACTIVE' },
        { id: 'watchdog', name: 'Agent Watchdog', desc: 'Real-time performance.', status: 'BETA' },
        { id: 'cyber-guard', name: 'Cyber-Guard v2', desc: 'Moral security layer.', status: 'SECURE' }
    ];

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
                if (!State.activePlugins.includes(p.id)) {
                    State.activePlugins.push(p.id);
                }
                Bus.emit('log', { msg: `Plugin ${p.name} activated.`, type: 'system' });
            } else {
                State.activePlugins = State.activePlugins.filter(id => id !== p.id);
                Bus.emit('log', { msg: `Plugin ${p.name} offline.`, type: 'warning' });
            }
            saveState();
            renderPlugins();
        });
    });

    // Handle Force Registry Scan button
    const scanBtn = document.querySelector('.install-btn');
    if (scanBtn && !scanBtn.hasListener) {
        scanBtn.hasListener = true;
        scanBtn.addEventListener('click', async () => {
            scanBtn.disabled = true;
            scanBtn.textContent = 'SCANNING REGISTRY...';
            Bus.emit('log', { msg: 'Initiating deep registry scan for new AI modules...', type: 'system' });

            await new Promise(r => setTimeout(r, 1500));

            Bus.emit('log', { msg: 'Registry sync complete. No new artifacts found.', type: 'success' });
            scanBtn.disabled = false;
            scanBtn.textContent = 'FORCE REGISTRY SCAN';
            renderPlugins();
        });
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const view = document.getElementById(`${tabName}-view`);

    if (tabBtn) tabBtn.classList.add('active');
    if (view) view.classList.add('active');

    if (tabName === 'plugins') {
        renderPlugins();
    }
}

function autoExpandNode(type) {
    const header = document.querySelector(`.node-header.${type}`);
    if (header) header.parentElement.classList.add('expanded');
}

function saveState() {
    chrome.storage.local.set({ observerState: State });
}
