import { randomUUID, } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, } from 'node:fs/promises';
import { homedir, platform, } from 'node:os';
import { dirname, join, } from 'node:path';
const REGISTRY_PATH = join(getEquipmentDataDirectory(), 'device-registry.json');
export async function getRegisteredDevices() {
    const registry = await readRegistry();
    return registry.devices;
}
export async function registerDevice(input) {
    const registry = await readRegistry();
    const existing = findExistingDevice(registry.devices, input);
    if (existing) {
        const updated = {
            ...existing,
            name: input.name,
            manufacturer: input.manufacturer,
            model: input.model,
            address: input.address,
            providerDeviceId: input.providerDeviceId,
        };
        registry.devices =
            registry.devices.map((device) => device.id === existing.id
                ? updated
                : device);
        await writeRegistry(registry);
        return updated;
    }
    const device = {
        id: randomUUID(),
        providerId: input.providerId,
        providerDeviceId: input.providerDeviceId,
        name: input.name,
        manufacturer: input.manufacturer,
        model: input.model,
        address: input.address,
        addedAt: new Date().toISOString(),
    };
    registry.devices.push(device);
    await writeRegistry(registry);
    return device;
}
export async function removeRegisteredDevice(id) {
    const registry = await readRegistry();
    const remainingDevices = registry.devices.filter((device) => device.id !== id);
    if (remainingDevices.length ===
        registry.devices.length) {
        return false;
    }
    registry.devices =
        remainingDevices;
    await writeRegistry(registry);
    return true;
}
function findExistingDevice(devices, input) {
    if (input.providerDeviceId) {
        const byProviderIdentity = devices.find((device) => device.providerId ===
            input.providerId &&
            device.providerDeviceId ===
                input.providerDeviceId);
        if (byProviderIdentity) {
            return byProviderIdentity;
        }
    }
    if (input.address) {
        return devices.find((device) => device.providerId ===
            input.providerId &&
            device.address ===
                input.address);
    }
    return undefined;
}
async function readRegistry() {
    try {
        const text = await readFile(REGISTRY_PATH, 'utf8');
        const value = JSON.parse(text);
        if (!isRegistryFile(value)) {
            throw new Error('Equipment device registry contains invalid data.');
        }
        return value;
    }
    catch (error) {
        if (isNodeError(error) &&
            error.code === 'ENOENT') {
            return {
                version: 1,
                devices: [],
            };
        }
        throw error;
    }
}
async function writeRegistry(registry) {
    await mkdir(dirname(REGISTRY_PATH), {
        recursive: true,
    });
    const temporaryPath = `${REGISTRY_PATH}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(registry, null, 2), 'utf8');
    await rename(temporaryPath, REGISTRY_PATH);
}
function getEquipmentDataDirectory() {
    switch (platform()) {
        case 'win32':
            return join(process.env.LOCALAPPDATA ??
                join(homedir(), 'AppData', 'Local'), 'SettingForge', 'Equipment');
        case 'darwin':
            return join(homedir(), 'Library', 'Application Support', 'SettingForge', 'Equipment');
        default:
            return join(process.env.XDG_DATA_HOME ??
                join(homedir(), '.local', 'share'), 'SettingForge', 'Equipment');
    }
}
function isRegistryFile(value) {
    if (typeof value !== 'object' ||
        value === null) {
        return false;
    }
    const candidate = value;
    return (candidate.version === 1 &&
        Array.isArray(candidate.devices) &&
        candidate.devices.every(isRegisteredDevice));
}
function isRegisteredDevice(value) {
    if (typeof value !== 'object' ||
        value === null) {
        return false;
    }
    const candidate = value;
    return (typeof candidate.id ===
        'string' &&
        typeof candidate.providerId ===
            'string' &&
        typeof candidate.name ===
            'string' &&
        typeof candidate.addedAt ===
            'string' &&
        optionalString(candidate.providerDeviceId) &&
        optionalString(candidate.manufacturer) &&
        optionalString(candidate.model) &&
        optionalString(candidate.address));
}
function optionalString(value) {
    return (value === undefined ||
        typeof value === 'string');
}
function isNodeError(error) {
    return error instanceof Error;
}
