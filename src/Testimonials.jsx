import { Star } from 'lucide-react';
import './testimonials.css';

const REVIEWS = [
  { name: 'Marina T.', city: 'Atibaia', text: 'O guarda-corpo ficou exatamente como combinamos: resistente e com um acabamento que não parece industrial. Passou pela primeira chuva forte sem um arranhão.' },
  { name: 'Eduardo R.', city: 'Bom Jesus dos Perdões', text: 'Pedimos um portão que desse segurança sem perder a cara da fachada. Entregaram isso — e no prazo combinado.' },
  { name: 'Camila S.', city: 'Piracaia', text: 'A cobertura do nosso quintal aguenta vento forte sem balançar. Depois de dois invernos, continua perfeita.' },
  { name: 'Rafael M.', city: 'Jarinu', text: 'Trocamos uma estrutura de madeira por aço e a diferença de durabilidade já se nota. A equipe explicou cada etapa do projeto.' },
  { name: 'Juliana P.', city: 'Mairiporã', text: 'A escada em aço ficou leve visualmente, mas extremamente firme. Superou a expectativa do projeto.' },
];

const STARS = Array.from({ length: 5 });

export default function Testimonials() {
  return (
    <section className="ts-section" id="avaliacoes" aria-labelledby="ts-heading">
      <div className="ls-container">
        <div className="ts-heading reveal">
          <p className="ls-eyebrow"><span /> QUEM CONFIOU NA ÂMAGO</p>
          <h2 id="ts-heading">Confiança que se vê<br />na estrutura.</h2>
        </div>
        <div className="ts-grid">
          {REVIEWS.map((review) => (
            <article className="ts-card reveal" key={review.name}>
              <div className="ts-stars" aria-label="Avaliação de 5 estrelas">{STARS.map((_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}</div>
              <p className="ts-text">{review.text}</p>
              <p className="ts-author"><strong>{review.name}</strong><span>{review.city}</span></p>
            </article>
          ))}
        </div>
        <p className="ts-note">Depoimentos ilustrativos, representativos da experiência esperada — em breve, avaliações reais de clientes Âmago.</p>
      </div>
    </section>
  );
}
