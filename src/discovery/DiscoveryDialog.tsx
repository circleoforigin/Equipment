import {
  useEffect,
  useState,
} from 'react'

import {
  getRegisteredDevices,
  registerDevice,
  type RegisteredDevice,
} from '../runtime/EquipmentRuntimeClient'

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
  const [isScanning, setIsScanning] =
    useState(false)

  const [
    providerStates,
    setProviderStates,
  ] = useState<
    ProviderDiscoveryState[]
  >([])

  const [
    discoveredDevices,
    setDiscoveredDevices,
  ] = useState<
    DiscoveredDevice[]
  >([])

  const [
    registeredDevices,
    setRegisteredDevices,
  ] = useState<
    RegisteredDevice[]
  >([])

  const [
    scanCompleted,
    setScanCompleted,
  ] = useState(false)

  const [
    registeringDeviceKey,
    setRegisteringDeviceKey,
  ] = useState<
    string | null
  >(null)

  const [
    registrationMessages,
    setRegistrationMessages,
  ] = useState<
    Record<string, string>
  >({})

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    isOpen,
    onClose,
  ])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void loadRegisteredDevices()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      return
    }

    setIsScanning(false)
    setProviderStates([])
    setDiscoveredDevices([])
    setRegisteredDevices([])
    setScanCompleted(false)
    setRegisteringDeviceKey(null)
    setRegistrationMessages({})
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  async function loadRegisteredDevices() {
    try {
      const devices =
        await getRegisteredDevices()

      setRegisteredDevices(
        devices,
      )
    } catch (error) {
      console.error(
        'Unable to load registered Equipment devices:',
        error,
      )
    }
  }

  function handleBackdropPointerDown(
    event:
      React.PointerEvent<
        HTMLDivElement
      >,
  ) {
    if (
      event.target ===
      event.currentTarget
    ) {
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
    setRegisteringDeviceKey(null)
    setRegistrationMessages({})

    try {
      const result =
        await discoverDevices(
          (providerState) => {
            setProviderStates(
              (current) => {
                const existingIndex =
                  current.findIndex(
                    (state) =>
                      state.providerId ===
                      providerState.providerId,
                  )

                if (
                  existingIndex < 0
                ) {
                  return [
                    ...current,
                    providerState,
                  ]
                }

                const next =
                  [...current]

                next[
                  existingIndex
                ] =
                  providerState

                return next
              },
            )
          },
        )

      setProviderStates(
        result.providers,
      )

      setDiscoveredDevices(
        result.devices,
      )

      setScanCompleted(true)
    } finally {
      setIsScanning(false)
    }
  }

  async function handleRegisterDevice(
    device: DiscoveredDevice,
    index: number,
  ) {
    const deviceKey =
      createDeviceKey(
        device,
        index,
      )

    if (
      registeringDeviceKey !==
      null
    ) {
      return
    }

    setRegisteringDeviceKey(
      deviceKey,
    )

    setRegistrationMessages(
      (current) => ({
        ...current,
        [deviceKey]:
          'Adding device to Equipment...',
      }),
    )

    try {
      const registered =
        await registerDevice({
          providerId:
            device.providerId,

          providerDeviceId:
            device.providerDeviceId,

          name:
            device.name,

          manufacturer:
            device.manufacturer,

          model:
            device.model,

          address:
            device.address,
        })

      setRegisteredDevices(
        (current) => {
          const existingIndex =
            current.findIndex(
              (candidate) =>
                candidate.id ===
                registered.id,
            )

          if (
            existingIndex >= 0
          ) {
            const next =
              [...current]

            next[
              existingIndex
            ] =
              registered

            return next
          }

          return [
            ...current,
            registered,
          ]
        },
      )

      setRegistrationMessages(
        (current) => ({
          ...current,
          [deviceKey]:
            'Device added to Equipment.',
        }),
      )
    } catch (error) {
      setRegistrationMessages(
        (current) => ({
          ...current,
          [deviceKey]:
            error instanceof Error
              ? error.message
              : 'Unable to add device.',
        }),
      )
    } finally {
      setRegisteringDeviceKey(
        null,
      )
    }
  }

  return (
    <div
      className="discovery-backdrop"
      role="presentation"
      onPointerDown={
        handleBackdropPointerDown
      }
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
              Scan the local network for
              devices supported by
              Equipment.
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
            providerStates.length ===
              0 && (
              <div className="discovery-idle-state">
                <p>
                  Equipment will ask each
                  available device provider
                  to search for compatible
                  hardware.
                </p>

                <button
                  type="button"
                  className="equipment-primary-button"
                  onClick={
                    handleScan
                  }
                >
                  Scan for Devices
                </button>
              </div>
            )}

          {(isScanning ||
            providerStates.length >
              0) && (
            <div className="discovery-scan-state">
              <div className="discovery-scan-heading">
                <div>
                  <h3>
                    {isScanning
                      ? 'Scanning local network...'
                      : 'Scan complete'}
                  </h3>

                  <p>
                    Each provider searches
                    independently for
                    devices it understands.
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
                {providerStates.map(
                  (provider) => (
                    <div
                      className="discovery-provider"
                      key={
                        provider.providerId
                      }
                    >
                      <div>
                        <strong>
                          {
                            provider.providerName
                          }
                        </strong>

                        {provider.error && (
                          <p>
                            {
                              provider.error
                            }
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
                  ),
                )}
              </div>

              {scanCompleted &&
                discoveredDevices.length ===
                  0 && (
                  <div className="discovery-no-results">
                    <h3>
                      No compatible
                      devices found.
                    </h3>

                    <p>
                      Equipment did not
                      receive any devices
                      from the currently
                      available providers.
                    </p>
                  </div>
                )}

              {discoveredDevices.length >
                0 && (
                <div className="discovery-results">
                  <h3>
                    Discovered Devices
                  </h3>

                  <div className="discovery-device-list">
                    {discoveredDevices.map(
                      (
                        device,
                        index,
                      ) => {
                        const deviceKey =
                          createDeviceKey(
                            device,
                            index,
                          )

                        const registered =
                          findRegisteredDevice(
                            registeredDevices,
                            device,
                          )

                        const isRegistering =
                          registeringDeviceKey ===
                          deviceKey

                        return (
                          <article
                            className="discovery-device"
                            key={
                              deviceKey
                            }
                          >
                            <div>
                              <h4>
                                {
                                  device.name
                                }
                              </h4>

                              <div className="discovery-device-details">
                                {device.manufacturer && (
                                  <span>
                                    {
                                      device.manufacturer
                                    }
                                  </span>
                                )}

                                {device.model && (
                                  <span>
                                    {
                                      device.model
                                    }
                                  </span>
                                )}

                                {device.address && (
                                  <span>
                                    {
                                      device.address
                                    }
                                  </span>
                                )}
                              </div>

                              {registered && (
                                <p>
                                  Registered
                                  with
                                  Equipment
                                </p>
                              )}

                              {registrationMessages[
                                deviceKey
                              ] && (
                                <p>
                                  {
                                    registrationMessages[
                                      deviceKey
                                    ]
                                  }
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              className="equipment-secondary-button"
                              disabled={
                                registered !==
                                  undefined ||
                                registeringDeviceKey !==
                                  null
                              }
                              onClick={() =>
                                void handleRegisterDevice(
                                  device,
                                  index,
                                )
                              }
                            >
                              {registered
                                ? 'Added'
                                : isRegistering
                                  ? 'Adding...'
                                  : 'Add Device'}
                            </button>
                          </article>
                        )
                      },
                    )}
                  </div>
                </div>
              )}

              {!isScanning && (
                <div className="discovery-rescan">
                  <button
                    type="button"
                    className="equipment-primary-button"
                    onClick={
                      handleScan
                    }
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
  status:
    ProviderDiscoveryState[
      'status'
    ],
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

function findRegisteredDevice(
  registeredDevices:
    RegisteredDevice[],
  discoveredDevice:
    DiscoveredDevice,
): RegisteredDevice | undefined {
  if (
    discoveredDevice.providerDeviceId
  ) {
    const byProviderIdentity =
      registeredDevices.find(
        (device) =>
          device.providerId ===
            discoveredDevice.providerId &&
          device.providerDeviceId ===
            discoveredDevice.providerDeviceId,
      )

    if (byProviderIdentity) {
      return byProviderIdentity
    }
  }

  if (
    discoveredDevice.address
  ) {
    return registeredDevices.find(
      (device) =>
        device.providerId ===
          discoveredDevice.providerId &&
        device.address ===
          discoveredDevice.address,
    )
  }

  return undefined
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