export const State = {
    isScanning: false,
    progress: 0,
    tokens: 0,
    cost: 0,
    securityScore: 100,
    uxScore: 100,
    activePlugins: ['github-sync', 'cost-optimizer'],
    logs: [],
    securityAlerts: [],
    bridgeStatus: 'OFFLINE',
    telemetry: { cpu: 0, memory: 0 },
    recommendations: [],
    isTaskRunning: false,
    devopsLogs: [],
    authKey: "antgr_secret_v1_99", // Default for initial connection
    codebaseIndex: {}
};
