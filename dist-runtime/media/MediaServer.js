import { createServer, } from 'node:http';
import { networkInterfaces, } from 'node:os';
import { readFile, } from 'node:fs/promises';
import { extname, } from 'node:path';
import { randomUUID, } from 'node:crypto';
const MEDIA_PORT = 3013;
const registeredMedia = new Map();
let mediaServerStarted = false;
export async function startMediaServer() {
    if (mediaServerStarted) {
        return;
    }
    const server = createServer(async (request, response) => {
        if ((request.method !== 'GET' &&
            request.method !== 'HEAD') ||
            !request.url?.startsWith('/media/')) {
            response.writeHead(404);
            response.end();
            return;
        }
        const mediaId = request.url.slice('/media/'.length);
        const filePath = registeredMedia.get(mediaId);
        if (!filePath) {
            response.writeHead(404);
            response.end();
            return;
        }
        try {
            const data = await readFile(filePath);
            response.writeHead(200, {
                'Content-Type': getContentType(filePath),
                'Content-Length': data.length,
                'Cache-Control': 'no-store',
            });
            if (request.method === 'HEAD') {
                response.end();
                return;
            }
            response.end(data);
        }
        catch {
            response.writeHead(404);
            response.end();
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(MEDIA_PORT, '0.0.0.0', () => {
            mediaServerStarted = true;
            resolve();
        });
    });
    console.log(`Equipment media server listening on port ${MEDIA_PORT}`);
}
export function registerMediaFile(filePath) {
    const mediaId = randomUUID();
    registeredMedia.set(mediaId, filePath);
    const address = getLanAddress();
    return (`http://${address}:${MEDIA_PORT}` +
        `/media/${mediaId}`);
}
export function unregisterMediaFile(mediaUrl) {
    const mediaId = mediaUrl.split('/media/')[1];
    if (!mediaId) {
        return;
    }
    registeredMedia.delete(mediaId);
}
function getLanAddress() {
    const interfaces = networkInterfaces();
    for (const entries of Object.values(interfaces)) {
        for (const entry of entries ?? []) {
            if (entry.family === 'IPv4' &&
                !entry.internal) {
                return entry.address;
            }
        }
    }
    throw new Error('No LAN IPv4 address was found.');
}
function getContentType(filePath) {
    switch (extname(filePath)
        .toLowerCase()) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
}
