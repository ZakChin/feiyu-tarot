/**
 * Synthesised charge-up for the card storm: a rising sweep, a low rumble and
 * three fly-out whooshes, closing on a bright shimmer. No media files are
 * shipped; every entry point is a no-op when Web Audio is unavailable.
 */
let sharedContext = null;

function audioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedContext || sharedContext.state === 'closed') {
    try {
      sharedContext = new AudioCtor();
    } catch (error) {
      return null;
    }
  }
  return sharedContext;
}

function noiseBuffer(context, seconds) {
  const length = Math.ceil(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let smoothed = 0;
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    smoothed = (smoothed + 0.04 * white) / 1.04;
    data[index] = smoothed * 3.2;
  }
  return buffer;
}

export function playCharge({ durationMs = 2080, landingMs = 1100 } = {}) {
  const context = audioContext();
  if (!context) return () => {};
  try {
    if (context.state === 'suspended') context.resume();
    const start = context.currentTime + 0.02;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.42, start + 0.08);
    master.connect(context.destination);

    const nodes = [];
    const track = (node) => {
      nodes.push(node);
      return node;
    };

    const charge = track(context.createOscillator());
    charge.type = 'sawtooth';
    charge.frequency.setValueAtTime(68, start);
    charge.frequency.exponentialRampToValueAtTime(540, start + 1.15);
    const chargeFilter = track(context.createBiquadFilter());
    chargeFilter.type = 'lowpass';
    chargeFilter.Q.value = 7;
    chargeFilter.frequency.setValueAtTime(260, start);
    chargeFilter.frequency.exponentialRampToValueAtTime(3400, start + 1.15);
    const chargeGain = track(context.createGain());
    chargeGain.gain.setValueAtTime(0.0001, start);
    chargeGain.gain.exponentialRampToValueAtTime(0.16, start + 1.0);
    chargeGain.gain.exponentialRampToValueAtTime(0.0001, start + 1.3);
    charge.connect(chargeFilter);
    chargeFilter.connect(chargeGain);
    chargeGain.connect(master);
    charge.start(start);
    charge.stop(start + 1.32);

    const sub = track(context.createOscillator());
    sub.type = 'sine';
    sub.frequency.setValueAtTime(42, start);
    sub.frequency.exponentialRampToValueAtTime(74, start + 1.1);
    const subGain = track(context.createGain());
    subGain.gain.setValueAtTime(0.0001, start);
    subGain.gain.exponentialRampToValueAtTime(0.18, start + 0.85);
    subGain.gain.exponentialRampToValueAtTime(0.0001, start + 1.22);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start(start);
    sub.stop(start + 1.24);

    const air = track(context.createBufferSource());
    air.buffer = noiseBuffer(context, 1.4);
    const airFilter = track(context.createBiquadFilter());
    airFilter.type = 'bandpass';
    airFilter.Q.value = 1.1;
    airFilter.frequency.setValueAtTime(220, start);
    airFilter.frequency.exponentialRampToValueAtTime(2900, start + 1.12);
    const airGain = track(context.createGain());
    airGain.gain.setValueAtTime(0.0001, start);
    airGain.gain.exponentialRampToValueAtTime(0.09, start + 0.95);
    airGain.gain.exponentialRampToValueAtTime(0.0001, start + 1.3);
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(master);
    air.start(start);
    air.stop(start + 1.32);

    const flyAt = start + Math.max(0.7, landingMs / 1000);
    for (let index = 0; index < 3; index += 1) {
      const at = flyAt + index * 0.13;
      const whoosh = track(context.createBufferSource());
      whoosh.buffer = noiseBuffer(context, 0.32);
      const whooshFilter = track(context.createBiquadFilter());
      whooshFilter.type = 'bandpass';
      whooshFilter.Q.value = 1.6;
      whooshFilter.frequency.setValueAtTime(2200, at);
      whooshFilter.frequency.exponentialRampToValueAtTime(420, at + 0.3);
      const whooshGain = track(context.createGain());
      whooshGain.gain.setValueAtTime(0.0001, at);
      whooshGain.gain.exponentialRampToValueAtTime(0.1, at + 0.04);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(master);
      whoosh.start(at);
      whoosh.stop(at + 0.32);
    }

    const impactAt = start + Math.max(1.3, durationMs / 1000 - 0.18);
    [1318.5, 1760, 2637].forEach((frequency, index) => {
      const bell = track(context.createOscillator());
      bell.type = 'sine';
      bell.frequency.setValueAtTime(frequency, impactAt + index * 0.01);
      const bellGain = track(context.createGain());
      bellGain.gain.setValueAtTime(0.0001, impactAt);
      bellGain.gain.exponentialRampToValueAtTime(0.09 / (index + 1), impactAt + 0.012);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, impactAt + 0.9);
      bell.connect(bellGain);
      bellGain.connect(master);
      bell.start(impactAt);
      bell.stop(impactAt + 0.95);
    });

    const boom = track(context.createOscillator());
    boom.type = 'sine';
    boom.frequency.setValueAtTime(96, impactAt);
    boom.frequency.exponentialRampToValueAtTime(34, impactAt + 0.5);
    const boomGain = track(context.createGain());
    boomGain.gain.setValueAtTime(0.0001, impactAt);
    boomGain.gain.exponentialRampToValueAtTime(0.24, impactAt + 0.02);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, impactAt + 0.65);
    boom.connect(boomGain);
    boomGain.connect(master);
    boom.start(impactAt);
    boom.stop(impactAt + 0.7);

    const sparkle = track(context.createBufferSource());
    sparkle.buffer = noiseBuffer(context, 0.5);
    const sparkleFilter = track(context.createBiquadFilter());
    sparkleFilter.type = 'highpass';
    sparkleFilter.frequency.value = 2400;
    const sparkleGain = track(context.createGain());
    sparkleGain.gain.setValueAtTime(0.0001, impactAt);
    sparkleGain.gain.exponentialRampToValueAtTime(0.07, impactAt + 0.02);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, impactAt + 0.5);
    sparkle.connect(sparkleFilter);
    sparkleFilter.connect(sparkleGain);
    sparkleGain.connect(master);
    sparkle.start(impactAt);
    sparkle.stop(impactAt + 0.52);

    return function stop() {
      try {
        const now = context.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0.0001, now, 0.05);
        window.setTimeout(() => {
          for (const node of nodes) {
            try {
              if (typeof node.stop === 'function') node.stop();
            } catch (error) {
              /* already stopped */
            }
            try {
              node.disconnect();
            } catch (error) {
              /* already disconnected */
            }
          }
          try {
            master.disconnect();
          } catch (error) {
            /* already disconnected */
          }
        }, 320);
      } catch (error) {
        /* audio is best effort */
      }
    };
  } catch (error) {
    return () => {};
  }
}
