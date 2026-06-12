const WebSocket = require('ws');

require('dotenv').config();
const TOKEN = process.env.AUTH_TOKEN;
if (!TOKEN) { console.error('[ERROR] AUTH_TOKEN missing in bridge/.env'); process.exit(1); }
const url = `ws://localhost:3001?token=${TOKEN}`;
const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('[TEST] Connected to Bridge.');

    const testRequest = {
        type: 'LLM_PROMPT',
        agent: 'CTO',
        prompt: 'Analysis request for hybrid verification.'
    };

    console.log('[TEST] Sending AI request to Brain Bridge...');
    ws.send(JSON.stringify(testRequest));
});

ws.on('message', (data) => {
    const response = JSON.parse(data);
    if (response.type === 'LLM_RESPONSE') {
        console.log('\n--- BRAIN RESPONSE ---');
        console.log(`Agent: ${response.agent}`);
        console.log(`Source: ${response.source}`);
        if (response.error) {
            console.error(`Error: ${response.error}`);
        } else {
            console.log(`Response: ${response.response}`);
        }
        console.log('----------------------\n');
        ws.close();
        process.exit(0);
    } else if (response.type === 'SYSTEM') {
        console.log(`[SYSTEM] ${response.msg}`);
    }
});

ws.on('error', (err) => {
    console.error('[TEST] Connection Error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('[TEST] Timeout reached.');
    process.exit(1);
}, 20000);
