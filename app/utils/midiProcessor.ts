// app/utils/midiProcessor.ts
import { Midi } from '@tonejs/midi';
import { type BdoNote, type BdoInstrumentGroup } from './bdoBinary';


export const BDO_INSTRUMENTS: Record<string, number> = {
  // Beginner
  beginner_guitar:    0x00,
  beginner_flute:     0x01,
  beginner_recorder:  0x02,
  hand_drum:          0x04,
  cymbals:            0x05,
  beginner_harp:      0x06,
  beginner_piano:     0x07,
  beginner_violin:    0x08,
  // Florchestra
  guitar:             0x0a,
  flute:              0x0b,
  drum_set:           0x0d,
  marnibass:          0x0e,
  contrabass:         0x0f,
  harp:               0x10,
  piano:              0x11,
  violin:             0x12,
  handpan:            0x13,
  // Marnian
  marnian_wavy:       0x14,
  marnian_illusion:   0x18,
  marnian_secret:     0x1c,
  marnian_sandwich:   0x20,
  // Electric Guitar
  eguitar_silver:     0x24,
  eguitar_highway:    0x25,
  eguitar_hexe:       0x26,
  // Florchestra (suite)
  clarinet:           0x27,
  horn:               0x28,
};

export const BDO_INSTRUMENT_NAMES: Record<number, string> = {
  0x00: 'Beginner Guitar',
  0x01: 'Beginner Flute',
  0x02: 'Beginner Recorder',
  0x04: 'Hand Drum',
  0x05: 'Cymbals',
  0x06: 'Beginner Harp',
  0x07: 'Beginner Piano',
  0x08: 'Beginner Violin',
  0x0a: 'Florchestra Acoustic Guitar',
  0x0b: 'Florchestra Flute',
  0x0d: 'Drum Set',
  0x0e: 'Marnibass',
  0x0f: 'Florchestra Contrabass',
  0x10: 'Florchestra Harp',
  0x11: 'Florchestra Piano',
  0x12: 'Florchestra Violin',
  0x13: 'Handpan',
  0x14: 'Marnian Wavy Planet',
  0x18: 'Marnian Illusion Tree',
  0x1c: 'Marnian Secret Note',
  0x20: 'Marnian Sandwich',
  0x24: 'Guitar Silver Wave',
  0x25: 'Guitar Highway',
  0x26: 'Guitar Hexe Glam',
  0x27: 'Florchestra Clarinet',
  0x28: 'Florchestra Horn',
};

export const GM_PROGRAM_NAMES = [
  // 0–7: Piano
  'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano',
  'Honky-tonk Piano', 'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavinet',
  // 8–15: Chromatic Percussion
  'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone',
  'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
  // 16–23: Organ
  'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ',
  'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion',
  // 24–31: Guitar
  'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)', 'Electric Guitar (jazz)',
  'Electric Guitar (clean)', 'Electric Guitar (muted)', 'Overdriven Guitar',
  'Distortion Guitar', 'Guitar Harmonics',
  // 32–39: Bass
  'Acoustic Bass', 'Electric Bass (finger)', 'Electric Bass (pick)',
  'Fretless Bass', 'Slap Bass 1', 'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2',
  // 40–47: Strings
  'Violin', 'Viola', 'Cello', 'Contrabass',
  'Tremolo Strings', 'Pizzicato Strings', 'Orchestral Harp', 'Timpani',
  // 48–55: Ensemble
  'String Ensemble 1', 'String Ensemble 2', 'Synth Strings 1', 'Synth Strings 2',
  'Choir Aahs', 'Voice Oohs', 'Synth Choir', 'Orchestra Hit',
  // 56–63: Brass
  'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet',
  'French Horn', 'Brass Section', 'Synth Brass 1', 'Synth Brass 2',
  // 64–71: Reed
  'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax',
  'Oboe', 'English Horn', 'Bassoon', 'Clarinet',
  // 72–79: Pipe
  'Piccolo', 'Flute', 'Recorder', 'Pan Flute',
  'Blown Bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
  // 80–87: Synth Lead
  'Lead 1 (square)', 'Lead 2 (sawtooth)', 'Lead 3 (calliope)', 'Lead 4 (chiff)',
  'Lead 5 (charang)', 'Lead 6 (voice)', 'Lead 7 (fifths)', 'Lead 8 (bass + lead)',
  // 88–95: Synth Pad
  'Pad 1 (new age)', 'Pad 2 (warm)', 'Pad 3 (polysynth)', 'Pad 4 (choir)',
  'Pad 5 (bowed)', 'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
  // 96–103: Synth Effects
  'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)', 'FX 4 (atmosphere)',
  'FX 5 (brightness)', 'FX 6 (goblins)', 'FX 7 (echoes)', 'FX 8 (sci-fi)',
  // 104–111: Ethnic
  'Sitar', 'Banjo', 'Shamisen', 'Koto', 'Kalimba', 'Bagpipe', 'Fiddle', 'Shanai',
  // 112–119: Percussive
  'Tinkle Bell', 'Agogo', 'Steel Drums', 'Woodblock',
  'Taiko Drum', 'Melodic Tom', 'Synth Drum', 'Reverse Cymbal',
  // 120–127: Sound Effects
  'Guitar Fret Noise', 'Breath Noise', 'Seashore', 'Bird Tweet',
  'Telephone Ring', 'Helicopter', 'Applause', 'Gunshot',
];

export function getGmProgramName(prog: number): string {
  if (prog >= 0 && prog < GM_PROGRAM_NAMES.length) {
    return GM_PROGRAM_NAMES[prog];
  }
  return `Program ${prog}`;
}

export const BDO_NOTE_MIN = 24;  // C1
export const BDO_NOTE_MAX = 108; // C8
export const MAX_NOTES_PER_TRACK = 730;
export const MAX_NOTES_PER_INSTRUMENT = 10000;

// GM percussion note -> BDO drum pitch (48-64)
const GM_TO_BDO_DRUM: Record<number, number> = {
  35: 48,  // Acoustic Bass Drum -> Kick
  36: 48,  // Bass Drum 1 -> Kick
  37: 51,  // Side Stick -> RimShot
  38: 50,  // Acoustic Snare -> SnrHit
  39: 50,  // Hand Clap -> SnrHit
  40: 50,  // Electric Snare -> SnrHit
  41: 53,  // Low Floor Tom -> Tom1
  42: 54,  // Closed Hi-Hat -> HihatC
  43: 55,  // High Floor Tom -> Tom2
  44: 56,  // Pedal Hi-Hat -> HatPdl
  45: 57,  // Low Tom -> Tom3
  46: 58,  // Open Hi-Hat -> HihatO
  47: 59,  // Low-Mid Tom -> Tom4
  48: 60,  // Hi-Mid Tom -> Tom5
  49: 61,  // Crash Cymbal 1 -> CymCrsh
  50: 60,  // High Tom -> Tom5
  51: 62,  // Ride Cymbal 1 -> CymRide
  52: 61,  // Chinese Cymbal -> CymCrsh
  53: 62,  // Ride Bell -> CymRide
  54: 61,  // Tambourine -> CymCrsh
  55: 61,  // Splash Cymbal -> CymCrsh
  56: 51,  // Cowbell -> RimShot
  57: 61,  // Crash Cymbal 2 -> CymCrsh
  58: 51,  // Vibraslap -> RimShot
  59: 62,  // Ride Cymbal 2 -> CymRide
};

/**
 * Maps standard General MIDI program number (0-127) to BDO instrument ID.
 */
export function gmToBdoInstrument(program: number, isPercussion: boolean = false): number {
  if (isPercussion) {
    return BDO_INSTRUMENTS['drum_set'];
  }
  
  const gmRanges: [number, string][] = [
    [24,  'piano'],           // 0–23: piano, organs, chromatic perc
    [32,  'guitar'],          // 24–31: guitar
    [40,  'contrabass'],      // 32–39: bass
    [42,  'violin'],          // 40–41: violin, viola
    [44,  'contrabass'],      // 42–43: cello, contrabass
    [47,  'harp'],            // 44–46: pizz strings, harp
    [48,  'drum_set'],        // 47: timpani
    [56,  'violin'],          // 48–55: string ensembles, choir
    [64,  'horn'],            // 56–63: brass
    [72,  'clarinet'],        // 64–71: sax, reed woodwinds
    [80,  'flute'],           // 72–79: flute family
    [88,  'marnian_wavy'],    // 80–87: lead synths
    [96,  'marnian_illusion'],// 88–95: pad synths
    [104, 'marnibass'],       // 96–103: synth effects
    [112, 'handpan'],         // 104–111: ethnic
    [120, 'hand_drum'],       // 112–119: percussive
    [128, 'piano'],           // 120–127: sound FX — fallback
  ];

  for (const [upper, name] of gmRanges) {
    if (program < upper) {
      return BDO_INSTRUMENTS[name];
    }
  }
  return BDO_INSTRUMENTS['piano'];
}

/**
 * Maps standard GM drums pitches to BDO drum pitches (48-64).
 */
export function mapDrumNotes(notes: BdoNote[]): BdoNote[] {
  return notes.map(n => {
    const bdoPitch = GM_TO_BDO_DRUM[n.pitch] ?? 48; // default to Kick
    return {
      pitch: bdoPitch,
      vel: n.vel,
      start: n.start,
      dur: n.dur,
      ntype: 99, // drum type note BDO
    };
  });
}

/**
 * Transpose notes and clamp them inside BDO melodic range [24, 108].
 */
export function transposeAndClampNotes(notes: BdoNote[], semitones: number): BdoNote[] {
  return notes.map(n => {
    let p = n.pitch + semitones;
    if (p < BDO_NOTE_MIN) {
      p = p + 12 * Math.ceil((BDO_NOTE_MIN - p) / 12);
    } else if (p > BDO_NOTE_MAX) {
      p = p - 12 * Math.ceil((p - BDO_NOTE_MAX) / 12);
    }
    p = Math.max(BDO_NOTE_MIN, Math.min(BDO_NOTE_MAX, p));
    return { ...n, pitch: p };
  });
}

/**
 * Apply sustain CC 64 events to notes.
 */
export function applySustainToNotes(notes: BdoNote[], cc64: Array<{ time: number; value: number }>): BdoNote[] {
  if (cc64.length === 0) return notes;
  const cc = [...cc64].sort((a, b) => a.time - b.time);

  function isSustainActiveAt(t: number): boolean {
    let active = false;
    for (const event of cc) {
      if (event.time > t) break;
      active = event.value >= 64;
    }
    return active;
  }

  function nextSustainReleaseTime(t: number): number | null {
    for (const event of cc) {
      if (event.time > t && event.value < 64) {
        return event.time;
      }
    }
    return null;
  }

  return notes.map((note, index) => {
    const end = note.start + note.dur; // end in ms
    const endSec = end / 1000;

    if (isSustainActiveAt(endSec)) {
      const releaseSec = nextSustainReleaseTime(endSec);
      let newEndMs = releaseSec ? (releaseSec * 1000) : (end + 100);

      // Avoid overlapping with the next note of the same pitch
      for (let j = index + 1; j < notes.length; j++) {
        if (notes[j].pitch === note.pitch) {
          if (notes[j].start < newEndMs) {
            newEndMs = notes[j].start;
          }
          break;
        }
      }

      const newDur = newEndMs - note.start;
      return {
        ...note,
        dur: newDur > 0 ? newDur : note.dur,
      };
    }
    return note;
  });
}

// --- Velocity helpers ---

export function rescaleVelocity(notes: BdoNote[], min: number = 0, max: number = 127): BdoNote[] {
  if (notes.length === 0) return notes;
  const normal = notes.filter(n => n.ntype === 0);
  if (normal.length === 0) return notes;
  const vels = normal.map(n => n.vel);
  const srcMin = Math.min(...vels);
  const srcMax = Math.max(...vels);
  if (srcMin === srcMax) {
    const flat = Math.floor((min + max) / 2);
    return notes.map(n => n.ntype === 0 ? { ...n, vel: flat } : n);
  }
  return notes.map(n => {
    if (n.ntype === 0) {
      const scaled = min + ((n.vel - srcMin) / (srcMax - srcMin)) * (max - min);
      return { ...n, vel: Math.round(scaled) };
    }
    return n;
  });
}

export function floorVelocity(notes: BdoNote[], floor: number = 100): BdoNote[] {
  if (notes.length === 0) return notes;
  const normal = notes.filter(n => n.ntype === 0);
  if (normal.length === 0) return notes;
  const srcMin = Math.min(...normal.map(n => n.vel));
  if (srcMin === 0 || srcMin >= floor) return notes;
  const ratio = floor / srcMin;
  return notes.map(n => {
    if (n.ntype === 0) {
      return { ...n, vel: Math.min(Math.round(n.vel * ratio), 127) };
    }
    return n;
  });
}

export function steppedVelocity(notes: BdoNote[], base: number = 99, step: number = 5): BdoNote[] {
  if (notes.length === 0) return notes;
  const normal = notes.filter(n => n.ntype === 0);
  if (normal.length === 0) return notes;
  const normalVels = Array.from(new Set(normal.map(n => n.vel))).sort((a, b) => a - b);
  const velMap = new Map<number, number>();
  for (let i = 0; i < normalVels.length; i++) {
    velMap.set(normalVels[i], Math.min(base + i * step, 127));
  }
  if (normalVels.length > 0) {
    velMap.set(normalVels[normalVels.length - 1], 127);
  }
  return notes.map(n => {
    if (n.ntype === 0) {
      return { ...n, vel: velMap.get(n.vel) ?? n.vel };
    }
    return n;
  });
}

export function layeredVelocity(notes: BdoNote[], scale: number = 1.0): BdoNote[] {
  if (notes.length === 0) return notes;
  let levels = [80, 90, 100, 121];
  if (scale !== 1.0) {
    levels = Array.from(new Set(levels.map(l => Math.max(1, Math.min(127, Math.round(l * scale)))))).sort((a, b) => a - b);
  }
  const normal = notes.filter(n => n.ntype === 0);
  if (normal.length === 0) return notes;
  const normalVels = Array.from(new Set(normal.map(n => n.vel))).sort((a, b) => a - b);
  if (normalVels.length === 0) return notes;

  const velMap = new Map<number, number>();
  if (normalVels.length === 1) {
    velMap.set(normalVels[0], levels[Math.floor(levels.length / 2)]);
  } else {
    for (let i = 0; i < normalVels.length; i++) {
      const idx = Math.round((i / (normalVels.length - 1)) * (levels.length - 1));
      velMap.set(normalVels[i], levels[idx]);
    }
  }

  return notes.map(n => {
    if (n.ntype === 0) {
      return { ...n, vel: velMap.get(n.vel) ?? n.vel };
    }
    return n;
  });
}

/**
 * Split note list into chunks that fit BDO's per-track limit (730 notes).
 */
export function splitNotesIntoTracks(notes: BdoNote[], maxPerTrack: number = MAX_NOTES_PER_TRACK): BdoNote[][] {
  if (notes.length <= maxPerTrack) {
    return [notes];
  }
  const chunks: BdoNote[][] = [];
  for (let i = 0; i < notes.length; i += maxPerTrack) {
    chunks.push(notes.slice(i, i + maxPerTrack));
  }
  return chunks;
}

export interface MidiChannelGroup {
  channel: number;
  notes: BdoNote[];
  gmProgram: number;
  isPercussion: boolean;
  notesCount: number;
  name: string;
}

export interface ParsedMidiResult {
  bpm: number;
  timeSig: number;
  channels: MidiChannelGroup[];
  totalNotes: number;
  tempoChangesCount: number;
  durationMs: number;
  cc64EventsByChannel: Record<number, Array<{ time: number; value: number }>>;
}

/**
 * Parse uploaded MIDI ArrayBuffer and extract channel notes.
 */
export function parseMidiFile(
  arrayBuffer: ArrayBuffer,
  applySustain: boolean = true,
  flattenTempo: boolean = false
): ParsedMidiResult {
  const midi = new Midi(arrayBuffer);

  // 1. Gather BPM and Tempo maps
  const tempos = midi.header.tempos;
  const tempoChangesCount = tempos.length;
  
  let bpm = 120;
  if (tempos.length > 0) {
    bpm = Math.round(tempos[0].bpm);
  }

  if (flattenTempo && tempos.length > 1) {
    bpm = 200; // max BDO tempo to minimize grid errors
  }

  // 2. Gather Time Signature
  let timeSig = 4;
  if (midi.header.timeSignatures.length > 0) {
    timeSig = midi.header.timeSignatures[0].timeSignature[0];
  }

  // 3. Process track CC 64 events (Sustain)
  const cc64EventsByChannel: Record<number, Array<{ time: number; value: number }>> = {};
  for (const track of midi.tracks) {
    const ch = track.channel;
    if (track.controlChanges && track.controlChanges[64]) {
      const ccList = track.controlChanges[64].map(cc => ({
        time: cc.time,
        value: Math.round(cc.value * 127), // convert 0-1 to 0-127
      }));
      if (!cc64EventsByChannel[ch]) {
        cc64EventsByChannel[ch] = [];
      }
      cc64EventsByChannel[ch].push(...ccList);
    }
  }

  // 4. Gather notes grouped by channel
  const notesByChannel: Record<number, BdoNote[]> = {};
  const programByChannel: Record<number, number> = {};

  for (const track of midi.tracks) {
    const ch = track.channel;
    if (track.notes && track.notes.length > 0) {
      if (!notesByChannel[ch]) {
        notesByChannel[ch] = [];
      }
      
      programByChannel[ch] = track.instrument.number;

      const trackNotes: BdoNote[] = track.notes
        .filter(n => n.velocity > 0 && n.duration > 0)
        .map(n => ({
          pitch: n.midi,
          vel: Math.max(1, Math.round(n.velocity * 127)), // convert 0-1 to 0-127, at least 1
          start: n.time * 1000,              // to ms
          dur: Math.max(1, n.duration * 1000),            // to ms, at least 1
          ntype: 0,
        }));

      notesByChannel[ch].push(...trackNotes);
    }
  }

  // Sort notes by start time and apply sustain
  const channels: MidiChannelGroup[] = [];
  let totalNotes = 0;
  let maxTimeMs = 0;

  for (const chStr of Object.keys(notesByChannel)) {
    const ch = parseInt(chStr);
    let chNotes = notesByChannel[ch];
    if (chNotes.length === 0) continue;

    chNotes.sort((a, b) => a.start - b.start);

    const isPercussion = (ch === 9);
    const gmProgram = programByChannel[ch] ?? 0;

    // Apply sustain CC 64 if requested
    if (applySustain && cc64EventsByChannel[ch]) {
      chNotes = applySustainToNotes(chNotes, cc64EventsByChannel[ch]);
    }

    totalNotes += chNotes.length;
    
    for (const note of chNotes) {
      const end = note.start + note.dur;
      if (end > maxTimeMs) maxTimeMs = end;
    }

    const name = isPercussion ? `Drums (ch 10)` : `${getGmProgramName(gmProgram)}`;

    channels.push({
      channel: ch,
      notes: chNotes,
      gmProgram,
      isPercussion,
      notesCount: chNotes.length,
      name,
    });
  }

  // Sort channel groups
  channels.sort((a, b) => a.channel - b.channel);

  return {
    bpm,
    timeSig,
    channels,
    totalNotes,
    tempoChangesCount,
    durationMs: maxTimeMs,
    cc64EventsByChannel,
  };
}
