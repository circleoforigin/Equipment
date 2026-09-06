import type {
  EquipmentRoom,
} from '../models/Room'

interface RoomSelectorDialogProps {
  rooms: EquipmentRoom[]
  selectedRoomId?: string

  onCancel: () => void

  onSelectRoom: (
    roomId: string,
  ) => void
}

export default function RoomSelectorDialog({
  rooms,
  selectedRoomId,
  onCancel,
  onSelectRoom,
}: RoomSelectorDialogProps) {
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel()
        }
      }}
    >
      <div className="dialog room-selector-dialog">
        <h2>Select Room</h2>

        <p>
          Choose the Room for this Equipment project.
        </p>

        <div className="project-picker-list">
          {rooms.length === 0 ? (
            <div className="room-manager-empty">
              No Rooms have been created.
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={[
                  'project-picker-item',

                  selectedRoomId ===
                  room.id
                    ? 'selected'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() =>
                  onSelectRoom(
                    room.id,
                  )
                }
              >
                {room.name}
              </button>
            ))
          )}
        </div>

        <div className="dialog-buttons">
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}