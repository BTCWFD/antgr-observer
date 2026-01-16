const WebSocket = require('ws');

const PORT = 3001;
const TOKEN = 'antigravity-mission-control-2026';
const URL = `ws://localhost:${PORT}?token=${TOKEN}`;

console.log('--- ANTIGRAVITY HARDENING DIAGNOSTIC ---');

function runTest() {
    console.log(`[Diagnostic] Connecting to ${URL}...`);
    const ws = new WebSocket(URL);

    let heartbeatCount = 0;

    ws.on('open', () => {
        console.log('[SUCCESS] Connection established.');

        // Test 1: Handshake
        console.log('[Test 1] Verifying Handshake...');
    });

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'SYSTEM') {
            console.log(`[Handshake] Server: ${data.msg}`);
            if (data.msg.includes('Secure')) {
                console.log('[PASS] Handshake verified.');

                // Test 2: Heartbeat (PING)
                console.log('[Test 2] Sending PING...');
                ws.send(JSON.stringify({ type: 'PING', ts: Date.now() }));
            }
        } else if (data.type === 'TELEMETRY') {
            heartbeatCount++;
            console.log(`[Telemetry] Heartbeat ${heartbeatCount} received. CPU: ${data.data.cpu}%`);

            if (heartbeatCount >= 2) {
                console.log('[PASS] Heartbeat stability verified.');
                console.log('\n--- DIAGNOSTIC COMPLETED: ALL SYSTEMS NOMINAL ---');
                ws.close();
                process.exit(0);
            }
        }
    });

    ws.on('error', (err) => {
        console.error('[FAIL] Connection Error:', err.message);
        process.exit(1);
    });

    setTimeout(() => {
        console.error('[FAIL] Diagnostic Timeout: No telemetry received.');
        ws.close();
        process.exit(1);
    }, 10000);
}

runTest();
