import type {
  EquipmentCapability,
} from '../../models/Capability'

import type {
  DiscoveredDevice,
} from '../../discovery/DiscoveryTypes'

import {
  discoverCastDevices,
  displayCastVideo,
} from '../../runtime/EquipmentRuntimeClient'

import type {
  DisplayVideoRequest,
  EquipmentConnectionResult,
  EquipmentProvider,
} from '../EquipmentProvider'

export class GoogleCastProvider
  implements EquipmentProvider
{
  readonly id =
    'google-cast'

  readonly name =
    'Google Cast'

  readonly capabilities:
    EquipmentCapability[] = [
      {
        id: 'display-video',
        name: 'Display Video',
      },
    ]

  async discover():
    Promise<DiscoveredDevice[]> {
    const devices =
      await discoverCastDevices()

    return devices.map(
      device => ({
        providerId:
          this.id,

        providerDeviceId:
          device.providerDeviceId,

        name:
          device.name,

        model:
          device.model,

        address:
          device.address,
      }),
    )
  }

  async connect(
    _device: DiscoveredDevice,
  ): Promise<EquipmentConnectionResult> {
    return {
      connected: true,
      authorized: true,
    }
  }

  async displayVideo(
    device: DiscoveredDevice,
    request: DisplayVideoRequest,
  ): Promise<void> {
    if (!device.address) {
      throw new Error(
        'Google Cast device does not have an address.',
      )
    }

    await displayCastVideo(
      device.address,
      request.videoUrl,
    )
  }
}