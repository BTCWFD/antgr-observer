const { test } = require('node:test');
const assert = require('node:assert');
const { promptHasCodebaseContext } = require('../lib/privacy');

test('explicit flag includesCodebase:true takes precedence => true', () => {
    assert.strictEqual(promptHasCodebaseContext({ includesCodebase: true, prompt: 'hello world' }), true);
});

test('explicit flag codebaseContext:true takes precedence even with innocent prompt => true', () => {
    assert.strictEqual(promptHasCodebaseContext({ codebaseContext: true, prompt: 'how are you?' }), true);
});

test('regression guard: event-description prompt without flags does NOT leak => false', () => {
    // The board sends plain event descriptions like this. Without an explicit
    // opt-in flag these must never be treated as carrying codebase context.
    assert.strictEqual(promptHasCodebaseContext({ prompt: 'Checking Ethical Guardrails...' }), false);
    assert.strictEqual(promptHasCodebaseContext({ includesCodebase: false, prompt: 'Checking Ethical Guardrails...' }), false);
});

test('heuristic: fenced code block => true', () => {
    assert.strictEqual(promptHasCodebaseContext({ prompt: 'Look at this:\n```\nconst x = 1;\n```' }), true);
});

test('heuristic: source path reference => true', () => {
    assert.strictEqual(promptHasCodebaseContext({ prompt: 'Please review scripts/modules/State.js for me' }), true);
});

test('no prompt / undefined request => false (no throw)', () => {
    assert.strictEqual(promptHasCodebaseContext(undefined), false);
    assert.strictEqual(promptHasCodebaseContext({}), false);
    assert.strictEqual(promptHasCodebaseContext({ prompt: undefined }), false);
});
