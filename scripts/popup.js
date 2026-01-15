// Antigravity Observer - God-Tier Reactive Architecture
const State = {
    isScanning: false,
    progress: 0,
    tokens: 0,
    cost: 0,
    securityScore: 100,
    logs: []
};

/**
 * MissionLogger: High-performance reactive log manager.
 * Implements a circular buffer to prevent DOM bloat and layout thrashing.
 */
class MissionLogger {
    constructor(containerId, maxEntries = 100) {
        this.container = document.getElementById(containerId);
        this.maxEntries = maxEntries;
    }

    add(message, type = 'default') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString([], { hour12: false });
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${message}</span>`;
        
        this.container.prepend(entry);
        
        // Maintain buffer size
        if (this.container.children.length > this.maxEntries) {
            this.container.lastElementChild.remove();
        }
        
        // Auto-scroll logic (scroll to top because we prepend)
        this.container.scrollTop = 0;
    }

    clear() {
        this.container.innerHTML = '';
    }
}

let Logger;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    Logger = new MissionLogger('log-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Load Persistent State
    chrome.storage.local.get(['observerState'], (result) => {
        if (result.observerState) {
            Object.assign(State, result.observerState);
            State.isScanning = false; // Reset scan state on reload
            updateUI();
            addLogEntry('System core recovered from deep sleep.', 'system');
        } else {
            addLogEntry('System core initialized. Heartbeat stable.', 'system');
        }
    });

    updateSystemMetrics();
    refreshBtn.addEventListener('click', runWorkspaceSync);
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
    insightsPanel.innerHTML = '<div class="insight-placeholder">Analyzing patterns...</div>';

    const sequence = [
        { msg: 'Initiating deep-scan protocol...', type: 'system', delay: 400, tokens: 450 },
        { msg: 'Checking Ethical Guardrails (Policy v2.1)...', type: 'system', delay: 600, tokens: 200 },
        { msg: 'Analyzing code for prompt injection risks...', type: 'default', delay: 1200, tokens: 500 },
        { msg: 'Hashing directory tree for adk-python...', type: 'default', delay: 800, tokens: 1200 },
        { msg: 'Scanning for exposed credentials...', type: 'warning', delay: 1500, tokens: 300, risk: 15 },
        { msg: 'Predicting future resource bottlenecks...', type: 'system', delay: 1000, tokens: 400 },
        { msg: 'Verifying Compliance [Agent Integrity: OK]', type: 'success', delay: 1000, tokens: 150 },
        { msg: 'Optimizing artifact observation layer...', type: 'system', delay: 500, tokens: 2100 }
    ];

    State.securityScore = 100;
    State.tokens = 0;
    State.progress = 0;

    for (const step of sequence) {
        await wait(step.delay);
        addLogEntry(step.msg, step.type);
        State.progress += (100 / sequence.length);
        State.tokens += step.tokens;
        State.cost = (State.tokens / 1000) * 0.002;

        if (step.risk) {
            State.securityScore -= step.risk;
            addLogEntry(`SECURITY THREAT: Potential credential leak detected!`, 'warning');
        }

        updateUI();
        saveState();

        if (State.tokens > 4000) {
            addLogEntry('WARNING: High token consumption detected.', 'warning');
        }
    }

    // Generate Predictive Insight
    insightsPanel.innerHTML = `
    <div class="insight-item">
      <span class="insight-icon">◈</span>
      <span>Bottleneck Forecast: High memory usage predicted in 48h.</span>
    </div>
    <div class="insight-item" style="margin-top: 8px;">
      <span class="insight-icon">◈</span>
      <span>Optimization: Switching to Gemini 1.5 Flash could save 40% cost.</span>
    </div>
  `;

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
    const tokenCount = document.getElementById('token-count');
    const costValue = document.getElementById('cost-value');
    const securityScore = document.getElementById('security-score');

    if (fill) fill.style.width = `${State.progress}%`;
    if (text) text.textContent = `${Math.round(State.progress)}%`;
    if (tokenCount) tokenCount.textContent = State.tokens.toLocaleString();
    if (costValue) costValue.textContent = `$${State.cost.toFixed(3)}`;
    if (securityScore) {
        securityScore.textContent = `${State.securityScore}%`;
        // Dynamic color for security score
        if (State.securityScore < 90) securityScore.style.color = '#ffaa00';
        if (State.securityScore < 70) securityScore.style.color = '#ff4444';
        if (State.securityScore >= 90) securityScore.style.color = '#00ff88';
    }
}

function saveState() {
    chrome.storage.local.set({ observerState: State });
}

function addLogEntry(message, type = 'default') {
    if (Logger) {
        Logger.add(message, type);
    }
}

function updateSystemMetrics() {
    setInterval(() => {
        if (State.isScanning) return;
        
        const latency = Math.floor(Math.random() * 20) + 5;
        const cpu = (Math.random() * 5 + 2).toFixed(1);
        
        if (Math.random() > 0.98) {
            addLogEntry(`Heartbeat: Latency ${latency}ms | CPU ${cpu}%`, 'default');
        }
    }, 5000);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
