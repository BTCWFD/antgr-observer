import { Bus } from './Bus.js';
import { State } from './State.js';

export class BridgeClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.reconnectInterval = 2000;
        this.isNativeConnected = false;
    }

    connect() {
        const token = State.authKey;
        if (!token) {
            Bus.emit('log', { msg: 'Bridge: Waiting for Security Token...', type: 'warning' });
            return;
        }

        try {
            if (this.socket) {
                this.socket.onopen = null;
                this.socket.onmessage = null;
                this.socket.onclose = null;
                this.socket.onerror = null;
                this.socket.close();
            }

            Bus.emit('log', { msg: `Bridge: Attempting connection to ${this.url}...`, type: 'system' });
            this.socket = new WebSocket(`${this.url}?token=${token}`);

            this.socket.onopen = () => {
                State.bridgeStatus = 'ONLINE';
                Bus.emit('log', { msg: 'Bridge Status: [PROTECTED CONNECTION ESTABLISHED]', type: 'success' });
                Bus.emit('bridge_status', 'ONLINE');
                this.scanCodebase();
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'TELEMETRY') {
                        State.telemetry = data.data;
                        this.handleTelemetry(data.data);
                    } else if (data.type === 'LLM_RESPONSE') {
                        Bus.emit('ai_response', data);
                    } else if (data.type === 'PROCESS_LOG') {
                        Bus.emit('process_log', data);
                    } else if (data.type === 'CODEBASE_INDEX') {
                        State.codebaseIndex = data.files;
                        Bus.emit('log', { msg: `Semantic: Indexed ${Object.keys(data.files).length} files. AI context primed.`, type: 'system' });
                    } else if (data.type === 'SYSTEM') {
                        Bus.emit('log', { msg: `Bridge: ${data.msg}`, type: 'system' });
                    }
                } catch (e) {
                    console.error('Bridge Message Error:', e);
                }
            };

            this.socket.onclose = (event) => {
                State.bridgeStatus = 'OFFLINE';
                Bus.emit('bridge_status', 'OFFLINE');
                if (!event.wasClean) {
                    Bus.emit('log', { msg: 'Bridge Status: [UNEXPECTED DISCONNECT]', type: 'warning' });
                }
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.socket.onerror = (err) => {
                console.error('Bridge Socket Error:', err);
                this.socket.close();
            };
        } catch (e) {
            console.error('Bridge connection failed', e);
        }
    }

    sendAIRequest(agent, prompt) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'LLM_PROMPT',
                agent: agent,
                prompt: prompt
            }));
            return true;
        }
        return false;
    }

    /**
     * PHASE 3: Dedicated Remote Brain Request
     * Simulates a call to an external cloud intelligence API.
     */
    async requestRemoteInsight(agent, context) {
        return new Promise((resolve) => {
            const delay = 1500 + Math.random() * 1000;
            setTimeout(() => {
                const response = {
                    type: 'LLM_RESPONSE',
                    agent: agent,
                    source: 'REMOTE',
                    response: `[REMOTE] Protocol Consensus: Analysis for "${context.slice(0, 20)}..." verified against global policy.`
                };
                Bus.emit('ai_response', response);
                resolve(response);
            }, delay);
        });
    }

    handleTelemetry(data) {
        if (!State.isScanning) {
            Bus.emit('telemetry', data);
        }
    }

    startTask(command) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'START_TASK', command: command }));
        }
    }

    stopTask() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'STOP_TASK' }));
        }
    }

    scanCodebase() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'SCAN_CODEBASE' }));
        }
    }
}

export const Bridge = new BridgeClient('ws://localhost:3001');
