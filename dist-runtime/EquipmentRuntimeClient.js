const DEFAULT_RUNTIME_URL = 'http://127.0.0.1:3012';
const runtimeUrl = import.meta.env.VITE_EQUIPMENT_RUNTIME_URL ??
    DEFAULT_RUNTIME_URL;
export async function getRuntimeHealth() {
    const response = await fetch(`${runtimeUrl}/health`);
    if (!response.ok) {
        throw new Error(`Equipment runtime returned HTTP ${response.status}.`);
    }
    const body = await response.json();
    if (!isRuntimeHealth(body)) {
        throw new Error('Equipment runtime returned an invalid health response.');
    }
    return body;
}
function isRuntimeHealth(value) {
    if (typeof value !== 'object' ||
        value === null) {
        return false;
    }
    const candidate = value;
    return (candidate.service ===
        'equipment-runtime' &&
        candidate.status === 'ok' &&
        typeof candidate.version === 'string');
}
