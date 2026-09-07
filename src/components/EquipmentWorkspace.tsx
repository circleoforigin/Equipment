import type {
  EquipmentRoom,
} from '../models/Room'

interface EquipmentWorkspaceProps {
  room: EquipmentRoom | null
}

function EquipmentWorkspace({
  room,
}: EquipmentWorkspaceProps) {
  return (
    <div className="equipment-project-workspace">
      <aside className="equipment-inspector">
        <div className="equipment-panel-header">
          Inspector
        </div>

        <div className="equipment-inspector-empty">
          Select a Control to inspect it.
        </div>
      </aside>

      <div className="equipment-main-workspace">
        <section className="equipment-room-workspace">
          <div className="equipment-panel-header">
            Room
            {room
              ? ` — ${room.name}`
              : ''}
          </div>

          <div className="equipment-room-content">
            {!room ? (
              <div className="equipment-room-placeholder">
                No Room selected.
              </div>
            ) : (
              <div
                className="equipment-room-canvas"
                style={{
                  aspectRatio:
                    `${room.width} / ${room.height}`,
                }}
              >
                {room.devices.map(
                  (placement) => {
                    const left =
                      (
                        (
                          placement.position.x +
                          room.width / 2
                        ) /
                        room.width
                      ) *
                      100

                    const top =
                      (
                        (
                          room.height / 2 -
                          placement.position.y
                        ) /
                        room.height
                      ) *
                      100

                    return (
                      <div
                        key={placement.id}
                        className="equipment-room-feature"
                        style={{
                          left:
                            `${left}%`,
                          top:
                            `${top}%`,
                        }}
                      >
                        {placement.name}
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </div>
        </section>

        <section className="equipment-control-tray">
          <div className="equipment-panel-header">
            Controls
          </div>

          <div className="equipment-control-tray-empty">
            No Controls have been added.
          </div>
        </section>
      </div>
    </div>
  )
}

export default EquipmentWorkspace