import { useState, useEffect, useRef, useId } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, Plus, X, Menu, ChevronLeft, ChevronRight, Check, Copy, MoveUpRight } from 'lucide-react';
import LowerSections from './LowerSections.jsx';
import FinishExperience from './FinishExperience.jsx';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from './gsap.js';
import { CathedralGrain, TapeMeasure } from './Wood.jsx';
import FinishSimulator from './FinishSimulator.jsx';

const photo = (n, thumb = false) => `/images/image-${String(n).padStart(2, '0')}${thumb ? '-thumb' : ''}.webp`;

function Brand({ footer = false }) {
  return <a className={`brand ${footer ? 'brand-footer' : ''}`} href="#inicio" aria-label="Âmago Marcenaria, início">
    <svg viewBox="0 0 50 50" fill="none" aria-hidden="true"><path d="M7 41V18L25 8l18 10v23M17 41V24l8-4 8 4v17M7 32h10m16 0h10" stroke="currentColor" strokeWidth="1.6" /></svg>
    <span><strong>âmago<span className="brand-dot">.</span></strong><small>MARCENARIA</small></span>
  </a>;
}

function useModalFocus(ref, onClose) {
  useEffect(() => {
    const oldFocus = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => ref.current?.querySelector('button, input, select, textarea, [tabindex="0"]')?.focus(), 30);
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = [...ref.current.querySelectorAll('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]')];
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { clearTimeout(timer); document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', handleKey); oldFocus?.focus(); };
  }, [ref, onClose]);
}

const projects = [
  { n: 4, title: 'Um espaço para reunir', category: 'Ambientes', detail: 'Área gourmet', position: 'center 48%' },
  { n: 19, title: 'Textura que acolhe', category: 'Detalhes', detail: 'Tons & texturas', position: 'center 20%' },
  { n: 14, title: 'Feito para compartilhar', category: 'Ambientes', detail: 'Cozinha integrada', position: 'center 65%' },
  { n: 2, title: 'A beleza do natural', category: 'Detalhes', detail: 'Inspiração de acabamento', position: 'center 20%' },
  { n: 26, title: 'Linhas em harmonia', category: 'Exteriores', detail: 'Arquitetura & ambiente', position: 'center 45%' },
  { n: 11, title: 'Dentro e fora, conectados', category: 'Exteriores', detail: 'Espaços integrados', position: 'center 55%' },
  ...[1, 3, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27].map((n) => ({ n, title: `Um novo olhar sobre o espaço`, category: [1, 3, 5, 17, 23].includes(n) ? 'Ambientes' : 'Exteriores', detail: 'Acervo de ambientes', position: 'center' })),
];

function Lightbox({ index, onClose }) {
  const [current, setCurrent] = useState(index);
  const ref = useRef(null);
  useModalFocus(ref, onClose);
  const advance = (delta) => setCurrent((value) => (value + delta + projects.length) % projects.length);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'ArrowRight') setCurrent(v => (v + 1) % projects.length); if (e.key === 'ArrowLeft') setCurrent(v => (v - 1 + projects.length) % projects.length); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const item = projects[current];
  return <div className="modal-backdrop lightbox" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="lightbox-dialog" ref={ref} role="dialog" aria-modal="true" aria-label="Galeria de ambientes">
      <div className="lightbox-top"><span>ÂMAGO / ACERVO DE AMBIENTES</span><button className="icon-button" onClick={onClose} aria-label="Fechar galeria"><X /></button></div>
      <div className="lightbox-image"><button className="icon-button gallery-prev" onClick={() => advance(-1)} aria-label="Foto anterior"><ChevronLeft /></button><img src={photo(item.n)} alt={`${item.detail} — fotografia ${item.n} do acervo`} /><button className="icon-button gallery-next" onClick={() => advance(1)} aria-label="Próxima foto"><ChevronRight /></button></div>
      <div className="lightbox-bottom"><div><h3>{item.title}</h3><p>{item.detail}</p></div><span>{String(current + 1).padStart(2, '0')} <i>/ {projects.length}</i></span></div>
    </div>
  </div>;
}

function ContactModal({ onClose }) {
  const ref = useRef(null), id = useId();
  useModalFocus(ref, onClose);
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const summaryRef = useRef(null);
  const submit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSummary(`Olá, Âmago! Meu nome é ${data.get('name').trim()}.\nQuero conversar sobre um projeto para ${data.get('room').toLowerCase()}.\n\nMinha ideia: ${data.get('idea').trim()}`);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true); }
    catch { summaryRef.current?.focus(); summaryRef.current?.select(); }
  };
  return <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={ref}>
      <button className="icon-button modal-close" aria-label="Fechar formulário" onClick={onClose}><X /></button>
      <span className="eyebrow">VAMOS TIRAR DO PAPEL</span><h2 id={`${id}-title`}>Todo projeto começa<br />com uma boa conversa.</h2>
      {summary ? <div className="contact-result"><div className="result-check"><Check size={22} /></div><h3>Sua ideia já tem um começo.</h3><p>Este é o resumo do projeto que você imaginou.</p><textarea ref={summaryRef} readOnly aria-label="Resumo do projeto" value={summary} /><button className="button button-forest" onClick={copy}>{copied ? 'Resumo copiado' : 'Copiar meu resumo'} {copied ? <Check size={18} /> : <Copy size={18} />}</button><button className="text-button" onClick={() => { setSummary(''); setCopied(false); }}>Criar outro resumo</button><span role="status" className="sr-only">{copied ? 'Resumo copiado para a área de transferência.' : ''}</span></div> : <form onSubmit={submit}>
        <label htmlFor={`${id}-name`}>Como podemos chamar você?</label><input id={`${id}-name`} name="name" required minLength={2} maxLength={80} placeholder="Seu nome" autoComplete="given-name" />
        <label htmlFor={`${id}-room`}>Qual ambiente você quer transformar?</label><select id={`${id}-room`} name="room" required defaultValue=""><option value="" disabled>Escolha um ambiente</option><option>Cozinha e área gourmet</option><option>Sala de estar</option><option>Quarto e closet</option><option>Home office</option><option>Outro ambiente</option></select>
        <label htmlFor={`${id}-idea`}>Conte um pouco da sua ideia</label><textarea id={`${id}-idea`} name="idea" required minLength={10} maxLength={1500} rows={3} placeholder="O que você gostaria de criar no seu espaço?" />
        <button type="submit" className="button button-forest">Preparar meu projeto <ArrowUpRight size={18} /></button>
      </form>}
      <p className="demo-note">Esta é uma demonstração. Nenhum dado é enviado ou armazenado.</p>
    </div>
  </div>;
}

const services = [
  { name: 'Cozinhas', label: 'Cozinhas & áreas gourmet', title: 'O coração da casa,\ncom a sua identidade.', text: 'Espaço para preparar, receber e compartilhar. Uma marcenaria que integra os ambientes e dá lugar a cada detalhe da sua rotina.', tags: ['Organização inteligente', 'Integração do ambiente', 'Desenho sob medida'], x: 77, y: 68, n: 14, icon: '01' },
  { name: 'Armários', label: 'Armários sob medida', title: 'Cada coisa\nno seu lugar.', text: 'Por dentro, praticidade. Por fora, harmonia. Divisões pensadas para o que você guarda e proporções que acompanham o seu espaço.', tags: ['Aproveitamento do espaço', 'Divisões personalizadas', 'Acabamentos coordenados'], x: 84, y: 48, n: 4, icon: '02' },
  { name: 'Painéis', label: 'Painéis & composições', title: 'Texturas que dão\npersonalidade.', text: 'Volumes, cores e composições que transformam a leitura do ambiente. Um projeto que conecta os móveis à arquitetura da sua casa.', tags: ['Composição de materiais', 'Continuidade visual', 'Personalização'], x: 42, y: 27, n: 19, icon: '03' },
];

function ServiceExplorer({ onContact }) {
  const [active, setActive] = useState(0);
  const selected = services[active];
  return <section className="services section-pad" id="servicos">
    <div className="section-heading reveal"><div><span className="eyebrow"><span className="tiny-line" /> DO SEU JEITO</span><h2>Um ambiente.<br /><span className="muted">Muitas possibilidades.</span></h2></div><p>Explore os detalhes. Descubra como a marcenaria pode fazer parte do seu espaço.</p></div>
    <div className="service-grid">
      <div className="service-visual reveal"><div className="service-photo"><img src={photo(4)} alt="Área gourmet integrada, com armários claros e uma ilha central" loading="lazy" width="1350" height="1800" /><div className="photo-shade" /><span className="image-index">UM OLHAR PARA CADA DETALHE</span>{services.map((s, i) => <button key={s.name} type="button" className={`hotspot ${active === i ? 'active' : ''}`} style={{left: `${s.x}%`, top: `${s.y}%`}} onClick={() => setActive(i)} aria-label={`Explorar ${s.label}`} aria-pressed={active === i}><Plus size={16} /><span>{s.name}</span></button>)}<span className="image-instruction"><Plus size={13} /> Toque nos pontos para explorar</span></div></div>
      <div className="service-panel reveal"><div className="service-tabs" role="tablist" aria-label="Tipos de projeto">{services.map((s, i) => <button key={s.name} role="tab" id={`service-tab-${i}`} aria-controls="service-panel" aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + services.length) % services.length; setActive(next); document.getElementById(`service-tab-${next}`)?.focus(); } }} className={active === i ? 'selected' : ''}>{s.name}</button>)}</div>
        <div id="service-panel" role="tabpanel" aria-labelledby={`service-tab-${active}`} tabIndex={0}><div className="service-detail" key={active}><span className="detail-counter">{selected.icon} <span>/ {selected.label}</span></span><h3>{selected.title.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</h3><p>{selected.text}</p><ul>{selected.tags.map(t => <li key={t}><Check size={14} />{t}</li>)}</ul><button className="text-link" onClick={onContact}>Pensar no meu projeto <ArrowUpRight size={19} /></button></div></div>
        <div className="service-footnote"><span className="material-circle" /><p>A escolha do acabamento faz parte<br />da construção do seu projeto.</p></div>
      </div>
    </div>
  </section>;
}

function ProjectGallery({ onOpen }) {
  const [filter, setFilter] = useState('Todos');
  const [expanded, setExpanded] = useState(false);
  const filtered = projects.filter(p => filter === 'Todos' || p.category === filter);
  const shown = expanded ? filtered : filtered.slice(0, 3);
  const galleryRef = useRef(null);

  // Each photo is "planed": a wood veneer slides off with a shaving curl on its leading edge.
  useGSAP((context, contextSafe) => {
    if (prefersReducedMotion()) return undefined;
    const section = galleryRef.current;
    section.classList.add('veneer-on');
    const plane = contextSafe((cards) => cards.forEach((card, i) => {
      const img = card.querySelector('.project-image img');
      gsap.timeline({ delay: i * 0.14 })
        .set(img, { transition: 'none' })
        .to(card.querySelector('.veneer'), { yPercent: -106, duration: 1.1, ease: 'power3.inOut' }, 0)
        .from(img, { scale: 1.14, duration: 1.5, ease: 'power2.out' }, 0.1)
        .set(img, { clearProps: 'transition,transform,scale' });
    }));
    ScrollTrigger.batch(section.querySelectorAll('.project-card'), { start: 'top 88%', once: true, onEnter: plane });
    ScrollTrigger.refresh();
    return () => section.classList.remove('veneer-on');
  }, { scope: galleryRef, dependencies: [filter, expanded], revertOnUpdate: true });

  return <section className="projects section-pad" id="projetos" ref={galleryRef}>
    <div className="section-heading reveal"><div><span className="eyebrow"><span className="tiny-line" /> ESPAÇOS COM PERSONALIDADE</span><h2>O detalhe faz<br /><span className="muted">toda a diferença.</span></h2></div><div className="gallery-heading-right"><p>Uma seleção de ambientes, encontros de materiais e ideias para o seu próximo projeto.</p><div className="filter-row" aria-label="Filtrar galeria">{['Todos', 'Ambientes', 'Detalhes', 'Exteriores'].map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => {setFilter(f); setExpanded(false);}}>{f}</button>)}</div></div></div>
    <div className="project-grid">{shown.map((p, index) => <button className={`project-card ${index % 3 === 1 ? 'project-card-offset' : ''}`} key={p.n} onClick={() => onOpen(projects.indexOf(p))} aria-label={`Ampliar: ${p.title}, ${p.detail}`}><div className="project-image"><img src={photo(p.n, true)} alt={p.detail} style={{objectPosition:p.position}} width="525" height="700" loading="lazy" /><span className="project-open"><ArrowUpRight size={21} /></span><span className="project-category">{p.category}</span><span className="veneer" aria-hidden="true"><span className="veneer-curl" /></span></div><div className="project-caption"><div><h3>{p.title}</h3><p>{p.detail}</p></div><span>{String(projects.indexOf(p) + 1).padStart(2, '0')}</span></div></button>)}</div>
    <div className="gallery-bottom"><span>{String(filtered.length).padStart(2, '0')} olhares para inspirar o seu espaço</span>{filtered.length > 3 && <button className="button button-outline" onClick={() => setExpanded(!expanded)}>{expanded ? 'Recolher galeria' : 'Ver toda a galeria'} {expanded ? <X size={16} /> : <Plus size={16} />}</button>}</div>
  </section>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const contactClose = useRef(() => setContactOpen(false)).current;
  const galleryClose = useRef(() => setGalleryIndex(null)).current;
  const openContact = () => { setMenuOpen(false); setContactOpen(true); };
  useEffect(() => {
    const handler = () => { setScrolled(window.scrollY > 25); setPastHero(window.scrollY > window.innerHeight * 0.6); };
    handler(); window.addEventListener('scroll', handler, {passive:true});
    const elements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), {threshold:0.12});
    elements.forEach(element => {element.classList.add('reveal-ready'); observer.observe(element);});
    return () => { window.removeEventListener('scroll', handler); observer.disconnect(); };
  }, []);
  useEffect(() => { const close = (e) => {if(e.key === 'Escape') setMenuOpen(false);}; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  return <>
    <a href="#conteudo" className="skip-link">Ir para o conteúdo</a>
    <TapeMeasure />
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}><div className="header-inner"><Brand /><nav className={menuOpen ? 'nav open' : 'nav'} id="main-nav" aria-label="Navegação principal"><a href="#projetos" onClick={() => setMenuOpen(false)}>Projetos</a><a href="#servicos" onClick={() => setMenuOpen(false)}>O que fazemos</a><a href="#processo" onClick={() => setMenuOpen(false)}>Nosso processo</a><a href="#duvidas" onClick={() => setMenuOpen(false)}>Dúvidas</a><button className="nav-mobile-contact" onClick={openContact}>Vamos conversar <ArrowUpRight size={16} /></button></nav><button className="header-cta" onClick={openContact}>Vamos conversar <ArrowUpRight size={16} /></button><button className="menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div></header>
    <main id="conteudo">
      <section className={`hero ${pastHero ? 'hero-offscreen' : ''}`} id="inicio"><div className="hero-grain" /><div className="slat-ceiling" aria-hidden="true">{Array.from({length:40},(_,i)=><i key={i} style={{'--i':i}} />)}</div><div className="hero-inner"><div className="hero-copy"><span className="eyebrow hero-eyebrow"><span className="status-dot" /> NATURALMENTE, SOB MEDIDA.</span><h1>Seu espaço,<br />na sua<br /><span>essência.</span></h1><p>Transformamos ideias em ambientes que acolhem.<br className="desktop-break" /> Marcenaria pensada para a sua casa — e para a vida que acontece nela.</p><div className="hero-actions"><a className="button button-wood" href="#projetos">Explore os ambientes <ArrowUpRight size={19} /></a><button className="hero-text-link" onClick={openContact}>Imagine o seu <ArrowRight size={17} /></button></div></div><div className="hero-art"><div className="hero-photo-wrap"><img className="hero-photo" src={photo(4)} width="1350" height="1800" alt="Área gourmet acolhedora, com armários claros, ilha e texturas amadeiradas" fetchPriority="high" /><div className="hero-photo-overlay" /><span className="hero-photo-label">ESPAÇOS PARA VIVER BEM</span><button className="hero-photo-button" aria-label="Explorar foto da área gourmet" onClick={() => setGalleryIndex(0)}><ArrowUpRight size={25} /></button><div className="hero-photo-caption"><span>Forma. Função.</span><strong>E um pouco de você.</strong></div></div><div className="wood-sample"><img src={photo(19,true)} width="525" height="700" alt="Detalhe de uma superfície em tom amadeirado" /><span>Detalhes que<br />fazem sentir.</span><svg viewBox="0 0 38 38" fill="none" aria-hidden="true"><path d="M7 30V8h24v22H16V17h6v13" stroke="currentColor" strokeWidth="1" /></svg></div><div className="hero-side-label">DESENHO ATEMPORAL · IDENTIDADE NATURAL</div></div><div className="hero-bottom"><a href="#servicos"><span className="scroll-circle"><ArrowDown size={15} /></span>Conheça a Âmago</a><span>Feito para o seu espaço.<br /><strong>Pensado em cada detalhe.</strong></span><span className="hero-bottom-index">01 <i>/</i> A ESSÊNCIA</span></div></div></section>
      <div className="values-strip" aria-label="Sob medida, atenção aos detalhes e identidade natural"><span><span className="strip-star">✳</span> Feito para você</span><span><span className="strip-star">✳</span> Atenção aos detalhes</span><span><span className="strip-star">✳</span> Identidade natural</span><span className="strip-last"><span className="strip-star">✳</span> Beleza que permanece</span></div>
      <ServiceExplorer onContact={openContact} />
      <FinishExperience />
      <FinishSimulator />
      <ProjectGallery onOpen={setGalleryIndex} />
      <section className="manifesto section-pad"><CathedralGrain className="manifesto-grain" /><span className="eyebrow">O QUE NOS MOVE</span><p className="reveal">Uma casa é feita de histórias.<br />A nossa parte é dar a elas<br /><span>um lugar especial.</span></p><div className="manifesto-bottom"><span className="manifesto-mark">â.</span><span>MATÉRIA, CUIDADO E INTENÇÃO.<br />ESSA É A ESSÊNCIA DA ÂMAGO.</span></div></section>
      <LowerSections onContact={openContact} />
    </main>
    <button className={`floating-contact ${pastHero ? 'floating-contact-visible' : ''}`} onClick={openContact} aria-label="Conversar sobre um projeto"><span>Seu projeto começa aqui</span><ArrowUpRight size={23} /></button>
    {galleryIndex !== null && <Lightbox index={galleryIndex} onClose={galleryClose} />}
    {contactOpen && <ContactModal onClose={contactClose} />}
  </>;
}
