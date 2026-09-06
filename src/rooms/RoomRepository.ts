import type {
  EquipmentRoom,
} from '../models/Room'

import {
  hostedCollectionRepository,
} from '../host/HostedCollectionRepository'

const ROOMS_COLLECTION = 'rooms'

function normalizeRoom(
  room: EquipmentRoom,
): EquipmentRoom {
  return {
    ...room,

    width:
      typeof room.width === 'number'
        ? room.width
        : 1,

    height:
      typeof room.height === 'number'
        ? room.height
        : 1,

    devices:
      Array.isArray(room.devices)
        ? room.devices
        : [],
  }
}

export class RoomRepository {
  async loadRooms(): Promise<
    EquipmentRoom[]
  > {
    const rooms =
      await hostedCollectionRepository
        .loadAll<EquipmentRoom>(
          ROOMS_COLLECTION,
        )

    return Array.isArray(rooms)
      ? rooms.map(normalizeRoom)
      : []
  }

  async saveRoom(
    room: EquipmentRoom,
  ): Promise<EquipmentRoom[]> {
    const normalizedRoom =
      normalizeRoom({
        ...room,
        updatedAt:
          new Date().toISOString(),
      })

    await hostedCollectionRepository.save(
      ROOMS_COLLECTION,
      normalizedRoom.id,
      normalizedRoom,
    )

    return this.loadRooms()
  }

  async deleteRoom(
    roomId: string,
  ): Promise<EquipmentRoom[]> {
    await hostedCollectionRepository.delete(
      ROOMS_COLLECTION,
      roomId,
    )

    return this.loadRooms()
  }
}

export const roomRepository =
  new RoomRepository()