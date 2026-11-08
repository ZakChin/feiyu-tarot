/**
 * The card-storm transition: a short canvas overlay that swirls a handful of
 * card backs, then flies three of them into the measured spread slots.
 */

export const STORM_MS = 2080;
const SPIN_MS = 1100;
const LAND_MS = 520;
const FADE_MS = 460;
const SPRITE_W = 220;
const SPRITE_H = 352;

export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(from, to, t) {
  return from + (to - from) * t;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeParticles(count, seed) {
  const random = typeof seed === 'number' ? mulberry32(seed) : Math.random;
  const particles = [];
  for (let index = 0; index < count; index += 1) {
    particles.push({
      angle: random() * Math.PI * 2,
      radius: 0.2 + random() * 0.42,
      speed: (0.5 + random() * 1.5) * (random() < 0.5 ? -1 : 1),
      spin: (random() * 2 - 1) * 0.9,
      size: 0.5 + random() * 0.55,
      alpha: 0.55 + random() * 0.45
    });
  }
  return particles;
}

function roundedRect(g, x, y, width, height, radius) {
  g.beginPath();
  g.moveTo(x + radius, y);
  g.lineTo(x + width - radius, y);
  g.quadraticCurveTo(x + width, y, x + width, y + radius);
  g.lineTo(x + width, y + height - radius);
  g.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  g.lineTo(x + radius, y + height);
  g.quadraticCurveTo(x, y + height, x, y + height - radius);
  g.lineTo(x, y + radius);
  g.quadraticCurveTo(x, y, x + radius, y);
  g.closePath();
}

function drawBackSprite(g) {
  g.clearRect(0, 0, SPRITE_W, SPRITE_H);
  const gradient = g.createLinearGradient(0, 0, 0, SPRITE_H);
  gradient.addColorStop(0, '#1b1020');
  gradient.addColorStop(0.55, '#0d0912');
  gradient.addColorStop(1, '#050308');
  roundedRect(g, 2, 2, SPRITE_W - 4, SPRITE_H - 4, 16);
  g.fillStyle = gradient;
  g.fill();
  g.strokeStyle = 'rgba(201,161,90,.8)';
  g.lineWidth = 2.5;
  g.stroke();
  roundedRect(g, 10, 10, SPRITE_W - 20, SPRITE_H - 20, 11);
  g.strokeStyle = 'rgba(201,161,90,.26)';
  g.lineWidth = 1;
  g.stroke();
  roundedRect(g, 16, 16, SPRITE_W - 32, SPRITE_H - 32, 8);
  g.strokeStyle = 'rgba(176,58,74,.32)';
  g.lineWidth = 1;
  g.stroke();

  g.beginPath();
  g.moveTo(58, 306);
  g.lineTo(58, 160);
  g.bezierCurveTo(58, 104, 78, 70, 110, 48);
  g.bezierCurveTo(142, 70, 162, 104, 162, 160);
  g.lineTo(162, 306);
  g.strokeStyle = 'rgba(201,161,90,.55)';
  g.lineWidth = 2;
  g.stroke();

  const cx = 110;
  const cy = 152;
  g.beginPath();
  g.arc(cx, cy, 34, 0, Math.PI * 2);
  g.strokeStyle = 'rgba(201,161,90,.55)';
  g.lineWidth = 1.6;
  g.stroke();
  g.beginPath();
  g.arc(cx, cy, 16, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(angle) * 16, cy + Math.sin(angle) * 16);
    g.lineTo(cx + Math.cos(angle) * 34, cy + Math.sin(angle) * 34);
    g.stroke();
  }
  g.beginPath();
  g.arc(cx, cy, 4, 0, Math.PI * 2);
  g.fillStyle = 'rgba(201,161,90,.9)';
  g.fill();

  g.beginPath();
  g.arc(126, 226, 26, Math.PI * 0.35, Math.PI * 1.65);
  g.arc(120, 226, 26, Math.PI * 1.55, Math.PI * 0.45, true);
  g.fillStyle = 'rgba(201,161,90,.8)';
  g.fill();

  const stars = [
    [42, 52, 1.6], [178, 70, 1.3], [36, 118, 1.1], [182, 132, 1.5],
    [50, 252, 1.4], [170, 268, 1.2], [70, 320, 1.1], [152, 316, 1.4]
  ];
  g.fillStyle = 'rgba(232,220,200,.75)';
  for (const star of stars) {
    g.beginPath();
    g.arc(star[0], star[1], star[2], 0, Math.PI * 2);
    g.fill();
  }

  const sheen = g.createLinearGradient(0, 0, SPRITE_W, SPRITE_H);
  sheen.addColorStop(0, 'rgba(255,134,200,.16)');
  sheen.addColorStop(0.28, 'rgba(255,211,110,.13)');
  sheen.addColorStop(0.55, 'rgba(155,255,155,.1)');
  sheen.addColorStop(0.8, 'rgba(106,215,255,.13)');
  sheen.addColorStop(1, 'rgba(181,140,255,.16)');
  g.save();
  g.globalCompositeOperation = 'screen';
  roundedRect(g, 2, 2, SPRITE_W - 4, SPRITE_H - 4, 16);
  g.fillStyle = sheen;
  g.fill();
  g.restore();
}

function fallbackTargets(width, height) {
  const cardWidth = Math.max(52, Math.min(140, (width - 48) / 3.5));
  const cardHeight = cardWidth * (SPRITE_H / SPRITE_W);
  const gap = cardWidth * 0.18;
  const total = cardWidth * 3 + gap * 2;
  const left = width / 2 - total / 2;
  const top = height / 2 - cardHeight / 2;
  return [0, 1, 2].map((index) => ({
    x: left + index * (cardWidth + gap),
    y: top,
    w: cardWidth,
    h: cardHeight
  }));
}

export function CardStorm({ targets, onDone, t }) {
  const canvasRef = React.useRef(null);
  const finishRef = React.useRef(() => {});
  const doneRef = React.useRef(onDone);
  doneRef.current = onDone;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const host = canvas.parentElement || canvas;
    const g = canvas.getContext('2d');
    if (!g) {
      doneRef.current();
      return undefined;
    }

    let reduced = false;
    try {
      reduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
      reduced = false;
    }
    if (reduced) {
      doneRef.current();
      return undefined;
    }

    const sprite = document.createElement('canvas');
    sprite.width = SPRITE_W;
    sprite.height = SPRITE_H;
    drawBackSprite(sprite.getContext('2d'));

    const glowSprite = document.createElement('canvas');
    glowSprite.width = 128;
    glowSprite.height = 128;
    {
      const glowCtx = glowSprite.getContext('2d');
      const glowGradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      glowGradient.addColorStop(0, 'rgba(255,255,255,.95)');
      glowGradient.addColorStop(0.22, 'rgba(255,238,196,.55)');
      glowGradient.addColorStop(0.55, 'rgba(201,161,90,.2)');
      glowGradient.addColorStop(1, 'rgba(201,161,90,0)');
      glowCtx.fillStyle = glowGradient;
      glowCtx.fillRect(0, 0, 128, 128);
    }

    let width = 1;
    let height = 1;
    let raf = 0;
    let finished = false;
    let observer = null;

    function resize() {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const particles = makeParticles(42, 0x7a5e);
    const landing = (() => {
      const reported = typeof targets === 'function' ? targets() : null;
      const valid = (reported || []).filter((item) => item && item.w > 1 && item.h > 1);
      return valid.length === 3 ? valid : fallbackTargets(width, height);
    })();
    const origin = { x: width / 2, y: height * 0.46 };
    const maxRadius = Math.min(width, height) * 0.68;
    const baseWidth = Math.max(34, Math.min(width, height) * 0.15);

    function orbitOf(particle, elapsed) {
      const spin = clamp(elapsed / SPIN_MS, 0, 1);
      const radius = maxRadius * particle.radius * (1 - 0.5 * easeInOutCubic(spin));
      const angle = particle.angle + particle.speed * (elapsed / 1000) * (1 + spin * 2.8);
      const depth = Math.sin(angle);
      const persp = 1 / (1 - depth * 0.34);
      const band = (particle.radius - 0.8) * maxRadius * 0.55 * (1 - 0.45 * spin);
      return {
        x: origin.x + Math.cos(angle) * radius * persp,
        y: origin.y + depth * radius * 0.44 * persp + band * (0.5 + 0.5 * persp),
        angle,
        radius,
        depth,
        persp
      };
    }

    const deck = {
      x: origin.x,
      y: height - 14,
      w: Math.min(baseWidth * 1.5, width * 0.32)
    };
    const deckHeight = deck.w * (SPRITE_H / SPRITE_W);
    const heroStarts = [0, 1, 2].map((index) => ({
      x: deck.x + (index - 1) * 3,
      y: deck.y - deckHeight / 2 - 2 - index * 2.5,
      w: baseWidth * 0.94
    }));
    const started = performance.now();
    const flyers = [];

    function draw(now) {
      if (finished) return;
      const elapsed = now - started;
      const landT = clamp((elapsed - SPIN_MS) / LAND_MS, 0, 1);
      const eased = easeOutCubic(landT);
      const fade = 1 - clamp((elapsed - SPIN_MS) / (FADE_MS + 380), 0, 1);
      const overlay = 1 - clamp((elapsed - (STORM_MS - 320)) / 320, 0, 1);
      host.style.opacity = String(overlay);
      g.clearRect(0, 0, width, height);

      const vignette = g.createRadialGradient(
        origin.x, origin.y, maxRadius * 0.15,
        origin.x, origin.y, maxRadius * 1.25
      );
      vignette.addColorStop(0, 'rgba(5,3,8,0)');
      vignette.addColorStop(0.7, 'rgba(5,3,8,.35)');
      vignette.addColorStop(1, 'rgba(3,2,5,.92)');
      g.fillStyle = vignette;
      g.fillRect(0, 0, width, height);

      g.save();
      g.globalCompositeOperation = 'lighter';
      const core = g.createRadialGradient(
        origin.x, origin.y, 0,
        origin.x, origin.y, maxRadius * 0.55
      );
      core.addColorStop(0, 'rgba(255,244,210,.9)');
      core.addColorStop(0.12, 'rgba(226,180,102,.5)');
      core.addColorStop(0.4, 'rgba(176,58,74,.18)');
      core.addColorStop(1, 'rgba(176,58,74,0)');
      g.fillStyle = core;
      g.fillRect(0, 0, width, height);
      g.restore();

      const spinPhase = elapsed * 0.0018;
      g.save();
      for (let arm = 0; arm < 3; arm += 1) {
        g.beginPath();
        for (let step = 0; step <= 40; step += 1) {
          const t = step / 40;
          const radius = 12 + t * maxRadius * 0.92;
          const angle = spinPhase + arm * (Math.PI * 2 / 3) + t * Math.PI * 1.7;
          const depth = Math.sin(angle);
          const persp = 1 / (1 - depth * 0.34);
          const x = origin.x + Math.cos(angle) * radius * persp;
          const y = origin.y + depth * radius * 0.44 * persp;
          if (step === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokeStyle = arm === 1 ? 'rgba(201,161,90,.2)' : 'rgba(140,90,150,.16)';
        g.lineWidth = arm === 1 ? 2 : 1.4;
        g.stroke();
      }
      for (let ring = 0; ring < 3; ring += 1) {
        const rr = maxRadius * (0.32 + ring * 0.2) * (1 - 0.18 * eased);
        g.beginPath();
        g.ellipse(origin.x, origin.y, rr, rr * 0.42, 0, 0, Math.PI * 2);
        g.strokeStyle = ring === 1 ? 'rgba(176,58,74,.16)' : 'rgba(201,161,90,.12)';
        g.lineWidth = 1;
        g.stroke();
      }
      g.restore();

      flyers.length = 0;
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const spot = orbitOf(particle, elapsed);
        const alpha = particle.alpha * (0.5 + 0.5 * clamp(1 - spot.radius / maxRadius, 0, 1)) * fade;
        if (alpha <= 0.01) continue;
        flyers.push({
          x: spot.x,
          y: spot.y,
          cardWidth: baseWidth * particle.size * spot.persp,
          rotation: particle.spin * (1 + (elapsed / 1000) * 1.7) + Math.cos(spot.angle) * 0.32,
          alpha,
          depth: spot.depth,
          glow: Math.sin(spot.angle) > 0.5
        });
      }
      flyers.sort((a, b) => a.depth - b.depth);

      for (const flyer of flyers) {
        const cardHeight = flyer.cardWidth * (SPRITE_H / SPRITE_W);
        if (flyer.glow) {
          const glowSize = flyer.cardWidth * 2.1;
          g.save();
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = flyer.alpha * 0.14;
          g.drawImage(glowSprite, flyer.x - glowSize / 2, flyer.y - glowSize / 2, glowSize, glowSize);
          g.restore();
        }
        g.save();
        g.globalAlpha = flyer.alpha;
        g.translate(flyer.x, flyer.y);
        g.rotate(flyer.rotation);
        g.drawImage(sprite, -flyer.cardWidth / 2, -cardHeight / 2, flyer.cardWidth, cardHeight);
        g.restore();
      }

      const deckAlpha = 1 - clamp((elapsed - (SPIN_MS + 120)) / (LAND_MS + 260), 0, 1);
      if (deckAlpha > 0.01) {
        const bob = Math.sin(elapsed / 380) * 2.2;
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = deckAlpha * 0.38;
        const halo = deck.w * 3.4;
        g.drawImage(glowSprite, deck.x - halo / 2, deck.y - deckHeight / 2 - halo / 2 + bob, halo, halo);
        g.restore();
        for (let layer = 0; layer <= 5; layer += 1) {
          const jitter = (1 - clamp(elapsed / SPIN_MS, 0, 1)) * Math.sin(elapsed / 74 + layer * 1.9) * 1.8;
          g.save();
          g.globalAlpha = deckAlpha * (0.5 + 0.09 * layer);
          g.translate(deck.x - deck.w / 2 + jitter, deck.y - deckHeight - layer * 1.9 + bob);
          g.drawImage(sprite, 0, 0, deck.w, deckHeight);
          g.restore();
        }
      }

      for (let index = 0; index < landing.length; index += 1) {
        const target = landing[index];
        const delay = index * 110;
        const flight = clamp((elapsed - SPIN_MS - delay) / Math.max(1, LAND_MS - 110), 0, 1);
        if (flight <= 0) continue;
        const ease = easeOutCubic(flight);
        const start = heroStarts[index] || heroStarts[0];
        const tx = target.x + target.w / 2;
        const ty = target.y + target.h / 2;
        const controlX = start.x + (tx - start.x) * 0.3;
        const controlY = start.y - maxRadius * 0.58;
        const u = 1 - ease;
        const x = u * u * start.x + 2 * u * ease * controlX + ease * ease * tx;
        const y = u * u * start.y + 2 * u * ease * controlY + ease * ease * ty;
        const cardWidth = lerp(start.w, target.w, ease) * (1 + 0.26 * Math.sin(Math.PI * flight));
        const rotation = (1 - ease) * (index === 1 ? 1 : -1) * Math.PI * 1.2;
        const cardHeight = cardWidth * (SPRITE_H / SPRITE_W);

        for (let ghost = 1; ghost <= 3; ghost += 1) {
          const back = clamp(flight - ghost * 0.035, 0, 1);
          if (back <= 0) continue;
          const ge = easeOutCubic(back);
          const gu = 1 - ge;
          const gx = gu * gu * start.x + 2 * gu * ge * controlX + ge * ge * tx;
          const gy = gu * gu * start.y + 2 * gu * ge * controlY + ge * ge * ty;
          g.save();
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 0.15 / ghost;
          const ghostSize = start.w * (2.1 - ghost * 0.2);
          g.drawImage(glowSprite, gx - ghostSize / 2, gy - ghostSize / 2, ghostSize, ghostSize);
          g.restore();
        }

        g.save();
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.26 + 0.5 * ease;
        const glowSize = cardWidth * (2.4 + ease * 1.4);
        g.drawImage(glowSprite, x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
        g.restore();

        g.save();
        g.translate(x, y);
        g.rotate(rotation);
        g.drawImage(sprite, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        g.restore();
      }

      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let index = 0; index < landing.length; index += 1) {
        const target = landing[index];
        const at = SPIN_MS + index * 110 + (LAND_MS - 110) * 0.72;
        const burst = clamp((elapsed - at) / 300, 0, 1);
        if (burst <= 0) continue;
        const cx = target.x + target.w / 2;
        const cy = target.y + target.h / 2;
        const size = target.w * (2.2 + burst * 3.6);
        g.globalAlpha = Math.pow(burst, 1.5) * 0.95;
        g.drawImage(glowSprite, cx - size / 2, cy - size / 2, size, size);
        g.globalAlpha = Math.pow(burst, 2) * 0.9;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(cx, cy, target.w * 0.32 * burst, 0, Math.PI * 2);
        g.fill();
      }
      const veil = clamp((elapsed - (STORM_MS - 340)) / 340, 0, 1);
      if (veil > 0) {
        g.globalAlpha = veil * 0.55;
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, width, height);
      }
      g.restore();

      if (elapsed >= STORM_MS) {
        finish();
        return;
      }
      raf = window.requestAnimationFrame(draw);
    }

    function cleanup() {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      if (observer) observer.disconnect();
      observer = null;
      window.removeEventListener('keydown', onKey);
    }

    function finish(skipped) {
      if (finished) return;
      finished = true;
      cleanup();
      doneRef.current(skipped === true);
    }
    finishRef.current = finish;

    function onKey(event) {
      if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        finish(true);
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => resize());
      observer.observe(host);
    }
    window.addEventListener('keydown', onKey);
    raf = window.requestAnimationFrame(draw);

    return cleanup;
  }, []);

  return h(
    'div',
    { className: 'dsh-tarot-storm', onClick: () => finishRef.current(true) },
    h('canvas', { className: 'dsh-tarot-storm-canvas', ref: canvasRef, 'aria-hidden': 'true' }),
    h('p', { className: 'dsh-tarot-storm-hint' }, t('storm.hint')),
    h(
      'button',
      {
        type: 'button',
        className: 'dsh-tarot-storm-skip',
        onClick: (event) => {
          event.stopPropagation();
          finishRef.current();
        }
      },
      t('storm.skip')
    )
  );
}
