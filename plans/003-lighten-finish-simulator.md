# 003 — Reduza o custo do simulador de pintura

- **Status**: DONE
- **Commit**: 72576fc
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 arquivo, cerca de 25 linhas

## Problem

O simulador analisa uma imagem de 900×1200, mais de 1 milhão de pixels. Ele cria quatro buffers `Float32Array`, percorre a imagem repetidamente e executa um blur 3×3 na thread principal. Isso pode congelar a rolagem quando a seção se aproxima.

```js
// src/FinishSimulator.jsx:5-6 — current
const PHOTO = '/images/image-02.webp';
const WORK_WIDTH = 900;

// src/FinishSimulator.jsx:21-29 — current
function analyse(image) {
  const width = WORK_WIDTH;
  const height = Math.round((width * image.naturalHeight) / image.naturalWidth);
  // ... getImageData over more than 1 million pixels
}
```

## Target

- Usar largura de trabalho de 480 px em telas até 700 px e 720 px nas demais.
- Limitar sempre a largura ao `naturalWidth` da imagem.
- Resolver a largura uma única vez no início da preparação, sem leituras de layout dentro dos loops de pixels.
- Manter exatamente o mesmo algoritmo, acabamentos, interação e cache; somente reduzir a resolução interna.

```js
// target
const workWidth = () => window.matchMedia('(max-width: 700px)').matches ? 480 : 720;

function analyse(image) {
  const width = Math.min(image.naturalWidth, workWidth());
  const height = Math.round((width * image.naturalHeight) / image.naturalWidth);
  // existing algorithm unchanged
}
```

Em mobile, o total cai de aproximadamente 1.080.000 para 307.200 pixels; em desktop, para aproximadamente 691.200 pixels.

## Repo conventions to follow

- O breakpoint móvel principal do projeto é 700 px.
- O componente já carrega a foto apenas perto da seção e mantém `ImageData` em cache por acabamento.
- Não introduza leituras de DOM ou `getBoundingClientRect()` dentro do processamento.

## Steps

1. Em `src/FinishSimulator.jsx`, substitua `WORK_WIDTH = 900` por constantes `MOBILE_WORK_WIDTH = 480` e `DESKTOP_WORK_WIDTH = 720`.
2. Crie uma função pequena que escolha a largura com `matchMedia('(max-width: 700px)')`.
3. Em `analyse(image)`, use o menor valor entre a largura escolhida e `image.naturalWidth`.
4. Não altere os loops, a máscara, as cores ou o cache.

## Boundaries

- Não use Web Worker, OffscreenCanvas ou nova dependência neste plano.
- Não mude a imagem fonte nem os valores das cores.
- Não altere markup ou CSS do simulador.

## Verification

- **Mechanical**: execute `npm.cmd run build`; deve terminar sem erros.
- **Feel check**: em desktop e 390×844, percorra Grafite, Branco e Corten; a imagem deve manter contornos, luz e sombra sem pixelização perceptível.
- Arraste a régua rapidamente e confirme que ela acompanha o ponteiro.
- No console, `canvas.width` deve ser 480 em mobile e 720 em desktop, salvo se a imagem fonte for menor.
- **Done when**: as três cores continuam visualmente corretas e o processamento móvel usa no máximo 307.200 pixels para essa foto.
