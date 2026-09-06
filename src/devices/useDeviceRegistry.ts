import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  getRegisteredDevices,
  type RegisteredDevice,
} from '../runtime/EquipmentRuntimeClient'

export function useDeviceRegistry() {
  const [
    devices,
    setDevices,
  ] = useState<
    RegisteredDevice[]
  >([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const reload =
    useCallback(
      async () => {
        setIsLoading(true)
        setError(null)

        try {
          const loadedDevices =
            await getRegisteredDevices()

          setDevices(
            loadedDevices,
          )
        } catch (loadError) {
          console.error(
            '[Equipment] Failed to load Device Registry.',
            loadError,
          )

          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load Device Registry.',
          )
        } finally {
          setIsLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    devices,
    isLoading,
    error,
    reload,
  }
}