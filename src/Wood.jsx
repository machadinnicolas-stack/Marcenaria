import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from './gsap.js';

const round = (n) => Math.round(n * 10) / 10;

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Catmull-Rom through the points, emitted as cubic Béziers.
function smoothPath(points) {
  let d = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d += `C${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)} ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)} ${round(p2[0])} ${round(p2[1])}`;
  }
  return d;
}

const EDGE_WIDTH = 1440;
const EDGE_HEIGHT = 120;
const EDGE_XS = Array.from({ length: 31 }, (_, i) => i * 48);

// A growth line that swells around a knot; lines further from the edge bend harder, as they do in real wood.
const contour = (offset, knot) => EDGE_XS.map((x) => [
  x,
  36 + offset + 7 * Math.sin(x / 190 + offset * 0.05) + 4 * Math.sin(x / 83 + 1.3) + 30 * knot * Math.exp(-(((x - 760) / 120) ** 2)),
]);

const EDGE_FILL = `${smoothPath(contour(0, 1))}V0H0Z`;
const EDGE_LINES = [smoothPath(contour(14, 1.25)), smoothPath(contour(28, 1.45))];

export function GrainEdge({ fill, side = 'top' }) {
  return (
    <svg className={`grain-edge grain-edge-${side}`} viewBox={`0 0 ${EDGE_WIDTH} ${EDGE_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={EDGE_FILL} fill={fill} />
      {EDGE_LINES.map((d) => <path key={d} d={d} className="grain-edge-line" />)}
    </svg>
  );
}

// Flat-sawn "cathedral" figure: nested arches, narrow and pointed at the heart, broad at the edge.
function cathedralPaths(count = 12, seed = 23) {
  const random = seededRandom(seed);
  const paths = [];
  let center = 200;
  for (let k = 0; k < count; k += 1) {
    center += (random() - 0.5) * 8;
    const peak = 520 - k * 38 + (random() - 0.5) * 10;
    const half = 16 + k * 15 + (random() - 0.5) * 6;
    const tip = center + (random() - 0.5) * 14;
    const shoulder = peak + (600 - peak) * 0.42;
    const pinch = half * (0.28 + k * 0.025);
    paths.push(`M${round(center - half)} 600C${round(center - half)} ${round(shoulder)} ${round(tip - pinch)} ${round(peak)} ${round(tip)} ${round(peak)}C${round(tip + pinch)} ${round(peak)} ${round(center + half)} ${round(shoulder)} ${round(center + half)} 600`);
  }
  return paths;
}

const CATHEDRAL = cathedralPaths();

export function CathedralGrain({ className = '', start = 'top 85%', end = 'bottom 65%' }) {
  const ref = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(ref.current.querySelectorAll('path'), { strokeDashoffset: 1 }, {
      strokeDashoffset: 0,
      ease: 'none',
      stagger: 0.07,
      scrollTrigger: { trigger: ref.current.closest('section') ?? ref.current, start, end, scrub: 0.8 },
    });
  }, { scope: ref });

  return (
    <svg ref={ref} className={`cathedral-grain ${className}`} viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      {CATHEDRAL.map((d) => <path key={d} d={d} pathLength="1" />)}
    </svg>
  );
}
