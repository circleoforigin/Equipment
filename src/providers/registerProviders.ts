import {
  registerProvider,
} from './ProviderRegistry'

import {
  SamsungProvider,
} from './samsung/SamsungProvider'

let registered = false

export function registerEquipmentProviders(): void {
  if (registered) {
    return
  }

  registered = true

  registerProvider(
    new SamsungProvider(),
  )
}