const { WebSocketServer } = require('ws');
const os = require('os');
const { execSync } = require('child_process');
const http = require('http');

const PORT = 3002;
const AUTH_TOKEN = "antgr_secret_v1_99"; // Simple security layer
const OLLAMA_URL = "http://localhost:11434/api/generate";
const DEFAULT_MODEL = "phi3:mini"; // Light version for optimized performance

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

async function callOllama(prompt) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: DEFAULT_MODEL,
            prompt: prompt,
            stream: false
        });

        const options = {
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed.response);
                } catch (e) {
                    reject('Ollama Parse Error');
                }
            });
        });

        req.on('error', (e) => reject(`Ollama Connection Error: ${e.message}`));
        req.write(data);
        req.end();
    });
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
    ws.send(JSON.stringify({ type: 'SYSTEM', msg: 'Connection Secure. Brain Bridge Active.' }));

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

    ws.on('message', async (message) => {
        try {
            const request = JSON.parse(message);
            if (request.type === 'LLM_PROMPT') {
                console.log(`[ANTGR-BRIDGE] AI Request: ${request.agent}`);
                try {
                    const response = await callOllama(request.prompt);
                    ws.send(JSON.stringify({
                        type: 'LLM_RESPONSE',
                        agent: request.agent,
                        response: response
                    }));
                } catch (err) {
                    ws.send(JSON.stringify({
                        type: 'LLM_RESPONSE',
                        agent: request.agent,
                        error: err
                    }));
                }
            }
        } catch (e) {
            console.error('[ANTGR-BRIDGE] Malformed message received');
        }
    });

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
