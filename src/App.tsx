import './App.css'

import {
  useRef,
  useState,
} from 'react'
import {
  useDeviceRegistry,
} from './devices/useDeviceRegistry'
import MenuBar from './components/MenuBar'
import DiscoveryDialog from './discovery/DiscoveryDialog'

function App() {
  const registryRef = useRef<HTMLElement>(null)
  const [isDiscoveryOpen, setIsDiscoveryOpen] =
    useState(false)

  const {
    devices,
    isLoading,
    error,
  } = useDeviceRegistry()

  function openDiscovery() {
    setIsDiscoveryOpen(true)
  }

  function closeDiscovery() {
    setIsDiscoveryOpen(false)
  }

  function showDeviceRegistry() {
    registryRef.current?.scrollIntoView({
      behavior: 'smooth',
    })

    registryRef.current?.focus({
      preventScroll: true,
    })
  }

  return (
    <div className="equipment-app">
      <MenuBar
        onDiscoverDevices={openDiscovery}
        onShowDeviceRegistry={showDeviceRegistry}
      />

      <main className="equipment-content">
        <header className="equipment-header">
          <div>
            <p className="equipment-kicker">
              SettingForge Module
            </p>

            <h1>Equipment</h1>

            <p className="equipment-subtitle">
              Physical device connectivity, environments,
              roles, capabilities, and reactions.
            </p>
          </div>
        </header>

        <section
          ref={registryRef}
          className="equipment-section"
          tabIndex={-1}
        >
          <div className="equipment-section-heading">
            <div>
              <h2>Device Registry</h2>

              <p>
                Physical devices known to Equipment.
              </p>
            </div>

            {!isLoading && !error && (
              <span className="equipment-count">
                {devices.length}
              </span>
            )}
          </div>

          {isLoading && (
            <p className="equipment-status">
              Loading devices...
            </p>
          )}

          {error && (
            <div className="equipment-error">
              <strong>
                Device Registry could not be loaded.
              </strong>

              <p>
                {error}
              </p>
            </div>
          )}

          {!isLoading &&
            !error &&
            devices.length === 0 && (
              <div className="equipment-empty-state">
                <h3>No devices connected yet.</h3>

                <p>
                  Equipment is ready for its first
                  device provider.
                </p>
              </div>
            )}

          {!isLoading &&
            !error &&
            devices.length > 0 && (
              <div className="equipment-device-list">
                {devices.map((device) => (
                  <article
                    className="equipment-device"
                    key={device.id}
                  >
                    <div>
                      <h3>
                        {device.name}
                      </h3>

                      <p>
                        Provider: {device.providerId}
                      </p>
                    </div>

                    <div className="equipment-capabilities">
                      {device.capabilities.map(
                        (capability) => (
                          <span
                            className="equipment-capability"
                            key={capability.id}
                          >
                            {capability.name}
                          </span>
                        ),
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>
      </main>

      <DiscoveryDialog
        isOpen={isDiscoveryOpen}
        onClose={closeDiscovery}
      />
    </div>
  )
}

export default App