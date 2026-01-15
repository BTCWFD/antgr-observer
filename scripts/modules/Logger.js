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
        Bus.on('security_warn', (data) => this.add(`[CRITICAL] Leak Detected: ${data.type}`, 'warning'));
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
