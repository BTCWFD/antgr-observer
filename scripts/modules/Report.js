/**
 * Report.js
 * Markdown report builder + browser download layer for the Advisory Board.
 * MV3 popup-safe: uses Blob + objectURL + a temporary anchor (no extra manifest permissions).
 */

/**
 * Escape characters that would break Markdown table cell syntax.
 * @param {*} value
 * @returns {string}
 */
function escapeCell(value) {
    return String(value == null ? '' : value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export const Report = {
    /**
     * Build a Markdown report string from structured findings.
     * @param {Array<{role:string, message:string, source?:string}>} findings
     * @param {{date?:string, metrics?:{tokens?:*, cost?:*, securityScore?:*, uxScore?:*}}} meta
     * @returns {string}
     */
    buildMarkdown(findings = [], meta = {}) {
        const date = meta.date || new Date().toISOString();
        const metrics = meta.metrics || {};

        const lines = [];
        lines.push('# Antigravity Advisory Board Report');
        lines.push('');
        lines.push(`Generated: ${date}`);
        lines.push('');

        // Metrics summary table
        lines.push('## Metrics');
        lines.push('');
        lines.push('| Metric | Value |');
        lines.push('| --- | --- |');
        lines.push(`| Tokens | ${escapeCell(metrics.tokens != null ? metrics.tokens : 'N/A')} |`);
        lines.push(`| Cost | ${escapeCell(metrics.cost != null ? metrics.cost : 'N/A')} |`);
        lines.push(`| Security | ${escapeCell(metrics.securityScore != null ? metrics.securityScore : 'N/A')} |`);
        lines.push(`| UX | ${escapeCell(metrics.uxScore != null ? metrics.uxScore : 'N/A')} |`);
        lines.push('');

        // Findings grouped by role
        lines.push('## Findings');
        lines.push('');

        if (!Array.isArray(findings) || findings.length === 0) {
            lines.push('_No findings recorded for this session._');
            lines.push('');
            return lines.join('\n');
        }

        const byRole = {};
        const roleOrder = [];
        for (const finding of findings) {
            const role = (finding && finding.role) ? finding.role : 'General';
            if (!byRole[role]) {
                byRole[role] = [];
                roleOrder.push(role);
            }
            byRole[role].push(finding);
        }

        for (const role of roleOrder) {
            lines.push(`### ${role}`);
            lines.push('');
            for (const item of byRole[role]) {
                const source = (item && item.source) ? item.source : 'LOCAL';
                const message = (item && item.message) ? item.message : '';
                lines.push(`- [${source}] ${message}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    },

    /**
     * Trigger a browser download of the given content.
     * @param {string} filename
     * @param {string} content
     * @param {string} [mime='text/markdown']
     */
    download(filename, content, mime = 'text/markdown') {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    },

    /**
     * Convenience: build the Markdown and immediately download it.
     * @param {Array} findings
     * @param {{date?:string, metrics?:object}} meta
     */
    export(findings = [], meta = {}) {
        const md = this.buildMarkdown(findings, meta);
        this.download(`antgr-board-report-${meta.date || 'session'}.md`, md);
    }
};
