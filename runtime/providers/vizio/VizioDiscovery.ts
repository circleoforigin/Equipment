import dgram from 'node:dgram'

const SSDP_ADDRESS =
  '239.255.255.250'

const SSDP_PORT = 1900

const VIZIO_SEARCH_TARGET =
  'urn:schemas-kinoma-com:device:shell:1'

const DISCOVERY_TIMEOUT_MS = 3000

export interface VizioDiscoveredDevice {
  providerDeviceId?: string
  name: string
  manufacturer: 'VIZIO'
  model?: string
  address: string
  apiPort: number
}

export async function discoverVizioDevices():
  Promise<VizioDiscoveredDevice[]> {
  return new Promise(
    (resolve, reject) => {
      const socket =
        dgram.createSocket('udp4')

      const devices =
        new Map<
          string,
          VizioDiscoveredDevice
        >()

      const searchMessage =
        Buffer.from(
          [
            'M-SEARCH * HTTP/1.1',
            `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
            'MAN: "ssdp:discover"',
            'MX: 2',
            `ST: ${VIZIO_SEARCH_TARGET}`,
            '',
            '',
          ].join('\r\n'),
        )

      socket.on(
        'message',
        (
          message,
          remote,
        ) => {
          const response =
            message.toString('utf8')

          const usn =
            getHeader(
              response,
              'usn',
            )

          const location =
            getHeader(
              response,
              'location',
            )

          const apiPort =
            getPortFromLocation(
              location,
            ) ?? 7345

          const key =
            usn ??
            `${remote.address}:${apiPort}`

          devices.set(
            key,
            {
              providerDeviceId:
                usn,
              name:
                'VIZIO Smart TV',
              manufacturer:
                'VIZIO',
              address:
                remote.address,
              apiPort,
            },
          )
        },
      )

      socket.once(
        'error',
        (error) => {
          socket.close()
          reject(error)
        },
      )

      socket.bind(
        () => {
          socket.send(
            searchMessage,
            SSDP_PORT,
            SSDP_ADDRESS,
          )

          setTimeout(
            () => {
              socket.close()

              resolve(
                [...devices.values()],
              )
            },
            DISCOVERY_TIMEOUT_MS,
          )
        },
      )
    },
  )
}

function getHeader(
  message: string,
  name: string,
): string | undefined {
  const prefix =
    `${name.toLowerCase()}:`

  for (
    const line
    of message.split(/\r?\n/)
  ) {
    if (
      line
        .toLowerCase()
        .startsWith(prefix)
    ) {
      return line
        .slice(prefix.length)
        .trim()
    }
  }

  return undefined
}

function getPortFromLocation(
  location:
    string | undefined,
): number | undefined {
  if (!location) {
    return undefined
  }

  try {
    const url =
      new URL(location)

    if (!url.port) {
      return undefined
    }

    const port =
      Number.parseInt(
        url.port,
        10,
      )

    return Number.isFinite(port)
      ? port
      : undefined
  } catch {
    return undefined
  }
}