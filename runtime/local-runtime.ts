import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http'

import {
  getRegisteredDevices,
  registerDevice,
  removeRegisteredDevice,
  type RegisterDeviceInput,
} from './devices/DeviceRegistry.js'

import {
  registerMediaFile,
  startMediaServer,
} from './media/MediaServer.js'

import {
  prepareDisplayImage,
} from './media/ImageProcessor.js'

import {
  resolve,
} from 'node:path'

import {
  discoverSamsungDevices,
} from './providers/samsung/SamsungDiscovery.js'

import {
  connectSamsung,
} from './providers/samsung/SamsungRemote.js'

import {
  displaySamsungImage,
} from './providers/samsung/SamsungDisplay.js'

import {
  discoverVizioDevices,
} from './providers/vizio/VizioDiscovery.js'

import {
  completeVizioPairing,
  connectVizio,
  type VizioPairingChallenge,
} from './providers/vizio/VizioRemote.js'

import {
  discoverCastDevices,
} from './providers/cast/CastDiscovery.js'

const HOST = '127.0.0.1'

const PORT = Number.parseInt(
  process.env.EQUIPMENT_RUNTIME_PORT ?? '3012',
  10,
)

interface HealthResponse {
  service: 'equipment-runtime'
  status: 'ok'
  version: string
}

const server = createServer(
  async (
    request: IncomingMessage,
    response: ServerResponse,
  ) => {
    if (
      request.method === 'GET' &&
      request.url === '/health'
    ) {      
      sendJson(
        response,
        200,
        {
          service: 'equipment-runtime',
          status: 'ok',
          version: '0.1.0',
        } satisfies HealthResponse,
      )

      return
    }

    if (
  request.method === 'POST' &&
  request.url ===
    '/media/test/display-image'
) {
  try {
    const testImagePath =
  resolve(
    process.cwd(),
    'runtime',
    'media',
    'assets',
    'display-image-test.png',
  )

    const preparedImagePath =
      await prepareDisplayImage({
        sourcePath:
          testImagePath,
      })

    const imageUrl =
      registerMediaFile(
        preparedImagePath,
      )

    sendJson(
      response,
      200,
      {
        imageUrl,
      },
    )
  } catch (error) {
    console.error(
      'Unable to register Display Image test media:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to register test media.',
      },
    )
  }

  return
}

    if (
      request.method === 'GET' &&
      request.url === '/devices'
    ) {
      try {
        const devices =
          await getRegisteredDevices()

        sendJson(
          response,
          200,
          {
            devices,
          },
        )
      } catch (error) {
        console.error(
          'Failed to read Equipment device registry:',
          error,
        )

        sendJson(
          response,
          500,
          {
            error:
              error instanceof Error
                ? error.message
                : 'Failed to read Equipment device registry.',
          },
        )
      }

      return
    }

    if (
      request.method === 'POST' &&
      request.url === '/devices'
      ) {
      try {
        const body =
          await readJsonBody(
            request,
          )

        const input =
          parseRegisterDeviceInput(
            body,
          )

        if (!input) {
          sendJson(
            response,
            400,
            {
              error:
                'Device registration request is invalid.',
            },
          )

          return
        }

        const device =
          await registerDevice(
            input,
          )

        sendJson(
          response,
          200,
          {
            device,
          },
        )
      } catch (error) {
        console.error(
          'Failed to register Equipment device:',
          error,
        )

        sendJson(
          response,
          500,
          {
            error:
              error instanceof Error
                ? error.message
                : 'Failed to register Equipment device.',
          },
        )
      }

      return
    }

    if (
  request.method === 'POST' &&
  request.url === '/devices/remove'
) {
  try {
    const body =
      await readJsonBody(
        request,
      )

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      sendJson(
        response,
        400,
        {
          error:
            'Device removal request is invalid.',
        },
      )

      return
    }

    const candidate =
      body as Record<
        string,
        unknown
      >

    if (
      typeof candidate.id !==
        'string' ||
      candidate.id.length === 0
    ) {
      sendJson(
        response,
        400,
        {
          error:
            'Device id is required.',
        },
      )

      return
    }

    const removed =
      await removeRegisteredDevice(
        candidate.id,
      )

    if (!removed) {
      sendJson(
        response,
        404,
        {
          error:
            'Registered device was not found.',
        },
      )

      return
    }

    sendJson(
      response,
      200,
      {
        removed: true,
      },
    )
  } catch (error) {
    console.error(
      'Failed to remove Equipment device:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove Equipment device.',
      },
    )
  }

  return
}

if (
  request.method === 'GET' &&
  request.url ===
    '/providers/cast/discover'
) {
  try {
    const devices =
      await discoverCastDevices()

    console.log(
      'Cast discovery completed:',
      devices,
    )

    sendJson(
      response,
      200,
      {
        devices,
      },
    )
  } catch (error) {
    console.error(
      'Cast discovery failed:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'Cast discovery failed.',
      },
    )
  }

  return
}

if (
  request.method === 'GET' &&
  request.url ===
    '/providers/vizio/discover'
) {
  try {
    const devices =
      await discoverVizioDevices()

    sendJson(
      response,
      200,
      {
        devices,
      },
    )
  } catch (error) {
    console.error(
      'VIZIO discovery failed:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'VIZIO discovery failed.',
      },
    )
  }

  return
}

if (
  request.method === 'POST' &&
  request.url ===
    '/providers/vizio/connect'
) {
  try {
    const body =
      await readJsonBody(
        request,
      )

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      throw new Error(
        'VIZIO connection request is invalid.',
      )
    }

    const candidate =
      body as Record<
        string,
        unknown
      >

    if (
      typeof candidate.address !==
        'string' ||
      candidate.address.length ===
        0
    ) {
      throw new Error(
        'VIZIO device address is required.',
      )
    }

    const result =
      await connectVizio(
        candidate.address,
      )

    sendJson(
      response,
      200,
      result,
    )
  } catch (error) {
    console.error(
      'VIZIO connection failed:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'VIZIO connection failed.',
      },
    )
  }

  return
}

if (
  request.method === 'POST' &&
  request.url ===
    '/providers/vizio/pair'
) {
  try {
    const body =
      await readJsonBody(
        request,
      )

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      throw new Error(
        'VIZIO pairing request is invalid.',
      )
    }

    const candidate =
      body as Record<
        string,
        unknown
      >

    if (
      typeof candidate.address !==
        'string' ||
      typeof candidate.pin !==
        'string' ||
      typeof candidate.challenge !==
        'object' ||
      candidate.challenge === null
    ) {
      throw new Error(
        'VIZIO pairing request is incomplete.',
      )
    }

    const result =
      await completeVizioPairing(
        candidate.address,
        candidate.pin,
        candidate.challenge as
          VizioPairingChallenge,
      )

    sendJson(
      response,
      200,
      result,
    )
  } catch (error) {
    console.error(
      'VIZIO pairing failed:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'VIZIO pairing failed.',
      },
    )
  }

  return
}

    if (
      request.method === 'GET' &&
      request.url ===
        '/providers/samsung/discover'
      ) {
      try {
        const devices =
          await discoverSamsungDevices()

        sendJson(
          response,
          200,
          {
            devices,
          },
        )
      } catch (error) {
        console.error(
          'Samsung discovery failed:',
          error,
        )

        sendJson(
          response,
          500,
          {
            error:
              error instanceof Error
                ? error.message
                : 'Samsung discovery failed.',
          },
        )
      }

      return
    }
        
    if (
      request.method === 'POST' &&
      request.url ===
        '/providers/samsung/connect'
    ) {
  try {
    const body =
      await readJsonBody(
        request,
      )

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      sendJson(
        response,
        400,
        {
          error:
            'Connection request is invalid.',
        },
      )

      return
    }

    const candidate =
      body as Record<
        string,
        unknown
      >

    if (
      typeof candidate.address !==
      'string' ||
      candidate.address.length === 0
    ) {
      sendJson(
        response,
        400,
        {
          error:
            'Device address is required.',
        },
      )

      return
    }

    const result =
      await connectSamsung(
        candidate.address,
      )

    sendJson(
      response,
      200,
      result,
    )
  } catch (error) {
    console.error(
      'Samsung connection failed:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'Samsung connection failed.',
      },
    )
  }

  return
}
if (
  request.method === 'POST' &&
  request.url ===
    '/providers/samsung/display-image'
) {
  try {
    const body =
      await readJsonBody(
        request,
      )

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      sendJson(
        response,
        400,
        {
          error:
            'Display image request is invalid.',
        },
      )

      return
    }

    const candidate =
      body as Record<
        string,
        unknown
      >

    if (
      typeof candidate.address !==
        'string' ||
      candidate.address.length === 0
    ) {
      sendJson(
        response,
        400,
        {
          error:
            'Device address is required.',
        },
      )

      return
    }

    if (
      typeof candidate.imageUrl !==
        'string' ||
      candidate.imageUrl.length === 0
    ) {
      sendJson(
        response,
        400,
        {
          error:
            'Image URL is required.',
        },
      )

      return
    }

    await displaySamsungImage(
      candidate.address,
      candidate.imageUrl,
    )

    sendJson(
      response,
      200,
      {
        displayed: true,
      },
    )
  } catch (error) {
    console.error(
      'Samsung image display failed:',
      error,
    )

    sendJson(
      response,
      500,
      {
        error:
          error instanceof Error
            ? error.message
            : 'Samsung image display failed.',
      },
    )
  }

  return
}

    sendJson(
      response,
      404,
      {
        error: 'Not found.',
      },
    )
  },
)

await startMediaServer()

server.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `Equipment runtime listening on http://${HOST}:${PORT}`,
    )
  },
)

async function readJsonBody(
  request: IncomingMessage,
): Promise<unknown> {
  const chunks: Buffer[] = []

  for await (
    const chunk of request
  ) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk),
    )
  }

  if (chunks.length === 0) {
    return null
  }

  const text =
    Buffer.concat(
      chunks,
    ).toString('utf8')

  return JSON.parse(text) as unknown
}

function parseRegisterDeviceInput(
  value: unknown,
): RegisterDeviceInput | null {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return null
  }

  const candidate =
    value as Record<
      string,
      unknown
    >

  if (
    typeof candidate.providerId !==
      'string' ||
    candidate.providerId.length ===
      0 ||
    typeof candidate.name !==
      'string' ||
    candidate.name.length === 0
  ) {
    return null
  }

  if (
    !optionalString(
      candidate.providerDeviceId,
    ) ||
    !optionalString(
      candidate.manufacturer,
    ) ||
    !optionalString(
      candidate.model,
    ) ||
    !optionalString(
      candidate.address,
    )
  ) {
    return null
  }

  return {
    providerId:
      candidate.providerId,
    providerDeviceId:
      candidate.providerDeviceId,
    name:
      candidate.name,
    manufacturer:
      candidate.manufacturer,
    model:
      candidate.model,
    address:
      candidate.address,
  }
}

function optionalString(
  value: unknown,
): value is string | undefined {
  return (
    value === undefined ||
    typeof value === 'string'
  )
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  response.writeHead(
    statusCode,
    {
      'Content-Type':
        'application/json; charset=utf-8',

      /*
       * These endpoints are still local-only.
       *
       * We will introduce stricter runtime
       * authorization before this becomes
       * production-grade privileged control.
       */
      'Access-Control-Allow-Origin': '*',
    },
  )

  response.end(
    JSON.stringify(body),
  )
}