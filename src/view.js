/**
 * Client view for the daily tarot panel: gothic card art, the spread, the
 * reading (per-card assertions + verdict) and the local history.
 */

const DECK_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
const TOPIC_BY_ID = new Map(TOPICS.map((topic) => [topic.id, topic]));
const POSITION_KEYS = ['past', 'present', 'future'];
const HISTORY_LIMIT = 60;

export const CSS = `
.dsh-tarot-root {
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
  height: 100%;
  overflow-y: auto;
  padding: 30px clamp(18px, 4vw, 48px) 64px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: "Cormorant Garamond", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif;
  line-height: 1.6;
}
.dsh-tarot-root * { box-sizing: border-box; }
.dsh-tarot-sky {
  position: sticky;
  top: 0;
  z-index: 0;
  height: 0;
  pointer-events: none;
}
.dsh-tarot-sky svg {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 100%;
  height: 100vh;
}
.dsh-tarot-sky::before {
  content: "";
  position: absolute;
  top: 0;
  left: -20%;
  width: 140%;
  height: 100vh;
  background:
    radial-gradient(45% 32% at 30% 35%, rgba(93, 143, 184, .18) 0%, rgba(93, 143, 184, 0) 70%),
    radial-gradient(40% 30% at 70% 62%, rgba(201, 161, 90, .11) 0%, rgba(201, 161, 90, 0) 70%);
  animation: dsh-tarot-sky-aurora 26s ease-in-out infinite alternate;
}
.dsh-tarot-sky::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-image:
    radial-gradient(circle at 12% 24%, rgba(255, 243, 196, .55) 0 1px, transparent 1.6px),
    radial-gradient(circle at 64% 18%, rgba(255, 243, 196, .4) 0 1px, transparent 1.7px),
    radial-gradient(circle at 38% 72%, rgba(255, 243, 196, .45) 0 1.2px, transparent 1.9px),
    radial-gradient(circle at 82% 62%, rgba(255, 243, 196, .35) 0 1px, transparent 1.6px);
  background-size: 260px 210px, 340px 280px, 300px 250px, 420px 360px;
  opacity: .55;
  animation: dsh-tarot-sky-dust 46s linear infinite;
}
.dsh-tarot-sky-swirls {
  transform-origin: 50% 45%;
  animation: dsh-tarot-sky-drift 76s ease-in-out infinite alternate;
}
.dsh-tarot-sky-moon {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: dsh-tarot-sky-float 17s ease-in-out infinite alternate;
}
.dsh-tarot-sky-star {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: dsh-tarot-sky-twinkle 5.6s ease-in-out infinite;
}
.dsh-tarot-inner-wrap { position: relative; z-index: 1; width: 100%; max-width: 1040px; margin: 0 auto; }
.dsh-tarot-head { margin-bottom: 6px; }
.dsh-tarot-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 20px;
  margin-top: 6px;
}
.dsh-tarot-title {
  margin: 0;
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 500;
  letter-spacing: .1em;
}
.dsh-tarot-today {
  font-size: 12px;
  letter-spacing: .08em;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-rule {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px 0 14px;
  color: var(--dsw-alias-brand-primary);
}
.dsh-tarot-rule::before,
.dsh-tarot-rule::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--dsw-alias-border-l1);
}
.dsh-tarot-rule-mark { font-size: 11px; letter-spacing: .4em; }
.dsh-tarot-intro {
  margin: 0;
  max-width: 62ch;
  color: var(--dsw-alias-label-secondary);
  font-size: 14px;
}
.dsh-tarot-count {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  letter-spacing: .08em;
}
.dsh-tarot-notice {
  margin: 16px 0 0;
  padding: 9px 14px;
  border: 1px solid var(--dsw-alias-state-warn-primary);
  border-radius: 8px;
  color: var(--dsw-alias-state-warn-primary);
  font-size: 12px;
}
.dsh-tarot-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr);
  gap: 14px 20px;
  margin: 22px 0 4px;
}
.dsh-tarot-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.dsh-tarot-field-label {
  font-size: 12px;
  letter-spacing: .1em;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  outline: none;
}
.dsh-tarot-input::placeholder { color: var(--dsw-alias-label-tertiary); }
.dsh-tarot-input:focus-visible {
  border-color: var(--dsw-alias-brand-primary);
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dsh-tarot-topics {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.dsh-tarot-topics-label {
  margin-right: 2px;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  letter-spacing: .1em;
}
.dsh-tarot-chip {
  padding: 4px 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-tarot-chip:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.dsh-tarot-chip[aria-pressed="true"] {
  border-color: var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.dsh-tarot-chip:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dsh-tarot-stage {
  position: relative;
  margin-top: 26px;
}
.dsh-tarot-empty-note {
  margin: 0 0 22px;
  text-align: center;
}
.dsh-tarot-empty-title { margin: 0 0 4px; font-size: 16px; letter-spacing: .08em; }
.dsh-tarot-empty-hint { margin: 0; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.dsh-tarot-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 2.6vw, 26px);
  align-items: start;
}
.dsh-tarot-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.dsh-tarot-position {
  font-size: 11px;
  letter-spacing: .28em;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tarot-slot-card { width: 100%; max-width: 236px; }
.dsh-tarot-card {
  position: relative;
  margin: 0;
  width: 100%;
  aspect-ratio: 5 / 8;
  perspective: 1400px;
}
.dsh-tarot-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform .72s cubic-bezier(.2, .75, .2, 1);
}
.dsh-tarot-card.is-revealed .dsh-tarot-inner { transform: rotateY(180deg); }
.dsh-tarot-face {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.dsh-tarot-back {
  position: relative;
  background:
    radial-gradient(120% 90% at 50% 6%, #1b1330 0%, #0c0917 54%, #050409 100%);
  border: 1px solid rgba(201, 161, 90, .6);
  box-shadow:
    inset 0 0 0 4px #060409,
    inset 0 0 0 5px rgba(201, 161, 90, .3),
    inset 0 0 60px rgba(120, 80, 180, .16),
    0 18px 30px -18px rgba(0, 0, 0, .75);
}
.dsh-tarot-back svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.dsh-tarot-back::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: conic-gradient(
    from 210deg at 50% 32%,
    rgba(255, 134, 200, .3),
    rgba(255, 211, 110, .2),
    rgba(155, 255, 155, .22),
    rgba(106, 215, 255, .28),
    rgba(181, 140, 255, .3),
    rgba(255, 134, 200, .3)
  );
  background-size: 220% 220%;
  mix-blend-mode: screen;
  opacity: .55;
  animation: dsh-tarot-holo 10s linear infinite;
}
.dsh-tarot-front {
  transform: rotateY(180deg);
  border: 1px solid rgba(201, 161, 90, .55);
  background:
    radial-gradient(80% 50% at 50% 0%, rgba(176, 58, 74, .42) 0%, transparent 62%),
    radial-gradient(120% 90% at 50% 100%, rgba(125, 34, 51, .3) 0%, transparent 66%),
    linear-gradient(165deg, #1d1020 0%, #0d0912 52%, #1a0d14 100%);
  box-shadow:
    inset 0 0 0 3px #07050b,
    inset 0 0 0 4px rgba(176, 58, 74, .5),
    inset 0 0 0 6px rgba(201, 161, 90, .3),
    inset 0 0 70px rgba(125, 34, 51, .22),
    0 18px 30px -20px rgba(0, 0, 0, .8);
  color: #e8dcc8;
}
.dsh-tarot-magic {
  position: absolute;
  z-index: 0;
  left: 50%;
  top: 50%;
  width: 84%;
  height: auto;
  transform: translate(-50%, -50%);
  color: #c9a15a;
  opacity: .5;
  pointer-events: none;
}
.dsh-tarot-front-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 9% 8% 7%;
}
.dsh-tarot-arch {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.dsh-tarot-numeral {
  position: relative;
  z-index: 1;
  font-size: clamp(10px, 1.3vw, 13px);
  letter-spacing: .22em;
  color: rgba(232, 220, 200, .72);
}
.dsh-tarot-emblem {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
  color: #c9a15a;
}
.dsh-tarot-emblem svg { max-width: 78%; max-height: 74%; }
.dsh-tarot-face-name {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: clamp(11px, 1.3vw, 14px);
  letter-spacing: .12em;
  line-height: 1.35;
  color: rgba(232, 220, 200, .92);
  text-wrap: balance;
}
.dsh-tarot-pips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  gap: 4px 6px;
  max-width: 88%;
  color: #c9a15a;
}
.dsh-tarot-court { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dsh-tarot-crown { font-size: 10px; letter-spacing: .2em; color: rgba(201, 161, 90, .85); }
.dsh-tarot-foil-tag {
  position: absolute;
  z-index: 5;
  top: 7px;
  right: 7px;
  padding: 1px 7px;
  border: 1px solid rgba(232, 220, 200, .55);
  border-radius: 999px;
  background: rgba(11, 9, 16, .55);
  color: #f3e6c8;
  font-size: 9px;
  letter-spacing: .1em;
  white-space: nowrap;
}
.dsh-tarot-rays {
  position: absolute;
  inset: -22%;
  z-index: 4;
  pointer-events: none;
  opacity: 0;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255, 134, 200, .55) 0deg 3deg,
    transparent 3deg 15deg,
    rgba(255, 211, 110, .5) 15deg 18deg,
    transparent 18deg 30deg,
    rgba(155, 255, 155, .45) 30deg 33deg,
    transparent 33deg 45deg,
    rgba(106, 215, 255, .5) 45deg 48deg,
    transparent 48deg 60deg,
    rgba(181, 140, 255, .5) 60deg 63deg,
    transparent 63deg 75deg
  );
  -webkit-mask-image: radial-gradient(circle at 50% 50%, transparent 27%, #000 33%, #000 55%, transparent 72%);
  mask-image: radial-gradient(circle at 50% 50%, transparent 27%, #000 33%, #000 55%, transparent 72%);
  mix-blend-mode: screen;
  filter: blur(.4px);
}
.dsh-tarot-card.is-revealed .dsh-tarot-rays {
  animation: dsh-tarot-ray-burst 1.6s ease-out both, dsh-tarot-ray-turn 24s linear infinite;
}
.dsh-tarot-sparkle {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  opacity: .7;
  background-image:
    radial-gradient(circle at 22% 28%, rgba(255, 246, 216, .95) 0 1px, transparent 1.7px),
    radial-gradient(circle at 74% 22%, rgba(255, 246, 216, .8) 0 1px, transparent 1.8px),
    radial-gradient(circle at 62% 68%, rgba(255, 246, 216, .9) 0 1.2px, transparent 2px),
    radial-gradient(circle at 30% 78%, rgba(255, 246, 216, .7) 0 1px, transparent 1.6px);
  background-size: 64px 74px, 92px 86px, 78px 96px, 108px 92px;
  animation: dsh-tarot-twinkle 4.6s ease-in-out infinite;
}
.dsh-tarot-card.is-foil .dsh-tarot-front::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(
    115deg,
    transparent 26%,
    rgba(255, 238, 190, .38) 36%,
    rgba(168, 216, 255, .30) 46%,
    rgba(255, 168, 214, .28) 56%,
    transparent 68%
  );
  background-size: 280% 280%;
  mix-blend-mode: screen;
  animation: dsh-tarot-sheen 6.4s linear infinite;
}
.dsh-tarot-card-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-height: 34px;
  text-align: center;
  opacity: 0;
  transition: opacity .4s ease .15s;
}
.dsh-tarot-card-meta.is-shown { opacity: 1; }
.dsh-tarot-card-name { font-size: 14px; letter-spacing: .04em; }
.dsh-tarot-orient { font-size: 11px; color: var(--dsw-alias-label-tertiary); letter-spacing: .14em; }
.dsh-tarot-orient.is-rev { color: var(--dsw-alias-state-warn-primary); }
.dsh-tarot-empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 5 / 8;
  border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: radial-gradient(120% 90% at 50% 0%, var(--dsw-alias-bg-layer-2), transparent 72%);
  color: var(--dsw-alias-label-tertiary);
  font-size: 18px;
}
.dsh-tarot-draw-row { display: flex; justify-content: center; margin-top: 28px; }
.dsh-tarot-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 30px;
  border: 1px solid var(--dsw-alias-brand-primary);
  border-radius: 999px;
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-bg-base);
  font: inherit;
  font-size: 14px;
  letter-spacing: .14em;
  cursor: pointer;
}
.dsh-tarot-primary:hover { filter: brightness(1.06); }
.dsh-tarot-primary:disabled { opacity: .5; cursor: default; filter: none; }
.dsh-tarot-primary:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 3px; }
.dsh-tarot-storm {
  position: absolute;
  inset: 0;
  z-index: 20;
  overflow: hidden;
  border-radius: 14px;
  background:
    radial-gradient(58% 52% at 50% 44%, rgba(176, 58, 74, .16) 0%, rgba(176, 58, 74, 0) 70%),
    radial-gradient(75% 75% at 50% 44%, rgba(24, 14, 22, .96) 0%, rgba(5, 3, 8, .99) 72%);
  box-shadow: inset 0 0 90px rgba(201, 161, 90, .12);
  cursor: pointer;
}
.dsh-tarot-storm-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.dsh-tarot-flash {
  position: absolute;
  inset: -8%;
  z-index: 30;
  border-radius: 22px;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 46%, #ffffff 0%, rgba(255, 255, 255, .92) 16%, rgba(255, 238, 196, .42) 44%, rgba(255, 255, 255, 0) 72%);
  mix-blend-mode: screen;
  animation: dsh-tarot-flash-out .78s cubic-bezier(.2, .7, .2, 1) both;
}
.dsh-tarot-storm-hint {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  margin: 0;
  color: rgba(232, 220, 200, .62);
  font-size: 12px;
  letter-spacing: .24em;
  pointer-events: none;
}
.dsh-tarot-storm-skip {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border: 1px solid rgba(201, 161, 90, .42);
  border-radius: 999px;
  background: rgba(11, 9, 16, .4);
  color: rgba(232, 220, 200, .82);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-tarot-result {
  margin-top: 34px;
  outline: none;
}
.dsh-tarot-reading-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-topic-tag {
  padding: 1px 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-readings { display: grid; gap: 20px; }
.dsh-tarot-reading { padding-top: 14px; border-top: 1px solid var(--dsw-alias-border-l1); }
.dsh-tarot-reading:first-child { border-top: 0; padding-top: 0; }
.dsh-tarot-reading-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
}
.dsh-tarot-reading-pos {
  font-size: 11px;
  letter-spacing: .26em;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tarot-reading-name { font-size: 17px; letter-spacing: .03em; }
.dsh-tarot-badge {
  padding: 1px 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-badge.is-rev {
  color: var(--dsw-alias-state-warn-primary);
  border-color: var(--dsw-alias-state-warn-primary);
}
.dsh-tarot-badge.is-foil {
  color: var(--dsw-alias-state-success-primary);
  border-color: var(--dsw-alias-state-success-primary);
}
.dsh-tarot-assertion {
  margin: 10px 0 6px;
  font-size: 15px;
  line-height: 1.95;
  color: var(--dsw-alias-label-primary);
}
.dsh-tarot-plain {
  margin: 0;
  font-size: 13px;
  line-height: 1.9;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-keyword-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.dsh-tarot-kw {
  padding: 1px 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 4px;
  font-size: 11px;
  letter-spacing: .06em;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-kw.is-accent {
  color: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary);
}
.dsh-tarot-verdict {
  margin-top: 34px;
  padding: 22px clamp(16px, 3vw, 28px);
  border: 1px solid var(--dsw-alias-border-l1);
  border-left: 3px solid var(--dsw-alias-brand-primary);
  border-radius: 3px 14px 14px 3px;
  background: var(--dsw-alias-bg-layer-1);
  outline: none;
}
.dsh-tarot-verdict-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.dsh-tarot-seal {
  padding: 3px 12px;
  border: 1px solid var(--dsw-alias-brand-primary);
  border-radius: 3px;
  color: var(--dsw-alias-brand-primary);
  font-size: 12px;
  letter-spacing: .2em;
}
.dsh-tarot-h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: .18em;
  color: var(--dsw-alias-label-secondary);
}
.dsh-tarot-verdict-text {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 2;
  color: var(--dsw-alias-label-primary);
}
.dsh-tarot-verdict-refs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tarot-h3 {
  margin: 18px 0 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .22em;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tarot-action-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 7px;
}
.dsh-tarot-action-list li {
  position: relative;
  padding-left: 18px;
  font-size: 14px;
  color: var(--dsw-alias-label-primary);
}
.dsh-tarot-action-list li::before {
  content: "◆";
  position: absolute;
  left: 2px;
  top: 0;
  color: var(--dsw-alias-brand-primary);
  font-size: 9px;
}
.dsh-tarot-history {
  margin-top: 48px;
  padding-top: 22px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dsh-tarot-history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.dsh-tarot-history-head .dsh-tarot-h2 { letter-spacing: .16em; font-size: 14px; }
.dsh-tarot-history-count { font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.dsh-tarot-history-empty { margin: 16px 0 0; font-size: 13px; color: var(--dsw-alias-label-tertiary); }
.dsh-tarot-hist-group { margin-top: 18px; }
.dsh-tarot-hist-day {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .14em;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tarot-hist-list { margin: 0; padding: 0; list-style: none; }
.dsh-tarot-hist-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  width: 100%;
  padding: 10px 2px;
  border: 0;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.dsh-tarot-hist-row:hover { background: var(--dsw-alias-bg-layer-1); }
.dsh-tarot-hist-row:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.dsh-tarot-hist-time {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.dsh-tarot-hist-main { font-size: 13px; color: var(--dsw-alias-label-primary); }
.dsh-tarot-hist-cards { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dsh-tarot-hist-reading {
  padding: 6px 0 16px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dsh-tarot-clear { margin-top: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.dsh-tarot-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.dsh-tarot-link:hover { color: var(--dsw-alias-label-primary); }
.dsh-tarot-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dsh-tarot-confirm-yes {
  padding: 3px 12px;
  border: 1px solid var(--dsw-alias-state-error-primary);
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-state-error-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-tarot-confirm-no {
  padding: 3px 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-tarot-footer {
  margin-top: 40px;
  padding-top: 14px;
  border-top: 1px solid var(--dsw-alias-border-l1);
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tarot-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px 18px;
  margin-bottom: 26px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dsh-tarot-topbar-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.dsh-tarot-ghost {
  padding: 6px 15px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  letter-spacing: .1em;
  cursor: pointer;
}
.dsh-tarot-ghost:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-brand-primary); }
.dsh-tarot-ghost.is-on { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.dsh-tarot-ghost:focus-visible, .dsh-tarot-chip:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.dsh-tarot-screen { animation: dsh-tarot-screen-in .48s ease both; }
.dsh-tarot-kicker {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: .32em;
  color: var(--dsw-alias-brand-primary);
}
.dsh-tarot-ask { max-width: 780px; margin: 0 auto; padding: 16px 0 24px; }
.dsh-tarot-ask .dsh-tarot-title { font-size: clamp(30px, 4.4vw, 46px); }
.dsh-tarot-ask .dsh-tarot-intro { margin-top: 12px; }
.dsh-tarot-ask .dsh-tarot-form {
  margin-top: 26px;
  padding: 24px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 30px 70px -52px rgba(0, 0, 0, .9);
}
.dsh-tarot-ask-actions { grid-column: 1 / -1; display: flex; justify-content: center; margin-top: 4px; }
.dsh-tarot-primary.big { padding: 13px 46px; font-size: 15px; }
.dsh-tarot-draw-screen { max-width: 900px; margin: 0 auto; padding-top: 10px; text-align: center; }
.dsh-tarot-draw-screen .dsh-tarot-grid { margin-top: 26px; }
.dsh-tarot-draw-screen .dsh-tarot-slot-card { max-width: 224px; }
.dsh-tarot-draw-note {
  min-height: 22px;
  margin: 18px 0 0;
  font-size: 12px;
  letter-spacing: .2em;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tarot-draw-note.is-storm { color: var(--dsw-alias-brand-primary); }
.dsh-tarot-result-screen { outline: none; }
.dsh-tarot-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 34px 0 0; }
.dsh-tarot-pip:nth-child(3n) { color: #b0485a; }
.dsh-tarot-crown { color: rgba(201, 161, 90, .9); }
.dsh-tarot-face-name { text-shadow: 0 0 12px rgba(176, 58, 74, .35); }
@keyframes dsh-tarot-screen-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
}
@keyframes dsh-tarot-holo {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}
@keyframes dsh-tarot-ray-burst {
  0% { opacity: 0; }
  16% { opacity: .95; }
  48% { opacity: .4; }
  100% { opacity: .16; }
}
@keyframes dsh-tarot-ray-turn {
  to { transform: rotate(360deg); }
}
@keyframes dsh-tarot-sky-drift {
  0% { transform: translate3d(-18px, 10px, 0) rotate(-1.6deg) scale(1.02); }
  100% { transform: translate3d(22px, -14px, 0) rotate(1.8deg) scale(1.07); }
}
@keyframes dsh-tarot-sky-float {
  from { transform: translateY(-7px); }
  to { transform: translateY(9px); }
}
@keyframes dsh-tarot-sky-twinkle {
  0%, 100% { opacity: .35; }
  50% { opacity: 1; }
}
@keyframes dsh-tarot-sky-aurora {
  from { transform: translate3d(-4%, 0, 0) scale(1); }
  to { transform: translate3d(6%, -3%, 0) scale(1.08); }
}
@keyframes dsh-tarot-sky-dust {
  from { background-position: 0 0, 0 0, 0 0, 0 0; }
  to { background-position: 260px 210px, -340px 280px, 300px -250px, -420px 360px; }
}
@keyframes dsh-tarot-sheen {
  0% { background-position: 130% 0; }
  100% { background-position: -130% 0; }
}
@keyframes dsh-tarot-twinkle {
  0%, 100% { opacity: .35; }
  50% { opacity: .85; }
}
@keyframes dsh-tarot-flash-out {
  0% { opacity: 0; transform: scale(.92); }
  12% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0; transform: scale(1.1); }
}
@media (max-width: 720px) {
  .dsh-tarot-form { grid-template-columns: 1fr; }
  .dsh-tarot-grid { gap: 10px; }
  .dsh-tarot-slot-card { max-width: 180px; }
  .dsh-tarot-card-meta { min-height: 30px; }
  .dsh-tarot-card-name { font-size: 12px; }
  .dsh-tarot-root { padding: 22px 14px 48px; }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-tarot-inner { transition: none; }
  .dsh-tarot-card.is-foil .dsh-tarot-front::after { animation: none; background-position: 50% 40%; }
  .dsh-tarot-sparkle { animation: none; }
  .dsh-tarot-screen { animation: none; }
  .dsh-tarot-back::after { animation: none; background-position: 50% 40%; }
  .dsh-tarot-rays,
  .dsh-tarot-sky-swirls,
  .dsh-tarot-sky-moon,
  .dsh-tarot-sky-star,
  .dsh-tarot-sky::after,
  .dsh-tarot-sky::before { animation: none; }
}
`;

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch (error) {
    return null;
  }
}

function probeStorage(storage) {
  if (!storage) return false;
  try {
    const key = 'dsh.tarot.probe';
    storage.setItem(key, '1');
    storage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

function prefersReduced() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch (error) {
    return false;
  }
}

function parseDay(key) {
  const parts = String(key).split('-').map((part) => Number(part));
  return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
}

function formatFullDate(key, localeId) {
  try {
    const formatter = new Intl.DateTimeFormat(localeId === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    return formatter.format(parseDay(key));
  } catch (error) {
    return key;
  }
}

function formatDate(key, localeId) {
  try {
    const formatter = new Intl.DateTimeFormat(localeId === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
    return formatter.format(parseDay(key));
  } catch (error) {
    return key;
  }
}

function formatTime(ts, localeId) {
  try {
    const formatter = new Intl.DateTimeFormat(localeId === 'en' ? 'en-US' : 'zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return formatter.format(new Date(ts));
  } catch (error) {
    return '';
  }
}

function cardName(card, localeId) {
  return localeId === 'en' ? card.nameEn : card.name;
}

function toRoman(number) {
  if (number === 0) return '0';
  const table = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let rest = number;
  let out = '';
  for (const entry of table) {
    while (rest >= entry[0]) {
      out += entry[1];
      rest -= entry[0];
    }
  }
  return out;
}

function rankLabel(rank) {
  if (rank === 1) return 'A';
  if (rank === 11) return 'P';
  if (rank === 12) return 'Kn';
  if (rank === 13) return 'Q';
  if (rank === 14) return 'K';
  return String(rank);
}

function CardBackArt() {
  const rays = [];
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
    const long = index % 2 === 0;
    rays.push(
      h('line', {
        key: 'ray-' + index,
        x1: 50 + Math.cos(angle) * 14,
        y1: 82 + Math.sin(angle) * 14,
        x2: 50 + Math.cos(angle) * (long ? 24 : 19.5),
        y2: 82 + Math.sin(angle) * (long ? 24 : 19.5),
        stroke: index % 3 === 0 ? 'url(#tarot-holo)' : '#c9a15a',
        strokeOpacity: index % 3 === 0 ? 0.95 : 0.7,
        strokeWidth: long ? 1.15 : 0.65,
        strokeLinecap: 'round'
      })
    );
  }
  const ticks = [];
  for (let index = 0; index < 36; index += 1) {
    const angle = (index / 36) * Math.PI * 2;
    const major = index % 3 === 0;
    ticks.push(
      h('line', {
        key: 'tick-' + index,
        x1: 50 + Math.cos(angle) * 11.2,
        y1: 82 + Math.sin(angle) * 11.2,
        x2: 50 + Math.cos(angle) * (major ? 13 : 12.1),
        y2: 82 + Math.sin(angle) * (major ? 13 : 12.1),
        stroke: '#c9a15a',
        strokeOpacity: major ? 0.85 : 0.45,
        strokeWidth: 0.5
      })
    );
  }
  const stars = [
    [16, 30, 0.9], [84, 34, 0.8], [24, 132, 0.7], [78, 128, 1], [12, 78, 0.6],
    [88, 88, 0.7], [36, 20, 0.6], [66, 146, 0.7], [50, 12, 0.5], [50, 152, 0.5]
  ];
  const cornerFlourish = h(
    'g',
    { className: 'dsh-tarot-flourish' },
    h('path', {
      d: 'M9 15c11-3 20 3 24 12 2 5 1 10-4 13 5-1 10 0 13 4-6 1-12 1-17-1-2 5-7 8-13 7 4-3 6-7 6-12 0-7-2-15-9-23Z',
      fill: 'none',
      stroke: 'url(#tarot-holo)',
      strokeWidth: 1.1,
      strokeOpacity: 0.9
    }),
    h('path', {
      d: 'M14 20c7-1 12 3 15 9 1 3 0 6-3 8 4-1 7 0 9 3-5 0-9 0-12-2-2 4-5 6-9 5 3-2 4-5 4-9 0-5-1-9-4-14Z',
      fill: 'none',
      stroke: '#c9a15a',
      strokeWidth: 0.55,
      strokeOpacity: 0.6
    }),
    h('circle', { cx: 15, cy: 24, r: 1.4, fill: 'url(#tarot-holo)', opacity: 0.9 })
  );
  const eye = h(
    'g',
    { className: 'dsh-tarot-eye' },
    h('path', {
      d: 'M38 41c5-6 19-6 24 0-5 6-19 6-24 0Z',
      fill: 'none',
      stroke: '#c9a15a',
      strokeWidth: 0.8
    }),
    h('circle', { cx: 50, cy: 41, r: 3.4, fill: 'none', stroke: 'url(#tarot-holo)', strokeWidth: 0.7 }),
    h('circle', { cx: 50, cy: 41, r: 1.5, fill: '#e8dcc8', opacity: 0.92 }),
    h('path', {
      d: 'M50 33v-3M44 34.5l-2-2M56 34.5l2-2',
      stroke: '#c9a15a',
      strokeWidth: 0.55,
      strokeOpacity: 0.8,
      strokeLinecap: 'round'
    })
  );
  const moon = h('path', {
    d: 'M23 62a8 8 0 1 0 11 9 9.5 9.5 0 1 1-11-9Z',
    fill: 'url(#tarot-holo)',
    opacity: 0.85
  });
  return h(
    'svg',
    {
      viewBox: '0 0 100 160',
      preserveAspectRatio: 'none',
      className: 'dsh-tarot-back-art',
      'aria-hidden': 'true'
    },
    h(
      'defs',
      null,
      h(
        'linearGradient',
        { id: 'tarot-holo', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
        ['#ff86c8', '#ffd36e', '#9bff9b', '#6ad7ff', '#b58cff', '#ff86c8'].map((color, index) =>
          h('stop', { key: color + index, offset: index * 20 + '%', stopColor: color })
        )
      ),
      h(
        'linearGradient',
        { id: 'tarot-holo-soft', x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
        ['#6ad7ff', '#ff86c8', '#ffd36e'].map((color, index) =>
          h('stop', { key: color + index, offset: index * 50 + '%', stopColor: color })
        )
      )
    ),
    h('rect', { x: 0, y: 0, width: 100, height: 160, fill: '#07050c' }),
    h('rect', { x: 0, y: 0, width: 100, height: 160, fill: 'url(#tarot-holo-soft)', opacity: 0.06 }),
    h('path', {
      d: 'M18 152V61c0-23 14-42 32-52 18 10 32 29 32 52v91',
      fill: 'none',
      stroke: '#c9a15a',
      strokeWidth: 1.5,
      strokeOpacity: 0.9
    }),
    h('path', {
      d: 'M23 152V62c0-20 12-37 27-46 15 9 27 26 27 46v90',
      fill: 'none',
      stroke: '#c9a15a',
      strokeWidth: 0.6,
      strokeOpacity: 0.55
    }),
    h('path', {
      d: 'M28 152V64c0-18 10-33 22-41 12 8 22 23 22 41v88',
      fill: 'none',
      stroke: 'url(#tarot-holo)',
      strokeWidth: 0.5,
      strokeOpacity: 0.5
    }),
    cornerFlourish,
    h('g', { transform: 'translate(100 0) scale(-1 1)' }, cornerFlourish),
    h('g', { transform: 'translate(0 160) scale(1 -1)' }, cornerFlourish),
    h('g', { transform: 'translate(100 160) scale(-1 -1)' }, cornerFlourish),
    h('path', {
      d: 'M50 8v9M50 143v9',
      stroke: '#c9a15a',
      strokeWidth: 0.7,
      strokeOpacity: 0.6
    }),
    eye,
    h('g', { transform: 'translate(0 160) scale(1 -1)' }, eye),
    moon,
    h('g', { transform: 'translate(100 0) scale(-1 1)' }, moon),
    ...rays,
    h('circle', { cx: 50, cy: 82, r: 16.5, fill: 'none', stroke: '#c9a15a', strokeWidth: 1.1, strokeOpacity: 0.85 }),
    h('circle', { cx: 50, cy: 82, r: 12.5, fill: 'none', stroke: 'url(#tarot-holo)', strokeWidth: 0.7 }),
    h('circle', { cx: 50, cy: 82, r: 7.5, fill: 'none', stroke: '#c9a15a', strokeWidth: 0.8, strokeOpacity: 0.8 }),
    ...ticks,
    h('circle', { cx: 50, cy: 82, r: 3.4, fill: 'url(#tarot-holo)', opacity: 0.9 }),
    h('circle', { cx: 50, cy: 82, r: 1.2, fill: '#fff6e0' }),
    ...stars.map((star, index) =>
      h(
        'path',
        {
          key: 'star-' + index,
          d:
            'M' + star[0] + ' ' + (star[1] - star[2] * 3) +
            'L' + (star[0] + star[2] * 0.7) + ' ' + star[1] +
            'L' + star[0] + ' ' + (star[1] + star[2] * 3) +
            'L' + (star[0] - star[2] * 0.7) + ' ' + star[1] + 'Z',
          fill: index % 3 === 0 ? 'url(#tarot-holo)' : '#c9a15a',
          opacity: 0.8
        }
      )
    )
  );
}

function SuitGlyph({ suit, size }) {
  const common = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };
  if (suit === 'wands') {
    return h(
      'svg',
      common,
      h('path', { d: 'M7 21 17 7' }),
      h('path', { d: 'M17 7c2-1.2 3-3.3 2.4-5.4-2.1.3-3.8 1.7-4.4 3.7' }),
      h('path', { d: 'M5 21h4' })
    );
  }
  if (suit === 'cups') {
    return h(
      'svg',
      common,
      h('path', { d: 'M5 5h14c0 4.4-3 8-7 8S5 9.4 5 5Z' }),
      h('path', { d: 'M12 13v6M8 20h8' })
    );
  }
  if (suit === 'swords') {
    return h(
      'svg',
      common,
      h('path', { d: 'M12 3v12' }),
      h('path', { d: 'M7.5 15h9' }),
      h('path', { d: 'M12 15v5' }),
      h('circle', { cx: 12, cy: 21, r: 1.1 })
    );
  }
  return h(
    'svg',
    common,
    h('circle', { cx: 12, cy: 12, r: 8.6 }),
    h('path', { d: 'M12 5.5 13.6 10l4.7 1.6-4.7 1.6L12 18l-1.6-4.8L5.7 11.6 10.4 10Z' })
  );
}

function MajorGlyph({ number }) {
  const spokes = [];
  const count = Math.max(4, (number % 22) + 4);
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    spokes.push(
      h('line', {
        key: 'ray-' + index,
        x1: 24 + Math.cos(angle) * 8,
        y1: 24 + Math.sin(angle) * 8,
        x2: 24 + Math.cos(angle) * 19,
        y2: 24 + Math.sin(angle) * 19,
        strokeWidth: 1
      })
    );
  }
  return h(
    'svg',
    {
      viewBox: '0 0 48 48',
      width: 48,
      height: 48,
      fill: 'none',
      stroke: 'currentColor',
      strokeLinecap: 'round',
      'aria-hidden': 'true'
    },
    h('circle', { cx: 24, cy: 24, r: 20.5, strokeWidth: 1.2 }),
    h('circle', { cx: 24, cy: 24, r: 7.5, strokeWidth: 1 }),
    ...spokes,
    h('circle', { cx: 24, cy: 24, r: 2.2, fill: 'currentColor', stroke: 'none' })
  );
}

function Pips({ suit, rank }) {
  if (rank === 1) return h(SuitGlyph, { suit, size: 52 });
  if (rank >= 11) {
    return h(
      'div',
      { className: 'dsh-tarot-court' },
      h('span', { className: 'dsh-tarot-crown' }, '✦'),
      h(SuitGlyph, { suit, size: 46 })
    );
  }
  const items = [];
  for (let index = 0; index < rank; index += 1) {
    items.push(h('span', { key: 'pip-' + index, className: 'dsh-tarot-pip' }, h(SuitGlyph, { suit, size: 21 })));
  }
  return h('div', { className: 'dsh-tarot-pips' }, items);
}

function StarrySky() {
  const stars = [
    [90, 120, 2.2, 0], [220, 70, 1.4, 1.2], [340, 180, 2.8, 2.4], [520, 90, 1.6, 0.6],
    [680, 150, 2.4, 1.8], [840, 80, 1.5, 3.1], [980, 170, 2.6, 0.9], [1120, 110, 1.8, 2.2],
    [150, 320, 1.5, 2.8], [420, 300, 2.1, 1.4], [760, 330, 1.7, 0.3], [1050, 300, 2.3, 1.9],
    [280, 520, 1.4, 0.8], [620, 560, 2.2, 2.6], [960, 540, 1.6, 1.1], [1140, 460, 2.0, 3.4]
  ];
  return h(
    'div',
    { className: 'dsh-tarot-sky', 'aria-hidden': 'true' },
    h(
      'svg',
      { viewBox: '0 0 1200 800', preserveAspectRatio: 'xMidYMid slice' },
      h(
        'defs',
        null,
        h(
          'radialGradient',
          { id: 'tarot-star' },
          h('stop', { offset: '0%', stopColor: '#fff3c4', stopOpacity: 0.95 }),
          h('stop', { offset: '45%', stopColor: '#e8c66a', stopOpacity: 0.45 }),
          h('stop', { offset: '100%', stopColor: '#c9a15a', stopOpacity: 0 })
        ),
        h(
          'linearGradient',
          { id: 'tarot-sky-bg', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
          h('stop', { offset: '0%', stopColor: '#070b17' }),
          h('stop', { offset: '48%', stopColor: '#0a1020' }),
          h('stop', { offset: '100%', stopColor: '#0b0812' })
        )
      ),
      h('rect', { width: 1200, height: 800, fill: 'url(#tarot-sky-bg)' }),
      h(
        'g',
        { className: 'dsh-tarot-sky-swirls' },
        h('path', {
          d: 'M-40 250C120 160 300 150 430 240c130 90 260 120 420 40 160-80 320-70 420 30',
          fill: 'none', stroke: '#3f6f9e', strokeOpacity: 0.26, strokeWidth: 26, strokeLinecap: 'round'
        }),
        h('path', {
          d: 'M-20 300C140 230 310 240 440 320c130 80 280 90 430 10 150-80 300-60 380 40',
          fill: 'none', stroke: '#c9a15a', strokeOpacity: 0.12, strokeWidth: 12, strokeLinecap: 'round'
        }),
        h('path', {
          d: 'M40 470c150-70 300-60 400 30 100 90 260 110 400 30 140-80 260-60 340 30',
          fill: 'none', stroke: '#6b4f9e', strokeOpacity: 0.15, strokeWidth: 34, strokeLinecap: 'round'
        }),
        h('path', {
          d: 'M0 560c180-40 320 20 440 60 120 40 280 20 420-40 140-60 250-30 340 20',
          fill: 'none', stroke: '#3f6f9e', strokeOpacity: 0.13, strokeWidth: 18, strokeLinecap: 'round'
        })
      ),
      h(
        'g',
        { className: 'dsh-tarot-sky-moon' },
        h('circle', { cx: 980, cy: 210, r: 66, fill: 'url(#tarot-star)', opacity: 0.42 }),
        h('path', {
          d: 'M1006 164a52 52 0 1 0 26 84 46 46 0 1 1-26-84Z',
          fill: '#f3e2a0', opacity: 0.85
        })
      ),
      stars.map((star, index) =>
        h(
          'g',
          {
            key: 'sky-star-' + index,
            className: 'dsh-tarot-sky-star',
            style: { animationDelay: star[3] + 's' }
          },
          h('circle', { cx: star[0], cy: star[1], r: star[2] * 7, fill: 'url(#tarot-star)', opacity: 0.55 }),
          h('circle', { cx: star[0], cy: star[1], r: star[2] * 1.2, fill: '#fff3c4', opacity: 0.92 }),
          h('path', {
            d:
              'M' + star[0] + ' ' + (star[1] - star[2] * 4) + 'v' + star[2] * 8 +
              'M' + (star[0] - star[2] * 4) + ' ' + star[1] + 'h' + star[2] * 8,
            stroke: '#ffe9a8', strokeOpacity: 0.45, strokeWidth: 0.7
          })
        )
      )
    )
  );
}

function CardFace({ card, localeId }) {
  const numeral = card.arcana === 'major' ? toRoman(card.number) : rankLabel(card.rank);
  return h(
    'div',
    { className: 'dsh-tarot-front-inner' },
    h(
      'svg',
      { className: 'dsh-tarot-arch', viewBox: '0 0 100 160', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
      h('path', {
        d: 'M50 8C32 22 19 34 19 54v96h62V54C81 34 68 22 50 8Z',
        fill: 'none',
        stroke: '#c9a15a',
        strokeOpacity: 0.55,
        strokeWidth: 1.2
      }),
      h('path', {
        d: 'M50 15C35 27 25 38 25 55v88h50V55c0-17-10-28-25-40Z',
        fill: 'none',
        stroke: '#c9a15a',
        strokeOpacity: 0.26,
        strokeWidth: 0.7
      })
    ),
    h(
      'svg',
      { className: 'dsh-tarot-magic', viewBox: '0 0 100 100', 'aria-hidden': 'true' },
      h('circle', {
        cx: 50, cy: 50, r: 46, fill: 'none', stroke: 'currentColor',
        strokeOpacity: 0.28, strokeWidth: 0.6, strokeDasharray: '1 3'
      }),
      h('circle', {
        cx: 50, cy: 50, r: 39, fill: 'none', stroke: '#b0485a',
        strokeOpacity: 0.45, strokeWidth: 0.7
      }),
      h('circle', {
        cx: 50, cy: 50, r: 30, fill: 'none', stroke: 'currentColor',
        strokeOpacity: 0.22, strokeWidth: 0.5, strokeDasharray: '5 3'
      }),
      [0, 45, 90, 135, 180, 225, 270, 315].map((degrees) => {
        const angle = (degrees * Math.PI) / 180;
        return h('line', {
          key: 'magic-' + degrees,
          x1: 50 + Math.cos(angle) * 30,
          y1: 50 + Math.sin(angle) * 30,
          x2: 50 + Math.cos(angle) * 37,
          y2: 50 + Math.sin(angle) * 37,
          stroke: degrees % 90 === 0 ? '#b0485a' : 'currentColor',
          strokeOpacity: 0.5,
          strokeWidth: 0.5
        });
      }),
      h('path', {
        d: 'M50 5 52 48 95 50 52 52 50 95 48 52 5 50 48 48Z',
        fill: 'none', stroke: '#b0485a', strokeOpacity: 0.25, strokeWidth: 0.45
      }),
      h('circle', {
        cx: 50, cy: 50, r: 22, fill: 'none', stroke: 'currentColor',
        strokeOpacity: 0.18, strokeWidth: 0.5
      })
    ),
    h('span', { className: 'dsh-tarot-numeral' }, numeral),
    h(
      'div',
      { className: 'dsh-tarot-emblem' },
      card.arcana === 'major'
        ? h(MajorGlyph, { number: card.number })
        : h(Pips, { suit: card.suit, rank: card.rank })
    ),
    h('span', { className: 'dsh-tarot-face-name' }, cardName(card, localeId))
  );
}

function TarotCard({ card, reversed, revealed, localeId, t }) {
  const fortune = card.fortune[reversed ? 'reversed' : 'upright'];
  const foil = fortune === 'good';
  return h(
    'figure',
    {
      className:
        'dsh-tarot-card' + (revealed ? ' is-revealed' : '') + (foil ? ' is-foil' : '')
    },
    h(
      'div',
      { className: 'dsh-tarot-inner' },
      h('div', { className: 'dsh-tarot-face dsh-tarot-back' }, h(CardBackArt)),
      h(
        'div',
        { className: 'dsh-tarot-face dsh-tarot-front' },
        foil ? h('div', { className: 'dsh-tarot-sparkle', 'aria-hidden': 'true' }) : null,
        h(CardFace, { card, localeId }),
        foil ? h('span', { className: 'dsh-tarot-foil-tag' }, t('foil.badge')) : null
      )
    ),
    foil ? h('span', { className: 'dsh-tarot-rays', 'aria-hidden': 'true' }) : null
  );
}

function ReadingDetails({ draw, t, localeId, compact }) {
  const reading = React.useMemo(
    () => buildReading(draw, { deckById: DECK_BY_ID, topicsById: TOPIC_BY_ID, t, locale: localeId }),
    [draw, t, localeId]
  );
  if (!reading) return null;
  const supportName = localeId === 'en' ? reading.support.nameEn : reading.support.name;
  const challengeName = localeId === 'en' ? reading.challenge.nameEn : reading.challenge.name;
  return h(
    'div',
    { className: 'dsh-tarot-reading-body' + (compact ? ' is-compact' : '') },
    h(
      'p',
      { className: 'dsh-tarot-reading-meta' },
      h('span', null, tr(t, 'reading.for', { name: reading.querent })),
      reading.rawQuestion ? h('span', null, tr(t, 'reading.asked', { question: reading.rawQuestion })) : null,
      h('span', { className: 'dsh-tarot-topic-tag' }, t(reading.topic.labelKey))
    ),
    h(
      'div',
      { className: 'dsh-tarot-readings' },
      reading.cards.map((entry) =>
        h(
          'article',
          { key: entry.position, className: 'dsh-tarot-reading' },
          h(
            'div',
            { className: 'dsh-tarot-reading-head' },
            h('span', { className: 'dsh-tarot-reading-pos' }, entry.positionLabel),
            h('span', { className: 'dsh-tarot-reading-name' }, entry.name),
            h(
              'span',
              { className: 'dsh-tarot-badge' + (entry.reversed ? ' is-rev' : '') },
              entry.orientationLabel
            ),
            entry.foil ? h('span', { className: 'dsh-tarot-badge is-foil' }, t('foil.badge')) : null
          ),
          h('p', { className: 'dsh-tarot-assertion' }, entry.assertion),
          h('p', { className: 'dsh-tarot-plain' }, entry.text),
          h(
            'div',
            { className: 'dsh-tarot-keyword-row' },
            entry.keywords.map((word, index) =>
              h('span', { key: word + index, className: 'dsh-tarot-kw' }, word)
            )
          )
        )
      )
    ),
    h(
      'section',
      { className: 'dsh-tarot-verdict', 'aria-label': t('verdict.title') },
      h(
        'div',
        { className: 'dsh-tarot-verdict-head' },
        h('span', { className: 'dsh-tarot-seal' }, reading.verdict.label),
        h('h2', { className: 'dsh-tarot-h2' }, t('verdict.title'))
      ),
      h('p', { className: 'dsh-tarot-verdict-text' }, reading.verdict.paragraph),
      h(
        'p',
        { className: 'dsh-tarot-verdict-refs' },
        h('span', null, tr(t, 'verdict.support', { card: supportName })),
        h('span', null, '·'),
        h('span', null, tr(t, 'verdict.challenge', { card: challengeName }))
      ),
      h('h3', { className: 'dsh-tarot-h3' }, t('actions.title')),
      h(
        'ul',
        { className: 'dsh-tarot-action-list' },
        reading.actions.map((action, index) => h('li', { key: index }, action))
      ),
      h(
        'div',
        { className: 'dsh-tarot-keyword-row' },
        reading.keywords.map((word, index) =>
          h('span', { key: word + index, className: 'dsh-tarot-kw is-accent' }, word)
        )
      )
    )
  );
}

export function TarotSidebarIcon({ size } = {}) {
  const edge = typeof size === 'number' && size > 0 ? size : 20;
  return h(
    'svg',
    {
      width: edge,
      height: edge,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true'
    },
    h('path', { d: 'M5.5 3h13a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3Z' }),
    h('path', { d: 'M7.5 19.5V10.4C7.5 7.3 9.5 5 12 5s4.5 2.3 4.5 5.4v9.1' }),
    h('path', { d: 'M13.35 9.7a2.5 2.5 0 1 0 3.15 3.9 3.1 3.1 0 1 1-3.15-3.9Z', fill: 'currentColor', stroke: 'none' }),
    h('circle', { cx: 9.1, cy: 15.4, r: 0.7, fill: 'currentColor', stroke: 'none' }),
    h('circle', { cx: 12.9, cy: 17.1, r: 0.8, fill: 'currentColor', stroke: 'none' }),
    h('circle', { cx: 15.9, cy: 14.7, r: 0.65, fill: 'currentColor', stroke: 'none' })
  );
}

export function TarotPanel({ t, locale }) {
  const [, bump] = React.useReducer((value) => value + 1, 0);

  React.useEffect(() => {
    if (!locale || typeof locale.subscribe !== 'function') return undefined;
    try {
      return locale.subscribe(() => bump());
    } catch (error) {
      return undefined;
    }
  }, [locale]);

  const [boot] = React.useState(() => {
    const storage = getStorage();
    const ok = probeStorage(storage);
    const store = sanitizeStore(loadStore(storage), DECK_BY_ID, TOPIC_BY_ID);
    return { draws: store.draws, ok };
  });
  const [draws, setDraws] = React.useState(boot.draws);
  const [saveOk, setSaveOk] = React.useState(boot.ok);
  const [today, setToday] = React.useState(() => dateKey(new Date()));
  const latest = boot.draws[0] || null;
  const [querent, setQuerent] = React.useState(latest ? latest.querent : '');
  const [question, setQuestion] = React.useState(latest ? latest.question : '');
  const [topic, setTopic] = React.useState(latest ? latest.topic : 'general');
  const [storming, setStorming] = React.useState(false);
  const [revealed, setRevealed] = React.useState(true);
  const [view, setView] = React.useState(() => (latest ? 'result' : 'ask'));
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(null);
  const [clearArm, setClearArm] = React.useState(false);
  const [pulse, setPulse] = React.useState(0);
  const [flash, setFlash] = React.useState(false);
  const [soundOn, setSoundOn] = React.useState(() => {
    try {
      const storage = getStorage();
      return !storage || storage.getItem('dsh.tarot.sound') !== 'off';
    } catch (error) {
      return true;
    }
  });
  const manualTopic = React.useRef(false);
  const resultRef = React.useRef(null);
  const resultTimer = React.useRef(0);
  const flashTimer = React.useRef(0);
  const soundStop = React.useRef(null);
  const stageRef = React.useRef(null);
  const slotRefs = [React.useRef(null), React.useRef(null), React.useRef(null)];

  React.useEffect(
    () => () => {
      window.clearTimeout(resultTimer.current);
      window.clearTimeout(flashTimer.current);
      if (soundStop.current) {
        soundStop.current();
        soundStop.current = null;
      }
    },
    []
  );

  React.useEffect(() => {
    if (view !== 'result') return undefined;
    const frame = window.requestAnimationFrame(() => {
      const node = resultRef.current;
      if (!node || typeof node.focus !== 'function') return;
      try {
        node.focus({ preventScroll: true });
      } catch (error) {
        node.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  React.useEffect(() => {
    if (!storming) return undefined;
    const timer = window.setTimeout(finishStorm, STORM_MS + 800);
    return () => window.clearTimeout(timer);
  }, [storming]);

  React.useEffect(() => {
    const storage = getStorage();
    if (!storage) return undefined;
    function onStorage(event) {
      if (event.key !== STORAGE_KEY) return;
      try {
        const next = sanitizeStore(loadStore(storage), DECK_BY_ID, TOPIC_BY_ID);
        setDraws(next.draws);
      } catch (error) {
        /* ignore foreign writes */
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  React.useEffect(() => {
    const tick = () => setToday(dateKey(new Date()));
    const timer = window.setInterval(tick, 60000);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
    };
  }, []);

  let localeId = 'zh';
  if (locale && typeof locale.getLocale === 'function') {
    try {
      localeId = locale.getLocale().active || 'zh';
    } catch (error) {
      localeId = 'zh';
    }
  }

  const current = draws[0] || null;
  const pastDraws = draws.slice(1);
  const todayCount = draws.filter((draw) => draw.dateKey === today).length;

  function persist(list) {
    const storage = getStorage();
    if (!storage) return false;
    return saveStore(storage, { version: 1, draws: list });
  }

  function chooseTopic(id) {
    manualTopic.current = true;
    setTopic(id);
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    try {
      const storage = getStorage();
      if (storage) storage.setItem('dsh.tarot.sound', next ? 'on' : 'off');
    } catch (error) {
      /* storage is optional */
    }
    if (!next && soundStop.current) {
      soundStop.current();
      soundStop.current = null;
    }
  }

  function cancelEffects() {
    window.clearTimeout(flashTimer.current);
    setFlash(false);
    if (soundStop.current) {
      soundStop.current();
      soundStop.current = null;
    }
  }

  function onQuestionChange(event) {
    setQuestion(event.target.value);
    manualTopic.current = false;
  }

  function onQuestionBlur() {
    if (manualTopic.current) return;
    setTopic(detectTopic(question, TOPICS));
  }

  function beginDraw(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (storming) return;
    const cards = pickDistinct(CARDS, current ? current.cards : null);
    const finalTopic = manualTopic.current || !question.trim()
      ? topic
      : detectTopic(question, TOPICS);
    const draw = makeDraw({ cards, querent, question, topic: finalTopic });
    const next = appendDraw(draws, draw);
    const ok = persist(next);
    setDraws(next);
    setTopic(finalTopic);
    setSaveOk(ok);
    setExpanded(null);
    setClearArm(false);
    setHistoryOpen(false);
    setPulse((value) => value + 1);
    setRevealed(false);
    setStorming(false);
    setView('draw');
    window.clearTimeout(flashTimer.current);
    setFlash(false);
    window.clearTimeout(resultTimer.current);
    if (prefersReduced()) {
      setRevealed(true);
      resultTimer.current = window.setTimeout(() => setView('result'), 500);
    } else {
      if (soundOn) {
        if (soundStop.current) soundStop.current();
        soundStop.current = playCharge({ durationMs: STORM_MS, landingMs: SPIN_MS });
      }
      setStorming(true);
    }
  }

  function finishStorm(skipped) {
    if (skipped && soundStop.current) {
      soundStop.current();
      soundStop.current = null;
    }
    setStorming(false);
    setRevealed(true);
    setFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 780);
    window.clearTimeout(resultTimer.current);
    resultTimer.current = window.setTimeout(() => setView('result'), 1150);
  }

  function goAsk() {
    cancelEffects();
    window.clearTimeout(resultTimer.current);
    setStorming(false);
    setRevealed(true);
    setHistoryOpen(false);
    setView('ask');
  }

  function measureTargets() {
    const stage = stageRef.current;
    if (!stage) return [];
    const stageRect = stage.getBoundingClientRect();
    return slotRefs
      .map((ref) => {
        const element = ref.current;
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left - stageRect.left,
          y: rect.top - stageRect.top,
          w: rect.width,
          h: rect.height
        };
      })
      .filter(Boolean);
  }

  function clearHistory() {
    window.clearTimeout(resultTimer.current);
    const next = [];
    const ok = persist(next);
    setDraws(next);
    setSaveOk(ok);
    setClearArm(false);
    setExpanded(null);
    setRevealed(true);
    setStorming(false);
    setHistoryOpen(false);
    setView('ask');
  }

  function dayLabel(key) {
    if (key === today) return t('history.today');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (key === dateKey(yesterday)) return t('history.yesterday');
    return formatDate(key, localeId);
  }

  const groups = [];
  pastDraws.forEach((draw) => {
    const last = groups[groups.length - 1];
    if (last && last.key === draw.dateKey) last.items.push(draw);
    else groups.push({ key: draw.dateKey, items: [draw] });
  });

  const historySection = h(
    'section',
    { className: 'dsh-tarot-history' },
    h(
      'div',
      { className: 'dsh-tarot-history-head' },
      h('h2', { className: 'dsh-tarot-h2' }, t('history.title')),
      h('span', { className: 'dsh-tarot-history-count' }, tr(t, 'history.count', { count: pastDraws.length }))
    ),
    pastDraws.length === 0
      ? h('p', { className: 'dsh-tarot-history-empty' }, t('history.empty'))
      : groups.map((group) =>
          h(
            'div',
            { key: group.key, className: 'dsh-tarot-hist-group' },
            h('h3', { className: 'dsh-tarot-hist-day' }, dayLabel(group.key)),
            h(
              'ul',
              { className: 'dsh-tarot-hist-list' },
              group.items.map((draw) => {
                const open = expanded === draw.id;
                return h(
                  'li',
                  { key: draw.id, className: 'dsh-tarot-hist-item' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-tarot-hist-row',
                      'aria-expanded': open,
                      onClick: () => setExpanded(open ? null : draw.id)
                    },
                    h('span', { className: 'dsh-tarot-hist-time' }, formatTime(draw.at, localeId)),
                    h(
                      'span',
                      { className: 'dsh-tarot-hist-main' },
                      draw.querent ? tr(t, 'history.querent', { name: draw.querent }) + ' · ' : '',
                      draw.question ? '「' + draw.question + '」' : t('question.none'),
                      ' ',
                      h(
                        'span',
                        { className: 'dsh-tarot-topic-tag' },
                        t((TOPIC_BY_ID.get(draw.topic) || TOPIC_BY_ID.get('general')).labelKey)
                      )
                    ),
                    h(
                      'span',
                      { className: 'dsh-tarot-hist-cards' },
                      draw.cards
                        .map((slot) => {
                          const card = DECK_BY_ID.get(slot.cardId);
                          if (!card) return '';
                          return cardName(card, localeId) + (slot.reversed ? '⟳' : '');
                        })
                        .filter(Boolean)
                        .join(' · ')
                    )
                  ),
                  open
                    ? h(
                        'div',
                        { className: 'dsh-tarot-hist-reading' },
                        h(ReadingDetails, { draw, t, localeId, compact: true })
                      )
                    : null
                );
              })
            )
          )
        ),
    pastDraws.length > 0
      ? h(
          'div',
          { className: 'dsh-tarot-clear' },
          clearArm
            ? h(
                'span',
                { className: 'dsh-tarot-confirm' },
                h('span', null, t('history.confirm')),
                h(
                  'button',
                  { type: 'button', className: 'dsh-tarot-confirm-yes', onClick: clearHistory },
                  t('history.confirmYes')
                ),
                h(
                  'button',
                  { type: 'button', className: 'dsh-tarot-confirm-no', onClick: () => setClearArm(false) },
                  t('history.cancel')
                )
              )
            : h(
                'button',
                { type: 'button', className: 'dsh-tarot-link', onClick: () => setClearArm(true) },
                t('history.clear')
              )
        )
      : null
  );

  function stageCards() {
    return h(
      'div',
      { className: 'dsh-tarot-grid' },
      POSITION_KEYS.map((position, index) => {
        const slot = current ? current.cards[index] : null;
        const card = slot ? DECK_BY_ID.get(slot.cardId) : null;
        return h(
          'div',
          { key: position + '-' + pulse, className: 'dsh-tarot-slot' },
          h('div', { className: 'dsh-tarot-position' }, t('position.' + position)),
          h(
            'div',
            { className: 'dsh-tarot-slot-card', ref: slotRefs[index] },
            card && slot
              ? h(TarotCard, { card, reversed: slot.reversed, revealed, localeId, t })
              : h('div', { className: 'dsh-tarot-empty-card', 'aria-hidden': 'true' }, h('span', null, '✦'))
          ),
          h(
            'div',
            { className: 'dsh-tarot-card-meta' + (card && slot && revealed ? ' is-shown' : '') },
            card && slot && revealed
              ? [
                  h('span', { key: 'name', className: 'dsh-tarot-card-name' }, cardName(card, localeId)),
                  h(
                    'span',
                    {
                      key: 'orient',
                      className: 'dsh-tarot-orient' + (slot.reversed ? ' is-rev' : '')
                    },
                    t(slot.reversed ? 'orientation.reversed' : 'orientation.upright')
                  )
                ]
              : null
          )
        );
      })
    );
  }

  const askScreen = h(
    'section',
    { className: 'dsh-tarot-screen dsh-tarot-ask' },
    h('p', { className: 'dsh-tarot-kicker' }, t('ask.kicker')),
    h('h1', { className: 'dsh-tarot-title' }, t('title')),
    h('p', { className: 'dsh-tarot-intro' }, t('intro')),
    h('p', { className: 'dsh-tarot-count' }, tr(t, 'drawnCount', { count: todayCount })),
    h(
      'form',
      { className: 'dsh-tarot-form', onSubmit: beginDraw },
      h(
        'label',
        { className: 'dsh-tarot-field' },
        h('span', { className: 'dsh-tarot-field-label' }, t('querent.label')),
        h('input', {
          className: 'dsh-tarot-input',
          type: 'text',
          value: querent,
          maxLength: 24,
          placeholder: t('querent.placeholder'),
          onChange: (event) => setQuerent(event.target.value)
        })
      ),
      h(
        'label',
        { className: 'dsh-tarot-field' },
        h('span', { className: 'dsh-tarot-field-label' }, t('question.label')),
        h('input', {
          className: 'dsh-tarot-input',
          type: 'text',
          value: question,
          maxLength: 60,
          placeholder: t('question.placeholder'),
          onChange: onQuestionChange,
          onBlur: onQuestionBlur
        })
      ),
      h(
        'div',
        { className: 'dsh-tarot-topics', role: 'group', 'aria-label': t('topic.label') },
        h('span', { className: 'dsh-tarot-topics-label' }, t('topic.label')),
        TOPICS.map((entry) =>
          h(
            'button',
            {
              key: entry.id,
              type: 'button',
              className: 'dsh-tarot-chip',
              'aria-pressed': topic === entry.id,
              onClick: () => chooseTopic(entry.id)
            },
            t(entry.labelKey)
          )
        )
      ),
      h(
        'div',
        { className: 'dsh-tarot-ask-actions' },
        h('button', { type: 'submit', className: 'dsh-tarot-primary big' }, t('ask.submit'))
      )
    )
  );

  const drawScreen = h(
    'section',
    { className: 'dsh-tarot-screen dsh-tarot-draw-screen' },
    h('p', { className: 'dsh-tarot-kicker' }, t('draw.kicker')),
    h('h1', { className: 'dsh-tarot-title' }, t('draw.title')),
    h(
      'div',
      { className: 'dsh-tarot-stage', ref: stageRef },
      stageCards(),
      storming ? h(CardStorm, { targets: measureTargets, onDone: finishStorm, t }) : null,
      flash ? h('span', { className: 'dsh-tarot-flash', 'aria-hidden': 'true' }) : null
    ),
    h(
      'p',
      { className: 'dsh-tarot-draw-note' + (storming ? ' is-storm' : '') },
      storming ? t('draw.flipHint') : t('draw.hint')
    )
  );

  const resultScreen = h(
    'section',
    { className: 'dsh-tarot-screen dsh-tarot-result-screen', ref: resultRef, tabIndex: -1 },
    h('p', { className: 'dsh-tarot-kicker' }, t('result.kicker')),
    h('h1', { className: 'dsh-tarot-title' }, t('result.title')),
    h('div', { className: 'dsh-tarot-stage', ref: stageRef }, stageCards()),
    current ? h(ReadingDetails, { draw: current, t, localeId }) : null,
    h(
      'div',
      { className: 'dsh-tarot-actions' },
      h(
        'button',
        { type: 'button', className: 'dsh-tarot-primary', disabled: storming, onClick: beginDraw },
        t('result.again')
      ),
      h('button', { type: 'button', className: 'dsh-tarot-ghost', onClick: goAsk }, t('result.ask'))
    )
  );

  return h(
    'div',
    { className: 'dsh-tarot-root' },
    h('style', { key: 'tarot-styles' }, CSS),
    h(StarrySky),
    h(
      'div',
      { className: 'dsh-tarot-inner-wrap' },
      h(
        'header',
        { className: 'dsh-tarot-topbar' },
        h(
          'div',
          { className: 'dsh-tarot-topbar-actions' },
          h('span', { className: 'dsh-tarot-today' }, formatFullDate(today, localeId)),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-tarot-ghost dsh-tarot-sound',
              onClick: toggleSound,
              'aria-pressed': soundOn
            },
            soundOn ? t('sound.on') : t('sound.off')
          ),
          pastDraws.length > 0
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-tarot-ghost' + (historyOpen ? ' is-on' : ''),
                  onClick: () => setHistoryOpen((value) => !value),
                  'aria-expanded': historyOpen
                },
                historyOpen ? t('history.hide') : t('history.toggle')
              )
            : null
        )
      ),
      !saveOk
        ? h('p', { className: 'dsh-tarot-notice', role: 'status' }, t('storage.unavailable'))
        : null,
      view === 'ask' ? askScreen : null,
      view === 'draw' ? drawScreen : null,
      view === 'result' ? resultScreen : null,
      historyOpen && pastDraws.length > 0 ? historySection : null,
      h('footer', { className: 'dsh-tarot-footer' }, t('disclaimer'))
    )
  );
}
