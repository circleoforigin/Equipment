import type {
  DiscoveredDevice,
} from '../discovery/DiscoveryTypes'

import type {
  EquipmentCapability,
} from '../models/Capability'

export interface EquipmentConnectionChallenge {
  type: 'pin'
  prompt: string
  data: unknown
}

export interface EquipmentConnectionResult {
  connected: boolean
  authorized: boolean
  challenge?:
    EquipmentConnectionChallenge
}

export interface DisplayImageRequest {
  imageUrl: string
}

export interface DisplayVideoRequest {
  videoUrl: string
  loop?: boolean
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

  completeConnection?(
    device: DiscoveredDevice,
    challenge:
      EquipmentConnectionChallenge,
    response: string,
  ): Promise<EquipmentConnectionResult>

  displayImage?(
    device: DiscoveredDevice,
    request: DisplayImageRequest,
  ): Promise<void>

  displayVideo?(
    device: DiscoveredDevice,
    request: DisplayVideoRequest,
  ): Promise<void>
}