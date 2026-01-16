import { Bus } from './Bus.js';
import { State } from './State.js';
import { Bridge } from './Bridge.js';

/**
 * UXExpert: Pro-active design and integration advisor.
 */
export class UXExpert {
    constructor(containerId, scoreId) {
        this.container = document.getElementById(containerId);
        this.scoreEl = document.getElementById(scoreId);

        Bus.on('ux_audit_start', () => this.reset());
        Bus.on('ux_recommend', (data) => this.addRecommendation(data));
    }

    reset() {
        this.container.innerHTML = '<div class="ux-placeholder">Analyzing visual flow...</div>';
        State.recommendations = [];
        State.uxScore = 100;
        this.updateScore(100);
    }

    addRecommendation(rec) {
        if (State.recommendations.find(r => r.id === rec.id)) return;

        State.recommendations.push(rec);
        const card = document.createElement('div');
        const source = rec.source || 'LOCAL';
        card.className = `ux-rec-card ${rec.type} source-${source.toLowerCase()}`;
        card.innerHTML = `
            <div class="ux-rec-content">
                <div class="ux-rec-top">
                    <span class="ux-rec-source">[${source}]</span>
                    <span class="ux-rec-icon">${this.getIcon(rec.type)}</span>
                </div>
                <span class="ux-rec-label">${rec.label}</span>
            </div>
            <div class="ux-actions">
                <button class="ux-action-btn" data-id="${rec.id}">DEPLOY</button>
                <button class="action-btn github-small" title="Raise GitHub Issue">🚀</button>
            </div>
        `;

        if (this.container.querySelector('.ux-placeholder')) {
            this.container.innerHTML = '';
        }

        this.container.appendChild(card);
        card.querySelector('.ux-action-btn').addEventListener('click', () => this.executeAction(rec));
        card.querySelector('.github-small').addEventListener('click', () => {
            Bus.emit('devops_action', {
                type: 'GITHUB_ISSUE',
                title: `[ANTGR-UX] Design Recommendation`,
                body: `Source: ${source}\nAgent: UX Specialist\nRecommendation: ${rec.label}`
            });
        });
        this.container.scrollTop = this.container.scrollHeight;
    }

    getIcon(type) {
        switch (type) {
            case 'plugin': return '🔌';
            case 'button': return '⚡';
            case 'style': return '🎨';
            default: return '◈';
        }
    }

    updateScore(score) {
        State.uxScore = score;
        if (this.scoreEl) {
            this.scoreEl.textContent = `${score}%`;
            this.scoreEl.style.color = score < 90 ? '#ff00ff' : '#bc00ff';
        }
    }

    executeAction(rec) {
        Bus.emit('log', { msg: `UX Action: Deploying ${rec.label}...`, type: 'system' });
        const btn = this.container.querySelector(`button[data-id="${rec.id}"]`);
        if (btn) {
            btn.textContent = 'ACTIVE';
            btn.disabled = true;
            btn.classList.add('deployed');
        }
    }

    async askAI(context) {
        // Trigger LOCAL audit
        const prompt = `Como experto UX en una misión crítica, analiza este evento: "${context}". 
        Da una recomendación técnica corta de diseño o UX. 
        IMPORTANTE: Implementa un indicador de progreso (spinner o barra de carga) vinculado visualmente para mitigar la ansiedad del usuario.
        Formato JSON: { "label": "...", "type": "plugin|button|style" }`;
        Bridge.sendAIRequest('UX', prompt);
    }
}

/**
 * PredictiveInsightAgent: Analyzes trends and predicts next steps.
 */
export class PredictiveInsightAgent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        Bus.on('ui_update', () => this.updateUI());
    }

    report(message, source = 'LOCAL') {
        if (!this.container) return;
        const div = document.createElement('div');
        div.className = `insight-item source-${source.toLowerCase()}`;
        div.innerHTML = `<span class="insight-label">[PREDICTIVE]</span> ${message}`;

        if (this.container.querySelector('.insight-placeholder')) {
            this.container.innerHTML = '';
        }

        this.container.prepend(div);
        if (this.container.children.length > 5) this.container.lastElementChild.remove();
    }

    updateUI() {
        // Dynamic logic for UI if needed
    }

    async askAI(context) {
        const prompt = `Como analista predictivo de Antigravity, analiza este flujo: "${context}". 
        Predice un posible cuello de botella o riesgo futuro y da una sugerencia corta.`;
        Bridge.sendAIRequest('INSIGHTS', prompt);
    }
}

/**
 * CTOAuditor: High-level technical auditor agent.
 */
export class CTOAuditor {
    constructor(containerId, statusId) {
        this.container = document.getElementById(containerId);
        this.statusEl = document.getElementById(statusId);
        this.active = false;

        Bus.on('cto_audit_start', () => this.start());
        Bus.on('cto_audit_stop', () => this.stop());
    }

    start() {
        this.active = true;
        this.statusEl.textContent = 'SCANNING...';
        this.statusEl.classList.add('pulse');
        this.container.innerHTML = '';
    }

    stop() {
        this.active = false;
        this.statusEl.textContent = 'AUDIT READY';
        this.statusEl.classList.remove('pulse');
    }

    report(type, message, source = 'LOCAL') {
        if (!this.active) return;
        const alert = document.createElement('div');
        alert.className = `cto-alert source-${source.toLowerCase()}`;
        alert.innerHTML = `
            <div class="cto-alert-main">
                <span class="cto-alert-source">[${source}]</span>
                <span class="cto-alert-type">[CTO: ${type}]</span>
                <span class="cto-alert-msg">${message}</span>
            </div>
            <button class="action-btn github-small" title="Raise GitHub Issue">🚀</button>
        `;
        this.container.prepend(alert);

        alert.querySelector('.github-small').addEventListener('click', () => {
            Bus.emit('devops_action', {
                type: 'GITHUB_ISSUE',
                title: `[ANTGR-${type}] Audit Finding`,
                body: `Source: ${source}\nAgent: CTO\nFinding: ${message}`
            });
        });

        // Allow up to 4 alerts to show consensus from both brains
        if (this.container.children.length > 4) this.container.lastElementChild.remove();
    }

    async askAI(context) {
        // Trigger LOCAL audit (Brain Bridge)
        const localPrompt = `Como CTO de Antigravity, realiza una auditoría continua (DAST) y de cumplimiento ético sobre este evento: "${context}". 
        Busca vectores de inyección futuros y desviaciones éticas. Dame una recomendación técnica crítica y corta (máximo 15 palabras).`;
        Bridge.sendAIRequest('CTO', localPrompt);
    }
}
