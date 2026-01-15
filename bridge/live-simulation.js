const WebSocket = require('ws');

const url = 'ws://localhost:3001?token=antgr_secret_v1_99';
const ws = new WebSocket(url);

const missionSteps = [
    { agent: 'CTO', prompt: 'Analiza este evento: "El sistema detectó 500 conexiones concurrentes fallidas en el endpoint /auth". Dame una recomendación crítica corta.' },
    { agent: 'UX', prompt: 'Analiza este log: "El usuario tardó 8 segundos en encontrar el botón de checkout". Sugiere una mejora de diseño en formato JSON { "label": "...", "type": "button|style" }' },
    { agent: 'CTO', prompt: 'Analiza este evento: "La base de datos está devolviendo consultas de lectura en 1500ms". Recomendación técnica rápida.' }
];

let step = 0;

ws.on('open', () => {
    console.log('--- STARTING LIVE AI MISSION SIMULATION ---');
    console.log('Connected to Brain Bridge. Sending first scenario...\n');
    sendNext();
});

function sendNext() {
    if (step >= missionSteps.length) {
        console.log('\n--- SIMULATION COMPLETE ---');
        ws.close();
        process.exit(0);
    }
    const current = missionSteps[step];
    console.log(`[SENDING TO ${current.agent}]: ${current.prompt.substring(0, 60)}...`);
    ws.send(JSON.stringify({ type: 'LLM_PROMPT', ...current }));
    step++;
}

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'LLM_RESPONSE') {
        console.log(`\n[BRAIN RESPONSE - ${msg.agent}]:`);
        console.log(`> ${msg.response || msg.error}`);
        console.log('--------------------------------------------');
        setTimeout(sendNext, 2000); // Wait a bit before next step
    }
});

ws.on('error', (err) => {
    console.error('Connection Error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('\n[SIMULATION TIMEOUT] - Check if Ollama is running and Llama3 is loaded.');
    process.exit(1);
}, 60000);
