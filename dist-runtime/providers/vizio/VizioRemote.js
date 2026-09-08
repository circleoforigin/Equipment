import https from 'node:https';
import { randomUUID, } from 'node:crypto';
import keytar from '@github/keytar';
const VIZIO_SERVICE = 'SettingForge Equipment Vizio';
const DEVICE_NAME = 'SettingForge Equipment';
const DEVICE_ID = `settingforge-${randomUUID()}`;
export async function connectVizio(address, port = 7345) {
    const existingToken = await getVizioToken(address);
    if (existingToken) {
        return {
            connected: true,
            authorized: true,
            requiresPin: false,
        };
    }
    const response = await requestVizio(address, port, '/pairing/start', {
        DEVICE_NAME,
        DEVICE_ID,
    });
    assertSuccess(response, 'VIZIO pairing start');
    const pairingRequestToken = response.ITEM?.PAIRING_REQ_TOKEN;
    const challengeType = response.ITEM?.CHALLENGE_TYPE;
    if (typeof pairingRequestToken !==
        'number' ||
        typeof challengeType !==
            'number') {
        throw new Error('VIZIO pairing response did not contain a valid challenge.');
    }
    return {
        connected: true,
        authorized: false,
        requiresPin: true,
        challenge: {
            deviceId: DEVICE_ID,
            pairingRequestToken,
            challengeType,
        },
    };
}
export async function completeVizioPairing(address, pin, challenge, port = 7345) {
    const response = await requestVizio(address, port, '/pairing/pair', {
        DEVICE_ID: challenge.deviceId,
        CHALLENGE_TYPE: challenge.challengeType,
        RESPONSE_VALUE: pin,
        PAIRING_REQ_TOKEN: challenge.pairingRequestToken,
    });
    assertSuccess(response, 'VIZIO pairing');
    const authToken = response.ITEM?.AUTH_TOKEN;
    if (typeof authToken !==
        'string' ||
        authToken.length === 0) {
        throw new Error('VIZIO pairing succeeded but did not return an authorization token.');
    }
    await keytar.setPassword(VIZIO_SERVICE, getTokenAccount(address), authToken);
    return {
        connected: true,
        authorized: true,
        requiresPin: false,
    };
}
export async function getVizioToken(address) {
    return keytar.getPassword(VIZIO_SERVICE, getTokenAccount(address));
}
async function requestVizio(address, port, path, body) {
    const payload = JSON.stringify(body);
    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: address,
            port,
            path,
            method: 'PUT',
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        }, (response) => {
            const chunks = [];
            response.on('data', (chunk) => {
                chunks.push(Buffer.isBuffer(chunk)
                    ? chunk
                    : Buffer.from(chunk));
            });
            response.on('end', () => {
                try {
                    const text = Buffer.concat(chunks).toString('utf8');
                    if (!response.statusCode ||
                        response.statusCode <
                            200 ||
                        response.statusCode >=
                            300) {
                        reject(new Error(`VIZIO request returned HTTP ${response.statusCode ?? 'unknown'}: ${text}`));
                        return;
                    }
                    const result = JSON.parse(text);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
        request.once('error', reject);
        request.write(payload);
        request.end();
    });
}
function assertSuccess(response, operation) {
    const result = response.STATUS?.RESULT;
    if (result === 'SUCCESS') {
        return;
    }
    const detail = response.STATUS?.DETAIL;
    throw new Error(detail
        ? `${operation} failed: ${detail}`
        : `${operation} failed: ${result ?? 'unknown response'}`);
}
function getTokenAccount(address) {
    return `vizio:${address}`;
}
