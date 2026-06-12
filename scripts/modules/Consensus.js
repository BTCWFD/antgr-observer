/**
 * Consensus.js
 * Pure cross-role agreement analytics over the current advisory-board findings.
 * No DOM, no imports, never throws. Given a flat list of findings it surfaces
 * "themes" (significant tokens) mentioned by two or more distinct roles and a
 * coarse 0-100 agreement score.
 */

/**
 * Small English + Spanish stopword set. Tokens in here are dropped before
 * theme analysis so common filler words never count as agreement.
 */
const STOPWORDS = new Set([
    // English
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will',
    'your', 'they', 'their', 'them', 'then', 'than', 'into', 'over', 'when',
    'what', 'which', 'while', 'should', 'could', 'would', 'about', 'there',
    'here', 'been', 'being', 'were', 'also', 'such', 'some', 'more', 'most',
    'only', 'each', 'other', 'these', 'those', 'because', 'between', 'where',
    // Spanish
    'para', 'con', 'los', 'las', 'una', 'uno', 'unos', 'unas', 'del', 'que',
    'por', 'como', 'pero', 'esta', 'este', 'estos', 'estas', 'esto', 'son',
    'sus', 'sin', 'sobre', 'entre', 'cuando', 'donde', 'porque', 'tiene',
    'todo', 'toda', 'todos', 'todas', 'muy', 'mas', 'desde', 'hasta'
]);

/**
 * Tokenize a finding message into significant lowercase tokens.
 * Splits on non-letters, keeps tokens of length >= 4, drops stopwords.
 * @param {*} message
 * @returns {string[]} Unique significant tokens for this message.
 */
function tokenize(message) {
    const text = String(message == null ? '' : message).toLowerCase();
    const raw = text.split(/[^a-zàáâãäçèéêëìíîïñòóôõöùúûü]+/i);
    const seen = new Set();
    for (const token of raw) {
        if (token.length < 4) continue;
        if (STOPWORDS.has(token)) continue;
        seen.add(token);
    }
    return [...seen];
}

export const Consensus = {
    /**
     * Compute cross-role agreement over the current findings.
     * A "theme" is a significant token used by findings from >= 2 distinct roles.
     * @param {Array<{role?:string, message?:string}>} [findings=[]]
     * @returns {{score:number, sharedThemes:Array<{theme:string, roles:string[], count:number}>}}
     */
    compute(findings = []) {
        try {
            if (!Array.isArray(findings) || findings.length < 2) {
                return { score: 0, sharedThemes: [] };
            }

            // Map token -> Set of distinct role names that mentioned it.
            const tokenRoles = new Map();

            for (const finding of findings) {
                if (!finding) continue;
                const role = finding.role ? String(finding.role) : 'General';
                const tokens = tokenize(finding.message);
                for (const token of tokens) {
                    let roles = tokenRoles.get(token);
                    if (!roles) {
                        roles = new Set();
                        tokenRoles.set(token, roles);
                    }
                    roles.add(role);
                }
            }

            const distinctSignificantTokens = tokenRoles.size;

            const sharedThemes = [];
            for (const [theme, roles] of tokenRoles) {
                if (roles.size >= 2) {
                    sharedThemes.push({
                        theme,
                        roles: [...roles],
                        count: roles.size
                    });
                }
            }

            sharedThemes.sort((a, b) => b.count - a.count);
            const topThemes = sharedThemes.slice(0, 8);

            let score = Math.round(
                100 * (sharedThemes.length / Math.max(1, distinctSignificantTokens))
            );
            if (score < 0) score = 0;
            if (score > 100) score = 100;

            return { score, sharedThemes: topThemes };
        } catch (e) {
            return { score: 0, sharedThemes: [] };
        }
    }
};
