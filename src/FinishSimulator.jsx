import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from './gsap.js';
import './finish-simulator.css';

const PHOTO = '/images/image-02.webp';
const WORK_WIDTH = 900;

const FINISHES = [
  { id: 'natural', name: 'Natural', dark: [150, 116, 78], light: [236, 210, 170] },
  { id: 'mel', name: 'Mel', dark: [120, 70, 30], light: [226, 160, 88] },
  { id: 'nogueira', name: 'Nogueira', dark: [46, 28, 18], light: [138, 96, 66] },
];

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Finds the wood panels by colour (warm hue, enough saturation) above the wall line, and records each pixel's
// relative brightness so a new finish keeps the photo's grain, grooves and lighting.
function analyse(image) {
  const width = WORK_WIDTH;
  const height = Math.round((width * image.naturalHeight) / image.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const base = context.getImageData(0, 0, width, height);
  const pixels = base.data;
  const count = width * height;
  const weight = new Float32Array(count);
  const luma = new Float32Array(count);
  const histogram = new Uint32Array(256);

  for (let i = 0; i < count; i += 1) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);
    const saturation = max === 0 ? 0 : delta / max;
    let hue = 0;
    if (delta > 0) {
      if (max === r) hue = 60 * (((g - b) / delta) % 6);
      else if (max === g) hue = 60 * ((b - r) / delta + 2);
      else hue = 60 * ((r - g) / delta + 4);
      if (hue < 0) hue += 360;
    }
    const hueWeight = hue >= 18 && hue <= 48 ? 1 : hue < 18 ? smooth(8, 18, hue) : 1 - smooth(48, 58, hue);
    const y = Math.floor(i / width) / height;
    const w = hueWeight * smooth(0.18, 0.34, saturation) * smooth(0.18, 0.3, max) * (1 - smooth(0.63, 0.7, y));
    weight[i] = w;
    luma[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    if (w > 0.5) histogram[Math.round(luma[i] * 255)] += 1;
  }

  const total = histogram.reduce((sum, n) => sum + n, 0);
  const percentile = (p) => {
    let seen = 0;
    for (let v = 0; v < 256; v += 1) {
      seen += histogram[v];
      if (seen >= total * p) return v / 255;
    }
    return 1;
  };
  const low = percentile(0.03);
  const high = percentile(0.97);
  const tone = new Float32Array(count);
  for (let i = 0; i < count; i += 1) tone[i] = Math.min(1, Math.max(0, (luma[i] - low) / (high - low || 1)));

  return { width, height, base, weight, tone };
}

function paint({ width, height, base, weight, tone }, finish) {
  const out = new ImageData(new Uint8ClampedArray(base.data), width, height);
  const data = out.data;
  const { dark, light } = finish;
  for (let i = 0; i < weight.length; i += 1) {
    const w = weight[i];
    if (w < 0.01) continue;
    const t = tone[i] ** 0.9;
    for (let c = 0; c < 3; c += 1) {
      const target = dark[c] + (light[c] - dark[c]) * t;
      data[i * 4 + c] = data[i * 4 + c] * (1 - w) + target * w;
    }
  }
  return out;
}

export default function FinishSimulator() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const analysisRef = useRef(null);
  const cacheRef = useRef(new Map());
  const introRef = useRef(null);
  const draggingRef = useRef(false);
  const [finishId, setFinishId] = useState('nogueira');
  const [position, setPosition] = useState(50);
  const [ready, setReady] = useState(false);
  const radioName = useId();
  const headingId = useId();
  const finish = FINISHES.find((item) => item.id === finishId);

  const draw = useCallback(() => {
    const analysis = analysisRef.current;
    const canvas = canvasRef.current;
    if (!analysis || !canvas) return;
    let imageData = cacheRef.current.get(finishId);
    if (!imageData) {
      imageData = paint(analysis, finish);
      cacheRef.current.set(finishId, imageData);
    }
    canvas.width = analysis.width;
    canvas.height = analysis.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
  }, [finishId, finish]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  useGSAP(() => {
    const reduced = prefersReducedMotion();
    if (!reduced) setPosition(100);
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top bottom+=600',
      once: true,
      onEnter: () => {
        const image = new Image();
        image.src = PHOTO;
        image.decode().then(() => {
          analysisRef.current = analyse(image);
          setReady(true);
        });
      },
    });
    if (reduced) return;
    const proxy = { value: 100 };
    introRef.current = gsap.to(proxy, {
      value: 50,
      duration: 1.6,
      ease: 'power3.inOut',
      paused: true,
      onUpdate: () => setPosition(proxy.value),
    });
    ScrollTrigger.create({
      trigger: stageRef.current,
      start: 'top 62%',
      once: true,
      onEnter: () => introRef.current?.play(),
    });
  }, { scope: sectionRef });

  const stopIntro = () => {
    introRef.current?.kill();
    introRef.current = null;
  };

  const moveTo = (clientX) => {
    const rect = stageRef.current.getBoundingClientRect();
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  const onPointerDown = (event) => {
    stopIntro();
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };
  const onPointerMove = (event) => {
    if (draggingRef.current) moveTo(event.clientX);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const onKeyDown = (event) => {
    const step = event.shiftKey ? 20 : 5;
    const next = { ArrowLeft: position - step, ArrowRight: position + step, Home: 0, End: 100 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    stopIntro();
    setPosition(Math.min(100, Math.max(0, next)));
  };

  return (
    <section className="fs-section section-pad" id="antes-depois" ref={sectionRef} aria-labelledby={headingId}>
      <div className="fs-layout">
        <div className="fs-copy">
          <span className="eyebrow"><span className="tiny-line" /> ANTES E DEPOIS DO ACABAMENTO</span>
          <h2 id={headingId}>Mesmo forro.<br /><span className="muted">Outra atmosfera.</span></h2>
          <p>Arraste a régua sobre a foto e compare. A mesma estrutura ganha outro clima só com a troca do tom da madeira.</p>
          <fieldset className="fs-finishes">
            <legend>Aplique o acabamento</legend>
            <div className="fs-options">
              {FINISHES.map((item) => (
                <label key={item.id} className={`fs-option${finishId === item.id ? ' fs-option-selected' : ''}`}>
                  <input type="radio" name={radioName} value={item.id} checked={finishId === item.id} onChange={() => setFinishId(item.id)} />
                  <span className="fs-swatch" style={{ '--fs-dark': `rgb(${item.dark})`, '--fs-light': `rgb(${item.light})` }} aria-hidden="true" />
                  {item.name}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="fs-note">Simulação ilustrativa aplicada sobre a foto real de um forro. As cores finais variam conforme o material escolhido.</p>
        </div>

        <figure className="fs-figure">
          <div
            className={`fs-stage${ready ? ' fs-ready' : ''}`}
            ref={stageRef}
            style={{ '--pos': `${position}%` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img src={PHOTO} alt="Forro amadeirado com vigas pretas, antes da troca de acabamento" width="1350" height="1800" loading="lazy" draggable="false" />
            <canvas ref={canvasRef} className="fs-after" aria-hidden="true" />
            <span className="fs-chip fs-chip-before" aria-hidden="true">Antes</span>
            <span className="fs-chip fs-chip-after" aria-hidden="true">Depois · {finish.name}</span>
            <div
              className="fs-handle"
              role="slider"
              tabIndex={0}
              aria-label="Comparar antes e depois do acabamento"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position)}
              aria-valuetext={`${Math.round(100 - position)}% da foto com acabamento ${finish.name}`}
              onKeyDown={onKeyDown}
            >
              <span className="fs-knob" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </div>
          </div>
          <figcaption className="fs-caption">Arraste a régua ou use as setas do teclado.</figcaption>
        </figure>
      </div>
    </section>
  );
}
