const { WebSocketServer } = require('ws');
const os = require('os');
const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "phi3:mini";

if (!AUTH_TOKEN) {
    console.error('[CRITICAL] AUTH_TOKEN not found in .env. Shutting down.');
    process.exit(1);
}

// --- Hardened WebSocket Initialization ---
let wss;
try {
    wss = new WebSocketServer({ port: PORT });
    console.log(`[ANTGR-BRIDGE] Mission Control Bridge started on ws://localhost:${PORT}`);
    setupWss(wss);
} catch (e) {
    if (e.code === 'EADDRINUSE') {
        console.warn(`[ANTGR-BRIDGE] PORT ${PORT} BUSY. Socket mode disabled, Native Messaging only.`);
    } else {
        console.error(`[ANTGR-BRIDGE] Failed to start WebSocket server:`, e);
    }
}

console.log(`[ANTGR-BRIDGE] Security: ENFORCED`);

function getDiskUsage() {
    try {
        if (process.platform === 'win32') {
            const output = execSync('wmic logicaldisk get size,freespace,caption').toString();
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
    console.log(`[ANTGR-BRIDGE] Calling Ollama for prompt: ${prompt.slice(0, 30)}...`);
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
                'Content-Length': Buffer.byteLength(data)
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

function setupWss(wss) {
    let activeProcess = null;

    wss.on('connection', (ws, req) => {
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

        const telemetryInterval = setInterval(() => {
            const cpuUsage = os.loadavg()[0];
            const freeMem = os.freemem();
            const totalMem = os.totalmem();
            const memUsage = ((totalMem - freeMem) / totalMem) * 100;
            const diskUsage = getDiskUsage();
            const uptime = Math.round(os.uptime() / 3600);

            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    type: 'TELEMETRY',
                    data: { cpu: cpuUsage.toFixed(1), memory: memUsage.toFixed(1), disk: diskUsage, uptime: uptime }
                }));
            }
        }, 2000);

        ws.on('message', async (message) => {
            try {
                const request = JSON.parse(message);
                if (request.type === 'PING') return;

                if (request.type === 'LLM_PROMPT') {
                    try {
                        const response = await callOllama(request.prompt);
                        ws.send(JSON.stringify({ type: 'LLM_RESPONSE', agent: request.agent, source: 'LOCAL', response: response }));
                    } catch (err) {
                        ws.send(JSON.stringify({ type: 'LLM_RESPONSE', agent: request.agent, source: 'LOCAL', error: err }));
                    }
                } else if (request.type === 'SCAN_CODEBASE') {
                    const rootDir = path.join(__dirname, '..');
                    const fileMap = {};
                    const scanDir = (dir) => {
                        fs.readdirSync(dir).forEach(file => {
                            const fullPath = path.join(dir, file);
                            const relPath = path.relative(rootDir, fullPath);
                            if (['node_modules', '.git', 'dist', 'bridge', 'icons'].includes(file)) return;
                            const stats = fs.statSync(fullPath);
                            if (stats.isDirectory()) scanDir(fullPath);
                            else if (['.js', '.html', '.css', '.md'].includes(path.extname(file))) {
                                fileMap[relPath] = fs.readFileSync(fullPath, 'utf8').substring(0, 5000);
                            }
                        });
                    };
                    scanDir(rootDir);
                    ws.send(JSON.stringify({ type: 'CODEBASE_INDEX', files: fileMap }));
                } else if (request.type === 'START_TASK') {
                    if (activeProcess) {
                        ws.send(JSON.stringify({ type: 'SYSTEM', msg: 'Task already running.' }));
                        return;
                    }
                    const [cmd, ...args] = request.command.split(' ');
                    activeProcess = spawn(cmd, args, { shell: true });
                    const sendLog = (data, isError = false) => {
                        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'PROCESS_LOG', data: data.toString(), isError }));
                    };
                    activeProcess.stdout.on('data', data => sendLog(data));
                    activeProcess.stderr.on('data', data => sendLog(data, true));
                    activeProcess.on('close', (code) => {
                        sendLog(`\n[TASK ENDED WITH CODE ${code}]`);
                        activeProcess = null;
                    });
                } else if (request.type === 'STOP_TASK') {
                    if (activeProcess) { activeProcess.kill(); activeProcess = null; ws.send(JSON.stringify({ type: 'SYSTEM', msg: 'Task terminated.' })); }
                }
            } catch (e) { console.error('[ANTGR-BRIDGE] Message error:', e); }
        });

        ws.on('close', () => {
            if (activeProcess) activeProcess.kill();
            clearInterval(telemetryInterval);
        });
    });
}

process.on('SIGINT', () => {
    if (wss) wss.close(() => process.exit());
    else process.exit();
});

// --- Native Messaging Protocol Support ---
process.stdin.on('readable', () => {
    let input = process.stdin.read();
    if (input) { /* Keep pipe open */ }
});

function sendNativeMessage(obj) {
    const payload = Buffer.from(JSON.stringify(obj));
    const header = Buffer.alloc(4);
    header.writeUInt32LE(payload.length, 0);
    process.stdout.write(header);
    process.stdout.write(payload);
}

if (process.send || !process.stdout.isTTY) {
    setInterval(() => {
        sendNativeMessage({ type: 'HEARTBEAT', status: 'ONLINE' });
    }, 30000);
}
