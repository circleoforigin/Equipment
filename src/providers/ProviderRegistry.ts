import type {
  EquipmentProvider,
} from './EquipmentProvider'

const providers: EquipmentProvider[] = []

export function registerProvider(
  provider: EquipmentProvider,
): void {
  const existingIndex = providers.findIndex(
    (existing) => existing.id === provider.id,
  )

  if (existingIndex >= 0) {
    providers[existingIndex] = provider
    return
  }

  providers.push(provider)
}

export function getProviders(): readonly EquipmentProvider[] {
  return providers
}