import keytar from '@github/keytar'

import WebSocket, {
  type RawData,
} from 'ws'

const SAMSUNG_REMOTE_PORT = 8002
const CONNECTION_TIMEOUT_MS = 30000

const CREDENTIAL_SERVICE =
  'SettingForge Equipment Samsung'

const CLIENT_NAME =
  Buffer.from(
    'SettingForge Equipment',
    'utf8',
  ).toString('base64')

interface SamsungConnectMessage {
  event?: unknown
  data?: {
    token?: unknown
  }
}

export interface SamsungMenuTestResult {
  connected: boolean
  authorized: boolean
  tokenReceived: boolean
}

export async function testSamsungMenu(
  address: string,
): Promise<SamsungMenuTestResult> {
  const existingToken =
    await getStoredToken(address)

  const token =
    await connectAndSendKey(
      address,
      'KEY_MENU',
      existingToken,
    )

  if (
    token &&
    token !== existingToken
  ) {
    await storeToken(
      address,
      token,
    )
  }

  return {
    connected: true,
    authorized: true,
    tokenReceived:
      token !== undefined,
  }
}

async function getStoredToken(
  address: string,
): Promise<string | undefined> {
  const token =
    await keytar.getPassword(
      CREDENTIAL_SERVICE,
      createCredentialAccount(
        address,
      ),
    )

  return token ?? undefined
}

async function storeToken(
  address: string,
  token: string,
): Promise<void> {
  await keytar.setPassword(
    CREDENTIAL_SERVICE,
    createCredentialAccount(
      address,
    ),
    token,
  )
}

function createCredentialAccount(
  address: string,
): string {
  return `samsung:${address}`
}

function connectAndSendKey(
  address: string,
  key: string,
  token?: string,
): Promise<string | undefined> {
  return new Promise(
    (resolve, reject) => {
      const url =
        createRemoteUrl(
          address,
          token,
        )

      const socket =
        new WebSocket(
          url,
          {
            rejectUnauthorized: false,
            handshakeTimeout:
              CONNECTION_TIMEOUT_MS,
          },
        )

      let settled = false

      const timeout =
        setTimeout(
          () => {
            fail(
              new Error(
                'Timed out waiting for Samsung TV authorization.',
              ),
            )
          },
          CONNECTION_TIMEOUT_MS,
        )

      function succeed(
        receivedToken?: string,
      ): void {
        if (settled) {
          return
        }

        settled = true

        clearTimeout(timeout)

        try {
          socket.close()
        } catch {
          // Socket may already be closed.
        }

        resolve(
          receivedToken ?? token,
        )
      }

      function fail(
        error: Error,
      ): void {
        if (settled) {
          return
        }

        settled = true

        clearTimeout(timeout)

        try {
          socket.close()
        } catch {
          // Socket may already be closed.
        }

        reject(error)
      }

      socket.on(
        'message',
        (data: RawData) => {
          const message =
            parseConnectMessage(
              data,
            )

          if (!message) {
            return
          }

          if (
            message.event !==
            'ms.channel.connect'
          ) {
            return
          }

          const receivedToken =
            typeof message.data
              ?.token === 'string'
              ? message.data.token
              : undefined

          sendRemoteKey(
            socket,
            key,
          )

          setTimeout(
            () => {
              succeed(
                receivedToken,
              )
            },
            300,
          )
        },
      )

      socket.on(
        'error',
        (error) => {
          fail(
            error instanceof Error
              ? error
              : new Error(
                  'Samsung WebSocket connection failed.',
                ),
          )
        },
      )

      socket.on(
        'close',
        () => {
          if (!settled) {
            fail(
              new Error(
                'Samsung TV closed the connection before authorization completed.',
              ),
            )
          }
        },
      )
    },
  )
}

function createRemoteUrl(
  address: string,
  token?: string,
): string {
  const parameters =
    new URLSearchParams({
      name: CLIENT_NAME,
    })

  if (token) {
    parameters.set(
      'token',
      token,
    )
  }

  return (
    `wss://${address}:` +
    `${SAMSUNG_REMOTE_PORT}` +
    '/api/v2/channels/' +
    'samsung.remote.control?' +
    parameters.toString()
  )
}

function sendRemoteKey(
  socket: WebSocket,
  key: string,
): void {
  socket.send(
    JSON.stringify({
      method:
        'ms.remote.control',

      params: {
        Cmd: 'Click',
        DataOfCmd: key,
        Option: 'false',
        TypeOfRemote:
          'SendRemoteKey',
      },
    }),
  )
}

function parseConnectMessage(
  data: RawData,
): SamsungConnectMessage | null {
  try {
    const value =
      JSON.parse(
        data.toString(),
      ) as unknown

    if (
      typeof value !== 'object' ||
      value === null
    ) {
      return null
    }

    return (
      value as
        SamsungConnectMessage
    )
  } catch {
    return null
  }
}