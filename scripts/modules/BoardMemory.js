import { State } from './State.js';

/**
 * BoardMemory: Pure data layer for advisory board findings.
 * Tracks current-session findings (deduped by role+message) and
 * a capped history of past sessions (most-recent-first, max 10).
 */
export const BoardMemory = {
    /**
     * Record a finding for the current session.
     * Dedupes by role+message; ignores duplicates within the session.
     * @param {string} role - Advisor role that produced the finding.
     * @param {string} message - The finding text.
     * @param {string} [source='LOCAL'] - Origin tag (e.g. LOCAL/REMOTE).
     */
    record(role, message, source = 'LOCAL') {
        const exists = State.boardFindings.some(
            (f) => f.role === role && f.message === message
        );
        if (exists) return;
        State.boardFindings.push({ role, message, source, ts: Date.now() });
    },

    /**
     * Clear all current-session findings.
     */
    clearCurrent() {
        State.boardFindings = [];
    },

    /**
     * @returns {Array} Current-session findings.
     */
    getCurrent() {
        return State.boardFindings;
    },

    /**
     * Snapshot the current session into history (most-recent-first), cap to 10.
     * Does nothing if there are no current findings.
     * @param {Object} [metrics={}] - Metrics snapshot to attach to the session.
     * @returns {Object|null} The stored session, or null when there were no findings.
     */
    snapshotSession(metrics = {}) {
        if (State.boardFindings.length === 0) return null;
        const session = {
            ts: Date.now(),
            metrics,
            findings: [...State.boardFindings]
        };
        State.boardHistory.unshift(session);
        if (State.boardHistory.length > 10) {
            State.boardHistory.length = 10;
        }
        return session;
    },

    /**
     * @returns {Array} Past sessions (most-recent-first).
     */
    getHistory() {
        return State.boardHistory;
    }
};
