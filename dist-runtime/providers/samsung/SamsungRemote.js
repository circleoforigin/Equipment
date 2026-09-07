import keytar from '@github/keytar';
import WebSocket from 'ws';
const SAMSUNG_REMOTE_PORT = 8002;
const CONNECTION_TIMEOUT_MS = 30000;
const CREDENTIAL_SERVICE = 'SettingForge Equipment Samsung';
const CLIENT_NAME = Buffer.from('SettingForge Equipment', 'utf8').toString('base64');
export async function connectSamsung(address) {
    const existingToken = await getStoredToken(address);
    const token = await connectForAuthorization(address, existingToken);
    if (token &&
        token !== existingToken) {
        await storeToken(address, token);
    }
    return {
        connected: true,
        authorized: true,
        tokenReceived: token !== undefined,
    };
}
async function getStoredToken(address) {
    const token = await keytar.getPassword(CREDENTIAL_SERVICE, createCredentialAccount(address));
    return token ?? undefined;
}
async function storeToken(address, token) {
    await keytar.setPassword(CREDENTIAL_SERVICE, createCredentialAccount(address), token);
}
function createCredentialAccount(address) {
    return `samsung:${address}`;
}
function connectForAuthorization(address, token) {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(createRemoteUrl(address, token), {
            rejectUnauthorized: false,
            handshakeTimeout: CONNECTION_TIMEOUT_MS,
        });
        let settled = false;
        const timeout = setTimeout(() => {
            fail(new Error('Timed out waiting for Samsung TV authorization.'));
        }, CONNECTION_TIMEOUT_MS);
        function succeed(receivedToken) {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            try {
                socket.close();
            }
            catch {
                // Already closed.
            }
            resolve(receivedToken ?? token);
        }
        function fail(error) {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            try {
                socket.close();
            }
            catch {
                // Already closed.
            }
            reject(error);
        }
        socket.on('message', (data) => {
            const message = parseConnectMessage(data);
            if (message?.event !==
                'ms.channel.connect') {
                return;
            }
            const receivedToken = typeof message.data?.token ===
                'string'
                ? message.data.token
                : undefined;
            succeed(receivedToken);
        });
        socket.on('error', (error) => {
            fail(error instanceof Error
                ? error
                : new Error('Samsung WebSocket connection failed.'));
        });
        socket.on('close', () => {
            if (!settled) {
                fail(new Error('Samsung TV closed the connection before authorization completed.'));
            }
        });
    });
}
function createRemoteUrl(address, token) {
    const parameters = new URLSearchParams({
        name: CLIENT_NAME,
    });
    if (token) {
        parameters.set('token', token);
    }
    return (`wss://${address}:` +
        `${SAMSUNG_REMOTE_PORT}` +
        '/api/v2/channels/' +
        'samsung.remote.control?' +
        parameters.toString());
}
function parseConnectMessage(data) {
    try {
        const value = JSON.parse(data.toString());
        if (typeof value !== 'object' ||
            value === null) {
            return null;
        }
        return value;
    }
    catch {
        return null;
    }
}
