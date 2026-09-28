import { useEffect, useId, useRef, useState } from 'react';
import './finish-experience.css';

const FINISHES = [
  { id: 'natural', name: 'Natural', rgb: [190, 155, 109], swatch: '#c8a674' },
  { id: 'mel', name: 'Mel', rgb: [173, 115, 62], swatch: '#b98047' },
  { id: 'nogueira', name: 'Nogueira', rgb: [104, 70, 49], swatch: '#725039' },
];

// A fixed noise field gives every finish the same illustrative grain.
function makeNoise() {
  const size = 128;
  const field = new Float32Array(size * size);
  let seed = 97123;
  for (let i = 0; i < field.length; i += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    field[i] = seed / 4294967296;
  }
  return (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const dx = x - ix;
    const dy = y - iy;
    const sx = dx * dx * (3 - 2 * dx);
    const sy = dy * dy * (3 - 2 * dy);
    const row = (iy & 127) * size;
    const nextRow = ((iy + 1) & 127) * size;
    const left = ix & 127;
    const right = (ix + 1) & 127;
    const top = field[row + left] * (1 - sx) + field[row + right] * sx;
    const bottom = field[nextRow + left] * (1 - sx) + field[nextRow + right] * sx;
    return top * (1 - sy) + bottom * sy;
  };
}

const noise = makeNoise();

function paintWood(canvas, width, height, finish) {
  const context = canvas.getContext('2d');
  if (!context || width < 1 || height < 1) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  const texture = context.createImageData(pixelWidth, pixelHeight);
  const pixels = texture.data;
  const boundaries = [0, 0.255, 0.745, 1];
  let random = 52173;

  for (let y = 0; y < pixelHeight; y += 1) {
    const v = y / pixelHeight;
    for (let x = 0; x < pixelWidth; x += 1) {
      const u = x / pixelWidth;
      const board = u < boundaries[1] ? 0 : u < boundaries[2] ? 1 : 2;
      const localX = (u - boundaries[board]) / (boundaries[board + 1] - boundaries[board]);
      const offset = board * 23.71;
      const drift = noise(localX * 3.1 + offset, v * 1.65 + 11) - 0.5;
      const fineDrift = noise(localX * 9 + offset, v * 3.1 + 6) - 0.5;
      const trunkX = localX - 0.52 + drift * 0.14 + Math.sin(v * 4 + board) * 0.045;
      const trunkY = (v * 1.45 + 0.75 + board * 0.18) * 0.245;
      const rings = Math.sqrt(trunkX * trunkX * 0.58 + trunkY * trunkY) * 48
        + drift * 1.3 + fineDrift * 0.29;
      const growth = (Math.sin(rings * Math.PI * 2) + 1) * 0.5;
      const latewood = growth ** 12;
      const secondGrain = Math.sin(rings * Math.PI * 4 + 0.7) * 0.018;
      const fibers = noise(localX * 175 + offset, v * 5.8 + 42) - 0.5;
      const pores = Math.max(0, noise(localX * 270 + offset, v * 36 + 82) - 0.65);
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const dust = (random / 4294967296 - 0.5) * 0.045;
      const boardShade = board === 1 ? 0.035 : board === 0 ? -0.035 : -0.07;
      const tone = 1.03 + boardShade + drift * 0.22 + fineDrift * 0.085
        + growth * 0.045 - latewood * 0.18 + secondGrain + fibers * 0.115 - pores * 0.48 + dust;
      const edge = Math.min(localX, 1 - localX) * width * (boundaries[board + 1] - boundaries[board]);
      const join = edge < 0.9 ? 0.67 : edge < 1.8 ? 0.94 : 1;
      const index = (y * pixelWidth + x) * 4;
      pixels[index] = Math.min(255, finish.rgb[0] * tone * join);
      pixels[index + 1] = Math.min(255, finish.rgb[1] * tone * join);
      pixels[index + 2] = Math.min(255, finish.rgb[2] * tone * join);
      pixels[index + 3] = 255;
    }
  }
  context.putImageData(texture, 0, 0);

  const ambient = context.createLinearGradient(0, 0, pixelWidth, pixelHeight);
  ambient.addColorStop(0, 'rgba(255, 238, 209, 0.13)');
  ambient.addColorStop(0.5, 'rgba(255, 238, 209, 0)');
  ambient.addColorStop(1, 'rgba(35, 20, 12, 0.19)');
  context.fillStyle = ambient;
  context.fillRect(0, 0, pixelWidth, pixelHeight);
}

export default function FinishExperience() {
  const [selected, setSelected] = useState('natural');
  const [reducedMotion, setReducedMotion] = useState(false);
  const panelRef = useRef(null);
  const canvasRef = useRef(null);
  const lightRef = useRef({ x: 67, y: 28 });
  const radioName = useId();
  const headingId = useId();
  const hintId = useId();
  const finish = FINISHES.find((item) => item.id === selected);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    if (!panel || !canvas) return undefined;

    let frame = 0;
    let lastWidth = -1;
    let lastHeight = -1;
    const render = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { width, height } = panel.getBoundingClientRect();
        if (width === lastWidth && height === lastHeight) return;
        lastWidth = width;
        lastHeight = height;
        paintWood(canvas, width, height, finish);
      });
    };

    const observer = new ResizeObserver(render);
    observer.observe(panel);
    render();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [finish]);

  const moveLight = (x, y) => {
    const position = { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
    lightRef.current = position;
    panelRef.current?.style.setProperty('--fx-light-x', `${position.x}%`);
    panelRef.current?.style.setProperty('--fx-light-y', `${position.y}%`);
  };

  const followPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    moveLight(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100);
  };

  const moveWithKeyboard = (event) => {
    const movement = { ArrowLeft: [-7, 0], ArrowRight: [7, 0], ArrowUp: [0, -7], ArrowDown: [0, 7] }[event.key];
    if (!movement) return;
    event.preventDefault();
    moveLight(lightRef.current.x + movement[0], lightRef.current.y + movement[1]);
  };

  return (
    <section className="fx-section" id="acabamento" aria-labelledby={headingId}>
      <div className="fx-layout">
        <div className="fx-copy">
          <p className="fx-eyebrow"><span aria-hidden="true" /> MATÉRIA & SENSIBILIDADE</p>
          <h2 className="fx-title" id={headingId}>A beleza está no que você <em>sente.</em></h2>
          <p className="fx-description">A textura convida ao toque. A luz revela novos detalhes. Explore os tons e imagine a madeira fazendo parte do seu espaço.</p>

          <fieldset className="fx-finishes">
            <legend>Encontre o seu tom</legend>
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
            Mova a luz sobre a textura e descubra os detalhes.
          </p>
        </div>

        <figure className="fx-sample">
          <div
            ref={panelRef}
            className="fx-wood-panel"
            data-reduced-motion={reducedMotion}
            role="group"
            aria-label={`Amostra ilustrativa no tom ${finish.name}. Use as setas do teclado para mover a luz.`}
            aria-describedby={hintId}
            tabIndex={0}
            onPointerMove={followPointer}
            onPointerDown={followPointer}
            onPointerLeave={() => moveLight(67, 28)}
            onKeyDown={moveWithKeyboard}
          >
            <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
            <div className="fx-light" aria-hidden="true" />
            <div className="fx-panel-shade" aria-hidden="true" />
            <span className="fx-panel-index" aria-hidden="true">0{FINISHES.findIndex((item) => item.id === selected) + 1} / 03</span>
            <span className="fx-panel-label" aria-hidden="true"><span>PALETA ÂMAGO</span>{finish.name}</span>
            <span className="fx-panel-mark" aria-hidden="true">â.</span>
          </div>
          <figcaption className="fx-caption"><span>Estudo de textura · representação ilustrativa</span><span className="fx-caption-line" aria-hidden="true" /></figcaption>
        </figure>
      </div>
    </section>
  );
}
