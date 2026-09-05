export type DiscoveryStatus =
  | 'idle'
  | 'scanning'
  | 'completed'
  | 'failed'

export interface DiscoveredDevice {
  providerId: string
  providerDeviceId?: string

  name: string
  manufacturer?: string
  model?: string
  address?: string
}

export interface ProviderDiscoveryState {
  providerId: string
  providerName: string
  status: DiscoveryStatus
  error?: string
}

export interface DiscoveryResult {
  devices: DiscoveredDevice[]
  providers: ProviderDiscoveryState[]
}