// Node file helpers for the node entries, around a random-access reader or write planner (ID3 from
// file/partial-id3.ts, MP4 from file/partial-mp4.ts).
import { isBytes } from '../core/bytes.js'
import { open, rename, unlink } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import type { ID3WriteInput } from '../api/api-id3.js'
import type { Warning } from '../core/errors.js'
import type { RandomAccess } from '../file/partial-id3.js'
import type { Planner, Reader } from './blob.js'

type Handle = Awaited<ReturnType<typeof open>>

export interface FileWriteResult {
  inPlace: boolean
  warnings: Warning[]
}

async function access(fh: Handle): Promise<RandomAccess> {
  const { size } = await fh.stat()
  return {
    size,
    read: async (offset, length) => {
      const buf = new Uint8Array(length)
      let done = 0
      while (done < length) {
        const { bytesRead } = await fh.read(buf, done, length - done, offset + done)
        if (bytesRead === 0) break
        done += bytesRead
      }
      return buf.subarray(0, done)
    },
  }
}

export async function readPath<O, R>(reader: Reader<O, R>, path: string, options: O): Promise<R> {
  const fh = await open(path, 'r')
  try {
    return await reader(await access(fh), options)
  } finally {
    await fh.close()
  }
}

export async function writePath<I, O>(planner: Planner<I, O>, path: string, input: I, options: O): Promise<FileWriteResult> {
  const fh = await open(path, 'r+')
  let plan
  try {
    plan = await planner(await access(fh), input, options)
    if (plan.inPlace) {
      // Same length and nothing moved: write only the new bytes at their offsets.
      let pos = 0
      for (const seg of plan.segments) {
        if (isBytes(seg)) {
          await fh.write(seg, 0, seg.length, pos)
          pos += seg.length
        } else pos += seg.end - seg.start
      }
      return { inPlace: true, warnings: plan.warnings }
    }
  } finally {
    if (!plan || plan.inPlace) await fh.close()
  }
  const tmp = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`)
  const out = await open(tmp, 'wx')
  try {
    const chunk = new Uint8Array(1024 * 1024)
    for (const seg of plan.segments) {
      if (isBytes(seg)) {
        await out.write(seg)
        continue
      }
      for (let pos = seg.start; pos < seg.end; ) {
        const n = Math.min(chunk.length, seg.end - pos)
        const { bytesRead } = await fh.read(chunk, 0, n, pos)
        if (bytesRead === 0) throw new Error('file shrank while writing')
        await out.write(chunk.subarray(0, bytesRead))
        pos += bytesRead
      }
    }
    await out.sync()
    await out.close()
    await fh.close()
    await rename(tmp, path)
  } catch (e) {
    await out.close().catch(() => {})
    await fh.close().catch(() => {})
    await unlink(tmp).catch(() => {})
    throw e
  }
  return { inPlace: false, warnings: plan.warnings }
}

/** The ID3WriteInput that removes the chosen tag types. */
export function removalInput(which: { id3v2?: boolean; id3v1?: boolean; lyrics3?: boolean }): ID3WriteInput {
  const input: ID3WriteInput = {}
  if (which.id3v2) input.id3v2 = null
  if (which.id3v1) input.id3v1 = null
  if (which.lyrics3 || which.id3v1) input.lyrics3 = null
  return input
}
