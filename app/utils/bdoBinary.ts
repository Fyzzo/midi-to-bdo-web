// app/utils/bdoBinary.ts
import { encrypt, decryptOwnerHeader } from './ice';

export interface BdoNote {
  pitch: number;
  vel: number;
  start: number; // millisecondes
  dur: number;   // millisecondes
  ntype: number; // 0 = mélodique, 99 = drum
}

export interface BdoInstrumentGroup {
  instId: number;
  tracks: BdoNote[][];
}

const BDO_VERSION = 9;
const HEADER_SIZE = 0x150;
const NAME_FIELD_SIZE = 62;
const NOTE_SIZE = 20;
const DEFAULT_VOLUME = 0x46; // 70

/**
 * Encode a character name as UTF-16LE, padded/truncated to size bytes.
 */
export function encodeName(name: string, size: number = NAME_FIELD_SIZE): Uint8Array {
  const maxChars = Math.floor(size / 2);
  const truncated = name.slice(0, maxChars);
  const buf = new Uint8Array(size);
  for (let i = 0; i < truncated.length; i++) {
    const code = truncated.charCodeAt(i);
    buf[i * 2] = code & 0xFF;
    buf[i * 2 + 1] = (code >> 8) & 0xFF;
  }
  return buf;
}

/**
 * Decode UTF-16LE character name from binary buffer, stripping null bytes.
 */
export function decodeName(buf: Uint8Array, offset: number, size: number = NAME_FIELD_SIZE): string {
  let chars: string[] = [];
  for (let i = 0; i < size; i += 2) {
    const code = buf[offset + i] | (buf[offset + i + 1] << 8);
    if (code === 0) break;
    chars.push(String.fromCharCode(code));
  }
  return chars.join('');
}

/**
 * Build the 8-byte track settings from effector parameters.
 */
export function makeTrackSettings(
  reverb: number = 0,
  delay: number = 0,
  chorus: { feedback: number; depth: number; freq: number } | null = null
): Uint8Array {
  const s = new Uint8Array(8);
  s[1] = Math.min(Math.max(Math.floor(reverb), 0), 127); // Reverb global
  s[3] = Math.min(Math.max(Math.floor(delay), 0), 127);  // Delay global
  if (chorus) {
    s[5] = Math.min(Math.max(Math.floor(chorus.feedback), 0), 127);
    s[6] = Math.min(Math.max(Math.floor(chorus.depth), 0), 127);
    s[7] = Math.min(Math.max(Math.floor(chorus.freq), 0), 127);
  }
  return s;
}

/**
 * Build the plaintext BDO binary structure.
 */
export function buildBdoBinary(
  bpm: number,
  timeSigNum: number,
  instrumentGroups: BdoInstrumentGroup[],
  charName: string = 'MIDI',
  ownerId: number = 0,
  trackSettings: Uint8Array
): Uint8Array {
  const numInstruments = instrumentGroups.length;
  // Build comma-separated instrument tag (ASCII decimal IDs)
  const instTagStr = instrumentGroups.map(g => g.instId.toString()).join(',');
  const instTagBytes = new TextEncoder().encode(instTagStr);

  // 1. Calculate required buffer size
  let totalSize = HEADER_SIZE;

  for (let g = 0; g < numInstruments; g++) {
    const group = instrumentGroups[g];
    const groupTrackCount = group.tracks.length + 1; // data tracks + 1 empty track

    if (g === 0) {
      totalSize += 1 + 2 + 2; // 0x00 byte + num_instruments(u16) + first_group_tracks(u16)
    } else {
      totalSize += 2; // subsequent group track count (u16)
    }

    // Add size for data tracks
    for (const track of group.tracks) {
      totalSize += 2 + 2 + 8 + 2 + track.length * NOTE_SIZE; // data_size(u16) + marker(u16) + settings(8) + count(u16) + notes
    }
    // Add size for empty trailing track
    totalSize += 2 + 2 + 8 + 2;
  }

  // Pad to 8-byte alignment (ICE block size requirement)
  const remainder = totalSize % 8;
  const paddingNeeded = remainder ? (8 - remainder) : 0;
  totalSize += paddingNeeded;

  // 2. Allocate buffer and write data
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // Write Header
  view.setUint32(0, ownerId, true);
  // Zeros at offset 4-7
  
  // Character name twice (62 bytes each)
  const name1 = encodeName(charName, NAME_FIELD_SIZE);
  uint8.set(name1, 8);
  const name2 = encodeName(charName, NAME_FIELD_SIZE);
  uint8.set(name2, 70);

  // BPM
  view.setUint16(132, bpm, true);
  // Time signature numerator
  view.setUint16(134, timeSigNum, true);

  // Instrument tag ASCII string
  uint8.set(instTagBytes, 136);

  // Zero-padding up to HEADER_SIZE (0x150) is automatic since ArrayBuffer is zero-initialized

  let offset = HEADER_SIZE;

  function writeTrack(instId: number, notes: BdoNote[]) {
    const noteCount = notes.length;
    const trackMarker = (instId | (DEFAULT_VOLUME << 8)) & 0xFFFF;
    const dataSize = 2 + 8 + 2 + noteCount * NOTE_SIZE;

    view.setUint16(offset, dataSize, true); offset += 2;
    view.setUint16(offset, trackMarker, true); offset += 2;
    uint8.set(trackSettings, offset); offset += 8;
    view.setUint16(offset, noteCount, true); offset += 2;

    for (const note of notes) {
      view.setUint8(offset, note.pitch & 0x7F); offset += 1;
      view.setUint8(offset, note.ntype & 0xFF); offset += 1;
      view.setUint8(offset, note.vel & 0x7F); offset += 1;
      view.setUint8(offset, note.vel & 0x7F); offset += 1;
      view.setFloat64(offset, note.start, true); offset += 8;
      view.setFloat64(offset, note.dur, true); offset += 8;
    }
  }

  // Write instrument groups
  for (let g = 0; g < numInstruments; g++) {
    const group = instrumentGroups[g];
    const groupTrackCount = group.tracks.length + 1;

    if (g === 0) {
      view.setUint8(offset, 0x00); offset += 1;
      view.setUint16(offset, numInstruments, true); offset += 2;
      view.setUint16(offset, groupTrackCount, true); offset += 2;
    } else {
      view.setUint16(offset, groupTrackCount, true); offset += 2;
    }

    // Data tracks
    for (const track of group.tracks) {
      writeTrack(group.instId, track);
    }

    // Empty trailing track (required)
    writeTrack(group.instId, []);
  }

  return uint8;
}

/**
 * Encrypt the plaintext payload and prepend the 4-byte BDO version header.
 */
export function encryptBdo(plaintext: Uint8Array): Uint8Array {
  const encrypted = encrypt(plaintext);
  const finalFile = new Uint8Array(4 + encrypted.length);
  const view = new DataView(finalFile.buffer);
  view.setUint32(0, BDO_VERSION, true); // Version 9 (LE)
  finalFile.set(encrypted, 4);
  return finalFile;
}

/**
 * Extract Owner ID and Character name from a single-note BDO file.
 * Returns { ownerId, charName }.
 */
export function extractOwnerId(fileData: Uint8Array): { ownerId: number; charName: string } {
  if (fileData.length < 4) {
    throw new Error("Fichier invalide (trop petit).");
  }
  const view = new DataView(fileData.buffer, fileData.byteOffset, fileData.byteLength);
  const version = view.getUint32(0, true);
  if (version !== BDO_VERSION) {
    throw new Error(`Version de fichier non supportée (${version}). Version attendue: ${BDO_VERSION}`);
  }

  // Slice the 4-byte version and decrypt the payload
  const ciphertext = fileData.slice(4);
  const plaintext = decryptOwnerHeader(ciphertext);

  const plainView = new DataView(plaintext.buffer, plaintext.byteOffset, plaintext.byteLength);
  const ownerId = plainView.getUint32(0, true);
  const charName = decodeName(plaintext, 8, NAME_FIELD_SIZE);

  return { ownerId, charName };
}
