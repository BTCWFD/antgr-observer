const { WebSocketServer } = require('ws');
const os = require('os');

const PORT = 3000;
const wss = new WebSocketServer({ port: PORT });

console.log(`[ANTGR-BRIDGE] Server started on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
    console.log('[ANTGR-BRIDGE] Extension connected.');

    // Send initial greeting
    ws.send(JSON.stringify({
        type: 'SYSTEM',
        msg: 'Connection established with Local Agent Bridge.',
        timestamp: new Date().toISOString()
    }));

    // Start telemetry stream
    const telemetryInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            const cpuUsage = os.loadavg()[0]; // 1 min average
            const freeMem = os.freemem();
            const totalMem = os.totalmem();
            const memUsage = ((totalMem - freeMem) / totalMem) * 100;

            ws.send(JSON.stringify({
                type: 'TELEMETRY',
                data: {
                    cpu: cpuUsage.toFixed(2),
                    memory: memUsage.toFixed(2),
                    load: os.loadavg()
                },
                timestamp: new Date().toISOString()
            }));
        }
    }, 2000);

    ws.on('close', () => {
        console.log('[ANTGR-BRIDGE] Extension disconnected.');
        clearInterval(telemetryInterval);
    });

    ws.on('message', (message) => {
        console.log(`[ANTGR-BRIDGE] Message received: ${message}`);
        // Handle incoming commands from extension if necessary
    });
});
