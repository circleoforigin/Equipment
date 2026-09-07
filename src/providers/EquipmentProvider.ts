import type {
  DiscoveredDevice,
} from '../discovery/DiscoveryTypes'

export interface EquipmentConnectionResult {
  connected: boolean
  authorized: boolean
}

export interface EquipmentProvider {
  readonly id: string
  readonly name: string

  discover(): Promise<DiscoveredDevice[]>

  connect(
    device: DiscoveredDevice,
  ): Promise<EquipmentConnectionResult>
}