import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from './gsap.js';
import { SheetEdge } from './Steel.jsx';
import './pergola-planner.css';

const CONTROLS = [
  { key: 'width', label: 'Largura', min: 2, max: 8, step: 0.1, unit: 'm' },
  { key: 'depth', label: 'Profundidade', min: 2, max: 6, step: 0.1, unit: 'm' },
  { key: 'spacing', label: 'Espaçamento entre vigas', min: 40, max: 120, step: 5, unit: 'cm' },
];

// Illustrative rule of thumb for the drawing only; real pillar positions come from the structural design.
const MAX_SPAN = 4;

const decimal = (n, digits = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const beamCount = (width, spacing) => Math.floor((width * 100) / spacing + 1e-6) + 1;

// Plan view drawn to scale inside a fixed 640×440 sheet, leaving room for the dimension lines.
function layout({ width, depth, spacing }) {
  const scale = Math.min(500 / width, 290 / depth);
  const w = width * scale;
  const h = depth * scale;
  const x0 = 60 + (500 - w) / 2;
  const y0 = 46 + (290 - h) / 2;
  const beams = Array.from({ length: beamCount(width, spacing) }, (_, i) => Math.min(x0 + (i * spacing * scale) / 100, x0 + w));
  const bays = Math.ceil(width / MAX_SPAN - 1e-6);
  const pillars = Array.from({ length: bays + 1 }, (_, i) => x0 + (i * w) / bays);
  return { w, h, x0, y0, beams, pillars, scale };
}

export default function PergolaPlanner({ onUseMeasures }) {
  const [size, setSize] = useState({ width: 6, depth: 4, spacing: 60 });
  const [shown, setShown] = useState(size);
  const shownRef = useRef({ ...size });
  const sectionRef = useRef(null);
  const drawingRef = useRef(null);
  const headingId = useId();
  const baseId = useId();

  useEffect(() => {
    if (prefersReducedMotion()) {
      shownRef.current = { ...size };
      setShown({ ...size });
      return undefined;
    }
    const tween = gsap.to(shownRef.current, {
      width: size.width,
      depth: size.depth,
      spacing: size.spacing,
      duration: 0.45,
      ease: 'power3.out',
      onUpdate: () => setShown({ ...shownRef.current }),
    });
    return () => tween.kill();
  }, [size]);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.timeline({ scrollTrigger: { trigger: drawingRef.current, start: 'top 75%', once: true } })
      .fromTo(drawingRef.current.querySelectorAll('.pp-line'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: 0.05 })
      .fromTo(drawingRef.current.querySelectorAll('.pp-beam'), { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.5, ease: 'power2.out', stagger: 0.03, clearProps: 'transform' }, 0.3)
      .from(drawingRef.current.querySelectorAll('.pp-pillar, .pp-label'), { autoAlpha: 0, duration: 0.4, stagger: 0.04 }, 0.8);
  }, { scope: sectionRef });

  const area = size.width * size.depth;
  const beams = beamCount(size.width, size.spacing);
  const bays = Math.ceil(size.width / MAX_SPAN - 1e-6);
  const pillars = (bays + 1) * 2;
  const plan = layout(shown);
  const bottom = plan.y0 + plan.h + 40;
  const right = plan.x0 + plan.w + 34;
  const firstGap = plan.beams.length > 1 ? plan.beams[1] - plan.beams[0] : 0;

  const summary = `Pergolado de ${decimal(size.width)} m × ${decimal(size.depth)} m (${decimal(area)} m²), com vigas a cada ${size.spacing} cm.`;

  return (
    <section className="pp-section" id="simulador" ref={sectionRef} aria-labelledby={headingId}>
      <SheetEdge fill="#edeceb" />
      <div className="pp-layout">
        <div className="pp-copy">
          <p className="pp-eyebrow"><span aria-hidden="true" /> SIMULE SEU PERGOLADO</p>
          <h2 id={headingId}>Comece pelas<br /><em>medidas.</em></h2>
          <p className="pp-intro">Ajuste o tamanho da área e o espaçamento das vigas. A planta se redesenha na hora — e você leva as medidas direto para a conversa.</p>

          <div className="pp-controls">
            {CONTROLS.map((control) => {
              const value = size[control.key];
              const fill = ((value - control.min) / (control.max - control.min)) * 100;
              const id = `${baseId}-${control.key}`;
              return (
                <div className="pp-control" key={control.key}>
                  <label htmlFor={id}>
                    <span>{control.label}</span>
                    <output htmlFor={id}>{control.unit === 'm' ? decimal(value) : value} {control.unit}</output>
                  </label>
                  <input
                    id={id}
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={value}
                    style={{ '--fill': `${fill}%` }}
                    onChange={(event) => setSize((current) => ({ ...current, [control.key]: Number(event.target.value) }))}
                  />
                </div>
              );
            })}
          </div>

          <dl className="pp-stats">
            <div><dt>Área coberta</dt><dd>{decimal(area)} m²</dd></div>
            <div><dt>Vigas na grelha</dt><dd>{beams}</dd></div>
            <div><dt>Pilares estimados</dt><dd>{pillars}</dd></div>
          </dl>

          <button type="button" className="button button-wood pp-cta" onClick={() => onUseMeasures(summary)}>
            Levar estas medidas para a conversa <ArrowUpRight size={19} />
          </button>
          <p className="pp-note">Estimativa ilustrativa. Perfis, vãos e posição dos pilares são definidos no projeto estrutural.</p>
        </div>

        <figure className="pp-figure">
          <svg ref={drawingRef} className="pp-drawing" viewBox="0 0 640 440" role="img" aria-label={`Planta do pergolado: ${summary}`}>
            <rect className="pp-line pp-frame" x={plan.x0} y={plan.y0} width={plan.w} height={plan.h} pathLength="1" />
            {plan.beams.map((x, i) => <rect key={i} className="pp-beam" x={x - 1.4} y={plan.y0} width="2.8" height={plan.h} />)}
            {plan.pillars.flatMap((x, i) => [plan.y0, plan.y0 + plan.h].map((y) => <rect key={`${i}-${y}`} className="pp-pillar" x={x - 6} y={y - 6} width="12" height="12" />))}

            <path className="pp-line pp-dim" pathLength="1" d={`M${plan.x0} ${plan.y0 + plan.h + 12}V${bottom + 8}M${plan.x0 + plan.w} ${plan.y0 + plan.h + 12}V${bottom + 8}M${plan.x0} ${bottom}H${plan.x0 + plan.w}M${plan.x0 - 6} ${bottom + 6}l12 -12M${plan.x0 + plan.w - 6} ${bottom + 6}l12 -12`} />
            <path className="pp-line pp-dim" pathLength="1" d={`M${plan.x0 + plan.w + 12} ${plan.y0}H${right + 8}M${plan.x0 + plan.w + 12} ${plan.y0 + plan.h}H${right + 8}M${right} ${plan.y0}V${plan.y0 + plan.h}M${right - 6} ${plan.y0 + 6}l12 -12M${right - 6} ${plan.y0 + plan.h + 6}l12 -12`} />
            {firstGap > 18 && <path className="pp-line pp-dim pp-dim-accent" pathLength="1" d={`M${plan.beams[0]} ${plan.y0 - 16}H${plan.beams[1]}M${plan.beams[0]} ${plan.y0 - 22}V${plan.y0 - 10}M${plan.beams[1]} ${plan.y0 - 22}V${plan.y0 - 10}`} />}

            <text className="pp-label" x={plan.x0 + plan.w / 2} y={bottom + 24} textAnchor="middle">{decimal(shown.width)} m</text>
            <text className="pp-label" x={right + 22} y={plan.y0 + plan.h / 2} textAnchor="middle" transform={`rotate(-90 ${right + 22} ${plan.y0 + plan.h / 2})`}>{decimal(shown.depth)} m</text>
            {firstGap > 18 && <text className="pp-label pp-label-accent" x={plan.beams[0] + firstGap / 2} y={plan.y0 - 28} textAnchor="middle">{Math.round(shown.spacing)} cm</text>}
          </svg>
          <figcaption className="pp-caption"><span>Planta ilustrativa · vista de cima</span><span className="pp-caption-line" aria-hidden="true" /></figcaption>
        </figure>
      </div>
      <SheetEdge fill="#f6f6f5" side="bottom" />
    </section>
  );
}
