import {
  mkdtemp,
  rm,
} from 'node:fs/promises'

import {
  tmpdir,
} from 'node:os'

import {
  join,
} from 'node:path'

import {
  spawn,
} from 'node:child_process'

import {
  createRequire,
} from 'node:module'

const require =
  createRequire(import.meta.url)

const ffmpegPath =
  require('ffmpeg-static') as
    string | null

export interface RenderImageVideoOptions {
  width?: number
  height?: number
  durationSeconds?: number
  frameRate?: number
}

export interface RenderedVideo {
  path: string
  cleanup: () => Promise<void>
}

const DEFAULT_WIDTH = 1920
const DEFAULT_HEIGHT = 1080
const DEFAULT_DURATION_SECONDS = 5
const DEFAULT_FRAME_RATE = 30

export async function renderImageToVideo(
  imagePath: string,
  options:
    RenderImageVideoOptions = {},
): Promise<RenderedVideo> {
  if (!ffmpegPath) {
    throw new Error(
      'FFmpeg executable is unavailable.',
    )
  }

  const executablePath: string =
  ffmpegPath

  const width =
    options.width ??
    DEFAULT_WIDTH

  const height =
    options.height ??
    DEFAULT_HEIGHT

  const durationSeconds =
    options.durationSeconds ??
    DEFAULT_DURATION_SECONDS

  const frameRate =
    options.frameRate ??
    DEFAULT_FRAME_RATE

  const workingDirectory =
    await mkdtemp(
      join(
        tmpdir(),
        'settingforge-equipment-video-',
      ),
    )

  const outputPath =
    join(
      workingDirectory,
      'display.mp4',
    )

  /*
   * scale:
   *   Enlarge the image enough to
   *   completely cover the display.
   *
   * crop:
   *   Center-crop anything extending
   *   beyond the requested dimensions.
   *
   * format:
   *   yuv420p gives us broad television
   *   and Chromecast compatibility.
   */
  const videoFilter =
    [
      `scale=${width}:${height}:force_original_aspect_ratio=increase`,
      `crop=${width}:${height}`,
      'format=yuv420p',
    ].join(',')

  const args = [
    '-hide_banner',
    '-loglevel',
    'error',

    '-loop',
    '1',

    '-i',
    imagePath,

    '-t',
    String(
      durationSeconds,
    ),

    '-r',
    String(
      frameRate,
    ),

    '-vf',
    videoFilter,

    '-c:v',
    'libx264',

    '-preset',
    'medium',

    '-crf',
    '18',

    '-pix_fmt',
    'yuv420p',

    /*
     * Places MP4 metadata at the
     * beginning of the file.
     *
     * This helps network receivers
     * begin playback without first
     * downloading the entire file.
     */
    '-movflags',
    '+faststart',

    '-an',

    '-y',
    outputPath,
  ]

  try {
    await runFfmpeg(
        executablePath,
        args,
    )

    return {
      path: outputPath,

      cleanup:
        async () => {
          await rm(
            workingDirectory,
            {
              recursive: true,
              force: true,
            },
          )
        },
    }
  } catch (error) {
    await rm(
      workingDirectory,
      {
        recursive: true,
        force: true,
      },
    )

    throw error
  }
}

async function runFfmpeg(
  executablePath: string,
  args: string[],
): Promise<void> {
  await new Promise<void>(
    (resolve, reject) => {
      const process =
        spawn(
          executablePath,
          args,
          {
            windowsHide: true,
            stdio: [
              'ignore',
              'ignore',
              'pipe',
            ],
          },
        )

      let errorOutput = ''

      process.stderr.on(
        'data',
        chunk => {
          errorOutput +=
            chunk.toString()
        },
      )

      process.once(
        'error',
        error => {
          reject(error)
        },
      )

      process.once(
        'close',
        code => {
          if (code === 0) {
            resolve()
            return
          }

          reject(
            new Error(
              errorOutput.trim() ||
              `FFmpeg exited with code ${code}.`,
            ),
          )
        },
      )
    },
  )
}