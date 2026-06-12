import { State } from './State.js';
import { Report } from './Report.js';

/**
 * HistoryView: Renders the capped Board Memory session history
 * (State.boardHistory, most-recent-first) into a container element.
 *
 * XSS-safety: all LLM-derived / dynamic text is inserted via textContent or
 * createTextNode. Only static chrome ever uses innerHTML.
 */
export class HistoryView {
    /**
     * @param {string} containerId - id of the mount element.
     */
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    /**
     * Render State.boardHistory into the container, replacing prior content.
     */
    render() {
        const container = this.container;
        if (!container) return;

        // Clear prior content (static chrome only).
        container.innerHTML = '';
        container.classList.add('board-history');

        const history = Array.isArray(State.boardHistory) ? State.boardHistory : [];

        if (history.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'history-placeholder';
            placeholder.textContent = 'No board sessions recorded yet.';
            container.appendChild(placeholder);
            return;
        }

        history.forEach((session) => {
            container.appendChild(this._buildSession(session));
        });
    }

    /**
     * Build a single .history-session row for a persisted session.
     * @param {{ts:number, metrics:object, findings:Array}} session
     * @returns {HTMLElement}
     * @private
     */
    _buildSession(session) {
        const metrics = (session && session.metrics) ? session.metrics : {};
        const findings = (session && Array.isArray(session.findings)) ? session.findings : [];

        const row = document.createElement('div');
        row.className = 'history-session';

        // Header: formatted date/time (textContent — derived from data).
        const heading = document.createElement('div');
        heading.className = 'history-meta';
        const when = document.createElement('span');
        when.className = 'badge';
        when.textContent = new Date(session.ts).toLocaleString();
        heading.appendChild(when);

        // Finding count + distinct role count.
        const distinctRoles = new Set();
        for (const finding of findings) {
            if (finding && finding.role != null) distinctRoles.add(finding.role);
        }
        const counts = document.createElement('span');
        counts.className = 'history-meta-counts';
        counts.textContent = `${findings.length} findings / ${distinctRoles.size} roles`;
        heading.appendChild(counts);

        row.appendChild(heading);

        // Compact metrics line: tokens / cost / security% / ux%.
        const metricsLine = document.createElement('div');
        metricsLine.className = 'history-meta';
        const tokens = metrics.tokens != null ? metrics.tokens : 'N/A';
        const cost = metrics.cost != null ? metrics.cost : 'N/A';
        const security = metrics.securityScore != null ? metrics.securityScore : 'N/A';
        const ux = metrics.uxScore != null ? metrics.uxScore : 'N/A';
        metricsLine.textContent = `${tokens} tokens / $${cost} / ${security}% sec / ${ux}% ux`;
        row.appendChild(metricsLine);

        // Export button.
        const exportBtn = document.createElement('button');
        exportBtn.className = 'history-export-btn';
        exportBtn.type = 'button';
        exportBtn.textContent = 'EXPORT';
        exportBtn.addEventListener('click', () => {
            Report.export(session.findings, {
                date: new Date(session.ts).toISOString().slice(0, 10),
                metrics: session.metrics
            });
        });
        row.appendChild(exportBtn);

        return row;
    }
}
