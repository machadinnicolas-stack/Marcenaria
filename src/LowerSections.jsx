import { useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Plus, Minus } from 'lucide-react';
import './lower-sections.css';
import { gsap, useGSAP, prefersReducedMotion } from './gsap.js';
import { SheetEdge, TrussDrawing } from './Steel.jsx';
import PergolaPlanner from './PergolaPlanner.jsx';

const steps = [
  {
    name: 'Conversa',
    description: 'Tudo começa com você. Entendemos sua rotina, suas referências e o que o seu espaço precisa.',
  },
  {
    name: 'Projeto',
    description: 'Ideias ganham forma. Medidas, materiais e acabamentos são pensados em conjunto, detalhe por detalhe.',
  },
  {
    name: 'Fabricação',
    description: 'Corte, dobra e solda transformam o desenho em estrutura, com precisão em cada junta e cada acabamento.',
  },
  {
    name: 'Instalação',
    description: 'A estrutura é fixada e alinhada no local. Os ajustes finais completam a transformação do espaço.',
  },
];

const questions = [
  {
    question: 'Por onde começo meu projeto?',
    answer: 'Comece contando que estrutura você imagina e como pretende usar o espaço. Fotos, medidas aproximadas e referências ajudam a iniciar a conversa. Os detalhes e a viabilidade são definidos durante o planejamento.',
  },
  {
    question: 'Posso escolher os materiais e acabamentos?',
    answer: 'Sim. A proposta é construir essas escolhas junto com você, considerando a aparência desejada, o uso de cada peça e as possibilidades do projeto. Perfis, cores de pintura e tipos de fixação fazem parte dessa conversa.',
  },
  {
    question: 'Preciso ter um projeto de arquitetura pronto?',
    answer: 'Não é necessário para iniciar a conversa. Você pode trazer um projeto existente ou apenas suas ideias e referências. A partir daí, são alinhadas as necessidades de desenho, medidas e detalhamento para seguir.',
  },
  {
    question: 'Como são definidos o orçamento e o prazo?',
    answer: 'Cada projeto tem suas particularidades. O orçamento e o cronograma são definidos após avaliar medidas, materiais, complexidade e condições de instalação, para que você conheça o escopo antes de decidir.',
  },
  {
    question: 'A estrutura enferruja com o tempo?',
    answer: 'Com tratamento anticorrosivo e pintura adequada ao ambiente, o aço fica protegido. A manutenção recomendada depende da exposição ao sol, à chuva e à maresia, e é orientada na entrega.',
  },
];

export default function LowerSections({ onContact, onUseMeasures }) {
  const [openQuestion, setOpenQuestion] = useState(0);
  const accordionId = useId();
  const stepsRef = useRef(null);

  // The four steps are steel plates with interlocking tabs: they arrive loose, lock together, and the seams flash like a weld.
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const boards = gsap.utils.toArray('.ls-step', stepsRef.current);
    const twoColumns = window.matchMedia('(max-width: 700px)').matches;
    const spread = twoColumns ? [-14, 14, -14, 14] : [-66, -22, 22, 66];
    const tilt = [-2.4, 1.6, -1.4, 2.2];
    const lift = [14, -10, 12, -8];
    gsap.set(stepsRef.current, { backgroundColor: 'transparent' });
    gsap.timeline({ scrollTrigger: { trigger: stepsRef.current, start: 'top 78%', once: true } })
      .fromTo(boards,
        { autoAlpha: 0, x: (i) => spread[i] * 1.8, y: (i) => lift[i] + 36, rotate: (i) => tilt[i] * 1.6 },
        { autoAlpha: 1, x: (i) => spread[i], y: (i) => lift[i], rotate: (i) => tilt[i], duration: 0.8, ease: 'power2.out', stagger: 0.07 })
      .to(boards, { x: 0, y: 0, rotate: 0, duration: 0.7, ease: 'power4.in', stagger: { each: 0.05, from: 'center' } }, '+=0.2')
      .to(stepsRef.current, { scale: 1.012, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' })
      .to(stepsRef.current, { backgroundColor: '#ffb45a', duration: 0.06 }, '<')
      .to(stepsRef.current, { backgroundColor: '#3d4146', duration: 1.6, ease: 'power2.out' });
  }, { scope: stepsRef });

  return (
    <>
      <section className="ls-process" id="processo" aria-labelledby="ls-process-heading">
        <div className="ls-container">
          <div className="ls-process-header reveal">
            <div>
              <p className="ls-eyebrow"><span /> DO PRIMEIRO TRAÇO AO ÚLTIMO DETALHE</p>
              <h2 id="ls-process-heading">Feito com tempo.<br />Pensado com você.</h2>
            </div>
            <p className="ls-section-intro">Um bom resultado começa com uma boa conversa. Acompanhamos cada etapa para que o projeto faça sentido na sua vida.</p>
          </div>
          <div className="ls-steps" ref={stepsRef}>
            {steps.map((step, index) => (
              <article className="ls-step" key={step.name}>
                <div className="ls-step-top"><span className="ls-step-number">0{index + 1}</span><ArrowUpRight aria-hidden="true" size={23} strokeWidth={1.25} /></div>
                <h3>{step.name}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
          <div className="ls-process-foot"><span>SEU ESPAÇO. SEU JEITO. CADA DETALHE.</span><ArrowDown size={18} strokeWidth={1.25} aria-hidden="true" /></div>
        </div>
      </section>

      <PergolaPlanner onUseMeasures={onUseMeasures} />

      <section className="ls-faq" id="duvidas" aria-labelledby="ls-faq-heading">
        <div className="ls-container ls-faq-grid">
          <div className="ls-faq-heading reveal">
            <p className="ls-eyebrow"><span /> VAMOS CONVERSAR</p>
            <h2 id="ls-faq-heading">Antes de<br />dar forma.</h2>
            <p>Algumas respostas para tirar<br className="ls-desktop-break" /> suas ideias do papel.</p>
          </div>
          <div className="ls-accordion reveal">
            {questions.map((item, index) => {
              const isOpen = openQuestion === index;
              const buttonId = `${accordionId}-button-${index}`;
              const panelId = `${accordionId}-panel-${index}`;
              return (
                <div className={`ls-faq-item${isOpen ? ' ls-faq-item-open' : ''}`} key={item.question}>
                  <h3>
                    <button type="button" className="ls-faq-trigger" id={buttonId} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenQuestion(isOpen ? null : index)}>
                      <span>{item.question}</span>
                      <span className="ls-faq-icon">{isOpen ? <Minus size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}</span>
                    </button>
                  </h3>
                  <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="ls-faq-answer"><p>{item.answer}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ls-contact" id="contato" aria-labelledby="ls-contact-heading">
        <SheetEdge fill="#f6f6f5" />
        <TrussDrawing className="ls-contact-grain" start="top 80%" end="bottom 85%" />
        <div className="ls-container ls-contact-content reveal">
          <p className="ls-eyebrow"><span /> UM ESPAÇO COM A SUA ESSÊNCIA</p>
          <h2 id="ls-contact-heading">Sua ideia merece<br />ganhar <em>forma.</em></h2>
          <p>Conte o que você imagina.<br />Vamos pensar juntos no que vem depois.</p>
          <button className="ls-contact-button" type="button" onClick={onContact}>Vamos criar seu projeto <span><ArrowUpRight size={21} aria-hidden="true" /></span></button>
        </div>
        <div className="ls-contact-note ls-container"><span>DO AÇO, POSSIBILIDADES.</span><span>DO SEU JEITO, ÂMAGO.</span></div>
      </section>

      <footer className="ls-footer">
        <div className="ls-container">
          <div className="ls-footer-main">
            <a className="ls-brand" href="#" aria-label="Âmago Serralheria, voltar ao início"><span>âmago<span className="ls-brand-dot">.</span></span><small>SERRALHERIA</small></a>
            <p>Aço, precisão<br />e um novo jeito de habitar.</p>
            <nav className="ls-footer-nav" aria-label="Navegação do rodapé"><a href="#processo">Nosso processo</a><a href="#duvidas">Dúvidas frequentes</a><a href="#contato">Vamos conversar <ArrowUpRight size={14} aria-hidden="true" /></a></nav>
          </div>
          <div className="ls-footer-bottom"><span>© {new Date().getFullYear()} Âmago Serralheria</span><span>Apresentação conceitual · marca fictícia</span><a href="#">Voltar ao topo <ArrowUpRight size={14} aria-hidden="true" /></a></div>
        </div>
      </footer>
    </>
  );
}
