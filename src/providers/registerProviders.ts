import {
  registerProvider,
} from './ProviderRegistry'

import {
  SamsungProvider,
} from './samsung/SamsungProvider'

import {
  VizioProvider,
} from './vizio/VizioProvider'

let registered = false

export function registerEquipmentProviders(): void {
  if (registered) {
    return
  }

  registered = true

  registerProvider(
    new SamsungProvider(),
  )

  registerProvider(
    new VizioProvider(),
  )
}