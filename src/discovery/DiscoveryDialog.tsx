import {
  useEffect,
  useState,
} from 'react'

import {
  discoverDevices,
} from './DiscoveryCoordinator'

import type {
  DiscoveredDevice,
  ProviderDiscoveryState,
} from './DiscoveryTypes'

interface DiscoveryDialogProps {
  isOpen: boolean
  onClose: () => void
}

function DiscoveryDialog({
  isOpen,
  onClose,
}: DiscoveryDialogProps) {
  const [isScanning, setIsScanning] = useState(false)

  const [
    providerStates,
    setProviderStates,
  ] = useState<ProviderDiscoveryState[]>([])

  const [
    discoveredDevices,
    setDiscoveredDevices,
  ] = useState<DiscoveredDevice[]>([])

  const [
    scanCompleted,
    setScanCompleted,
  ] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      return
    }

    setIsScanning(false)
    setProviderStates([])
    setDiscoveredDevices([])
    setScanCompleted(false)
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  function handleBackdropPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  async function handleScan() {
    if (isScanning) {
      return
    }

    setIsScanning(true)
    setScanCompleted(false)
    setProviderStates([])
    setDiscoveredDevices([])

    try {
      const result = await discoverDevices(
        (providerState) => {
          setProviderStates((current) => {
            const existingIndex = current.findIndex(
              (state) =>
                state.providerId ===
                providerState.providerId,
            )

            if (existingIndex < 0) {
              return [
                ...current,
                providerState,
              ]
            }

            const next = [...current]
            next[existingIndex] = providerState

            return next
          })
        },
      )

      setProviderStates(result.providers)
      setDiscoveredDevices(result.devices)
      setScanCompleted(true)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div
      className="discovery-backdrop"
      role="presentation"
      onPointerDown={handleBackdropPointerDown}
    >
      <section
        className="discovery-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-dialog-title"
      >
        <header className="discovery-dialog-header">
          <div>
            <h2 id="discovery-dialog-title">
              Discover Devices
            </h2>

            <p>
              Scan the local network for devices supported
              by Equipment.
            </p>
          </div>

          <button
            type="button"
            className="discovery-close-button"
            aria-label="Close Discover Devices"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="discovery-dialog-content">
          {!isScanning &&
            !scanCompleted &&
            providerStates.length === 0 && (
              <div className="discovery-idle-state">
                <p>
                  Equipment will ask each available device
                  provider to search for compatible
                  hardware.
                </p>

                <button
                  type="button"
                  className="equipment-primary-button"
                  onClick={handleScan}
                >
                  Scan for Devices
                </button>
              </div>
            )}

          {(isScanning ||
            providerStates.length > 0) && (
            <div className="discovery-scan-state">
              <div className="discovery-scan-heading">
                <div>
                  <h3>
                    {isScanning
                      ? 'Scanning local network...'
                      : 'Scan complete'}
                  </h3>

                  <p>
                    Each provider searches independently
                    for devices it understands.
                  </p>
                </div>

                {isScanning && (
                  <span
                    className="discovery-spinner"
                    aria-label="Scanning"
                  />
                )}
              </div>

              <div className="discovery-provider-list">
                {providerStates.map((provider) => (
                  <div
                    className="discovery-provider"
                    key={provider.providerId}
                  >
                    <div>
                      <strong>
                        {provider.providerName}
                      </strong>

                      {provider.error && (
                        <p>
                          {provider.error}
                        </p>
                      )}
                    </div>

                    <span
                      className={
                        `discovery-provider-status ` +
                        `is-${provider.status}`
                      }
                    >
                      {formatProviderStatus(
                        provider.status,
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {scanCompleted &&
                discoveredDevices.length === 0 && (
                  <div className="discovery-no-results">
                    <h3>
                      No compatible devices found.
                    </h3>

                    <p>
                      Equipment did not receive any devices
                      from the currently available
                      providers.
                    </p>
                  </div>
                )}

              {discoveredDevices.length > 0 && (
                <div className="discovery-results">
                  <h3>
                    Discovered Devices
                  </h3>

                  <div className="discovery-device-list">
                    {discoveredDevices.map(
                      (device, index) => (
                        <article
                          className="discovery-device"
                          key={createDeviceKey(
                            device,
                            index,
                          )}
                        >
                          <div>
                            <h4>
                              {device.name}
                            </h4>

                            <div className="discovery-device-details">
                              {device.manufacturer && (
                                <span>
                                  {device.manufacturer}
                                </span>
                              )}

                              {device.model && (
                                <span>
                                  {device.model}
                                </span>
                              )}

                              {device.address && (
                                <span>
                                  {device.address}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="equipment-secondary-button"
                            disabled
                            title="Device registration will be added after discovery."
                          >
                            Add Device
                          </button>
                        </article>
                      ),
                    )}
                  </div>
                </div>
              )}

              {!isScanning && (
                <div className="discovery-rescan">
                  <button
                    type="button"
                    className="equipment-primary-button"
                    onClick={handleScan}
                  >
                    Scan Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="discovery-dialog-footer">
          <div>
            <span>
              Can't find your device?
            </span>

            <button
              type="button"
              className="equipment-link-button"
              disabled
            >
              Add Manually...
            </button>
          </div>

          <button
            type="button"
            className="equipment-secondary-button"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  )
}

function formatProviderStatus(
  status: ProviderDiscoveryState['status'],
): string {
  switch (status) {
    case 'idle':
      return 'Waiting'

    case 'scanning':
      return 'Searching...'

    case 'completed':
      return 'Complete'

    case 'failed':
      return 'Failed'
  }
}

function createDeviceKey(
  device: DiscoveredDevice,
  index: number,
): string {
  return [
    device.providerId,
    device.providerDeviceId ??
      device.address ??
      device.name,
    index,
  ].join(':')
}

export default DiscoveryDialog