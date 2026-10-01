# Performance plans

| # | Plan | Severity | Status |
|---|---|---|---|
| 001 | Reduce initial motion work | HIGH | DONE |
| 002 | Remove continuous smooth-scroll loop | HIGH | DONE |
| 003 | Lighten finish simulator | HIGH | DONE |

## Recommended order

1. `002-remove-continuous-smooth-scroll-loop.md` — reduz bundle e trabalho contínuo sem depender dos demais.
2. `001-reduce-initial-motion-work.md` — corta animações e medições desnecessárias na abertura.
3. `003-lighten-finish-simulator.md` — reduz o pico de CPU durante a rolagem.

Os três planos são independentes e não adicionam dependências.
