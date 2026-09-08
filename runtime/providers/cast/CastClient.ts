import * as tls from 'node:tls'

import {
  CAST_PAYLOAD_TYPE_STRING,
  CAST_PROTOCOL_VERSION,
  decodeCastMessage,
  frameCastMessage,
  type CastMessage,
} from './CastProtocol.js'

const CAST_PORT = 8009

const SOURCE_ID = 'sender-0'
const PLATFORM_RECEIVER_ID =
  'receiver-0'

const DEFAULT_MEDIA_RECEIVER_APP_ID =
  'CC1AD845'

const CONNECTION_NAMESPACE =
  'urn:x-cast:com.google.cast.tp.connection'

const HEARTBEAT_NAMESPACE =
  'urn:x-cast:com.google.cast.tp.heartbeat'

const RECEIVER_NAMESPACE =
  'urn:x-cast:com.google.cast.receiver'

const MEDIA_NAMESPACE =
  'urn:x-cast:com.google.cast.media'

const HEARTBEAT_INTERVAL_MS =
  5000

const RESPONSE_TIMEOUT_MS =
  10000

interface CastPayload {
  type?: string
  requestId?: number
  [key: string]: unknown
}

interface ReceiverApplication {
  appId?: string
  displayName?: string
  sessionId?: string
  transportId?: string
}

interface ReceiverStatusPayload
  extends CastPayload {
  type: 'RECEIVER_STATUS'

  status?: {
    applications?:
      ReceiverApplication[]
  }
}

interface MessageWaiter {
  predicate: (
    message: CastMessage,
    payload: CastPayload,
  ) => boolean

  resolve: (
    payload: CastPayload,
  ) => void

  reject: (
    error: Error,
  ) => void

  timeout: NodeJS.Timeout
}

export interface CastMediaReceiver {
  appId: string
  sessionId: string
  transportId: string
}

export interface CastMediaPlayback {
  transportId: string
  mediaSessionId: number
}

export class CastClient {
  private socket?: tls.TLSSocket

  private incomingBuffer =
    Buffer.alloc(0)

  private heartbeatTimer?:
    NodeJS.Timeout

  private requestId = 1

  private readonly waiters:
    MessageWaiter[] = []

  constructor(
    private readonly address:
      string,
  ) {}

  async connect():
    Promise<void> {
    if (this.socket) {
      return
    }

    const socket =
      tls.connect({
        host: this.address,
        port: CAST_PORT,

        /*
         * Cast devices use their
         * own device certificate.
         *
         * We are connecting directly
         * to a known LAN device rather
         * than validating it as a
         * public HTTPS server.
         */
        rejectUnauthorized:
          false,
      })

    this.socket = socket

    socket.on(
      'data',
      data => {
        this.handleSocketData(
          data,
        )
      },
    )

    socket.on(
      'error',
      error => {
        this.rejectAllWaiters(
          error,
        )
      },
    )

    socket.on(
      'close',
      () => {
        this.stopHeartbeat()

        this.socket =
          undefined

        this.rejectAllWaiters(
          new Error(
            'Cast connection closed.',
          ),
        )
      },
    )

    await new Promise<void>(
      (resolve, reject) => {
        const handleSecure =
          () => {
            cleanup()
            resolve()
          }

        const handleError =
          (
            error: Error,
          ) => {
            cleanup()
            reject(error)
          }

        const cleanup =
          () => {
            socket.off(
              'secureConnect',
              handleSecure,
            )

            socket.off(
              'error',
              handleError,
            )
          }

        socket.once(
          'secureConnect',
          handleSecure,
        )

        socket.once(
          'error',
          handleError,
        )
      },
    )

    this.sendJson(
      PLATFORM_RECEIVER_ID,
      CONNECTION_NAMESPACE,
      {
        type: 'CONNECT',
      },
    )

    this.startHeartbeat()
  }

  async launchDefaultMediaReceiver():
    Promise<CastMediaReceiver> {
    await this.connect()

    /*
     * First see whether the
     * Default Media Receiver
     * is already running.
     */
    const existing =
      await this.getReceiverStatus()

    const existingApp =
      this.findDefaultMediaReceiver(
        existing,
      )

    if (
      existingApp?.transportId &&
      existingApp.sessionId
    ) {
      this.connectToReceiver(
        existingApp.transportId,
      )

      return {
        appId:
          DEFAULT_MEDIA_RECEIVER_APP_ID,

        sessionId:
          existingApp.sessionId,

        transportId:
          existingApp.transportId,
      }
    }

    const requestId =
      this.nextRequestId()

    const responsePromise =
      this.waitForPayload(
        (
          message,
          payload,
        ) => {
          if (
            message.namespace !==
            RECEIVER_NAMESPACE
          ) {
            return false
          }

          if (
            payload.type !==
            'RECEIVER_STATUS'
          ) {
            return false
          }

          const status =
            payload as
              ReceiverStatusPayload

          const app =
            this.findDefaultMediaReceiver(
              status,
            )

          return Boolean(
            app?.transportId &&
            app.sessionId,
          )
        },
      )

    this.sendJson(
      PLATFORM_RECEIVER_ID,
      RECEIVER_NAMESPACE,
      {
        type: 'LAUNCH',

        appId:
          DEFAULT_MEDIA_RECEIVER_APP_ID,

        requestId,
      },
    )

    const response =
      await responsePromise

    const status =
      response as
        ReceiverStatusPayload

    const application =
      this.findDefaultMediaReceiver(
        status,
      )

    if (
      !application
        ?.transportId ||
      !application
        .sessionId
    ) {
      throw new Error(
        'Default Media Receiver launched without a transport ID.',
      )
    }

    this.connectToReceiver(
      application.transportId,
    )

    return {
      appId:
        DEFAULT_MEDIA_RECEIVER_APP_ID,

      sessionId:
        application.sessionId,

      transportId:
        application.transportId,
    }
  }

  async playVideo(
  videoUrl: string,
  loop = false,
): Promise<CastMediaPlayback> {
  const receiver =
    await this.launchDefaultMediaReceiver()

  const requestId =
    this.nextRequestId()

  const responsePromise =
    this.waitForPayload(
      (
        message,
        payload,
      ) =>
        message.namespace ===
          MEDIA_NAMESPACE &&
        (
          payload.type ===
            'MEDIA_STATUS' ||
          payload.type ===
            'LOAD_FAILED'
        ) &&
        (
          payload.requestId ===
            requestId ||
          payload.requestId ===
            undefined
        ),
    )

  this.sendJson(
    receiver.transportId,
    MEDIA_NAMESPACE,
    {
      type: 'QUEUE_LOAD',
      requestId,

      startIndex: 0,
      currentTime: 0,

      repeatMode:
        loop
          ? 'REPEAT_ALL'
          : 'REPEAT_OFF',

      items: [
        {
          autoplay: true,

          media: {
            contentId:
              videoUrl,

            contentType:
              'video/mp4',

            streamType:
              'BUFFERED',
          },
        },
      ],
    },
  )

  const response =
    await responsePromise

  if (
    response.type ===
    'LOAD_FAILED'
  ) {
    throw new Error(
      'Cast receiver rejected the video.',
    )
  }

  const status =
    response.status

  if (!Array.isArray(status)) {
    throw new Error(
      'Cast receiver did not return media status.',
    )
  }

  const firstStatus =
    status[0]

  if (
    typeof firstStatus !==
      'object' ||
    firstStatus === null
  ) {
    throw new Error(
      'Cast receiver returned invalid media status.',
    )
  }

  const mediaSessionId =
    (
      firstStatus as
        Record<string, unknown>
    ).mediaSessionId

  if (
    typeof mediaSessionId !==
      'number'
  ) {
    throw new Error(
      'Cast receiver did not return a media session ID.',
    )
  }

  return {
    transportId:
      receiver.transportId,

    mediaSessionId,
  }
}

async pauseVideo(
  playback: CastMediaPlayback,
): Promise<void> {
  const requestId =
    this.nextRequestId()

  const responsePromise =
    this.waitForPayload(
      (
        message,
        payload,
      ) =>
        message.namespace ===
          MEDIA_NAMESPACE &&
        payload.type ===
          'MEDIA_STATUS' &&
        (
          payload.requestId ===
            requestId ||
          payload.requestId ===
            undefined
        ),
    )

  this.sendJson(
    playback.transportId,
    MEDIA_NAMESPACE,
    {
      type: 'PAUSE',

      requestId,

      mediaSessionId:
        playback.mediaSessionId,
    },
  )

  await responsePromise
}

  async getReceiverStatus():
    Promise<ReceiverStatusPayload> {
    await this.connect()

    const requestId =
      this.nextRequestId()

    const responsePromise =
      this.waitForPayload(
        (
          message,
          payload,
        ) =>
          message.namespace ===
            RECEIVER_NAMESPACE &&
          payload.type ===
            'RECEIVER_STATUS' &&
          (
            payload.requestId ===
              requestId ||
            payload.requestId ===
              undefined
          ),
      )

    this.sendJson(
      PLATFORM_RECEIVER_ID,
      RECEIVER_NAMESPACE,
      {
        type: 'GET_STATUS',
        requestId,
      },
    )

    return (
      await responsePromise
    ) as ReceiverStatusPayload
  }

  sendJson(
    destinationId: string,
    namespace: string,
    payload: CastPayload,
  ): void {
    const socket =
      this.socket

    if (
      !socket ||
      socket.destroyed
    ) {
      throw new Error(
        'Cast client is not connected.',
      )
    }

    const message:
      CastMessage = {
      protocolVersion:
        CAST_PROTOCOL_VERSION,

      sourceId:
        SOURCE_ID,

      destinationId,

      namespace,

      payloadType:
        CAST_PAYLOAD_TYPE_STRING,

      payloadUtf8:
        JSON.stringify(
          payload,
        ),
    }

    socket.write(
      frameCastMessage(
        message,
      ),
    )
  }

  close(): void {
    this.stopHeartbeat()

    if (
      this.socket &&
      !this.socket.destroyed
    ) {
      try {
        this.sendJson(
          PLATFORM_RECEIVER_ID,
          CONNECTION_NAMESPACE,
          {
            type: 'CLOSE',
          },
        )
      } catch {
        // Ignore shutdown errors.
      }

      this.socket.destroy()
    }

    this.socket =
      undefined
  }

  private connectToReceiver(
    transportId: string,
  ): void {
    this.sendJson(
      transportId,
      CONNECTION_NAMESPACE,
      {
        type: 'CONNECT',
      },
    )
  }

  private startHeartbeat():
    void {
    this.stopHeartbeat()

    this.heartbeatTimer =
      setInterval(
        () => {
          try {
            this.sendJson(
              PLATFORM_RECEIVER_ID,

              HEARTBEAT_NAMESPACE,

              {
                type: 'PING',
              },
            )
          } catch {
            this.stopHeartbeat()
          }
        },

        HEARTBEAT_INTERVAL_MS,
      )
  }

  private stopHeartbeat():
    void {
    if (
      !this.heartbeatTimer
    ) {
      return
    }

    clearInterval(
      this.heartbeatTimer,
    )

    this.heartbeatTimer =
      undefined
  }

  private handleSocketData(
    data: Buffer,
  ): void {
    this.incomingBuffer =
      Buffer.concat([
        this.incomingBuffer,
        data,
      ])

    while (
      this.incomingBuffer
        .length >= 4
    ) {
      const messageLength =
        this.incomingBuffer
          .readUInt32BE(0)

      const frameLength =
        messageLength + 4

      if (
        this.incomingBuffer
          .length <
        frameLength
      ) {
        return
      }

      const payloadBuffer =
        this.incomingBuffer
          .subarray(
            4,
            frameLength,
          )

      this.incomingBuffer =
        this.incomingBuffer
          .subarray(
            frameLength,
          )

      try {
        const message =
          decodeCastMessage(
            payloadBuffer,
          )

        this.handleMessage(
          message,
        )
      } catch (error) {
        console.error(
          'Failed to decode Cast message:',
          error,
        )
      }
    }
  }

  private handleMessage(
    message: CastMessage,
  ): void {
    if (
      message.payloadUtf8 ===
      undefined
    ) {
      return
    }

    let payload:
      CastPayload

    try {
      payload =
        JSON.parse(
          message.payloadUtf8,
        ) as CastPayload
    } catch {
      return
    }

    /*
     * Cast receivers may send us
     * heartbeat PING messages.
     * Answer them immediately.
     */
    if (
      message.namespace ===
        HEARTBEAT_NAMESPACE &&
      payload.type ===
        'PING'
    ) {
      try {
        this.sendJson(
          message.sourceId,

          HEARTBEAT_NAMESPACE,

          {
            type: 'PONG',
          },
        )
      } catch {
        // Socket may be closing.
      }
    }

    this.resolveWaiters(
      message,
      payload,
    )
  }

  private waitForPayload(
    predicate:
      MessageWaiter[
        'predicate'
      ],
  ): Promise<CastPayload> {
    return new Promise(
      (resolve, reject) => {
        const waiter:
          MessageWaiter = {
          predicate,

          resolve,

          reject,

          timeout:
            setTimeout(
              () => {
                this.removeWaiter(
                  waiter,
                )

                reject(
                  new Error(
                    'Timed out waiting for Cast response.',
                  ),
                )
              },

              RESPONSE_TIMEOUT_MS,
            ),
        }

        this.waiters.push(
          waiter,
        )
      },
    )
  }

  private resolveWaiters(
    message: CastMessage,
    payload: CastPayload,
  ): void {
    for (
      const waiter
      of [...this.waiters]
    ) {
      let matches = false

      try {
        matches =
          waiter.predicate(
            message,
            payload,
          )
      } catch {
        matches = false
      }

      if (!matches) {
        continue
      }

      clearTimeout(
        waiter.timeout,
      )

      this.removeWaiter(
        waiter,
      )

      waiter.resolve(
        payload,
      )
    }
  }

  private removeWaiter(
    waiter: MessageWaiter,
  ): void {
    const index =
      this.waiters.indexOf(
        waiter,
      )

    if (index >= 0) {
      this.waiters.splice(
        index,
        1,
      )
    }
  }

  private rejectAllWaiters(
    error: Error,
  ): void {
    for (
      const waiter
      of [...this.waiters]
    ) {
      clearTimeout(
        waiter.timeout,
      )

      waiter.reject(
        error,
      )
    }

    this.waiters.length = 0
  }

  private nextRequestId():
    number {
    const current =
      this.requestId

    this.requestId += 1

    return current
  }

  private findDefaultMediaReceiver(
    payload:
      ReceiverStatusPayload,
  ):
    ReceiverApplication |
    undefined {
    return payload.status
      ?.applications
      ?.find(
        application =>
          application.appId ===
          DEFAULT_MEDIA_RECEIVER_APP_ID,
      )
  }
}