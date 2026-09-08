import {
  tmpdir,
} from 'node:os'

import {
  join,
} from 'node:path'

import {
  randomUUID,
} from 'node:crypto'

import sharp from 'sharp'

export interface PrepareDisplayImageOptions {
  sourcePath: string
  width?: number
  height?: number
}

export async function prepareDisplayImage(
  options: PrepareDisplayImageOptions,
): Promise<string> {
  const width =
    options.width ?? 1920

  const height =
    options.height ?? 1080

  const outputPath =
    join(
      tmpdir(),
      `settingforge-display-${randomUUID()}.png`,
    )

  await sharp(
    options.sourcePath,
  )
    .resize(
      width,
      height,
      {
        fit: 'cover',
        position: 'centre',
      },
    )
    .png()
    .toFile(
      outputPath,
    )

  return outputPath
}