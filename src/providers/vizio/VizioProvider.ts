import type {
  EquipmentCapability,
} from '../../models/Capability'

import type {
  DiscoveredDevice,
} from '../../discovery/DiscoveryTypes'

import {
  completeVizioPairing,
  connectVizioDevice,
  discoverVizioDevices,
} from '../../runtime/EquipmentRuntimeClient'

import type {
  EquipmentConnectionChallenge,
  EquipmentConnectionResult,
  EquipmentProvider,
} from '../EquipmentProvider'

export class VizioProvider
  implements EquipmentProvider
{
  readonly id = 'vizio'
  readonly name = 'VIZIO'

  /*
   * Do not advertise media capabilities
   * until the video-casting path is proven
   * on the physical TV.
   */
  readonly capabilities:
    EquipmentCapability[] = []

  async discover():
    Promise<DiscoveredDevice[]> {
    const devices =
      await discoverVizioDevices()

    return devices.map(
      (device) => ({
        providerId: this.id,

        providerDeviceId:
          device.providerDeviceId,

        name:
          device.name,

        manufacturer:
          device.manufacturer,

        model:
          device.model,

        address:
          device.address,
      }),
    )
  }

  async connect(
    device: DiscoveredDevice,
  ): Promise<EquipmentConnectionResult> {
    if (!device.address) {
      throw new Error(
        'VIZIO device does not have a connection address.',
      )
    }

    const result =
      await connectVizioDevice(
        device.address,
      )

    if (
      result.requiresPin &&
      result.challenge
    ) {
      return {
        connected:
          result.connected,

        authorized: false,

        challenge: {
          type: 'pin',

          prompt:
            'Enter the PIN shown on the VIZIO TV.',

          data:
            result.challenge,
        },
      }
    }

    return {
      connected:
        result.connected,

      authorized:
        result.authorized,
    }
  }

  async completeConnection(
    device: DiscoveredDevice,
    challenge:
      EquipmentConnectionChallenge,
    response: string,
  ): Promise<EquipmentConnectionResult> {
    if (!device.address) {
      throw new Error(
        'VIZIO device does not have a connection address.',
      )
    }

    const result =
      await completeVizioPairing(
        device.address,
        response,
        challenge.data,
      )

    return {
      connected:
        result.connected,

      authorized:
        result.authorized,
    }
  }
}