# RPG Master Plan

App desktop (Electron) de planejamento de sessões de RPG: boards de cards ligados por setas, feitos para preparar e narrar sessões. Inclui também um módulo de bestiário para gerar e gerenciar fichas de monstros e NPCs.

## Stack

Electron + Vite + React + TypeScript, via `electron-vite`:

```
src/
  main/        processo main do Electron (janela, IPC, file system, watcher)
  preload/     contextBridge — expõe window.api pro renderer
  renderer/    app React (canvas, stores, componentes)
  shared/      tipos e utilitários usados pelos três lados
```

Ver `SPEC.md` para a especificação completa e o histórico de decisões, e `CLAUDE.md` para o schema dos dados (boards, cards, bestiário).

## Desenvolvimento

```
npm install
npm run dev      # electron-vite dev
npm run build    # tsc -b + electron-vite build
npm run lint     # oxlint
npm run dist     # build + electron-builder (executável portátil Windows)
```

## Dados

Boards e fichas de bestiário ficam fora do git, em pastas configuráveis via `settings.json` (padrão: raiz do repo) — ver `CLAUDE.md` para detalhes.
