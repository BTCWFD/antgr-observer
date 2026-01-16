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

        // --- Socket Guard ---
        if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
            return; // Prevent multiple simultaneous connections
        }

        try {
            if (this.socket) {
                this.socket.onopen = null;
                this.socket.onmessage = null;
                this.socket.onclose = null;
                this.socket.onerror = null;
                this.socket.close();
            }

            State.connectionAttempts++;
            Bus.emit('log', { msg: `Bridge: Attempting connection to ${this.url} (Attempt ${State.connectionAttempts})...`, type: 'system' });
            this.socket = new WebSocket(`${this.url}?token=${token}`);

            this.socket.onopen = () => {
                State.bridgeStatus = 'ONLINE';
                State.connectionAttempts = 0; // Reset on success
                State.lastConnected = Date.now();
                this.reconnectInterval = 2000; // Reset interval
                Bus.emit('log', { msg: 'Bridge Status: [PROTECTED CONNECTION ESTABLISHED]', type: 'success' });
                Bus.emit('bridge_status', 'ONLINE');
                this.scanCodebase();
                this.startHeartbeat();
            };

            this.socket.onmessage = (event) => {
                // Heartbeat response (Pong) is handled implicitly by activity
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
                this.stopHeartbeat();

                if (!event.wasClean) {
                    // --- Exponential Backoff ---
                    this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, 30000);
                    Bus.emit('log', { msg: `Bridge Status: [DISCONNECT] Retrying in ${Math.round(this.reconnectInterval / 1000)}s...`, type: 'warning' });
                }
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.socket.onerror = (err) => {
                this.socket.close();
            };
        } catch (e) {
            console.error('Bridge connection failed', e);
        }
    }

    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: 'PING', ts: Date.now() }));
            }
        }, 10000);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
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
