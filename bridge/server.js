const { WebSocketServer } = require('ws');
const os = require('os');
const { execSync } = require('child_process');

const PORT = 3000;
const AUTH_TOKEN = "antgr_secret_v1_99"; // Simple security layer
const wss = new WebSocketServer({ port: PORT });

console.log(`[ANTGR-BRIDGE] Mission Control Bridge started on ws://localhost:${PORT}`);
console.log(`[ANTGR-BRIDGE] Security: ENFORCED`);

function getDiskUsage() {
    try {
        if (process.platform === 'win32') {
            const output = execSync('wmic logicaldisk get size,freespace,caption').toString();
            // Simple parser for first disk
            const lines = output.trim().split('\n').filter(l => l.includes('C:'));
            if (lines.length > 0) {
                const parts = lines[0].trim().split(/\s+/);
                const free = parseInt(parts[1]);
                const total = parseInt(parts[2]);
                return Math.round(((total - free) / total) * 100);
            }
        }
    } catch (e) { return 0; }
    return 0;
}

wss.on('connection', (ws, req) => {
    // Basic Auth Check via URL params
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (token !== AUTH_TOKEN) {
        console.log('[ANTGR-BRIDGE] Unauthorized connection attempt rejected.');
        ws.send(JSON.stringify({ type: 'SYSTEM', msg: 'ACCESS DENIED: Invalid Token' }));
        setTimeout(() => ws.close(), 100);
        return;
    }

    console.log('[ANTGR-BRIDGE] Extension authenticated.');
    ws.send(JSON.stringify({ type: 'SYSTEM', msg: 'Connection Secure. Telemetry Streaming.' }));

    const interval = setInterval(() => {
        const cpuUsage = os.loadavg()[0]; // 1 min average
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const memUsage = ((totalMem - freeMem) / totalMem) * 100;
        const diskUsage = getDiskUsage();
        const uptime = Math.round(os.uptime() / 3600); // hours

        const payload = {
            type: 'TELEMETRY',
            data: {
                cpu: cpuUsage.toFixed(1),
                memory: memUsage.toFixed(1),
                disk: diskUsage,
                uptime: uptime
            }
        };

        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    }, 2000);

    ws.on('close', () => {
        console.log('[ANTGR-BRIDGE] Extension disconnected.');
        clearInterval(interval);
    });
});

process.on('SIGINT', () => {
    console.log('[ANTGR-BRIDGE] Shutting down bridge...');
    wss.close(() => {
        process.exit();
    });
});
