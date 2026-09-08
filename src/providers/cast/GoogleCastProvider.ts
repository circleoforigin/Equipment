import type {
  EquipmentCapability,
} from '../../models/Capability'

import type {
  DiscoveredDevice,
} from '../../discovery/DiscoveryTypes'

import {
  discoverCastDevices,
} from '../../runtime/EquipmentRuntimeClient'

import type {
  EquipmentConnectionResult,
  EquipmentProvider,
} from '../EquipmentProvider'

export class GoogleCastProvider
  implements EquipmentProvider
{
  readonly id = 'google-cast'
  readonly name = 'Google Cast'

  readonly capabilities:
    EquipmentCapability[] = []

  async discover():
    Promise<DiscoveredDevice[]> {
    const devices =
      await discoverCastDevices()

    return devices.map(
      (device) => ({
        providerId: this.id,

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
    /*
     * Cast receivers do not use
     * the VIZIO PIN authorization
     * flow.
     *
     * Actual Cast transport
     * connection will be proven
     * with Display Video.
     */
    return {
      connected: true,
      authorized: true,
    }
  }
}