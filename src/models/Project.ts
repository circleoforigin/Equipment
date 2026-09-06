export interface EquipmentProject {
  id: string
  name: string
  
  controlIds: string[]
  reactions: []

  activeRoomId?: string

  createdAt: string
  updatedAt: string
}