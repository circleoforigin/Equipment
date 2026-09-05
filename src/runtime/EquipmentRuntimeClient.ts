const DEFAULT_RUNTIME_URL =
  'http://127.0.0.1:3012'

const runtimeUrl =
  import.meta.env.VITE_EQUIPMENT_RUNTIME_URL ??
  DEFAULT_RUNTIME_URL

export interface EquipmentRuntimeHealth {
  service: 'equipment-runtime'
  status: 'ok'
  version: string
}

export interface SamsungRuntimeDevice {
  providerDeviceId?: string
  name: string
  manufacturer?: string
  model?: string
  address?: string
}

export async function getRuntimeHealth():
  Promise<EquipmentRuntimeHealth> {
  const response = await fetch(
    `${runtimeUrl}/health`,
  )

  if (!response.ok) {
    throw new Error(
      `Equipment runtime returned HTTP ${response.status}.`,
    )
  }

  const body =
    await response.json() as unknown

  if (!isRuntimeHealth(body)) {
    throw new Error(
      'Equipment runtime returned an invalid health response.',
    )
  }

  return body
}

export async function discoverSamsungDevices():
  Promise<SamsungRuntimeDevice[]> {
  const response = await fetch(
    `${runtimeUrl}/providers/samsung/discover`,
  )

  if (!response.ok) {
    throw new Error(
      `Samsung discovery returned HTTP ${response.status}.`,
    )
  }

  const body =
    await response.json() as unknown

  if (
    typeof body !== 'object' ||
    body === null
  ) {
    throw new Error(
      'Samsung discovery returned an invalid response.',
    )
  }

  const candidate =
    body as Record<string, unknown>

  if (!Array.isArray(candidate.devices)) {
    throw new Error(
      'Samsung discovery response did not contain a device list.',
    )
  }

  const devices:
    SamsungRuntimeDevice[] = []

  for (const value of candidate.devices) {
    if (!isSamsungRuntimeDevice(value)) {
      throw new Error(
        'Samsung discovery returned an invalid device.',
      )
    }

    devices.push(value)
  }

  return devices
}

function isRuntimeHealth(
  value: unknown,
): value is EquipmentRuntimeHealth {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const candidate =
    value as Record<string, unknown>

  return (
    candidate.service ===
      'equipment-runtime' &&
    candidate.status === 'ok' &&
    typeof candidate.version ===
      'string'
  )
}

function isSamsungRuntimeDevice(
  value: unknown,
): value is SamsungRuntimeDevice {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const candidate =
    value as Record<string, unknown>

  return (
    typeof candidate.name ===
      'string' &&
    optionalString(
      candidate.providerDeviceId,
    ) &&
    optionalString(
      candidate.manufacturer,
    ) &&
    optionalString(
      candidate.model,
    ) &&
    optionalString(
      candidate.address,
    )
  )
}

function optionalString(
  value: unknown,
): boolean {
  return (
    value === undefined ||
    typeof value === 'string'
  )
}