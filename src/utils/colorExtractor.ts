import RNFS from 'react-native-fs'
import { toArrayBuffer } from 'react-native-quick-base64'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jpeg = require('jpeg-js') as { decode: (data: Uint8Array, options?: { useTArray?: boolean }) => { width: number, height: number, data: Uint8Array } }

/**
 * 从封面图中提取主色调（纯 JS 实现，无需原生模块）
 * 流程：下载/读取封面 → jpeg-js 解码像素 → 色相分桶统计 → 输出鲜艳的主题色
 */

const BINS = 36

const cache = new Map<string, Promise<string | null>>()

const rgbToHue = (r: number, g: number, b: number): { h: number, s: number, v: number } => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const v = max / 255
  const s = max == 0 ? 0 : d / max
  let h = 0
  if (d != 0) {
    if (max == r) h = ((g - b) / d) % 6
    else if (max == g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, v }
}

const hslToHex = (h: number, s: number, l: number): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const extractFromPixels = (data: Uint8Array, width: number, height: number): string | null => {
  const binWeight = new Array<number>(BINS).fill(0)
  const binHue = new Array<number>(BINS).fill(0)
  const binCount = new Array<number>(BINS).fill(0)

  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 4096)))
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      const { h, s, v } = rgbToHue(data[i], data[i + 1], data[i + 2])
      // 过滤灰白黑等无法体现主题色的像素
      if (s < 0.22 || v < 0.16 || v > 0.97) continue
      const bin = Math.min(BINS - 1, Math.floor(h / (360 / BINS)))
      binWeight[bin] += s
      binHue[bin] += h
      binCount[bin]++
    }
  }

  let best = -1
  let bestWeight = 0
  for (let i = 0; i < BINS; i++) {
    if (binWeight[i] > bestWeight) {
      bestWeight = binWeight[i]
      best = i
    }
  }
  // 色彩过于单一（接近灰度图）时交由调用方回退到主题色
  if (best < 0 || binCount[best] < 12) return null

  const h = binHue[best] / binCount[best]
  const s = 0.62
  const l = 0.52
  return hslToHex(h, s, l)
}

const readImageBytes = async(url: string): Promise<Uint8Array> => {
  if (url.startsWith('/')) {
    const b64 = await RNFS.readFile(url, 'base64')
    return new Uint8Array(toArrayBuffer(b64))
  }
  const target = `${RNFS.CachesDirectoryPath}/color_extract_${url.replace(/\W/g, '').slice(-48)}.jpg`
  const exists = await RNFS.exists(target)
  if (!exists) {
    const { statusCode } = await RNFS.downloadFile({ fromUrl: url, toFile: target }).promise
    if (statusCode != 200) throw new Error(`download failed: ${statusCode}`)
  }
  const b64 = await RNFS.readFile(target, 'base64')
  return new Uint8Array(toArrayBuffer(b64))
}

const extract = async(url: string): Promise<string | null> => {
  const bytes = await readImageBytes(url)
  let decoded: { width: number, height: number, data: Uint8Array }
  try {
    decoded = jpeg.decode(bytes, { useTArray: true })
  } catch {
    // PNG 等格式暂不支持，回退主题色
    return null
  }
  return extractFromPixels(decoded.data, decoded.width, decoded.height)
}

export const getDominantColor = (url: string | null | undefined): Promise<string | null> => {
  if (!url) return Promise.resolve(null)
  let promise = cache.get(url)
  if (!promise) {
    promise = extract(url).catch(() => null)
    cache.set(url, promise)
  }
  return promise
}
