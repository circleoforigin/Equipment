import type {
  DiscoveredDevice,
} from '../discovery/DiscoveryTypes'

export interface EquipmentProvider {
  readonly id: string
  readonly name: string

  discover(): Promise<DiscoveredDevice[]>
}