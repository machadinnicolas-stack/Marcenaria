import { useEffect, useId, useRef, useState } from 'react';
import './finish-experience.css';
import { SheetEdge } from './Steel.jsx';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from './gsap.js';

// sheen = the specular highlight: narrow and tall for brushed steel (anisotropic), broad and soft for paint and rust.
const FINISHES = [
  { id: 'preto', name: 'Preto fosco', swatch: '#2c2e31', tone: 'dark', sheen: { w: '40%', h: '52%', color: '#ffffff', strength: 0.42 }, glow: 0.1 },
  { id: 'aco', name: 'Aço escovado', swatch: '#b0b5ba', tone: 'light', sheen: { w: '8%', h: '160%', color: '#ffffff', strength: 0.95 }, glow: 0.22 },
  { id: 'corten', name: 'Corten', swatch: '#9a4822', tone: 'dark', sheen: { w: '44%', h: '52%', color: '#ffcfa6', strength: 0.42 }, glow: 0.12 },
];

const MAX_CACHE = 6;

export default function FinishExperience() {
  const [selected, setSelected] = useState('preto');
  const [armed, setArmed] = useState(false);
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const canvasRef = useRef(null);
  const cacheRef = useRef(new Map());
  const pendingRef = useRef(new Map());
  const workerRef = useRef(null);
  const idleRef = useRef(null);
  const inViewRef = useRef(false);
  const lightRef = useRef({ x: 67, y: 32 });
  const radioName = useId();
  const headingId = useId();
  const hintId = useId();
  const finish = FINISHES.find((item) => item.id === selected);

  const moveLight = (x, y) => {
    const position = { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
    lightRef.current = position;
    panelRef.current?.style.setProperty('--fx-light-x', `${position.x}%`);
    panelRef.current?.style.setProperty('--fx-light-y', `${position.y}%`);
  };

  // Render lazily (the plate is computed pixel by pixel), and let the light drift on its own while nobody touches it,
  // so the effect is visible on phones, which have no cursor.
  useGSAP(() => {
    ScrollTrigger.create({ trigger: sectionRef.current, start: 'top bottom+=500', once: true, onEnter: () => setArmed(true) });
    if (prefersReducedMotion()) return;
    const proxy = { x: 26, y: 38 };
    idleRef.current = gsap.to(proxy, {
      x: 76,
      y: 24,
      duration: 4.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: true,
      onUpdate: () => moveLight(proxy.x, proxy.y),
    });
    ScrollTrigger.create({
      trigger: panelRef.current,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        inViewRef.current = self.isActive;
        if (self.isActive) idleRef.current?.play();
        else idleRef.current?.pause();
      },
    });
  }, { scope: sectionRef });

  // One worker for the whole section: it computes each plate once, off the main thread.
  useEffect(() => {
    if (!armed) return undefined;
    const cache = cacheRef.current;
    const pending = pendingRef.current;
    const worker = new Worker(new URL('./plate.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const specCanvas = document.createElement('canvas');
      specCanvas.width = data.pw;
      specCanvas.height = data.ph;
      specCanvas.getContext('2d').putImageData(new ImageData(data.spec, data.pw, data.ph), 0, 0);
      const specUrl = new Promise((resolve) => specCanvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.9));
      pending.get(data.key)?.({ base: new ImageData(data.base, data.pw, data.ph), specUrl });
      pending.delete(data.key);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
      pending.forEach((_, key) => cache.delete(key));
      pending.clear();
    };
  }, [armed]);

  const getPlate = (finishId, width, height, dpr) => {
    const cache = cacheRef.current;
    const key = `${finishId}:${width}x${height}@${dpr}`;
    if (cache.has(key)) return cache.get(key);
    const entry = new Promise((resolve) => pendingRef.current.set(key, resolve));
    workerRef.current.postMessage({ key, finishId, width, height, dpr });
    cache.set(key, entry);
    if (cache.size > MAX_CACHE) {
      const [oldKey, oldEntry] = cache.entries().next().value;
      cache.delete(oldKey);
      oldEntry.then((plate) => plate.specUrl.then((url) => URL.revokeObjectURL(url)));
    }
    return entry;
  };

  // Draws the selected finish; once it is on screen, the other finishes are prepared so switching is instant.
  useEffect(() => {
    if (!armed) return undefined;
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    let timer = 0;
    let lastKey = '';
    const draw = () => {
      const rect = panel.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const key = `${finish.id}:${width}x${height}@${dpr}`;
      if (key === lastKey || !workerRef.current) return;
      lastKey = key;
      getPlate(finish.id, width, height, dpr).then((plate) => {
        if (lastKey !== key) return;
        canvas.width = plate.base.width;
        canvas.height = plate.base.height;
        canvas.getContext('2d').putImageData(plate.base, 0, 0);
        plate.specUrl.then((url) => { if (lastKey === key) panel.style.setProperty('--fx-spec', `url(${url})`); });
        if (workerRef.current) FINISHES.forEach((item) => getPlate(item.id, width, height, dpr));
      });
    };

    let first = true;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(draw, first ? 0 : 160);
      first = false;
    });
    observer.observe(panel);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      lastKey = '';
    };
  }, [armed, finish]);

  useEffect(() => () => {
    cacheRef.current.forEach((entry) => entry.then((plate) => plate.specUrl.then((url) => URL.revokeObjectURL(url))));
    cacheRef.current.clear();
  }, []);

  const pauseIdle = () => idleRef.current?.pause();
  const resumeIdle = () => { if (inViewRef.current) idleRef.current?.play(); };

  const followPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    moveLight(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100);
  };

  const moveWithKeyboard = (event) => {
    const movement = { ArrowLeft: [-7, 0], ArrowRight: [7, 0], ArrowUp: [0, -7], ArrowDown: [0, 7] }[event.key];
    if (!movement) return;
    event.preventDefault();
    pauseIdle();
    moveLight(lightRef.current.x + movement[0], lightRef.current.y + movement[1]);
  };

  const plateStyle = {
    '--sheen-w': finish.sheen.w,
    '--sheen-h': finish.sheen.h,
    '--sheen-color': finish.sheen.color,
    '--sheen-strength': finish.sheen.strength,
    '--glow': finish.glow,
  };

  return (
    <section className="fx-section" id="acabamento" ref={sectionRef} aria-labelledby={headingId}>
      <SheetEdge fill="#edeceb" />
      <div className="fx-layout">
        <div className="fx-copy">
          <p className="fx-eyebrow"><span aria-hidden="true" /> MATÉRIA & PRECISÃO</p>
          <h2 className="fx-title" id={headingId}>A força está<br />no <em>acabamento.</em></h2>
          <p className="fx-description">A luz revela a superfície. Passe o cursor sobre a chapa e compare como cada acabamento do aço responde ao brilho.</p>

          <fieldset className="fx-finishes">
            <legend>Escolha o acabamento</legend>
            <div className="fx-options">
              {FINISHES.map((item) => (
                <label className={`fx-option${selected === item.id ? ' fx-option-selected' : ''}`} key={item.id}>
                  <input type="radio" name={radioName} value={item.id} checked={selected === item.id} onChange={() => setSelected(item.id)} />
                  <span className="fx-swatch" style={{ '--fx-swatch': item.swatch }} aria-hidden="true"><span /></span>
                  <span className="fx-option-name">{item.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="fx-interaction-hint" id={hintId}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Mova a luz sobre a chapa e veja o reflexo mudar.
          </p>
        </div>

        <figure className="fx-sample">
          <div
            ref={panelRef}
            className="fx-plate"
            data-tone={finish.tone}
            style={plateStyle}
            role="group"
            aria-label={`Amostra ilustrativa em ${finish.name}. Use as setas do teclado para mover a luz.`}
            aria-describedby={hintId}
            tabIndex={0}
            onPointerEnter={pauseIdle}
            onPointerMove={followPointer}
            onPointerDown={followPointer}
            onPointerLeave={resumeIdle}
            onKeyDown={moveWithKeyboard}
            onBlur={resumeIdle}
          >
            <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
            <div className="fx-sheen" aria-hidden="true" />
            <div className="fx-light" aria-hidden="true" />
            <div className="fx-panel-shade" aria-hidden="true" />
            {['tl', 'tr', 'bl', 'br'].map((corner) => <span key={corner} className={`fx-bolt fx-bolt-${corner}`} aria-hidden="true" />)}
            <span className="fx-panel-index" aria-hidden="true">0{FINISHES.findIndex((item) => item.id === selected) + 1} / 03</span>
            <span className="fx-panel-label" aria-hidden="true"><span>PALETA ÂMAGO</span>{finish.name}</span>
            <span className="fx-panel-mark" aria-hidden="true">â.</span>
          </div>
          <figcaption className="fx-caption"><span>Estudo de superfície · representação ilustrativa</span><span className="fx-caption-line" aria-hidden="true" /></figcaption>
        </figure>
      </div>
      <SheetEdge fill="#edeceb" side="bottom" />
    </section>
  );
}
