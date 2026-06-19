/**
 * Notifikasi suara untuk absensi menggunakan Web Audio API
 * Tidak perlu file audio eksternal — suara di-generate real-time
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Mainkan nada notifikasi absensi berhasil
 * Suara: chord happy ascending (C5-E5-G5) dengan efek fade-out
 */
export function playAbsensiSuccess(): void {
  try {
    const ctx = getAudioContext();

    // Resume context jika suspended (kebijakan autoplay browser)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // === Nada 1: C5 (523 Hz) ===
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 523.25;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // === Nada 2: E5 (659 Hz) — delay 0.1s ===
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 659.25;
    gain2.gain.setValueAtTime(0.3, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);

    // === Nada 3: G5 (784 Hz) — delay 0.2s ===
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.value = 783.99;
    gain3.gain.setValueAtTime(0.3, now + 0.2);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.2);
    osc3.stop(now + 0.6);
  } catch {
    // Silent fail — notifikasi suara bersifat opsional
  }
}
