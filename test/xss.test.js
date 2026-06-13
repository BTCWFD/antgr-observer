// XSS regression tests for the Advisory Board render methods.
// Loads the REAL scripts/modules/Agents.js under a jsdom DOM and asserts that
// malicious LLM-controlled text is rendered as inert text (via textContent /
// setAttribute) and never materializes as DOM element nodes (script/img/svg).
import test from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

// Install a DOM before importing the module (its constructors touch document).
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

const { BoardAgent, CTOAuditor, UXExpert } = await import('../scripts/modules/Agents.js');

// A payload that would execute / inject if interpolated into innerHTML.
const IMG_PAYLOAD = '"><img src=x onerror="globalThis.__xss=1">';
const SCRIPT_PAYLOAD = '<script>globalThis.__xss=1</script>';

function fresh(html) {
    document.body.innerHTML = html;
}

function assertNoInjection(container, payload) {
    assert.strictEqual(container.querySelector('img'), null, 'no <img> node should be injected');
    assert.strictEqual(container.querySelector('script'), null, 'no <script> node should be injected');
    assert.strictEqual(container.querySelector('svg'), null, 'no <svg> node should be injected');
    // The payload must survive as inert TEXT somewhere in the panel.
    assert.ok(container.textContent.includes(payload), 'payload should be present as escaped text');
}

test('BoardAgent.report renders malicious message as inert text', () => {
    fresh('<div id="bp"></div>');
    const role = { key: 'CEO', title: 'CEO · Strategy', icon: '*', color: '#fff' };
    const agent = new BoardAgent(role, 'bp');
    agent.report(IMG_PAYLOAD, 'REMOTE');
    const panel = document.getElementById('bp');
    assertNoInjection(panel, IMG_PAYLOAD);
    assert.strictEqual(globalThis.__xss, undefined, 'onerror handler must not fire');
});

test('CTOAuditor.report renders malicious message + type as inert text', () => {
    fresh('<div id="cp"></div><span id="cs"></span>');
    const auditor = new CTOAuditor('cp', 'cs');
    auditor.report(SCRIPT_PAYLOAD, IMG_PAYLOAD, 'LOCAL');
    const panel = document.getElementById('cp');
    assert.strictEqual(panel.querySelector('img'), null);
    assert.strictEqual(panel.querySelector('script'), null);
    assert.ok(panel.textContent.includes(IMG_PAYLOAD));
});

test('UXExpert.addRecommendation escapes label and never breaks out via data-id', () => {
    fresh('<div id="ux"></div><span id="uxs"></span>');
    const ux = new UXExpert('ux', 'uxs');
    // Both the label AND the id are attacker-controllable (id can be overridden
    // by a crafted LLM JSON); neither must inject DOM.
    ux.addRecommendation({ id: IMG_PAYLOAD, type: 'button', source: 'REMOTE', label: SCRIPT_PAYLOAD });
    const panel = document.getElementById('ux');
    assert.strictEqual(panel.querySelector('img'), null, 'data-id payload must not inject an element');
    assert.strictEqual(panel.querySelector('script'), null, 'label payload must not inject a script');
    assert.ok(panel.textContent.includes(SCRIPT_PAYLOAD), 'label rendered as text');
    // data-id is set via setAttribute, so the literal payload is the attribute value.
    const btn = panel.querySelector('.ux-action-btn');
    assert.strictEqual(btn.getAttribute('data-id'), IMG_PAYLOAD);
});
