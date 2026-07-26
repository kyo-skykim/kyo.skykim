function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export async function hasFileSignature(file: File, kind: "pdf" | "image" | "audio"): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (kind === "pdf") return ascii(bytes, 0, 5) === "%PDF-";

  if (kind === "image") {
    const png = bytes.length >= 8 && ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n";
    const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const gif = ascii(bytes, 0, 4) === "GIF8";
    const webp = ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
    const avif = ascii(bytes, 4, 8).includes("ftypavif");
    return png || jpeg || gif || webp || avif;
  }

  const mp3 = ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe6) === 0xe2);
  const wav = ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE";
  const ogg = ascii(bytes, 0, 4) === "OggS";
  const mp4 = ascii(bytes, 4, 4) === "ftyp";
  const aac = bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
  return mp3 || wav || ogg || mp4 || aac;
}
