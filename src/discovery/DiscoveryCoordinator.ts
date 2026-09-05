import {
  getProviders,
} from '../providers/ProviderRegistry'

import type {
  DiscoveryResult,
  DiscoveredDevice,
  ProviderDiscoveryState,
} from './DiscoveryTypes'

export async function discoverDevices(
  onProviderUpdate?: (
    state: ProviderDiscoveryState,
  ) => void,
): Promise<DiscoveryResult> {
  const providers = getProviders()

  const providerStates: ProviderDiscoveryState[] =
    providers.map((provider) => ({
      providerId: provider.id,
      providerName: provider.name,
      status: 'idle',
    }))

  const devices: DiscoveredDevice[] = []

  await Promise.all(
    providers.map(async (provider) => {
      updateProviderState(
        providerStates,
        {
          providerId: provider.id,
          providerName: provider.name,
          status: 'scanning',
        },
        onProviderUpdate,
      )

      try {
        const discovered = await provider.discover()

        devices.push(...discovered)

        updateProviderState(
          providerStates,
          {
            providerId: provider.id,
            providerName: provider.name,
            status: 'completed',
          },
          onProviderUpdate,
        )
      } catch (error) {
        updateProviderState(
          providerStates,
          {
            providerId: provider.id,
            providerName: provider.name,
            status: 'failed',
            error:
              error instanceof Error
                ? error.message
                : 'Unknown discovery error.',
          },
          onProviderUpdate,
        )
      }
    }),
  )

  return {
    devices: deduplicateDevices(devices),
    providers: providerStates,
  }
}

function updateProviderState(
  states: ProviderDiscoveryState[],
  nextState: ProviderDiscoveryState,
  onProviderUpdate?: (
    state: ProviderDiscoveryState,
  ) => void,
): void {
  const index = states.findIndex(
    (state) =>
      state.providerId === nextState.providerId,
  )

  if (index >= 0) {
    states[index] = nextState
  }

  onProviderUpdate?.(nextState)
}

function deduplicateDevices(
  devices: DiscoveredDevice[],
): DiscoveredDevice[] {
  const seen = new Set<string>()
  const unique: DiscoveredDevice[] = []

  for (const device of devices) {
    const identity =
      device.providerDeviceId ??
      device.address ??
      device.name

    const key = `${device.providerId}:${identity}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(device)
  }

  return unique
}