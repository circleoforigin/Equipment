import type {
  DiscoveredDevice,
} from '../../discovery/DiscoveryTypes'

import {
  connectSamsungDevice,
  discoverSamsungDevices,
} from '../../runtime/EquipmentRuntimeClient'

import type {
  EquipmentConnectionResult,
  EquipmentProvider,
} from '../EquipmentProvider'

export class SamsungProvider
  implements EquipmentProvider
{
  readonly id = 'samsung'
  readonly name = 'Samsung'

  async discover():
    Promise<DiscoveredDevice[]> {
    const devices =
      await discoverSamsungDevices()

    return devices.map(
      (device) => ({
        providerId: this.id,
        providerDeviceId:
          device.providerDeviceId,
        name: device.name,
        manufacturer:
          device.manufacturer,
        model: device.model,
        address: device.address,
      }),
    )
  }

  async connect(
    device: DiscoveredDevice,
  ): Promise<EquipmentConnectionResult> {
    if (!device.address) {
      throw new Error(
        'Samsung device does not have a connection address.',
      )
    }

    const result =
      await connectSamsungDevice(
        device.address,
      )

    return {
      connected: result.connected,
      authorized: result.authorized,
    }
  }
}