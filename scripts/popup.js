// Antigravity Observer - Optimized Architecture
const State = {
    isScanning: false,
    progress: 0,
    tokens: 0,
    cost: 0,
    logs: []
};

document.addEventListener('DOMContentLoaded', init);

function init() {
    const refreshBtn = document.getElementById('refresh-btn');

    addLogEntry('System core initialized. Heartbeat stable.', 'system');
    updateSystemMetrics();

    refreshBtn.addEventListener('click', runWorkspaceSync);
}

async function runWorkspaceSync() {
    if (State.isScanning) return;

    const refreshBtn = document.getElementById('refresh-btn');
    State.isScanning = true;
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'SCANNING...';

    const sequence = [
        { msg: 'Initiating deep-scan protocol...', type: 'system', delay: 400, tokens: 450 },
        { msg: 'Hashing directory tree for adk-python...', type: 'default', delay: 800, tokens: 1200 },
        { msg: 'Refactoring metadata cache...', type: 'default', delay: 600, tokens: 800 },
        { msg: 'Checking git integrity [Branch: main]', type: 'success', delay: 1000, tokens: 150 },
        { msg: 'Optimizing artifact observation layer...', type: 'system', delay: 500, tokens: 2100 }
    ];

    for (const step of sequence) {
        await wait(step.delay);
        addLogEntry(step.msg, step.type);
        State.progress += (100 / sequence.length);
        State.tokens += step.tokens;
        State.cost = (State.tokens / 1000) * 0.002; // Simulando $0.002 per 1k tokens
        updateUI();

        if (State.tokens > 4000) {
            addLogEntry('WARNING: High token consumption detected.', 'warning');
        }
    }

    addLogEntry('Sync completed. All systems nominal.', 'success');
    State.isScanning = false;
    State.progress = 100;
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'SYNC WORKSPACE';
    updateUI();
}

function updateUI() {
    const fill = document.querySelector('.progress-fill');
    const text = document.querySelector('.task-percent');
    const tokenCount = document.getElementById('token-count');
    const costValue = document.getElementById('cost-value');

    fill.style.width = `${State.progress}%`;
    text.textContent = `${Math.round(State.progress)}%`;
    tokenCount.textContent = State.tokens.toLocaleString();
    costValue.textContent = `$${State.cost.toFixed(3)}`;
}

function addLogEntry(message, type = 'default') {
    const logContainer = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString([], { hour12: false });
    entry.textContent = `[${time}] ${message}`;
    logContainer.prepend(entry);
    logContainer.scrollTop = 0;
}

function updateSystemMetrics() {
    // Simulación de métricas en tiempo real
    setInterval(() => {
        const latency = Math.floor(Math.random() * 20) + 5;
        const cpu = (Math.random() * 5 + 2).toFixed(1);
        // Podríamos añadir estos elementos al DOM si existieran, 
        // por ahora solo actualizamos el log con un evento aleatorio raramenre
        if (Math.random() > 0.95) {
            addLogEntry(`Heartbeat: Latency ${latency}ms | CPU ${cpu}%`, 'default');
        }
    }, 5000);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
