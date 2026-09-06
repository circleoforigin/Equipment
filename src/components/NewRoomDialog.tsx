import {
  useState,
} from 'react'

export type RoomShape =
  | 'square'
  | 'rectangle'

export interface NewRoomData {
  name: string
  shape: RoomShape
}

interface NewRoomDialogProps {
  onCancel: () => void

  onCreate: (
    data: NewRoomData,
  ) => void
}

export default function NewRoomDialog({
  onCancel,
  onCreate,
}: NewRoomDialogProps) {
  const [name, setName] =
    useState('')

  const [shape, setShape] =
    useState<RoomShape>('square')

  function handleCreate() {
    const trimmedName =
      name.trim()

    if (!trimmedName) {
      return
    }

    onCreate({
      name: trimmedName,
      shape,
    })
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>New Room</h2>

        <div className="new-room-row">
          <label>Name</label>

          <input
            type="text"
            value={name}
            placeholder="Room name"
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            autoFocus
          />
        </div>

        <div className="new-room-row">
          <label>Shape</label>

          <select
            value={shape}
            onChange={(event) =>
              setShape(
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

        <div className="dialog-buttons">
          <button onClick={onCancel}>
            Cancel
          </button>

          <button
            disabled={!name.trim()}
            onClick={handleCreate}
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  )
}