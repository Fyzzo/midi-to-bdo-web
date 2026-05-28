// app/utils/audioSynth.ts

let noiseBuffer: AudioBuffer | null = null;

// Soundfont sampler cache for high-quality instruments
const sampleCache: Record<string, Record<number, AudioBuffer>> = {};

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNoteName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const name = NOTE_NAMES[pitch % 12];
  return `${name}${octave}`;
}

async function fetchAndCacheSample(ctx: AudioContext, instrument: string, pitch: number, noteName: string) {
  if (!sampleCache[instrument]) {
    sampleCache[instrument] = {};
  }
  if (sampleCache[instrument][pitch]) return;

  const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrument}-mp3/${noteName}.mp3`;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const arrayBuffer = await res.arrayBuffer();
    // Use new Promise-based decodeAudioData for robustness
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    sampleCache[instrument][pitch] = audioBuffer;
  } catch (err) {
    // Fail silently, fallback is always active
  }
}

/**
 * Background pre-fetcher for the browser's HTTP cache.
 * Scans the active composition notes and fetches their MP3 files
 * in the background so that they load instantly during playback.
 */
export function prefetchSamplesForSong(notes: { instId: number, pitch: number }[]) {
  const instrumentMap: Record<number, string> = {
    0x07: 'acoustic_grand_piano',
    0x11: 'acoustic_grand_piano',
    0x00: 'acoustic_guitar_nylon',
    0x0a: 'acoustic_guitar_nylon',
    0x01: 'flute',
    0x0b: 'flute'
  };

  const fetched = new Set<string>();

  for (const n of notes) {
    const instrument = instrumentMap[n.instId];
    if (instrument) {
      const noteName = getNoteName(n.pitch);
      const cacheKey = `${instrument}-${noteName}`;
      if (!fetched.has(cacheKey)) {
        fetched.add(cacheKey);
        const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrument}-mp3/${noteName}.mp3`;
        fetch(url).catch(() => {});
      }
    }
  }
}

/**
 * Generate a reusable white noise buffer for drums, percussion, and cymbals.
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

/**
 * Generate a waveshaper distortion curve for BDO electric guitars.
 */
let distortionCurve: Float32Array | null = null;
function getDistortionCurve(): Float32Array {
  if (distortionCurve) return distortionCurve;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const k = 40; // distortion amount
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  distortionCurve = curve;
  return distortionCurve;
}

/**
 * Converts a MIDI note number to its corresponding frequency in Hz.
 */
export function midiToFreq(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

/**
 * Synthesizes and schedules a single note for a BDO instrument.
 */
export function playBdoNote(
  ctx: AudioContext,
  dest: AudioNode,
  instId: number,
  pitch: number,
  velocity: number,
  time: number,
  duration: number
) {
  const velFactor = velocity / 127;
  // Master gain for this specific note
  const noteGain = ctx.createGain();
  noteGain.gain.setValueAtTime(0, time);
  noteGain.connect(dest);

  // Frequency mapping for melodic notes
  const freq = midiToFreq(pitch);

  // Check if instrument is percussion/drum (0x0d is Drum Set, 0x04 is Hand Drum, 0x05 is Cymbals)
  const isDrumInstrument = (instId === 0x0d || instId === 0x04 || instId === 0x05);

  if (isDrumInstrument) {
    playDrumSound(ctx, noteGain, pitch, velFactor, time);
    return;
  }

  // INTERCEPT HIGH-QUALITY SAMPLERS FOR PIANO, GUITAR, AND FLUTE
  const instrumentMap: Record<number, string> = {
    0x07: 'acoustic_grand_piano',
    0x11: 'acoustic_grand_piano',
    0x00: 'acoustic_guitar_nylon',
    0x0a: 'acoustic_guitar_nylon',
    0x01: 'flute',
    0x0b: 'flute'
  };

  const instrument = instrumentMap[instId];
  if (instrument) {
    const noteName = getNoteName(pitch);
    const cachedBuffer = sampleCache[instrument]?.[pitch];

    if (cachedBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = cachedBuffer;
      source.connect(noteGain);

      // Natural, smooth volume envelope for sampled note
      noteGain.gain.setValueAtTime(0, time);
      noteGain.gain.linearRampToValueAtTime(velFactor * 0.7, time + 0.005);
      noteGain.gain.setValueAtTime(velFactor * 0.7, time + Math.max(0, duration - 0.04));
      noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      source.start(time);
      source.stop(time + duration);
      return;
    } else {
      // Trigger async load for future plays
      fetchAndCacheSample(ctx, instrument, pitch, noteName);
      // Fall back seamlessly to synthesis so there is zero audio delay
    }
  }

  // Melodic Instrument routers fallback
  switch (instId) {
    case 0x07: // Beginner Piano
    case 0x11: // Florchestra Piano
      // Piano: bright attack, exponential decay decay envelope
      {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq, time);

        // Mix 70% sine, 30% triangle
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        gain1.gain.setValueAtTime(0.7, time);
        gain2.gain.setValueAtTime(0.3, time);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(noteGain);
        gain2.connect(noteGain);

        // Envelope: super fast attack, decay to low sustain or zero
        noteGain.gain.linearRampToValueAtTime(velFactor * 0.45, time + 0.003);
        
        const decayTime = Math.min(duration, 2.0);
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.005, time + decayTime);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + decayTime + 0.05);
        osc2.stop(time + decayTime + 0.05);
      }
      break;

    case 0x06: // Beginner Harp
    case 0x10: // Florchestra Harp
      // Harp: extremely clean, fast pluck, faster decay
      {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(noteGain);

        noteGain.gain.linearRampToValueAtTime(velFactor * 0.4, time + 0.002);
        const decayTime = Math.min(duration, 1.2);
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.001, time + decayTime);

        osc.start(time);
        osc.stop(time + decayTime + 0.05);
      }
      break;

    case 0x00: // Beginner Guitar
    case 0x0a: // Florchestra Acoustic Guitar
      // Acoustic Guitar: Triangle + soft Sawtooth pluck
      {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq, time);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, time);

        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        gain1.gain.setValueAtTime(0.8, time);
        gain2.gain.setValueAtTime(0.2, time);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(filter);
        gain2.connect(filter);
        filter.connect(noteGain);

        noteGain.gain.linearRampToValueAtTime(velFactor * 0.35, time + 0.005);
        const decayTime = Math.min(duration, 1.5);
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.002, time + decayTime);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + decayTime + 0.05);
        osc2.stop(time + decayTime + 0.05);
      }
      break;

    case 0x24: // Guitar Silver Wave
    case 0x25: // Guitar Highway
    case 0x26: // Guitar Hexe Glam
      // Electric Guitar: distorted sawtooth wave with a sharp pluck
      {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        const distortion = ctx.createWaveShaper();
        distortion.curve = getDistortionCurve();
        distortion.oversample = '4x';

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, time);

        osc.connect(distortion);
        distortion.connect(filter);
        filter.connect(noteGain);

        noteGain.gain.linearRampToValueAtTime(velFactor * 0.15, time + 0.004); // distortion is naturally loud
        const decayTime = Math.min(duration, 1.8);
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.001, time + decayTime);

        osc.start(time);
        osc.stop(time + decayTime + 0.05);
      }
      break;

    case 0x08: // Beginner Violin
    case 0x12: // Florchestra Violin
    case 0x0f: // Florchestra Contrabass
    case 0x0e: // Marnibass
      // Strings: bowed sawtooth wave, soft attack, sustained, LFO vibrato
      {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        // Low-pass filter to make it sound like a body resonator
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Contrabass has lower resonance frequency
        const isBass = (instId === 0x0f || instId === 0x0e);
        filter.frequency.setValueAtTime(isBass ? 500 : 1400, time);

        // LFO Vibrato (6Hz)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(isBass ? 5.0 : 6.0, time);
        lfoGain.gain.setValueAtTime(freq * 0.012, time); // vibrato depth is 1.2% of pitch frequency

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(filter);
        filter.connect(noteGain);

        // Bow envelope: slower attack
        const attack = isBass ? 0.08 : 0.04;
        const release = 0.15;
        
        noteGain.gain.linearRampToValueAtTime(velFactor * 0.28, time + attack);
        noteGain.gain.setValueAtTime(velFactor * 0.28, time + Math.max(duration - release, attack));
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.001, time + duration);

        lfo.start(time);
        osc.start(time);
        lfo.stop(time + duration);
        osc.stop(time + duration);
      }
      break;

    case 0x01: // Beginner Flute
    case 0x02: // Beginner Recorder
    case 0x0b: // Florchestra Flute
    case 0x27: // Florchestra Clarinet
    case 0x28: // Florchestra Horn
      // Wind Instruments: sine + triangle, slow attack, vibrato
      {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq, time);

        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        gain1.gain.setValueAtTime(0.8, time);
        gain2.gain.setValueAtTime(0.2, time);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, time);

        // 5.5Hz vibrato
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, time);
        lfoGain.gain.setValueAtTime(freq * 0.008, time); // subtle pitch vibrato

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(filter);
        gain2.connect(filter);
        filter.connect(noteGain);

        const attack = 0.05;
        const release = 0.1;

        noteGain.gain.linearRampToValueAtTime(velFactor * 0.3, time + attack);
        noteGain.gain.setValueAtTime(velFactor * 0.3, time + Math.max(duration - release, attack));
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.001, time + duration);

        lfo.start(time);
        osc1.start(time);
        osc2.start(time);
        lfo.stop(time + duration);
        osc1.stop(time + duration);
        osc2.stop(time + duration);
      }
      break;

    case 0x13: // Handpan
    case 0x14: // Marnian Wavy Planet
    case 0x18: // Marnian Illusion Tree
    case 0x1c: // Marnian Secret Note
    case 0x20: // Marnian Sandwich
      // Handpan / Marnian Synths: FM Synthesis (Carrier & Modulator)
      {
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();

        carrier.type = 'sine';
        modulator.type = 'sine';

        carrier.frequency.setValueAtTime(freq, time);
        modulator.frequency.setValueAtTime(freq * 2.003, time); // harmonic modulator slightly detuned

        // FM depth
        modGain.gain.setValueAtTime(freq * 0.6, time);
        modGain.gain.exponentialRampToValueAtTime(freq * 0.001, time + Math.min(duration, 1.5));

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(noteGain);

        noteGain.gain.linearRampToValueAtTime(velFactor * 0.32, time + 0.005);
        const decayTime = Math.min(duration, 2.0);
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.001, time + decayTime);

        modulator.start(time);
        carrier.start(time);
        modulator.stop(time + decayTime + 0.05);
        carrier.stop(time + decayTime + 0.05);
      }
      break;

    default: // Fallback
      {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(noteGain);

        noteGain.gain.linearRampToValueAtTime(velFactor * 0.3, time + 0.005);
        noteGain.gain.exponentialRampToValueAtTime(velFactor * 0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration + 0.05);
      }
  }
}

/**
 * Synthesizes a drum or cymbal trigger based on BDO note pitch.
 */
function playDrumSound(
  ctx: AudioContext,
  noteGain: AudioNode,
  pitch: number,
  velFactor: number,
  time: number
) {
  // Drum trigger types
  switch (pitch) {
    case 48: // Kick Drum (Low swept sine)
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

        osc.connect(gain);
        gain.connect(noteGain);

        gain.gain.setValueAtTime(velFactor * 0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        noteGain.gain.setValueAtTime(1.0, time);

        osc.start(time);
        osc.stop(time + 0.15);
      }
      break;

    case 50: // Snare Drum (White Noise + Triangle Pluck)
      {
        // 1. Noise part
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1000, time);
        noiseFilter.Q.setValueAtTime(1.5, time);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velFactor * 0.35, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(noteGain);

        // 2. Fundamental snap part
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(velFactor * 0.45, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(oscGain);
        oscGain.connect(noteGain);

        noteGain.gain.setValueAtTime(1.0, time);

        noise.start(time);
        osc.start(time);
        noise.stop(time + 0.15);
        osc.stop(time + 0.15);
      }
      break;

    case 54: // Closed Hi-Hat (Filtered White Noise Burst)
    case 56:
    case 58:
      {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velFactor * 0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(noteGain);

        noteGain.gain.setValueAtTime(1.0, time);

        noise.start(time);
        noise.stop(time + 0.05);
      }
      break;

    case 42: // Open Hi-Hat (Slightly longer decay noise burst)
    case 46:
      {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6500, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velFactor * 0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(noteGain);

        noteGain.gain.setValueAtTime(1.0, time);

        noise.start(time);
        noise.stop(time + 0.25);
      }
      break;

    case 49: // Crash Cymbal (Long bright noise)
    case 57:
    case 61:
      {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5000, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velFactor * 0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(noteGain);

        noteGain.gain.setValueAtTime(1.0, time);

        noise.start(time);
        noise.stop(time + 1.0);
      }
      break;

    case 51: // Toms (Pitch swept triangle)
    case 55:
    case 60:
      {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        
        const startFreq = pitch === 51 ? 160 : (pitch === 55 ? 130 : 100);
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, time + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velFactor * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gain);
        gain.connect(noteGain);

        noteGain.gain.setValueAtTime(1.0, time);

        osc.start(time);
        osc.stop(time + 0.18);
      }
      break;

    case 53: // Ride Cymbal (High-frequency ping + noise)
    case 59:
    case 62:
      {
        // Ping
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2600, time);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(velFactor * 0.15, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(oscGain);
        oscGain.connect(noteGain);

        // Noise body
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, time);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velFactor * 0.06, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(noteGain);

        noteGain.gain.setValueAtTime(1.0, time);

        osc.start(time);
        noise.start(time);
        osc.stop(time + 0.20);
        noise.stop(time + 0.20);
      }
      break;

    default: // Hand Drum default
      {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velFactor * 0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(gain);
        gain.connect(noteGain);

        noteGain.gain.setValueAtTime(1.0, time);

        osc.start(time);
        osc.stop(time + 0.1);
      }
  }
}
