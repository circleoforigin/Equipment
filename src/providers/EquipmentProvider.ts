import type {
  DiscoveredDevice,
} from '../discovery/DiscoveryTypes'

import type {
  EquipmentCapability,
} from '../models/Capability'

export interface EquipmentConnectionResult {
  connected: boolean
  authorized: boolean
}

export interface DisplayImageRequest {
  imageUrl: string
}

export interface EquipmentProvider {
  readonly id: string
  readonly name: string

  readonly capabilities:
    EquipmentCapability[]

  discover():
    Promise<DiscoveredDevice[]>

  connect(
    device: DiscoveredDevice,
  ): Promise<EquipmentConnectionResult>

  displayImage(
    device: DiscoveredDevice,
    request: DisplayImageRequest,
  ): Promise<void>
}