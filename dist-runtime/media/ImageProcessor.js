import { tmpdir, } from 'node:os';
import { join, } from 'node:path';
import { randomUUID, } from 'node:crypto';
import sharp from 'sharp';
export async function prepareDisplayImage(options) {
    const width = options.width ?? 1920;
    const height = options.height ?? 1080;
    const outputPath = join(tmpdir(), `settingforge-display-${randomUUID()}.png`);
    await sharp(options.sourcePath)
        .resize(width, height, {
        fit: 'cover',
        position: 'centre',
    })
        .png()
        .toFile(outputPath);
    return outputPath;
}
