// Antigravity Observer - Background Service Worker
chrome.alarms.create('checkWorkspace', { periodInMinutes: 0.5 }); // Check every 30 seconds

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkWorkspace') {
        monitorProgress();
    }
});

async function monitorProgress() {
    console.log('Antigravity Observer: Monitoring workspace progress...');

    // En una extensión real, aquí usaríamos el chrome.fileSystem API o un Web Socket
    // para comunicarse con un servidor local que lee el disco.
    // Por ahora, simulamos la detección de progresos basados en el historial de navegación / storage.

    chrome.storage.local.get(['lastTaskStatus'], (result) => {
        const currentStatus = "Implementing Extension"; // Simulado
        if (result.lastTaskStatus !== currentStatus) {
            notifyUser('Progreso Detectado', `Nueva actualización en Antigravity: ${currentStatus}`);
            chrome.storage.local.set({ lastTaskStatus: currentStatus });

            // Broadcast to popup if open
            chrome.runtime.sendMessage({
                type: 'STATUS_UPDATE',
                payload: { status: currentStatus, timestamp: Date.now() }
            }).catch(err => {
                // Popup might be closed, this is fine
            });
        }
    });
}

function notifyUser(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: title,
        message: message,
        priority: 2
    });
}

chrome.runtime.onInstalled.addListener(() => {
    notifyUser('Antigravity Observer', 'Sistema de monitoreo activado en local.');
});
