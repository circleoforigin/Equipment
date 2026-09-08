import type { EquipmentCapability } from '../../models/Capability'
import type { DiscoveredDevice } from '../../discovery/DiscoveryTypes'

import {
  connectSamsungDevice,
  discoverSamsungDevices,
  displaySamsungImage,
} from '../../runtime/EquipmentRuntimeClient'

import type {
  DisplayImageRequest,
  EquipmentConnectionResult,
  EquipmentProvider,
} from '../EquipmentProvider'

export class SamsungProvider
  implements EquipmentProvider
{
  readonly id = 'samsung'
  readonly name = 'Samsung'

  readonly capabilities: EquipmentCapability[] = [
  {
    id: 'display-image',
    name: 'Display Image',
  },
  {
    id: 'display-video',
    name: 'Display Video',
  },
]

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

  async displayImage(
  device: DiscoveredDevice,
  request: DisplayImageRequest,
): Promise<void> {
  if (!device.address) {
    throw new Error(
      'Samsung device does not have a connection address.',
    )
  }

  await displaySamsungImage(
    device.address,
    request.imageUrl,
  )
}
}