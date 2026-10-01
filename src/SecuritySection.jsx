import { ShieldCheck, DoorClosed, CloudRain, Frame } from 'lucide-react';
import './security-section.css';
import { SheetEdge } from './Steel.jsx';

const POINTS = [
  { icon: ShieldCheck, title: 'Guarda-corpos', text: 'Sacadas, escadas e piscinas. Uma barreira de segurança que impede quedas sem esconder a vista.' },
  { icon: DoorClosed, title: 'Portões', text: 'Controle de acesso e a primeira impressão da fachada, com resistência que acompanha o uso diário.' },
  { icon: CloudRain, title: 'Coberturas & telhados', text: 'Estrutura dimensionada para vento e chuva, sem ceder com o tempo como a madeira cede.' },
  { icon: Frame, title: 'Molduras & fachadas', text: 'Define a identidade do imóvel e, ao mesmo tempo, sustenta e protege o que está por trás dela.' },
];

export default function SecuritySection() {
  return (
    <section className="sec-section" id="sobre" aria-labelledby="sec-heading">
      <SheetEdge fill="#edeceb" />
      <div className="sec-layout">
        <div className="sec-intro reveal">
          <p className="eyebrow"><span className="tiny-line" /> SOBRE A ÂMAGO</p>
          <h2 id="sec-heading">Mais que acabamento.<br />Uma estrutura em que<br /><span className="muted">você confia.</span></h2>
          <p className="sec-description">Trabalhamos com quem precisa resolver mais do que estética: guarda-corpos, portões, coberturas e fachadas que seguram peso, resistem ao tempo e protegem quem vive ali. O aço bem projetado dura mais do que a madeira — e não abre mão do visual moderno que o seu espaço pede. Da conversa inicial ao desenho final, cada projeto é personalizado para o seu terreno e para a sua rotina.</p>
        </div>

        <blockquote className="sec-quote reveal">
          <p>Nem tudo é voltado para acabamento, uma estrutura bem montada além de agregar um cenário futurista, mantém a proposta de proporcionar segurança e confiabilidade ao local.</p>
        </blockquote>

        <div className="sec-grid">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <article className="sec-card reveal" key={title}>
              <Icon size={26} strokeWidth={1.4} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
      <SheetEdge fill="#edeceb" side="bottom" />
    </section>
  );
}
