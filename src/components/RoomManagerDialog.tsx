import {
  useState,
} from 'react'

import type {
  EquipmentRoom,
  RoomDevicePlacement,
} from '../models/Room'

import type {
  RegisteredDevice,
} from '../runtime/EquipmentRuntimeClient'

interface RoomManagerDialogProps {
  rooms: EquipmentRoom[]
  devices: RegisteredDevice[]
  activeRoomId?: string

  onClose: () => void

  onCreateRoom: () => void

  onDeleteRoom: (
    roomId: string,
  ) => Promise<void>

  onSaveRoom: (
    room: EquipmentRoom,
  ) => Promise<void>
}

type RoomShape =
  | 'square'
  | 'rectangle'

type RoomManagerTab =
  | 'features'
  | 'hardware'

function getRoomShape(
  room: EquipmentRoom,
): RoomShape {
  return room.width === room.height
    ? 'square'
    : 'rectangle'
}

function getRoomDimensions(
  shape: RoomShape,
) {
  if (shape === 'rectangle') {
    return {
      width: 1.6,
      height: 1,
    }
  }

  return {
    width: 1,
    height: 1,
  }
}

function RoomManagerDialog({
  rooms,
  devices,
  activeRoomId,
  onClose,
  onCreateRoom,
  onDeleteRoom,
  onSaveRoom,
}: RoomManagerDialogProps) {
  const [
    selectedRoomId,
    setSelectedRoomId,
  ] = useState<string | null>(
    null,
  )

  const [
    draftRoom,
    setDraftRoom,
  ] = useState<EquipmentRoom | null>(
    null,
  )

  const [
    activeTab,
    setActiveTab,
  ] = useState<RoomManagerTab>(
    'features',
  )

  function handleChooseRoom(
    room: EquipmentRoom,
  ) {
    setDraftRoom(
      structuredClone(room),
    )

    setActiveTab(
      'features',
    )
  }

  function handleOpenSelectedRoom() {
    const room =
      rooms.find(
        (candidate) =>
          candidate.id ===
          selectedRoomId,
      )

    if (!room) {
      return
    }

    handleChooseRoom(room)
  }

  async function handleDeleteSelectedRoom() {
    const room =
      rooms.find(
        (candidate) =>
          candidate.id ===
          selectedRoomId,
      )

    if (!room) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${room.name}"? This cannot be undone.`,
      )

    if (!confirmed) {
      return
    }

    await onDeleteRoom(
      room.id,
    )

    setSelectedRoomId(
      null,
    )
  }

  function handleBack() {
    setDraftRoom(null)

    setActiveTab(
      'features',
    )
  }

  async function handleSave() {
    if (!draftRoom) {
      return
    }

    await onSaveRoom(
      draftRoom,
    )

    setDraftRoom(null)

    setActiveTab(
      'features',
    )
  }

  function handleShapeChange(
    shape: RoomShape,
  ) {
    if (!draftRoom) {
      return
    }

    const {
      width,
      height,
    } = getRoomDimensions(
      shape,
    )

    setDraftRoom({
      ...draftRoom,
      width,
      height,
    })
  }

  function handleAddPlacement() {
    if (!draftRoom) {
      return
    }

    const placement:
      RoomDevicePlacement = {
        id:
          crypto.randomUUID(),

        deviceId: '',

        name:
          `Device ${
            draftRoom.devices.length + 1
          }`,

        position: {
          x: 0,
          y: 0,
        },

        rotation: 0,
      }

    setDraftRoom({
      ...draftRoom,

      devices: [
        ...draftRoom.devices,
        placement,
      ],
    })
  }

  function handleRemovePlacement(
    placementId: string,
  ) {
    if (!draftRoom) {
      return
    }

    setDraftRoom({
      ...draftRoom,

      devices:
        draftRoom.devices.filter(
          (placement) =>
            placement.id !==
            placementId,
        ),
    })
  }

  function handleDeviceAssignment(
    placementId: string,
    deviceId: string,
  ) {
    if (!draftRoom) {
      return
    }

    setDraftRoom({
      ...draftRoom,

      devices:
        draftRoom.devices.map(
          (placement) =>
            placement.id ===
            placementId
              ? {
                  ...placement,
                  deviceId,
                }
              : placement,
        ),
    })
  }

  return (
    <div className="dialog-backdrop">
      <div className="room-manager-dialog">
        <div className="room-manager-header">
          <h2>
            Manage Rooms
          </h2>

          <div className="room-manager-header-actions">
            {!draftRoom ? (
              <>
                <button
                  type="button"
                  onClick={
                    onCreateRoom
                  }
                >
                  New Room
                </button>

                <div
                  className="room-manager-header-separator"
                  aria-hidden="true"
                />

                <button
                  type="button"
                  disabled={
                    !selectedRoomId
                  }
                  onClick={
                    handleOpenSelectedRoom
                  }
                >
                  Open
                </button>

                <button
                  type="button"
                  disabled={
                    !selectedRoomId
                  }
                  onClick={() => {
                    void handleDeleteSelectedRoom()
                  }}
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={
                    handleBack
                  }
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleSave()
                  }}
                >
                  Save
                </button>
              </>
            )}

            <button
              type="button"
              onClick={
                onClose
              }
            >
              Close
            </button>
          </div>
        </div>

        <div className="room-manager-body">
          {!draftRoom ? (
            <div className="room-manager-list">
              <div className="room-manager-list-title">
                Rooms
              </div>

              {rooms.length === 0 ? (
                <div className="room-manager-empty">
                  No Rooms have been created.
                </div>
              ) : (
                rooms.map(
                  (room) => (
                    <button
                      key={
                        room.id
                      }
                      type="button"
                      className={[
                        'room-manager-room-entry',

                        selectedRoomId ===
                        room.id
                          ? 'selected'
                          : '',

                        activeRoomId ===
                        room.id
                          ? 'active-room'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() =>
                        setSelectedRoomId(
                          room.id,
                        )
                      }
                    >
                      {room.name}
                    </button>
                  ),
                )
              )}
            </div>
          ) : (
            <>
              <div className="room-manager-tabs">
                <button
                  type="button"
                  className={
                    activeTab ===
                    'features'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveTab(
                      'features',
                    )
                  }
                >
                  Features
                </button>

                <button
                  type="button"
                  className={
                    activeTab ===
                    'hardware'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveTab(
                      'hardware',
                    )
                  }
                >
                  Hardware
                </button>
              </div>

              {activeTab ===
                'features' && (
                <div className="room-manager-features">
                  <div className="room-feature-row">
                    <label>
                      Name
                    </label>

                    <input
                      type="text"
                      value={
                        draftRoom.name
                      }
                      onChange={(
                        event,
                      ) =>
                        setDraftRoom({
                          ...draftRoom,

                          name:
                            event
                              .target
                              .value,
                        })
                      }
                    />
                  </div>

                  <div className="room-feature-row">
                    <label>
                      Shape
                    </label>

                    <select
                      value={getRoomShape(
                        draftRoom,
                      )}
                      onChange={(
                        event,
                      ) =>
                        handleShapeChange(
                          event.target
                            .value as RoomShape,
                        )
                      }
                    >
                      <option value="square">
                        Square
                      </option>

                      <option value="rectangle">
                        Rectangle
                      </option>
                    </select>
                  </div>

                  <div className="room-feature-row">
                    <label>
                      Device Placements
                    </label>

                    <button
                      type="button"
                      onClick={
                        handleAddPlacement
                      }
                    >
                      + Add
                    </button>
                  </div>

                  <div className="room-feature-section">
                    Placements
                  </div>

                  {draftRoom.devices.map(
                    (
                      placement,
                    ) => (
                      <div
                        key={
                          placement.id
                        }
                        className="room-device-feature"
                      >
                        <input
                          type="text"
                          value={
                            placement.name
                          }
                          onChange={(
                            event,
                          ) =>
                            setDraftRoom({
                              ...draftRoom,

                              devices:
                                draftRoom.devices.map(
                                  (
                                    candidate,
                                  ) =>
                                    candidate.id ===
                                    placement.id
                                      ? {
                                          ...candidate,

                                          name:
                                            event
                                              .target
                                              .value,
                                        }
                                      : candidate,
                                ),
                            })
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            handleRemovePlacement(
                              placement.id,
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}

              {activeTab ===
                'hardware' && (
                <div className="room-hardware-panel">
                  <div className="room-feature-section">
                    Device Mapping
                  </div>

                  {draftRoom.devices.length ===
                  0 ? (
                    <p>
                      Add a device placement
                      on the Features tab first.
                    </p>
                  ) : (
                    draftRoom.devices.map(
                      (
                        placement,
                      ) => (
                        <div
                          key={
                            placement.id
                          }
                          className="room-device-mapping"
                        >
                          <label>
                            {
                              placement.name
                            }
                          </label>

                          <select
                            value={
                              placement.deviceId
                            }
                            onChange={(
                              event,
                            ) =>
                              handleDeviceAssignment(
                                placement.id,
                                event
                                  .target
                                  .value,
                              )
                            }
                          >
                            <option value="">
                              Unassigned
                            </option>

                            {devices.map(
                              (
                                device,
                              ) => (
                                <option
                                  key={
                                    device.id
                                  }
                                  value={
                                    device.id
                                  }
                                >
                                  {
                                    device.name
                                  }
                                  {device.model
                                    ? ` · ${device.model}`
                                    : ''}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      ),
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomManagerDialog