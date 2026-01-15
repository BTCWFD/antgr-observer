// Antigravity Observer - Advanced Popup Logic
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    const logContainer = document.getElementById('log-container');

    addLogEntry('Mission Control Online. Waiting for sync...', 'system');

    refreshBtn.addEventListener('click', () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'SCANNING...';

        addLogEntry('Initiating Deep Scan of adk-python workspace...', 'system');

        setTimeout(() => addLogEntry('Analyizing directory structure...', 'default'), 500);
        setTimeout(() => addLogEntry('Detecting git state: Branch main (UP-TO-DATE)', 'success'), 1200);
        setTimeout(() => addLogEntry('Warning: 2 files modified since last commit.', 'warning'), 1800);

        // Simulate progress update
        setTimeout(() => {
            addLogEntry('Sync Sequence Complete. All artifacts observed.', 'success');
            updateProgress(100);
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'SYNC WORKSPACE';
        }, 2500);
    });

    function addLogEntry(message, type = 'default') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString([], { hour12: false });
        entry.textContent = `[${time}] ${message}`;
        logContainer.prepend(entry);

        // Auto-scroll simulation
        logContainer.scrollTop = 0;
    }

    function updateProgress(percent) {
        const fill = document.querySelector('.progress-fill');
        const text = document.querySelector('.task-percent');
        fill.style.width = `${percent}%`;
        text.textContent = `${percent}%`;
    }
});
