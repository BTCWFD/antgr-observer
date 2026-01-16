const { WebSocketServer } = require('ws');
const os = require('os');
const { execSync, spawn } = require('child_process');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "phi3:mini";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const REMOTE_MODEL = process.env.REMOTE_MODEL || "gemini-1.5-flash";
const SERVER_PASSWORD = process.env.SERVER_PASSWORD;

if (!AUTH_TOKEN) {
    console.error('[CRITICAL] AUTH_TOKEN not found in .env. Shutting down.');
    process.exit(1);
}

// --- SECURITY HARDENING: Multi-Layer Redaction ---
const SENSITIVE_VALUES = [GEMINI_API_KEY, AUTH_TOKEN, SERVER_PASSWORD].filter(Boolean);

function applyRedaction(data) {
    if (!data) return data;
    let str = typeof data === 'string' ? data : JSON.stringify(data);
    SENSITIVE_VALUES.forEach(val => {
        const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        str = str.replace(new RegExp(escaped, 'g'), '***REDACTED***');
    });
    return typeof data === 'string' ? str : JSON.parse(str);
}

// 1. Console Redaction
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => originalLog(...args.map(applyRedaction));
console.error = (...args) => originalError(...args.map(applyRedaction));
console.warn = (...args) => originalWarn(...args.map(applyRedaction));

// 2. WebSocket Safe Send
function safeSend(ws, data) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(applyRedaction(data)));
    }
}

const runServer = () => {
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
};

if (SERVER_PASSWORD) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n[SECURITY] --- ANTIGRAVITY MISSION CONTROL AUTHENTICATION ---');
    rl.question('[AUTH] Enter Admin Password to initiate Bridge: ', (input) => {
        if (input === SERVER_PASSWORD) {
            console.log('[AUTH] Access Granted. Initiating System...\n');
            rl.close();
            runServer();
        } else {
            console.error('[AUTH] ACCESS DENIED: Invalid Password. System shutdown.');
            process.exit(1);
        }
    });
} else {
    runServer();
}

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
    console.log(`[ANTGR-BRIDGE] Calling Local Brain (Ollama)...`);
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
            timeout: 5000, // 5s timeout for local
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
                    if (parsed.response) resolve(parsed.response);
                    else reject('Ollama Empty Response');
                } catch (e) {
                    reject('Ollama Parse Error');
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject('Ollama Timeout');
        });

        req.on('error', (e) => reject(`Ollama Error: ${e.message}`));
        req.write(data);
        req.end();
    });
}

async function callRemoteBrain(prompt) {
    console.log(`[ANTGR-BRIDGE] Calling Remote Brain (Gemini)...`);
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${REMOTE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.candidates && parsed.candidates[0].content.parts[0].text) {
                        resolve(parsed.candidates[0].content.parts[0].text);
                    } else {
                        reject('Gemini API Error: ' + JSON.stringify(parsed));
                    }
                } catch (e) {
                    reject('Gemini Parse Error: ' + body);
                }
            });
        });

        req.on('error', (e) => reject(`Gemini Connection Error: ${e.message}`));
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
            safeSend(ws, { type: 'SYSTEM', msg: 'ACCESS DENIED: Invalid Token' });
            setTimeout(() => ws.close(), 100);
            return;
        }

        console.log('[ANTGR-BRIDGE] Extension authenticated.');
        safeSend(ws, { type: 'SYSTEM', msg: 'Connection Secure. Brain Bridge Active.' });

        const telemetryInterval = setInterval(() => {
            const cpuUsage = os.loadavg()[0];
            const freeMem = os.freemem();
            const totalMem = os.totalmem();
            const memUsage = ((totalMem - freeMem) / totalMem) * 100;
            const diskUsage = getDiskUsage();
            const uptime = Math.round(os.uptime() / 3600);

            if (ws.readyState === ws.OPEN) {
                safeSend(ws, {
                    type: 'TELEMETRY',
                    data: { cpu: cpuUsage.toFixed(1), memory: memUsage.toFixed(1), disk: diskUsage, uptime: uptime }
                });
            }
        }, 2000);

        ws.on('message', async (message) => {
            try {
                const request = JSON.parse(message);
                if (request.type === 'PING') return;

                if (request.type === 'LLM_PROMPT') {
                    console.log(`[ANTGR-BRIDGE] LLM_PROMPT received for ${request.agent}`);
                    try {
                        // Hybrid Logic: Try Local first
                        try {
                            const response = await callOllama(request.prompt);
                            safeSend(ws, { type: 'LLM_RESPONSE', agent: request.agent, source: 'LOCAL', response: response });
                        } catch (err) {
                            console.warn(`[ANTGR-BRIDGE] Local Brain failed: ${err}. Failing over to Remote...`);
                            // Fallback to Remote
                            const response = await callRemoteBrain(request.prompt);
                            safeSend(ws, { type: 'LLM_RESPONSE', agent: request.agent, source: 'REMOTE', response: response });
                        }
                    } catch (err) {
                        console.error(`[ANTGR-BRIDGE] Hybrid Brain Failure:`, err);
                        safeSend(ws, { type: 'LLM_RESPONSE', agent: request.agent, source: 'HYBRID', error: err });
                    }
                }
                else if (request.type === 'SCAN_CODEBASE') {
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
                    safeSend(ws, { type: 'CODEBASE_INDEX', files: fileMap });
                } else if (request.type === 'START_TASK') {
                    if (activeProcess) {
                        safeSend(ws, { type: 'SYSTEM', msg: 'Task already running.' });
                        return;
                    }
                    const [cmd, ...args] = request.command.split(' ');
                    activeProcess = spawn(cmd, args, { shell: true });
                    const sendLog = (data, isError = false) => {
                        safeSend(ws, { type: 'PROCESS_LOG', data: data.toString(), isError });
                    };
                    activeProcess.stdout.on('data', data => sendLog(data));
                    activeProcess.stderr.on('data', data => sendLog(data, true));
                    activeProcess.on('close', (code) => {
                        sendLog(`\n[TASK ENDED WITH CODE ${code}]`);
                        activeProcess = null;
                    });
                } else if (request.type === 'STOP_TASK') {
                    if (activeProcess) { activeProcess.kill(); activeProcess = null; safeSend(ws, { type: 'SYSTEM', msg: 'Task terminated.' }); }
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
    const payload = Buffer.from(JSON.stringify(applyRedaction(obj)));
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
