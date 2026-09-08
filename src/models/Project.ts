import type {
  EquipmentControl,
} from './Control'

import type {
  EquipmentReaction,
} from './EquipmentReaction'

export interface EquipmentProject {
  id: string
  name: string

  controls: EquipmentControl[]

  reactions: EquipmentReaction[]

  activeRoomId?: string

  createdAt: string
  updatedAt: string
}