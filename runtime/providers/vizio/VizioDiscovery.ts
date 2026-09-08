import dgram from 'node:dgram'

const SSDP_ADDRESS =
  '239.255.255.250'

const SSDP_PORT = 1900

const DISCOVERY_TIMEOUT_MS =
  4000

const SEARCH_TARGETS = [
  'urn:schemas-kinoma-com:device:shell:1',
  'urn:dial-multiscreen-org:device:dial:1',
]

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

      const responses =
        new Map<
          string,
          {
            address: string
            usn?: string
            location?: string
          }
        >()

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

          const key =
            usn ??
            location ??
            remote.address

          responses.set(
            key,
            {
              address:
                remote.address,

              usn,

              location,
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
          for (
            const target
            of SEARCH_TARGETS
          ) {
            socket.send(
              createSearchMessage(
                target,
              ),
              SSDP_PORT,
              SSDP_ADDRESS,
            )
          }

          setTimeout(
            async () => {
              socket.close()

              const devices:
                VizioDiscoveredDevice[] =
                  []

              for (
                const response
                of responses.values()
              ) {
                const metadata =
                  response.location
                    ? await readDeviceDescription(
                        response.location,
                      )
                    : null

                if (
                  metadata &&
                  metadata.manufacturer &&
                  metadata.manufacturer
                    .toUpperCase() !==
                    'VIZIO'
                ) {
                  continue
                }

                /*
                 * DIAL responses give us
                 * reliable manufacturer
                 * metadata. The older
                 * VIZIO-specific response
                 * may not.
                 */
                if (
                  !metadata &&
                  !response.usn
                ) {
                  continue
                }

                devices.push({
                  providerDeviceId:
                    response.usn,

                  name:
                    metadata
                      ?.friendlyName ??
                    'VIZIO Smart TV',

                  manufacturer:
                    'VIZIO',

                  model:
                    metadata
                      ?.modelName,

                  address:
                    response.address,

                  /*
                   * Modern SmartCast API
                   * port. Pairing can later
                   * fall back to 9000 if
                   * necessary.
                   */
                  apiPort:
                    7345,
                })
              }

              resolve(
                deduplicateDevices(
                  devices,
                ),
              )
            },
            DISCOVERY_TIMEOUT_MS,
          )
        },
      )
    },
  )
}

function createSearchMessage(
  target: string,
): Buffer {
  return Buffer.from(
    [
      'M-SEARCH * HTTP/1.1',
      `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
      'MAN: "ssdp:discover"',
      'MX: 2',
      `ST: ${target}`,
      '',
      '',
    ].join('\r\n'),
  )
}

async function readDeviceDescription(
  location: string,
): Promise<{
  friendlyName?: string
  manufacturer?: string
  modelName?: string
} | null> {
  try {
    const response =
      await fetch(
        location,
      )

    if (!response.ok) {
      return null
    }

    const xml =
      await response.text()

    return {
      friendlyName:
        readXmlValue(
          xml,
          'friendlyName',
        ),

      manufacturer:
        readXmlValue(
          xml,
          'manufacturer',
        ),

      modelName:
        readXmlValue(
          xml,
          'modelName',
        ),
    }
  } catch {
    return null
  }
}

function readXmlValue(
  xml: string,
  tag: string,
): string | undefined {
  const pattern =
    new RegExp(
      `<${tag}[^>]*>([^<]+)</${tag}>`,
      'i',
    )

  const match =
    xml.match(pattern)

  return match?.[1]?.trim()
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
        .slice(
          prefix.length,
        )
        .trim()
    }
  }

  return undefined
}

function deduplicateDevices(
  devices:
    VizioDiscoveredDevice[],
): VizioDiscoveredDevice[] {
  const unique =
    new Map<
      string,
      VizioDiscoveredDevice
    >()

  for (
    const device
    of devices
  ) {
    const key =
      device.providerDeviceId ??
      device.address

    const existing =
      unique.get(key)

    if (!existing) {
      unique.set(
        key,
        device,
      )

      continue
    }

    unique.set(
      key,
      {
        ...existing,
        ...device,

        name:
          device.name !==
          'VIZIO Smart TV'
            ? device.name
            : existing.name,

        model:
          device.model ??
          existing.model,
      },
    )
  }

  return [
    ...unique.values(),
  ]
}