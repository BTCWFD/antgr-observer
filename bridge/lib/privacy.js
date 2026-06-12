// --- PRIVACY: Codebase Context Detection ---
// Heuristic used to decide whether an LLM prompt embeds source code / codebase
// context. When remote transmission of code is NOT explicitly authorized, such
// prompts must never fail over to the Remote (Gemini) brain.
//
// Pure, side-effect-free module: no require of server.js, no top-level side
// effects. Safe to require from tests.
function promptHasCodebaseContext(request) {
    // 1. Explicit signal from the client (preferred when present).
    if (request && (request.includesCodebase === true || request.codebaseContext === true)) {
        return true;
    }

    const prompt = (request && typeof request.prompt === 'string') ? request.prompt : '';
    if (!prompt) return false;

    // 2. Fenced code blocks (```), a strong indicator of embedded source.
    if (/```/.test(prompt)) return true;

    // 3. Source file path references (e.g. scripts/modules/State.js, bridge/server.js).
    if (/[\w./-]+\.(js|html|css|md|json|ts|jsx|tsx)\b/.test(prompt)) return true;

    return false;
}

module.exports = { promptHasCodebaseContext };
