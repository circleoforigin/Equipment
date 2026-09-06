export interface RoomDevicePlacement {
  id: string

  /**
   * References a device in Equipment's
   * Device Registry.
   */
  deviceId: string

  /**
   * User-facing name for this device
   * within this Room.
   *
   * Example: "Main TV", "Storm Light"
   */
  name: string

  position: {
    x: number
    y: number
  }

  rotation: number
}

export interface EquipmentRoom {
  id: string
  name: string

  /**
   * Visual Room dimensions.
   * These are normalized workspace dimensions,
   * not real-world feet/meters yet.
   */
  width: number
  height: number

  devices: RoomDevicePlacement[]

  createdAt: string
  updatedAt: string
}