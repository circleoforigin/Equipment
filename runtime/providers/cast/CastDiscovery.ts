import {
  Bonjour,
  type Service,
} from 'bonjour-service'

const DISCOVERY_TIMEOUT_MS =
  5000

export interface CastDiscoveredDevice {
  providerDeviceId?: string
  name: string
  model?: string
  address: string
  port: number
}

export async function discoverCastDevices():
  Promise<CastDiscoveredDevice[]> {
  return new Promise(
    (resolve) => {
      const bonjour =
        new Bonjour(
          undefined,
          (error: Error) => {
            console.error(
              'Cast mDNS error:',
              error,
            )
          },
        )

      const devices =
        new Map<
          string,
          CastDiscoveredDevice
        >()

      const browser =
        bonjour.find({
          type: 'googlecast',
          protocol: 'tcp',
        })

      browser.on(
        'up',
        (service: Service) => {
          const address =
            getIPv4Address(
              service,
            )

          if (!address) {
            return
          }

          const txt =
            service.txt ??
            {}

          const id =
            readTxtString(
              txt.id,
            )

          const name =
            readTxtString(
              txt.fn,
            ) ??
            service.name ??
            'Google Cast Device'

          const model =
            readTxtString(
              txt.md,
            )

          const key =
            id ??
            `${address}:${service.port}`

          devices.set(
            key,
            {
              providerDeviceId:
                id,

              name,

              model,

              address,

              port:
                service.port,
            },
          )

          console.log(
            'Cast device discovered:',
            {
              name,
              model,
              address,
              port:
                service.port,
              id,
            },
          )
        },
      )

      setTimeout(
        () => {
          browser.stop()
          bonjour.destroy()

          resolve([
            ...devices.values(),
          ])
        },
        DISCOVERY_TIMEOUT_MS,
      )
    },
  )
}

function getIPv4Address(
  service: Service,
): string | undefined {
  for (
    const address
    of service.addresses ?? []
  ) {
    if (
      /^\d{1,3}(?:\.\d{1,3}){3}$/
        .test(address)
    ) {
      return address
    }
  }

  return undefined
}

function readTxtString(
  value: unknown,
): string | undefined {
  if (
    typeof value === 'string' &&
    value.length > 0
  ) {
    return value
  }

  if (
    Buffer.isBuffer(value)
  ) {
    const text =
      value.toString('utf8')

    return text.length > 0
      ? text
      : undefined
  }

  return undefined
}