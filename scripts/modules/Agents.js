import { Bus } from './Bus.js';
import { State } from './State.js';
import { Bridge } from './Bridge.js';
import { BoardMemory } from './BoardMemory.js';

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
                    <span class="ux-rec-source"></span>
                    <span class="ux-rec-icon">${this.getIcon(rec.type)}</span>
                </div>
                <span class="ux-rec-label"></span>
            </div>
            <div class="ux-actions">
                <button class="ux-action-btn">DEPLOY</button>
                <button class="action-btn github-small" title="Raise GitHub Issue">🚀</button>
            </div>
        `;
        card.querySelector('.ux-rec-source').textContent = `[${source}]`;
        card.querySelector('.ux-rec-label').textContent = rec.label;
        // data-id set via attribute API (never interpolated into innerHTML) — XSS-safe.
        card.querySelector('.ux-action-btn').setAttribute('data-id', rec.id);

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

        // Persist into board memory for session reporting/history.
        BoardMemory.record('UX', rec.label, source);
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
        div.innerHTML = `<span class="insight-label">[PREDICTIVE]</span> `;
        div.appendChild(document.createTextNode(message));

        if (this.container.querySelector('.insight-placeholder')) {
            this.container.innerHTML = '';
        }

        this.container.prepend(div);
        if (this.container.children.length > 5) this.container.lastElementChild.remove();

        // Persist into board memory for session reporting/history.
        BoardMemory.record('PREDICTIVE', message, source);
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
        // We removed the this.active check to ensure late AI responses are still displayed
        const alert = document.createElement('div');
        alert.className = `cto-alert source-${source.toLowerCase()}`;
        alert.innerHTML = `
            <div class="cto-alert-main">
                <span class="cto-alert-source"></span>
                <span class="cto-alert-type"></span>
                <span class="cto-alert-msg"></span>
            </div>
            <button class="action-btn github-small" title="Raise GitHub Issue">🚀</button>
        `;
        alert.querySelector('.cto-alert-source').textContent = `[${source}]`;
        alert.querySelector('.cto-alert-type').textContent = `[CTO: ${type}]`;
        alert.querySelector('.cto-alert-msg').textContent = message;
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

        // Persist into board memory for session reporting/history.
        BoardMemory.record('CTO', message, source);
    }

    async askAI(context) {
        // Trigger LOCAL audit (Brain Bridge)
        const localPrompt = `Como CTO de Antigravity, realiza una auditoría continua (DAST) y de cumplimiento ético sobre este evento: "${context}".
        Busca vectores de inyección futuros y desviaciones éticas. Dame una recomendación técnica crítica y corta (máximo 15 palabras).`;
        Bridge.sendAIRequest('CTO', localPrompt);
    }
}

/**
 * BOARD_ROLES: The Antigravity Advisory Board roster.
 * Each role is a distinct AI persona. The Bridge is role-agnostic, so the
 * intelligence lives entirely in the `persona` prompt + dedicated panel.
 * CTO and UX are handled by their specialized classes above; these complete
 * the C-level / specialist board the mission needs.
 */
export const BOARD_ROLES = [
    {
        key: 'CEO', title: 'CEO · Strategy', icon: '👔', color: '#ffd700',
        persona: 'el CEO de Antigravity. Evalúas visión estratégica, OKRs, ventaja competitiva, ROI y prioridades de la misión.'
    },
    {
        key: 'BDM', title: 'BDM · Growth', icon: '📈', color: '#00ff88',
        persona: 'un Business Development Manager. Detectas oportunidades de partnership, monetización, go-to-market y crecimiento.'
    },
    {
        key: 'LEGAL', title: 'Legal Senior · Compliance', icon: '⚖️', color: '#ffaa00',
        persona: 'un Abogado Senior de tecnología. Auditas cumplimiento GDPR/CCPA, licencias open-source, privacidad de datos y términos de uso.'
    },
    {
        key: 'DEVOPS', title: 'DevOps · SRE', icon: '⚙️', color: '#00f2ff',
        persona: 'un Ingeniero DevOps/SRE senior. Evalúas CI/CD, observabilidad, fiabilidad, escalado e infraestructura como código.'
    },
    {
        key: 'MOBILE', title: 'Mobile · Cross-Platform', icon: '📱', color: '#bc00ff',
        persona: 'un Líder de ingeniería Mobile. Revisas diseño responsive, soporte PWA, rendimiento en dispositivos y paridad cross-platform.'
    },
    {
        key: 'QA', title: 'QA · Quality', icon: '🧪', color: '#ff5599',
        persona: 'un Ingeniero QA senior. Detectas edge cases, huecos de cobertura de pruebas, regresiones y riesgos de robustez.'
    },
    {
        key: 'DATA', title: 'Data · Analytics', icon: '📊', color: '#55ddff',
        persona: 'un Analista de Datos. Interpretas telemetría, defines métricas clave (KPIs) y detectas anomalías o sesgos en los datos.'
    }
];

/**
 * BoardAgent: Generic advisory-board agent driven by a BOARD_ROLES entry.
 * Renders role-specific findings into its own panel with one-click GitHub Issue.
 */
export class BoardAgent {
    constructor(role, mountId) {
        this.role = role;
        this.panel = document.getElementById(mountId);
    }

    reset() {
        if (this.panel) {
            this.panel.innerHTML = `<div class="board-placeholder">Awaiting ${this.role.title} review...</div>`;
        }
    }

    report(message, source = 'LOCAL') {
        if (!this.panel) return;

        const card = document.createElement('div');
        card.className = `board-card source-${source.toLowerCase()}`;
        card.style.setProperty('--role-color', this.role.color);
        card.innerHTML = `
            <div class="board-card-main">
                <div class="board-card-top">
                    <span class="board-source"></span>
                    <span class="board-role">${this.role.icon} ${this.role.key}</span>
                </div>
                <span class="board-msg"></span>
            </div>
            <button class="action-btn github-small" title="Raise GitHub Issue">🚀</button>
        `;
        card.querySelector('.board-source').textContent = `[${source}]`;
        card.querySelector('.board-msg').textContent = message;

        if (this.panel.querySelector('.board-placeholder')) {
            this.panel.innerHTML = '';
        }

        this.panel.prepend(card);
        card.querySelector('.github-small').addEventListener('click', () => {
            Bus.emit('devops_action', {
                type: 'GITHUB_ISSUE',
                title: `[ANTGR-${this.role.key}] ${this.role.title} Finding`,
                body: `Source: ${source}\nAgent: ${this.role.title}\nFinding: ${message}`
            });
        });

        // Keep the panel focused on the latest consensus
        if (this.panel.children.length > 4) this.panel.lastElementChild.remove();

        // Persist into board memory for session reporting/history.
        BoardMemory.record(this.role.title, message, source);
    }

    async askAI(context) {
        const prompt = `Actúa como ${this.role.persona}
Analiza este evento de la misión Antigravity: "${context}".
Entrega UNA recomendación crítica, accionable y concreta (máximo 18 palabras).
Responde en texto plano, sin markdown ni viñetas.`;
        Bridge.sendAIRequest(this.role.key, prompt);
    }
}
