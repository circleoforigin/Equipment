import { createSocket, } from 'node:dgram';
const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const DISCOVERY_TIMEOUT_MS = 3000;
const INFO_TIMEOUT_MS = 1500;
const SSDP_REQUEST = [
    'M-SEARCH * HTTP/1.1',
    `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
    'MAN: "ssdp:discover"',
    'MX: 2',
    'ST: urn:dial-multiscreen-org:service:dial:1',
    '',
    '',
].join('\r\n');
export async function discoverSamsungDevices() {
    const candidates = await collectSsdpCandidates();
    const results = await Promise.all(candidates.map(enrichCandidate));
    return results.filter((device) => device !== null);
}
function collectSsdpCandidates() {
    return new Promise((resolve, reject) => {
        const socket = createSocket('udp4');
        const candidates = new Map();
        let finished = false;
        function finish() {
            if (finished) {
                return;
            }
            finished = true;
            try {
                socket.close();
            }
            catch {
                // Socket may already be closed.
            }
            resolve([...candidates.values()]);
        }
        socket.on('error', (error) => {
            if (finished) {
                return;
            }
            finished = true;
            try {
                socket.close();
            }
            catch {
                // Socket may already be closed.
            }
            reject(error);
        });
        socket.on('message', (message, remoteInfo) => {
            const response = message.toString('utf8');
            const headers = parseSsdpHeaders(response);
            const location = headers.get('location');
            candidates.set(remoteInfo.address, {
                address: remoteInfo.address,
                location,
                response,
            });
        });
        socket.bind(0, '0.0.0.0', () => {
            socket.setBroadcast(true);
            socket.setMulticastTTL(2);
            const request = Buffer.from(SSDP_REQUEST, 'utf8');
            socket.send(request, SSDP_PORT, SSDP_ADDRESS, (error) => {
                if (error) {
                    socket.emit('error', error);
                }
            });
            setTimeout(finish, DISCOVERY_TIMEOUT_MS);
        });
    });
}
async function enrichCandidate(candidate) {
    const apiDevice = await fetchSamsungApiInfo(candidate.address);
    if (apiDevice) {
        return apiDevice;
    }
    const descriptionDevice = await fetchDescriptionInfo(candidate);
    if (descriptionDevice) {
        return descriptionDevice;
    }
    if (candidate.response
        .toLowerCase()
        .includes('samsung')) {
        return {
            name: `Samsung TV (${candidate.address})`,
            manufacturer: 'Samsung',
            address: candidate.address,
        };
    }
    return null;
}
async function fetchSamsungApiInfo(address) {
    try {
        const response = await fetch(`http://${address}:8001/api/v2/`, {
            signal: AbortSignal.timeout(INFO_TIMEOUT_MS),
        });
        if (!response.ok) {
            return null;
        }
        const value = await response.json();
        if (typeof value !== 'object' ||
            value === null) {
            return null;
        }
        const root = value;
        if (typeof root.device !== 'object' ||
            root.device === null) {
            return null;
        }
        const device = root.device;
        const name = stringValue(device.name) ??
            stringValue(root.name) ??
            `Samsung TV (${address})`;
        const providerDeviceId = stringValue(device.id) ??
            stringValue(device.duid) ??
            stringValue(device.udn) ??
            stringValue(root.id);
        const model = stringValue(device.modelName) ??
            stringValue(device.model);
        return {
            providerDeviceId,
            name,
            manufacturer: 'Samsung',
            model,
            address,
        };
    }
    catch {
        return null;
    }
}
async function fetchDescriptionInfo(candidate) {
    if (!candidate.location) {
        return null;
    }
    try {
        const response = await fetch(candidate.location, {
            signal: AbortSignal.timeout(INFO_TIMEOUT_MS),
        });
        if (!response.ok) {
            return null;
        }
        const xml = await response.text();
        const manufacturer = readXmlValue(xml, 'manufacturer');
        if (!manufacturer
            ?.toLowerCase()
            .includes('samsung')) {
            return null;
        }
        const name = readXmlValue(xml, 'friendlyName') ??
            `Samsung TV (${candidate.address})`;
        const model = readXmlValue(xml, 'modelName');
        const providerDeviceId = readXmlValue(xml, 'UDN');
        return {
            providerDeviceId,
            name,
            manufacturer,
            model,
            address: candidate.address,
        };
    }
    catch {
        return null;
    }
}
function parseSsdpHeaders(response) {
    const headers = new Map();
    for (const line of response.split(/\r?\n/)) {
        const separator = line.indexOf(':');
        if (separator < 0) {
            continue;
        }
        const name = line
            .slice(0, separator)
            .trim()
            .toLowerCase();
        const value = line
            .slice(separator + 1)
            .trim();
        if (name) {
            headers.set(name, value);
        }
    }
    return headers;
}
function readXmlValue(xml, elementName) {
    const expression = new RegExp(`<${elementName}[^>]*>(.*?)</${elementName}>`, 'i');
    const match = expression.exec(xml);
    if (!match?.[1]) {
        return undefined;
    }
    return decodeXmlEntities(match[1].trim());
}
function decodeXmlEntities(value) {
    return value
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&apos;', "'");
}
function stringValue(value) {
    return (typeof value === 'string' &&
        value.length > 0)
        ? value
        : undefined;
}
