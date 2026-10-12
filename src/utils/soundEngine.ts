import { zipAssetService } from '../services/zipAssetService';

/**
 * Synthesizes classic Minecraft Bedrock sound waves (block break, step, hit, explosion, chime, click, mobs, UI)
 * using Web Audio API with distinct frequencies and envelopes for EVERY sound category and event.
 */
class SoundTestEngine {
  private ctx: AudioContext | null = null;
  private audioCache = new Map<string, AudioBuffer>();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays custom or fetched audio buffer directly
   */
  async playBuffer(audioData: Uint8Array, volume: number = 1.0, pitch: number = 1.0): Promise<void> {
    const ctx = this.getContext();
    try {
      const arrayBuffer = audioData.buffer.slice(
        audioData.byteOffset,
        audioData.byteOffset + audioData.byteLength
      ) as ArrayBuffer;
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      source.playbackRate.value = Math.max(0.2, Math.min(3.0, pitch));
      gainNode.gain.value = Math.max(0, Math.min(2.0, volume));

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch {
      this.playProceduralSound('hit', 'default', volume, pitch);
    }
  }

  /**
   * Resolves sound event tag to real downloaded Minecraft .ogg sound recording
   */
  private resolveOggPath(soundId: string, eventName: string): string | null {
    const tag = `${soundId}.${eventName}`.toLowerCase();

    if (tag.includes('orb') || tag.includes('xp') || tag.includes('level')) return '/vanilla_sounds/orb.ogg';
    if (tag.includes('click') || tag.includes('press') || tag.includes('button')) return '/vanilla_sounds/click.ogg';
    if (tag.includes('explode') || tag.includes('tnt') || tag.includes('dragon')) return '/vanilla_sounds/explode1.ogg';
    if (tag.includes('bow')) return '/vanilla_sounds/bow.ogg';
    if (tag.includes('eat') || tag.includes('drink')) return '/vanilla_sounds/eat1.ogg';
    if (tag.includes('pop') || tag.includes('item.pickup')) return '/vanilla_sounds/pop.ogg';
    if (tag.includes('anvil') || tag.includes('iron') || tag.includes('metal')) return '/vanilla_sounds/anvil_use.ogg';
    if (tag.includes('chest_open') || (tag.includes('chest') && tag.includes('open'))) return '/vanilla_sounds/chest_open.ogg';
    if (tag.includes('chest_close') || (tag.includes('chest') && tag.includes('close'))) return '/vanilla_sounds/chest_closed.ogg';
    if (tag.includes('door')) return '/vanilla_sounds/door_open.ogg';
    if (tag.includes('stone') || tag.includes('cobble')) return '/vanilla_sounds/stone1.ogg';
    if (tag.includes('wood') || tag.includes('log') || tag.includes('plank')) return '/vanilla_sounds/wood1.ogg';
    if (tag.includes('grass') || tag.includes('leaf') || tag.includes('plant')) return '/vanilla_sounds/grass1.ogg';
    if (tag.includes('dirt') || tag.includes('gravel') || tag.includes('sand')) return '/vanilla_sounds/gravel1.ogg';
    if (tag.includes('zombie')) return '/vanilla_sounds/zombie_say1.ogg';
    if (tag.includes('skeleton')) return '/vanilla_sounds/skeleton_say1.ogg';
    if (tag.includes('creeper') || tag.includes('fuse')) return '/vanilla_sounds/creeper_fuse.ogg';
    if (tag.includes('villager')) return '/vanilla_sounds/villager_idle.ogg';

    return '/vanilla_sounds/click.ogg'; // Standard default audio file
  }

  /**
   * Plays genuine Minecraft .ogg sound file for the given sound event
   */
  async playSoundEvent(soundId: string, eventName: string, volume: number = 1.0, pitch: number = 1.0): Promise<void> {
    const ctx = this.getContext();
    const oggPath = this.resolveOggPath(soundId, eventName);

    if (oggPath) {
      try {
        if (!this.audioCache.has(oggPath)) {
          // 1. Attempt to read audio ArrayBuffer directly from vanilla_assets.zip
          const zipBuffer = await zipAssetService.getSoundAudioBuffer(oggPath);
          let arrayBuf: ArrayBuffer | null = zipBuffer;

          if (!arrayBuf) {
            try {
              const resp = await fetch(oggPath);
              if (resp.ok) {
                arrayBuf = await resp.arrayBuffer();
              }
            } catch {
              // Ignore network fetch error
            }
          }

          if (arrayBuf) {
            const decoded = await ctx.decodeAudioData(arrayBuf);
            this.audioCache.set(oggPath, decoded);
          }
        }

        const buffer = this.audioCache.get(oggPath);
        if (buffer) {
          const source = ctx.createBufferSource();
          const gainNode = ctx.createGain();

          source.buffer = buffer;
          source.playbackRate.value = Math.max(0.3, Math.min(2.5, pitch));
          gainNode.gain.value = Math.max(0, Math.min(2.0, volume * 0.7));

          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          source.start(0);
          return;
        }
      } catch (err) {
        console.warn('Ogg audio error, using procedural synth fallback:', err);
      }
    }

    // Always fallback synth if file is missing, decoding fails, or zip is loading
    let idHash = 0;
    for (let i = 0; i < soundId.length; i++) {
      idHash = (idHash << 5) - idHash + soundId.charCodeAt(i);
      idHash |= 0;
    }
    const uniqueFreqOffset = (Math.abs(idHash) % 300) - 150;
    this.playProceduralSound(soundId, eventName, volume, pitch, uniqueFreqOffset);
  }

  /**
   * Category and event-specific procedural synthesizer generating distinct Minecraft audio signatures
   */
  playProceduralSound(
    soundId: string,
    eventName: string,
    volume: number = 1.0,
    pitch: number = 1.0,
    freqOffset: number = 0
  ): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.45, now);
    gainNode.connect(ctx.destination);

    const fullTag = `${soundId}.${eventName}`.toLowerCase();

    if (fullTag.includes('amethyst') || fullTag.includes('chime') || fullTag.includes('bell') || fullTag.includes('orb')) {
      // Shimmering crystalline chime / XP orb
      const baseFreq = (880 + freqOffset) * pitch;
      [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.1, now + idx * 0.04 + 0.3);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.3, now + idx * 0.04);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

        osc.connect(subGain);
        subGain.connect(gainNode);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.35);
      });
    } else if (fullTag.includes('anvil') || fullTag.includes('iron') || fullTag.includes('metal') || fullTag.includes('copper')) {
      // Metallic clink / Anvil drop
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime((420 + freqOffset) * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.4);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200 * pitch, now);

      gainNode.gain.setValueAtTime(volume * 0.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (fullTag.includes('explode') || fullTag.includes('tnt') || fullTag.includes('dragon')) {
      // Heavy deep rumble explosion
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime((140 + freqOffset) * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.85);

      gainNode.gain.setValueAtTime(volume * 0.7, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (fullTag.includes('portal') || fullTag.includes('beacon') || fullTag.includes('enchant') || fullTag.includes('conduit')) {
      // Mystical warping synth
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((350 + freqOffset) * pitch, now);
      osc.frequency.linearRampToValueAtTime((700 + freqOffset) * pitch, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime((120 + freqOffset) * pitch, now + 0.6);

      gainNode.gain.setValueAtTime(volume * 0.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (fullTag.includes('mob') || fullTag.includes('zombie') || fullTag.includes('skeleton') || fullTag.includes('creeper') || fullTag.includes('villager')) {
      // Entity vocalization pitch pitch bend
      const osc = ctx.createOscillator();
      osc.type = fullTag.includes('skeleton') ? 'triangle' : 'sawtooth';
      const startF = (180 + freqOffset) * pitch;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.linearRampToValueAtTime(startF * 1.3, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(startF * 0.6, now + 0.4);

      gainNode.gain.setValueAtTime(volume * 0.45, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (fullTag.includes('water') || fullTag.includes('splash') || fullTag.includes('swim') || fullTag.includes('rain')) {
      // Fluid splash acoustic signature
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((600 + freqOffset) * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

      gainNode.gain.setValueAtTime(volume * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (fullTag.includes('break') || fullTag.includes('shatter') || fullTag.includes('hit')) {
      // Crunch / block break noise burst
      const bufferSize = ctx.sampleRate * 0.22;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.playbackRate.value = Math.max(0.4, pitch);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime((1500 + freqOffset) * pitch, now);

      noise.connect(filter);
      filter.connect(gainNode);
      noise.start(now);
    } else if (fullTag.includes('step') || fullTag.includes('walk')) {
      // Short ground thud
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((240 + freqOffset) * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      gainNode.gain.setValueAtTime(volume * 0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      // Clean UI click / default interaction pitch with unique ID frequency shift
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime((520 + freqOffset) * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

      gainNode.gain.setValueAtTime(volume * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }
}

export const soundEngine = new SoundTestEngine();
