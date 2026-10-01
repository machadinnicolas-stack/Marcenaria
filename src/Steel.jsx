import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from './gsap.js';

const round = (n) => Math.round(n * 10) / 10;

const SHEET_WIDTH = 1440;
const SHEET_HEIGHT = 40;
const SHEET_PERIOD = 120;

// Trapezoidal roofing sheet seen in section: flat rib, slope, flat valley.
function sheetProfile(offset) {
  let d = '';
  for (let x = 0; x < SHEET_WIDTH; x += SHEET_PERIOD) {
    d += `${d ? 'L' : 'M'}${x} ${8 + offset}H${x + 34}L${x + 50} ${30 + offset}H${x + 104}L${x + SHEET_PERIOD} ${8 + offset}`;
  }
  return d;
}

const SHEET_FILL = `${sheetProfile(0)}V0H0Z`;
const SHEET_LINE = sheetProfile(5);

export function SheetEdge({ fill, side = 'top' }) {
  return (
    <svg className={`sheet-edge sheet-edge-${side}`} viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={SHEET_FILL} fill={fill} />
      <path d={SHEET_LINE} className="sheet-edge-line" />
    </svg>
  );
}

const circle = (x, y, r) => `M${round(x - r)} ${round(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

// A Pratt roof truss drawn like a shop drawing: chords, members, gusset nodes, supports and dimension lines.
function trussPaths() {
  const left = 40;
  const right = 560;
  const base = 300;
  const apex = 110;
  const panels = 8;
  const width = (right - left) / panels;
  const topY = (x) => base - (base - apex) * (1 - Math.abs(x - 300) / 260);
  const paths = [`M${left} ${base}H${right}`, `M${left} ${base}L300 ${apex}L${right} ${base}`];
  for (let i = 1; i < panels; i += 1) {
    const x = left + width * i;
    paths.push(`M${x} ${base}V${round(topY(x))}`);
  }
  for (let i = 1; i < panels - 1; i += 1) {
    const x0 = left + width * i;
    const x1 = x0 + width;
    paths.push(i < panels / 2 ? `M${x0} ${round(topY(x0))}L${x1} ${base}` : `M${x0} ${base}L${x1} ${round(topY(x1))}`);
  }
  for (let i = 0; i <= panels; i += 1) {
    const x = left + width * i;
    paths.push(circle(x, base, 4));
    if (i > 0 && i < panels) paths.push(circle(x, topY(x), 4));
  }
  for (const x of [left, right]) {
    paths.push(`M${x} ${base}l-14 22h28z`, `M${x - 22} ${base + 22}h44`, `M${x - 16} ${base + 30}l8 -8M${x - 4} ${base + 30}l8 -8M${x + 8} ${base + 30}l8 -8`);
  }
  paths.push(
    `M${left} ${base + 38}V${base + 76}M${right} ${base + 38}V${base + 76}`,
    `M${left} ${base + 66}H${right}M${left - 6} ${base + 72}l12 -12M${right - 6} ${base + 72}l12 -12`,
    `M${right + 22} ${apex}H${right + 58}M${right + 46} ${base}V${apex}M${right + 40} ${apex + 6}l12 -12M${right + 40} ${base + 6}l12 -12`,
  );
  return paths;
}

const TRUSS = trussPaths();

export function TrussDrawing({ className = '', start = 'top 85%', end = 'bottom 65%' }) {
  const ref = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(ref.current.querySelectorAll('path'), { strokeDashoffset: 1 }, {
      strokeDashoffset: 0,
      ease: 'none',
      stagger: 0.03,
      scrollTrigger: { trigger: ref.current.closest('section') ?? ref.current, start, end, scrub: 0.8 },
    });
  }, { scope: ref });

  return (
    <svg ref={ref} className={`truss-drawing ${className}`} viewBox="0 0 640 420" aria-hidden="true" focusable="false">
      {TRUSS.map((d) => <path key={d} d={d} pathLength="1" />)}
    </svg>
  );
}

const TAPE_MARKS = Array.from({ length: 64 }, (_, i) => (i + 1) * 10);

// Scroll progress as a tape measure unrolling across the top of the page (1 unit = 6px).
export function TapeMeasure() {
  const ref = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion() || window.matchMedia('(max-width: 700px), (pointer: coarse)').matches) return;
    gsap.fromTo(ref.current, { '--tape': 0 }, { '--tape': 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.4 } });
  }, { scope: ref });

  return (
    <div className="tape" ref={ref} aria-hidden="true">
      <div className="tape-strip">{TAPE_MARKS.map((n) => <span key={n} style={{ left: `${n * 6}px` }}>{n}</span>)}</div>
      <span className="tape-hook" />
    </div>
  );
}
