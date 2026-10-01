# 002 — Remova o loop contínuo de smooth scroll

- **Status**: DONE
- **Commit**: 72576fc
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 5 arquivos, cerca de 35 linhas removidas

## Problem

O Lenis é importado no bundle inicial e conectado ao ticker global do GSAP. Em desktops com ponteiro fino, esse ticker continua chamando `lenis.raf()` mesmo quando a página está parada. O projeto já possui rolagem suave nativa em CSS.

```js
// src/smoothScroll.js:10-14 — current
lenis = new Lenis({ lerp: 0.12, anchors: true });
lenis.on('scroll', ScrollTrigger.update);
const tick = (time) => lenis?.raf(time * 1000);
gsap.ticker.add(tick);
gsap.ticker.lagSmoothing(0);
```

```css
/* src/styles.css:29-31 — current */
html {
  scroll-behavior: smooth;
  scroll-padding-top: 110px
}
```

## Target

- Usar a rolagem nativa já configurada em CSS.
- Remover o import e o efeito `startSmoothScroll()` de `App.jsx`.
- Remover as chamadas `pauseSmoothScroll()` e `resumeSmoothScroll()` do foco de modal; `body.style.overflow = 'hidden'` já impede rolagem do fundo.
- Excluir `src/smoothScroll.js`.
- Remover `lenis` de `package.json` e as entradas correspondentes do `package-lock.json`.
- Não alterar o comportamento de âncoras, modais ou foco.

## Repo conventions to follow

- A rolagem suave nativa já existe em `src/styles.css:29-31`.
- Movimento reduzido já troca `scroll-behavior` para `auto` em `src/styles.css:2571-2574`.
- O bloqueio de rolagem do modal já usa `document.body.style.overflow = 'hidden'` em `src/App.jsx:23`.

## Steps

1. Em `src/App.jsx`, remova o import de `./smoothScroll.js`, o efeito da linha 222 e as duas chamadas usadas pelo modal.
2. Exclua `src/smoothScroll.js`.
3. Remova `"lenis": "^1.3.26"` de `package.json`.
4. Remova `lenis` do objeto de dependências raiz e o bloco `node_modules/lenis` de `package-lock.json`, preservando JSON válido.

## Boundaries

- Não modifique as animações GSAP restantes.
- Não altere `scroll-behavior: smooth`.
- Não adicione dependências.
- Não mude a lógica de trap de foco do modal.

## Verification

- **Mechanical**: execute `npm.cmd ci` e `npm.cmd run build`; ambos devem terminar sem erros.
- `rg -n "lenis|smoothScroll" src package.json package-lock.json` não deve retornar ocorrências.
- **Feel check**: os links de âncora devem continuar rolando suavemente; abrir um modal deve impedir a rolagem do fundo; fechar o modal deve restaurá-la.
- No painel Performance, uma página parada não deve manter callbacks do Lenis/GSAP ticker.
- **Done when**: navegação e modais funcionam com rolagem nativa e Lenis não aparece no bundle.
