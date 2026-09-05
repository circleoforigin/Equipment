import type {
  DiscoveredDevice,
} from '../../discovery/DiscoveryTypes'

import {
  discoverSamsungDevices,
} from '../../runtime/EquipmentRuntimeClient'

import type {
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
}