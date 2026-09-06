import type {
  RegisteredDevice,
} from '../runtime/EquipmentRuntimeClient'

interface DeviceRegistryDialogProps {
  isOpen: boolean
  devices: RegisteredDevice[]
  isLoading: boolean
  error: string | null
  onClose: () => void
  onRemoveDevice: (
    id: string,
    name: string,
  ) => void
}

function DeviceRegistryDialog({
  isOpen,
  devices,
  isLoading,
  error,
  onClose,
  onRemoveDevice,
}: DeviceRegistryDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog device-registry-dialog">
        <h2>
          Device Registry
        </h2>

        {isLoading && (
          <p>
            Loading devices...
          </p>
        )}

        {error && (
          <p className="equipment-error-text">
            {error}
          </p>
        )}

        {!isLoading &&
          !error &&
          devices.length === 0 && (
            <p>
              No devices registered.
            </p>
          )}

        {!isLoading &&
          !error &&
          devices.length > 0 && (
            <div className="device-registry-list">
              {devices.map(
                (device) => (
                  <div
                    key={device.id}
                    className="device-registry-item"
                  >
                    <div>
                      <strong>
                        {device.name}
                      </strong>

                      <div className="device-registry-details">
                        <span>
                          Provider: {device.providerId}
                        </span>

                        {device.manufacturer && (
                          <span>
                            Manufacturer: {device.manufacturer}
                          </span>
                        )}

                        {device.model && (
                          <span>
                            Model: {device.model}
                          </span>
                        )}

                        {device.address && (
                          <span>
                            Address: {device.address}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onRemoveDevice(
                          device.id,
                          device.name,
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

        <div className="dialog-buttons">
          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeviceRegistryDialog