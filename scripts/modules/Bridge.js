import { Bus } from './Bus.js';
import { State } from './State.js';

export class BridgeClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.reconnectInterval = 5000;
        this.isNativeConnected = false;
    }

    connect() {
        const token = State.authKey;
        try {
            this.socket = new WebSocket(`${this.url}?token=${token}`);

            this.socket.onopen = () => {
                State.bridgeStatus = 'ONLINE';
                Bus.emit('log', { msg: 'Connected to Local Agent Bridge.', type: 'system' });
                // Note: updateUI callback will be handled via Bus in the orchestrator
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'TELEMETRY') {
                    State.telemetry = data.data;
                    this.handleTelemetry(data.data);
                } else if (data.type === 'LLM_RESPONSE') {
                    Bus.emit('ai_response', data);
                } else if (data.type === 'PROCESS_LOG') {
                    Bus.emit('devops_log', data);
                } else if (data.type === 'CODEBASE_INDEX') {
                    State.codebaseIndex = data.files;
                    Bus.emit('log', { msg: `Semantic: Indexed ${Object.keys(data.files).length} files. AI context primed.`, type: 'system' });
                } else if (data.type === 'SYSTEM') {
                    Bus.emit('log', { msg: `Bridge: ${data.msg}`, type: 'system' });
                }
            };

            this.socket.onclose = () => {
                State.bridgeStatus = 'OFFLINE';
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.socket.onerror = () => {
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
            if (Math.random() > 0.8) {
                Bus.emit('telemetry_update', data);
            }
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

export const Bridge = new BridgeClient('ws://localhost:3002');
