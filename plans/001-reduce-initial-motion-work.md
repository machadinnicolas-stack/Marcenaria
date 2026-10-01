# 001 — Reduza o trabalho de animação na primeira tela

- **Status**: DONE
- **Commit**: 72576fc
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 3 arquivos, cerca de 70 linhas

## Problem

A página inicia 40 animações individuais das ripas, mantém brilhos infinitos e registra animação de régua de rolagem até em telas móveis. A galeria ainda força um recálculo global de todos os ScrollTriggers durante a montagem.

```jsx
// src/App.jsx:195 — current
ScrollTrigger.refresh();

// src/App.jsx:249 — current
<div className="slat-ceiling" aria-hidden="true">{Array.from({length:40},(_,i)=><i key={i} style={{'--i':i}} />)}</div>
```

```jsx
// src/Steel.jsx:96-98 — current
useGSAP(() => {
  gsap.fromTo(ref.current, { '--tape': 0 }, { '--tape': 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.4 } });
}, { scope: ref });
```

```css
/* src/styles.css:426-441 — current */
.slat-ceiling i {
  animation: slatOn 1.1s ease-out both;
}
.slat-ceiling i::after {
  animation: slatSheen 8s ease-in-out calc(var(--i) * 70ms + 3s) infinite
}
```

## Target

- Não chamar `ScrollTrigger.refresh()` manualmente durante a montagem da galeria.
- Não registrar a régua animada quando `max-width: 700px`, `pointer: coarse` ou `prefers-reduced-motion: reduce` estiver ativo.
- Em telas móveis/coarse, renderizar visualmente metade das ripas, desligar os brilhos infinitos e manter apenas uma entrada curta do conjunto.
- Manter animações de entrada apenas em `transform` e `opacity`.
- Pular layout/pintura inicial das seções fora da primeira tela com `content-visibility: auto` e `contain-intrinsic-size: auto 900px`.

```css
/* target mobile/coarse */
@media (max-width:700px), (hover:none) and (pointer:coarse) {
  .slat-ceiling { animation: mobile-ceiling-in 600ms var(--ease) both; }
  .slat-ceiling i { animation: none; }
  .slat-ceiling i:nth-child(even) { display: none; }
  .slat-ceiling i::after { display: none; animation: none; }
  .hero h1 > span { animation: none; background-position: 45% 0; }
  .tape { display: none; }
}

@keyframes mobile-ceiling-in {
  from { opacity: 0; transform: translateX(-50%) perspective(var(--ceil-p)) rotateX(var(--ceil-a)) translateY(-10px); }
}
```

## Repo conventions to follow

- O token de easing existente está em `src/styles.css:19`: `--ease: cubic-bezier(.22,1,.36,1)`.
- O breakpoint móvel principal existente é `@media(max-width:700px)` em `src/styles.css:2136`.
- O projeto já testa `prefersReducedMotion()` antes de registrar várias animações GSAP.

## Steps

1. Em `src/App.jsx`, remova somente a chamada explícita `ScrollTrigger.refresh()` da galeria; mantenha o `ScrollTrigger.batch` e sua limpeza.
2. Em `src/Steel.jsx`, antes de criar o tween da régua, retorne quando houver movimento reduzido, tela até 700 px ou ponteiro coarse.
3. Em `src/styles.css`, adicione o bloco mobile/coarse e `@keyframes mobile-ceiling-in` descritos no Target.
4. Em `src/styles.css`, adicione um bloco `@supports (content-visibility: auto)` para `.services`, `.sec-section`, `.fs-section`, `.projects`, `.manifesto`, `.ls-process`, `.pp-section`, `.ls-faq`, `.ts-section`, `.ls-contact` e `.ls-footer`, usando `content-visibility: auto` e `contain-intrinsic-size: auto 900px`.

## Boundaries

- Não altere textos, layout, imagens ou CTAs.
- Não remova GSAP ou ScrollTrigger neste plano.
- Não adicione dependências.
- Se as linhas não corresponderem ao commit informado, pare e reporte em vez de improvisar.

## Verification

- **Mechanical**: execute `npm.cmd run build`; deve terminar sem erros.
- **Feel check**: em 390×844, o hero deve continuar com teto metálico visível, mas sem brilho contínuo; a régua superior não deve ser renderizada; em desktop, a régua e o efeito completo permanecem.
- Ative `prefers-reduced-motion` e confirme que nenhum movimento de posição é iniciado.
- Faça uma captura full-page após rolar toda a página e confirme que nenhuma seção permanece invisível.
- **Done when**: desktop preserva o acabamento visual, mobile executa menos animações iniciais e não há regressão de layout.
