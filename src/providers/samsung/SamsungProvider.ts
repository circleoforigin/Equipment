import type {
  DiscoveredDevice,
} from '../../discovery/DiscoveryTypes'

import type {
  EquipmentProvider,
} from '../EquipmentProvider'

export class SamsungProvider
  implements EquipmentProvider
{
  readonly id = 'samsung'
  readonly name = 'Samsung'

  async discover(): Promise<DiscoveredDevice[]> {
    return []
  }
}