import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http'

import {
  discoverSamsungDevices,
} from './providers/samsung/SamsungDiscovery.js'

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

    sendJson(
      response,
      404,
      {
        error: 'Not found.',
      },
    )
  },
)

server.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `Equipment runtime listening on http://${HOST}:${PORT}`,
    )
  },
)

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
       * Discovery is currently read-only.
       *
       * We will introduce stricter runtime
       * authorization before privileged
       * device-control endpoints exist.
       */
      'Access-Control-Allow-Origin': '*',
    },
  )

  response.end(
    JSON.stringify(body),
  )
}