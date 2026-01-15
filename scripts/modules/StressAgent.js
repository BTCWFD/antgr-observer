import { Bus } from './Bus.js';
import { State } from './State.js';

export class StressAgent {
    constructor() {
        this.telemetryInterval = null;
        this.logInterval = null;
        this.bridgeInterval = null;
    }

    get active() {
        return State.stressActive;
    }

    start() {
        if (State.stressActive) return;
        State.stressActive = true;
        Bus.emit('log', { msg: '!!! INITIATING GOD-TIER STRESS TEST !!!', type: 'warning' });

        // 1. Telemetry Flood (High frequency UI updates)
        this.telemetryInterval = setInterval(() => {
            const mockData = {
                cpu: (Math.random() * 100).toFixed(1),
                memory: (Math.random() * 100).toFixed(1),
                disk: Math.floor(Math.random() * 100),
                uptime: Math.floor(Math.random() * 1000)
            };
            Bus.emit('telemetry', mockData);

            // Randomize token count for sparkline stress
            State.tokens += Math.floor(Math.random() * 1000);
            State.cost += Math.random() * 0.5;
            Bus.emit('ui_update');
        }, 33); // ~30 FPS

        // 2. Log Tsunami (DOM throughput stress)
        this.logInterval = setInterval(() => {
            const types = ['default', 'system', 'warning', 'success'];
            const type = types[Math.floor(Math.random() * types.length)];
            const msg = `STRESS_FLOW: Internal packet hash ${Math.random().toString(36).substring(7)} processed locally.`;
            Bus.emit('log', { msg, type });

            // Occasionally inject security leaks to stress the scanner
            if (Math.random() > 0.95) {
                Bus.emit('log', { msg: 'CRITICAL_LEAK_SIM: AI_KEY_sk-' + Math.random().toString(36).substring(2, 24), type: 'warning' });
            }
        }, 50); // 20 logs per second

        // 3. System Stream Stress
        let streamCount = 0;
        this.bridgeInterval = setInterval(() => {
            Bus.emit('process_log', `STREAM_STRESS_BUFFER_CHUNK_${streamCount++}_${Date.now()}`);
        }, 100);
    }

    stop() {
        State.stressActive = false;
        clearInterval(this.telemetryInterval);
        clearInterval(this.logInterval);
        clearInterval(this.bridgeInterval);
        Bus.emit('log', { msg: 'STRESS TEST TERMINATED. SYSTEM STABILIZED.', type: 'success' });
        Bus.emit('ui_update');
    }
}

export const Stress = new StressAgent();
