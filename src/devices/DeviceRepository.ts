import type {
  EquipmentDevice,
} from '../models/Device';

import {
  hostedCollectionRepository,
} from '../host/HostedCollectionRepository';

const DEVICES_COLLECTION =
  'devices';

function normalizeDevice(
  device: EquipmentDevice
): EquipmentDevice {
  return {
    ...device,

    capabilities:
      Array.isArray(device.capabilities)
        ? device.capabilities
        : [],
  };
}

export class DeviceRepository {
  async loadDevices(): Promise<EquipmentDevice[]> {
    const devices =
      await hostedCollectionRepository
        .loadAll<EquipmentDevice>(
          DEVICES_COLLECTION
        );

    return Array.isArray(devices)
      ? devices.map(normalizeDevice)
      : [];
  }

  async loadDevice(
    deviceId: string
  ): Promise<EquipmentDevice | null> {
    const device =
      await hostedCollectionRepository
        .load<EquipmentDevice>(
          DEVICES_COLLECTION,
          deviceId
        );

    return device
      ? normalizeDevice(device)
      : null;
  }

  async saveDevice(
    device: EquipmentDevice
  ): Promise<void> {
    await hostedCollectionRepository.save(
      DEVICES_COLLECTION,
      device.id,
      device
    );
  }

  async deleteDevice(
    deviceId: string
  ): Promise<boolean> {
    return hostedCollectionRepository.delete(
      DEVICES_COLLECTION,
      deviceId
    );
  }
}

export const deviceRepository =
  new DeviceRepository();