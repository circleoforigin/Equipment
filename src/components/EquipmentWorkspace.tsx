import {
  useMemo,
  useState,
} from 'react'

import type {
  EquipmentControl,
  EquipmentControlType,
} from '../models/Control'

import type {
  EquipmentRoom,
} from '../models/Room'

import {
  getControlDefinitions,
} from '../controls/ControlCatalog'

interface EquipmentWorkspaceProps {
  room: EquipmentRoom | null

  controls: EquipmentControl[]

  onControlsChange:
    (controls: EquipmentControl[]) =>
      void

  onTestControl:
    (control: EquipmentControl) =>
      void
}

function EquipmentWorkspace({
  room,
  controls,
  onControlsChange,
  onTestControl,
}: EquipmentWorkspaceProps) {
  const [
    selectedControlType,
    setSelectedControlType,
  ] = useState<EquipmentControlType>(
    'display-image',
  )

  const [
    selectedControlId,
    setSelectedControlId,
  ] = useState<string | null>(
    null,
  )

  const [controlContextMenu, setControlContextMenu] =
useState<{
    controlId: string
    x: number
    y: number
  } | null>(null)

  const controlDefinitions =
    getControlDefinitions()

  const selectedControl =
    useMemo(
      () =>
        controls.find(
          (control) =>
            control.id ===
            selectedControlId,
        ) ?? null,
      [
        controls,
        selectedControlId,
      ],
    )

  function handleAddControl() {
    const definition =
      controlDefinitions.find(
        (candidate) =>
          candidate.type ===
          selectedControlType,
      )

    if (!definition) {
      return
    }

    const control:
      EquipmentControl = {
        id:
          crypto.randomUUID(),

        ...definition.createDefault(),
      }

    onControlsChange([
      ...controls,
      control,
    ])

    setSelectedControlId(
      control.id,
    )
  }

  function handleDeleteControl(controlId: string) {
  onControlsChange(
    controls.filter(
      (control) => control.id !== controlId,
    ),
  )

  if (selectedControlId === controlId) {
    setSelectedControlId(null)
  }

  setControlContextMenu(null)
}

  function handleUpdateSelectedControl(
    changes: Partial<EquipmentControl>,
    ) {
    if (!selectedControl) {
        return
    }

    onControlsChange(
    controls.map(
        (control) =>
            control.id === selectedControl.id
            ? {
              ...control,
              ...changes,
            }
          : control,
        ),
    )
  }

  return (
    <div 
        className="equipment-project-workspace"
        onPointerDown={() =>
        setControlContextMenu(null)
        }
    >
      <aside className="equipment-inspector">
        <div className="equipment-panel-header">
          Inspector
        </div>

        {selectedControl ? (
  <div className="equipment-control-inspector">
    <label>
      Name
    </label>

    <input
      type="text"
      value={
        selectedControl.name
      }
      onChange={(event) =>
        handleUpdateSelectedControl({
          name:
            event.target.value,
        })
      }
    />

    <label>
      Target
    </label>

    <select
      value={
        selectedControl.targetFeatureId ??
        ''
      }
      onChange={(event) =>
        handleUpdateSelectedControl({
          targetFeatureId:
            event.target.value ||
            undefined,
        })
      }
    >
      <option value="">
        Select Room Feature...
      </option>

      {room?.devices.map(
        (placement) => (
          <option
            key={placement.id}
            value={placement.id}
          >
            {placement.name}
          </option>
        ),
      )}
    </select>

    <span className="equipment-control-type">
      Type: {selectedControl.type}
    </span>

    <button
  type="button"
  disabled={
    !selectedControl.targetFeatureId
  }
  onClick={() => {
    onTestControl(
      selectedControl,
    )
  }}
>
  Test
</button>
  </div>
) : (
          <div className="equipment-inspector-empty">
            Select a Control to inspect it.
          </div>
        )}
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
                        key={
                          placement.id
                        }
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
          <div className="equipment-panel-header equipment-controls-header">
  <span>
    Controls
  </span>

  <div className="equipment-control-toolbar">
    <select
      value={
        selectedControlType
      }
      onChange={(event) =>
        setSelectedControlType(
          event.target
            .value as
            EquipmentControlType,
        )
      }
    >
      {controlDefinitions.map(
        (definition) => (
          <option
            key={
              definition.type
            }
            value={
              definition.type
            }
          >
            {definition.name}
          </option>
        ),
      )}
    </select>

    <button
      type="button"
      onClick={
        handleAddControl
      }
    >
      + Add
    </button>
  </div>
</div>

          {controls.length === 0 ? (
            <div className="equipment-control-tray-empty">
              No Controls have been added.
            </div>
          ) : (
            <div className="equipment-control-list">
              {controls.map(
  (control) => (
    <button
      key={control.id}
      type="button"
      className={
        control.id ===
        selectedControlId
          ? 'equipment-control-node selected'
          : 'equipment-control-node'
      }
      onClick={() =>
        setSelectedControlId(
          control.id,
        )
      }
      onContextMenu={(event) => {
  event.preventDefault()

  setSelectedControlId(
    control.id,
  )

  setControlContextMenu({
    controlId: control.id,
    x: event.clientX,
    y: event.clientY,
  })
}}
      title={control.name}
    >
      <span className="equipment-control-node-circle" />

      <span className="equipment-control-node-label">
        {control.name}
      </span>
    </button>
  ),
)}
            </div>
          )}
        </section>

        {controlContextMenu && (
  <div
    className="equipment-control-context-menu"
    style={{
      left: controlContextMenu.x,
      top: controlContextMenu.y,
    }}
  >
    <button
      type="button"
      onClick={() =>
        handleDeleteControl(
          controlContextMenu.controlId,
        )
      }
    >
      Delete Control
    </button>
  </div>
)}
      </div>
    </div>
  )
}

export default EquipmentWorkspace