import type {
  EquipmentControl,
} from './Control'

export interface EquipmentProject {
  id: string
  name: string

  controls: EquipmentControl[]

  reactions: []

  activeRoomId?: string

  createdAt: string
  updatedAt: string
}