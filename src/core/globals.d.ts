// The core compiles against lib ES2020 only (no DOM), so it cannot reach for browser or Node APIs
// by accident. TextDecoder/TextEncoder are the two universal globals it does use: they exist in
// every browser and in Node >= 11.
declare class TextDecoder {
  constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean })
  decode(input?: Uint8Array): string
}
declare class TextEncoder {
  encode(input?: string): Uint8Array
}
