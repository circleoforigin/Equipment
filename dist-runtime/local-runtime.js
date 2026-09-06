import { createServer, } from 'node:http';
import { getRegisteredDevices, registerDevice, } from './devices/DeviceRegistry.js';
import { discoverSamsungDevices, } from './providers/samsung/SamsungDiscovery.js';
import { testSamsungMenu, } from './providers/samsung/SamsungRemote.js';
const HOST = '127.0.0.1';
const PORT = Number.parseInt(process.env.EQUIPMENT_RUNTIME_PORT ?? '3012', 10);
const server = createServer(async (request, response) => {
    if (request.method === 'GET' &&
        request.url === '/health') {
        sendJson(response, 200, {
            service: 'equipment-runtime',
            status: 'ok',
            version: '0.1.0',
        });
        return;
    }
    if (request.method === 'GET' &&
        request.url === '/devices') {
        try {
            const devices = await getRegisteredDevices();
            sendJson(response, 200, {
                devices,
            });
        }
        catch (error) {
            console.error('Failed to read Equipment device registry:', error);
            sendJson(response, 500, {
                error: error instanceof Error
                    ? error.message
                    : 'Failed to read Equipment device registry.',
            });
        }
        return;
    }
    if (request.method === 'POST' &&
        request.url === '/devices') {
        try {
            const body = await readJsonBody(request);
            const input = parseRegisterDeviceInput(body);
            if (!input) {
                sendJson(response, 400, {
                    error: 'Device registration request is invalid.',
                });
                return;
            }
            const device = await registerDevice(input);
            sendJson(response, 200, {
                device,
            });
        }
        catch (error) {
            console.error('Failed to register Equipment device:', error);
            sendJson(response, 500, {
                error: error instanceof Error
                    ? error.message
                    : 'Failed to register Equipment device.',
            });
        }
        return;
    }
    if (request.method === 'GET' &&
        request.url ===
            '/providers/samsung/discover') {
        try {
            const devices = await discoverSamsungDevices();
            sendJson(response, 200, {
                devices,
            });
        }
        catch (error) {
            console.error('Samsung discovery failed:', error);
            sendJson(response, 500, {
                error: error instanceof Error
                    ? error.message
                    : 'Samsung discovery failed.',
            });
        }
        return;
    }
    if (request.method === 'POST' &&
        request.url ===
            '/providers/samsung/test-menu') {
        try {
            const body = await readJsonBody(request);
            if (typeof body !== 'object' ||
                body === null) {
                sendJson(response, 400, {
                    error: 'Request body must be an object.',
                });
                return;
            }
            const candidate = body;
            if (typeof candidate.address !==
                'string') {
                sendJson(response, 400, {
                    error: 'Samsung device address is required.',
                });
                return;
            }
            const result = await testSamsungMenu(candidate.address);
            sendJson(response, 200, result);
        }
        catch (error) {
            console.error('Samsung menu test failed:', error);
            sendJson(response, 500, {
                error: error instanceof Error
                    ? error.message
                    : 'Samsung menu test failed.',
            });
        }
        return;
    }
    sendJson(response, 404, {
        error: 'Not found.',
    });
});
server.listen(PORT, HOST, () => {
    console.log(`Equipment runtime listening on http://${HOST}:${PORT}`);
});
async function readJsonBody(request) {
    const chunks = [];
    for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk));
    }
    if (chunks.length === 0) {
        return null;
    }
    const text = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(text);
}
function parseRegisterDeviceInput(value) {
    if (typeof value !== 'object' ||
        value === null) {
        return null;
    }
    const candidate = value;
    if (typeof candidate.providerId !==
        'string' ||
        candidate.providerId.length ===
            0 ||
        typeof candidate.name !==
            'string' ||
        candidate.name.length === 0) {
        return null;
    }
    if (!optionalString(candidate.providerDeviceId) ||
        !optionalString(candidate.manufacturer) ||
        !optionalString(candidate.model) ||
        !optionalString(candidate.address)) {
        return null;
    }
    return {
        providerId: candidate.providerId,
        providerDeviceId: candidate.providerDeviceId,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
        model: candidate.model,
        address: candidate.address,
    };
}
function optionalString(value) {
    return (value === undefined ||
        typeof value === 'string');
}
function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        /*
         * These endpoints are still local-only.
         *
         * We will introduce stricter runtime
         * authorization before this becomes
         * production-grade privileged control.
         */
        'Access-Control-Allow-Origin': '*',
    });
    response.end(JSON.stringify(body));
}
