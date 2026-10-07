// Blob/File helpers for the browser entries, around a random-access reader or write planner (ID3
// from file/partial-id3.ts, MP4 from file/partial-mp4.ts).
import { isBytes } from '../core/bytes.js'
import type { PlannedWrite, RandomAccess } from '../file/partial-id3.js'

export type Reader<O, R> = (src: RandomAccess, options: O) => Promise<R>
export type Planner<I, O> = (src: RandomAccess, input: I, options: O) => Promise<PlannedWrite>

/** Blob.arrayBuffer() with a FileReader fallback (older Safari, jsdom). */
export function blobBytes(b: Blob): Promise<Uint8Array> {
  if (typeof b.arrayBuffer === 'function') return b.arrayBuffer().then((x) => new Uint8Array(x))
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer))
    r.onerror = () => reject(r.error)
    r.readAsArrayBuffer(b)
  })
}

function blobAccess(blob: Blob): RandomAccess {
  return { size: blob.size, read: (offset, length) => blobBytes(blob.slice(offset, offset + length)) }
}

export function readBlob<O, R>(reader: Reader<O, R>, blob: Blob, options: O): Promise<R> {
  return reader(blobAccess(blob), options)
}

export async function writeBlob<B extends Blob, I, O>(planner: Planner<I, O>, blob: B, input: I, options: O): Promise<B extends File ? File : Blob> {
  const plan = await planner(blobAccess(blob), input, options)
  const parts: BlobPart[] = plan.segments.map((seg) => (isBytes(seg) ? (seg as Uint8Array<ArrayBuffer>) : blob.slice(seg.start, seg.end)))
  const type = blob.type
  if (typeof File !== 'undefined' && blob instanceof File) {
    return new File(parts, blob.name, { type, lastModified: Date.now() }) as B extends File ? File : Blob
  }
  return new Blob(parts, { type }) as B extends File ? File : Blob
}
