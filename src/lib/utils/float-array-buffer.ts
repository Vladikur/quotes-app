export function floatArrayToBuffer(arr: Float32Array | number[]): Buffer {
  // Если уже Float32Array — zero-copy
  if (arr instanceof Float32Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)
  }

  // Если обычный JS-массив — один проход, без writeFloatLE
  const float32 = Float32Array.from(arr)
  return Buffer.from(float32.buffer)
}

export function bufferToFloatArray(buf: Buffer): Float32Array {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
}
