/**
 * WAV File Writer
 * Encodes audio buffer as WAV format and saves to file
 */

/**
 * Write audio buffer to WAV file
 */
export async function writeWavFile(
  buffer: Float32Array,
  sampleRate: number,
  channels: number,
  filePath: string
): Promise<void> {
  const wavData = encodeWav(buffer, sampleRate, channels);
  await Bun.write(filePath, wavData);
}

/**
 * Encode float audio buffer as WAV
 */
function encodeWav(
  samples: Float32Array,
  sampleRate: number,
  channels: number
): Uint8Array {
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, channels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1] range
    const sample = Math.max(-1, Math.min(1, samples[i]));
    // Convert to 16-bit signed integer
    const intSample = Math.floor(sample * 32767);
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

/**
 * Write string to DataView
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
