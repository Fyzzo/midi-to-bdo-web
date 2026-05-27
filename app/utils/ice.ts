// app/utils/ice.ts
/**
 * ICE Level-0 Cipher Block implementation.
 * Ported directly from the original Python '_ice.py' script.
 * Processes 8-byte blocks for Black Desert Online (BDO) music files.
 */

const SMOD = [
  [333, 313, 505, 369],
  [379, 375, 319, 391],
  [361, 445, 451, 397],
  [397, 425, 395, 505]
];

const SXOR = [
  [0x83, 0x85, 0x9B, 0xCD],
  [0xCC, 0xA7, 0xAD, 0x41],
  [0x4B, 0x2E, 0xD4, 0x33],
  [0xEA, 0xCB, 0x2E, 0x04]
];

const PBOX = [
  0x00000001, 0x00000080, 0x00000400, 0x00002000,
  0x00080000, 0x00200000, 0x01000000, 0x40000000,
  0x00000008, 0x00000020, 0x00000100, 0x00004000,
  0x00010000, 0x00800000, 0x04000000, 0x20000000,
  0x00000004, 0x00000010, 0x00000200, 0x00008000,
  0x00020000, 0x00400000, 0x08000000, 0x10000000,
  0x00000002, 0x00000040, 0x00000800, 0x00001000,
  0x00040000, 0x00100000, 0x02000000, 0x80000000
];

const KEYROT = [0, 1, 2, 3, 2, 1, 3, 0, 1, 3, 2, 0, 3, 1, 0, 2];

const sbox: number[][] = Array.from({ length: 4 }, () => new Array(1024).fill(0));

function perm32(x: number): number {
  let result = 0;
  let i = 0;
  let temp = x >>> 0;
  while (temp > 0) {
    if (temp & 1) {
      result = (result | PBOX[i]) >>> 0;
    }
    i++;
    temp = temp >>> 1;
  }
  return result >>> 0;
}

function gfMult(a: number, b: number, m: number): number {
  let result = 0;
  let tempA = a;
  let tempB = b;
  while (tempB > 0) {
    if (tempB & 1) {
      result ^= tempA;
    }
    tempA <<= 1;
    tempB >>= 1;
    if (tempA >= 256) {
      tempA ^= m;
    }
  }
  return result & 0xFF;
}

function gfExp7(b: number, m: number): number {
  if (b === 0) return 0;
  let x = gfMult(b, b, m);
  x = gfMult(b, x, m);
  x = gfMult(x, x, m);
  return gfMult(b, x, m);
}

// Precompute S-boxes on module load
(function initSbox() {
  for (let i = 0; i < 1024; i++) {
    const col = (i >> 1) & 0xFF;
    const row = (i & 0x1) | ((i & 0x200) >> 8);
    sbox[0][i] = perm32((gfExp7(col ^ SXOR[0][row], SMOD[0][row]) << 24) >>> 0);
    sbox[1][i] = perm32((gfExp7(col ^ SXOR[1][row], SMOD[1][row]) << 16) >>> 0);
    sbox[2][i] = perm32((gfExp7(col ^ SXOR[2][row], SMOD[2][row]) << 8) >>> 0);
    sbox[3][i] = perm32(gfExp7(col ^ SXOR[3][row], SMOD[3][row]) >>> 0);
  }
})();

function buildKeySchedule(): number[][] {
  const key = new Uint8Array([0x51, 0xf3, 0x0f, 0x11, 0x04, 0x24, 0x6a, 0x00]);
  const ks = Array.from({ length: 8 }, () => [0, 0, 0]);
  const kb = new Uint16Array(4);
  for (let i = 0; i < 4; i++) {
    kb[3 - i] = (key[i * 2] << 8) | key[i * 2 + 1];
  }
  for (let i = 0; i < 8; i++) {
    const kr = KEYROT[i];
    for (let j = 0; j < 15; j++) {
      for (let k = 0; k < 4; k++) {
        const t = (kr + k) & 3;
        const kbb = kb[t];
        const bit = kbb & 1;
        ks[i][j % 3] = (ks[i][j % 3] << 1) | bit;
        kb[t] = (kbb >> 1) | ((bit ^ 1) << 15);
      }
    }
  }
  return ks;
}

const KS = buildKeySchedule();

function iceF(p: number, sk: number[]): number {
  const tl = (((p >>> 16) & 0x3FF) | (((p >>> 14) | (p << 18)) & 0xFFC00)) >>> 0;
  const tr = ((p & 0x3FF) | ((p << 2) & 0xFFC00)) >>> 0;
  let al = (sk[2] & (tl ^ tr)) >>> 0;
  let ar = (al ^ tr ^ sk[1]) >>> 0;
  al = (al ^ tl ^ sk[0]) >>> 0;
  return (sbox[0][al >>> 10] | sbox[1][al & 0x3FF] | sbox[2][ar >>> 10] | sbox[3][ar & 0x3FF]) >>> 0;
}

function encryptBlock(data: Uint8Array, offset: number = 0): number[] {
  let l = 0;
  let r = 0;
  for (let i = 0; i < 4; i++) {
    const t = 24 - i * 8;
    l = (l | ((data[offset + i] & 0xFF) << t)) >>> 0;
    r = (r | ((data[offset + i + 4] & 0xFF) << t)) >>> 0;
  }
  for (let i = 0; i < 8; i += 2) {
    l = (l ^ iceF(r, KS[i])) >>> 0;
    r = (r ^ iceF(l, KS[i + 1])) >>> 0;
  }
  const out = new Array(8).fill(0);
  for (let i = 0; i < 4; i++) {
    out[3 - i] = r & 0xFF;
    out[7 - i] = l & 0xFF;
    r >>>= 8;
    l >>>= 8;
  }
  return out;
}

function decryptBlock(data: Uint8Array, offset: number = 0): number[] {
  let l = 0;
  let r = 0;
  for (let i = 0; i < 4; i++) {
    const t = 24 - i * 8;
    l = (l | ((data[offset + i] & 0xFF) << t)) >>> 0;
    r = (r | ((data[offset + i + 4] & 0xFF) << t)) >>> 0;
  }
  for (let i = 7; i > 0; i -= 2) {
    l = (l ^ iceF(r, KS[i])) >>> 0;
    r = (r ^ iceF(l, KS[i - 1])) >>> 0;
  }
  const out = new Array(8).fill(0);
  for (let i = 0; i < 4; i++) {
    out[3 - i] = r & 0xFF;
    out[7 - i] = l & 0xFF;
    r >>>= 8;
    l >>>= 8;
  }
  return out;
}

/**
 * Encrypt bytes using ICE Level-0 cipher.
 * processes full 8-byte blocks. Unaligned remainder at the end is left unencrypted.
 */
export function encrypt(plaintext: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  let remaining = plaintext.length;
  while (remaining >= 8) {
    out.push(...encryptBlock(plaintext, i));
    i += 8;
    remaining -= 8;
  }
  if (remaining > 0) {
    for (let j = i; j < plaintext.length; j++) {
      out.push(plaintext[j]);
    }
  }
  return new Uint8Array(out);
}

/**
 * Decrypt a small BDO file payload to extract owner header details.
 * Will throw if file size exceeds 512 bytes to match security logic in original converter.
 */
export function decryptOwnerHeader(ciphertext: Uint8Array): Uint8Array {
  if (ciphertext.length > 512) {
    throw new Error("Fichier trop grand pour extraire l'Owner ID — utilisez un fichier BDO à une seule note sauvegardé en jeu.");
  }
  const out: number[] = [];
  let i = 0;
  let remaining = ciphertext.length;
  while (remaining >= 8) {
    out.push(...decryptBlock(ciphertext, i));
    i += 8;
    remaining -= 8;
  }
  if (remaining > 0) {
    for (let j = i; j < ciphertext.length; j++) {
      out.push(ciphertext[j]);
    }
  }
  return new Uint8Array(out);
}
