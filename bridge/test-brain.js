const WebSocket = require('ws');

const url = 'ws://localhost:3001?token=antgr_secret_v1_99';
const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('Connected to Bridge for diagnostic...');

    const testRequest = {
        type: 'LLM_PROMPT',
        agent: 'CTO',
        prompt: 'Analiza este log: "Critical performance bottleneck detected in database query". Dame una recomendación técnica corta.'
    };

    console.log('Sending AI request to Brain Bridge...');
    ws.send(JSON.stringify(testRequest));
});

ws.on('message', (data) => {
    const response = JSON.parse(data);
    if (response.type === 'LLM_RESPONSE') {
        console.log('\n--- BRAIN BRIDGE RESPONSE ---');
        console.log(`Agent: ${response.agent}`);
        if (response.error) {
            console.error(`Error: ${response.error}`);
        } else {
            console.log(`Response: ${response.response}`);
        }
        console.log('-----------------------------\n');
        ws.close();
        process.exit(0);
    } else {
        console.log(`System Message: ${response.msg}`);
    }
});

ws.on('error', (err) => {
    console.error('Connection Error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('Test Timeout: Brain Bridge took too long to respond.');
    process.exit(1);
}, 15000);
