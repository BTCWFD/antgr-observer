import { Bus } from './Bus.js';
import { Scanner } from './Security.js';
import { State } from './State.js';

/**
 * TerminalManager: Streams raw system data with optimized buffer.
 */
export class TerminalManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.maxLines = 15;
    }

    stream(line) {
        if (!this.container) return;
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.textContent = `> ${line}`;
        this.container.appendChild(div);

        // Node Recycling (Phase 3 Optimization)
        if (this.container.children.length > this.maxLines) {
            this.container.firstElementChild.remove();
        }
        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '<div class="terminal-line">> SCANNING...</div>';
        }
    }
}

/**
 * MissionLogger: High-performance reactive log manager.
 */
export class MissionLogger {
    constructor(containerId, maxEntries = 100) {
        this.container = document.getElementById(containerId);
        this.maxEntries = maxEntries;

        Bus.on('log', (data) => this.add(data.msg, data.type));
        Bus.on('security_warn', (data) => this.add(`Validating request protocol... [${data.type[0].toUpperCase()}]`, 'system'));
    }

    add(message, type = 'default') {
        if (!this.container) return;
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString([], { hour12: false });
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${message}</span>`;

        this.container.appendChild(entry);

        // Node Recycling (Phase 3 Optimization)
        if (this.container.children.length > this.maxEntries) {
            this.container.firstElementChild.remove();
        }
        this.container.scrollTop = this.container.scrollHeight;

        // Security scanning integration
        if (type !== 'system') {
            const leaks = Scanner.scan(message);
            leaks.forEach(leak => {
                Bus.emit('security_warn', leak);
                State.securityScore -= 5;
                if (State.securityScore < 0) State.securityScore = 0;
                Bus.emit('ui_update');
            });
        }
    }
}
/**
 * Sparkline: Ultra-light real-time graph renderer.
 */
export class Sparkline {
    constructor(canvasId, color = '#00f2ff') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.history = [];
        this.maxPoints = 20;
        this.color = color;
    }

    add(value) {
        if (!this.canvas) return;
        this.history.push(value);
        if (this.history.length > this.maxPoints) this.history.shift();
        this.draw();
    }

    draw() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        if (this.history.length < 2) return;

        this.ctx.beginPath();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 1.5;
        this.ctx.lineJoin = 'round';

        const step = width / (this.maxPoints - 1);
        const maxVal = Math.max(...this.history) || 1;
        const minVal = Math.min(...this.history);
        const range = maxVal - minVal || 1;

        this.history.forEach((val, i) => {
            const x = i * step;
            const y = height - ((val - minVal) / range) * (height * 0.8) - (height * 0.1);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });

        this.ctx.stroke();
    }
}
