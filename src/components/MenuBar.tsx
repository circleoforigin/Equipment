import {
  useEffect,
  useRef,
  useState,
} from 'react'

type MenuId =
  | 'project'
  | 'rooms'
  | 'devices'
  | 'settings'

interface MenuBarProps {
  projectName?: string

  onNewProject: () => void
  onLoadProject: () => void
  onSaveProject: () => void
  onCloseProject: () => void
  onDeleteProject: () => void

  onSelectRoom: () => void
  onManageRooms: () => void

  onDiscoverDevices: () => void
  onShowDeviceRegistry: () => void
}

function MenuBar({
  projectName,

  onNewProject,
  onLoadProject,
  onSaveProject,
  onCloseProject,
  onDeleteProject,
  onSelectRoom,
  onManageRooms,
  onDiscoverDevices,
  onShowDeviceRegistry,
}: MenuBarProps) {
  const menuBarRef =
    useRef<HTMLDivElement>(null)

  const [
    openMenu,
    setOpenMenu,
  ] = useState<MenuId | null>(null)

  useEffect(() => {
    if (!openMenu) {
      return
    }

    function handleOutsidePointerDown(
      event: PointerEvent,
    ) {
      const target =
        event.target

      if (
        target instanceof Node &&
        !menuBarRef.current?.contains(target)
      ) {
        setOpenMenu(null)
      }
    }

    document.addEventListener(
      'pointerdown',
      handleOutsidePointerDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown,
      )
    }
  }, [openMenu])

  function toggleMenu(
    menu: MenuId,
  ) {
    setOpenMenu(
      (current) =>
        current === menu
          ? null
          : menu,
    )
  }

  function runMenuAction(
    action: () => void,
  ) {
    setOpenMenu(null)
    action()
  }

  return (
    <div
      ref={menuBarRef}
      className="menu-bar"
    >
      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={() =>
            toggleMenu('project')
          }
        >
          Project
        </button>

        {openMenu === 'project' && (
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onClick={() =>
                runMenuAction(
                  onNewProject,
                )
              }
            >
              New Project...
            </button>

            <button
              type="button"
              className="dropdown-item"
              onClick={() =>
                runMenuAction(
                  onLoadProject,
                )
              }
            >
              Load Project...
            </button>

            <div className="dropdown-separator" />

            <button
              type="button"
              className="dropdown-item"
              onClick={() =>
                runMenuAction(
                  onSaveProject,
                )
              }
            >
              Save Project
            </button>

            <button
              type="button"
              className="dropdown-item"
              disabled={!projectName}
              onClick={() =>
                runMenuAction(
                  onCloseProject,
                )
              }
            >
              Close Project
            </button>

            <div className="dropdown-separator" />

            <button
              type="button"
              className="dropdown-item"
              onClick={() =>
                runMenuAction(
                  onDeleteProject,
                )
              }
            >
              Delete Project...
            </button>
          </div>
        )}
      </div>

      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={() =>
            toggleMenu('rooms')
          }
        >
          Rooms
        </button>

        {openMenu === 'rooms' && (
          <div className="dropdown-menu">
            <button
  type="button"
  className="dropdown-item"
  disabled={!projectName}
  onClick={() =>
    runMenuAction(
      onSelectRoom,
    )
  }
>
  Select Room...
</button>

<button
  type="button"
  className="dropdown-item"
  onClick={() =>
    runMenuAction(
      onManageRooms,
    )
  }
>
  Manage Rooms...
</button>
          </div>
        )}
      </div>

      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={() =>
            toggleMenu('devices')
          }
        >
          Devices
        </button>

        {openMenu === 'devices' && (
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onClick={() =>
                runMenuAction(
                  onDiscoverDevices,
                )
              }
            >
              Discover Devices...
            </button>

            <div className="dropdown-separator" />

            <button
              type="button"
              className="dropdown-item"
              onClick={() =>
                runMenuAction(
                  onShowDeviceRegistry,
                )
              }
            >
              Device Registry
            </button>
          </div>
        )}
      </div>

      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={() =>
            toggleMenu('settings')
          }
        >
          Settings
        </button>

        {openMenu === 'settings' && (
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              disabled
            >
              Settings...
            </button>
          </div>
        )}
      </div>

      {projectName && (
        <div className="menu-project-name">
          {projectName}.proj
        </div>
      )}
    </div>
  )
}

export default MenuBar