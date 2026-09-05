import {
  useEffect,
  useRef,
  useState,
} from 'react'

type MenuId = 'project' | 'equipment' | 'settings'

interface MenuBarProps {
  onShowDeviceRegistry: () => void
}

function MenuBar({ onShowDeviceRegistry }: MenuBarProps) {
  const menuBarRef = useRef<HTMLDivElement>(null)
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null)

  useEffect(() => {
    if (!openMenu) return

    function handleOutsidePointerDown(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node &&
          !menuBarRef.current?.contains(target)) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown)
    }
  }, [openMenu])

  function toggleMenu(menu: MenuId) {
    setOpenMenu((current) => current === menu ? null : menu)
  }

  function showDeviceRegistry() {
    setOpenMenu(null)
    onShowDeviceRegistry()
  }

  return (
    <div ref={menuBarRef} className="menu-bar">
      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={() => toggleMenu('project')}
        >
          Project
        </button>

        {openMenu === 'project' && (
          <div className="dropdown-menu">
            <button type="button" className="dropdown-item" disabled>
              New Project...
            </button>
            <button type="button" className="dropdown-item" disabled>
              Load Project...
            </button>
          </div>
        )}
      </div>

      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={() => toggleMenu('equipment')}
        >
          Equipment
        </button>

        {openMenu === 'equipment' && (
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onClick={showDeviceRegistry}
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
          onClick={() => toggleMenu('settings')}
        >
          Settings
        </button>

        {openMenu === 'settings' && (
          <div className="dropdown-menu">
            <button type="button" className="dropdown-item" disabled>
              Settings...
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuBar
