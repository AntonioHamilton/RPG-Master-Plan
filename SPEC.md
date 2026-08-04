# RPGMasterPlan — Especificação

App desktop (Electron) para **planejar e narrar sessões de RPG** da campanha Hunter x Hunter: boards de cards ligados por setas com bifurcações, bestiário de monstros/NPCs integrado e gerenciamento de sessões — tudo num app só. Os dados são JSONs legíveis, pensados para edição direta por IA (fluxo: o agente prepara boards e fichas nos arquivos, Anton narra com o app aberto; o app recarrega ao vivo).

**Status atual**: v2 concluída (F1–F2 e F5–F8 entregues; F3 e F4 pendentes). O antigo app separado "Bestiário RPG" foi absorvido e aposentado.

## Visão geral do app

Três abas superiores, com o **cronômetro de sessão** sempre visível:

- **Boards** — canvas (React Flow) com cards ligados por setas direcionais com label (condição da bifurcação); tabs de boards na parte inferior; toolbar de criação de cards numa linha só.
- **Bestiário** — porte 1:1 do app antigo em TS/React: sub-abas Gerador / Monstros / NPCs / Opções.
- **Sessões** — gerenciador de boards: lista completa com reabrir, renomear, excluir (com confirmação) e reordenação manual (botões subir/descer).

Fechar uma tab de board **só guarda** (o arquivo fica; reabre pela aba Sessões). O cronômetro conta por timestamp — nunca atrasa em segundo plano; só para com Pausar, Reset ou fechando o app.

## Stack técnica

- **Electron** + **Vite** + **React** + **TypeScript** (electron-vite orquestra main / preload / renderer)
- **@xyflow/react** (React Flow) — canvas, drag-and-drop, setas, zoom/pan
- **Zustand** — stores (board, workspace, cronômetro, bestiário)
- **react-markdown + remark-gfm** — markdown com checkboxes clicáveis
- **chokidar** — file watcher no main (v4+: vigia diretórios, sem glob)
- Áudio via `HTMLAudioElement`

Comandos: `npm run dev` · `npm run build` · `npm run lint`.

## Dados

Pasta raiz configurável em `settings.json` (userData); padrão `C:\development\RPGMasterPlan\` (a raiz do repo), com:

| Pasta | Conteúdo | Git |
|---|---|---|
| `sessions\` | Um `<slug>.board.json` por board; `workspace.json` (tabs abertas `tabOrder`, `lastOpenBoard`, ordem da lista `boardOrder`) | ignorada |
| `bestiario\` | `salvos.json` (fichas: monstros, NPCs, aflições) e `conteudo.json` (conteúdo extra de geração) | ignorada |
| `livros\` | `HxH_RPG.pdf` — livro de regras, fonte de verdade | versionada |
| `specs\` | Specs de sessão escritas pelo agente (`{slug}.md`) | ignorada |

Garantias: **escrita atômica** (`.tmp` + rename), **autosave** com debounce ~1s, **watcher** recarrega edições externas ao vivo (boards e bestiário), board com JSON inválido mostra erro e não é sobrescrito até corrigir.

### Schema de board (resumo)

```json
{
  "id": "sessao-2",
  "name": "Sessão 2 — Dos Sapos à Licença",
  "nodes": [
    { "id": "combate-dos-sapos", "type": "nota", "position": { "x": 120, "y": 80 },
      "data": { "title": "Combate dos sapos", "color": "amber", "image": null, "markdown": "..." } }
  ],
  "edges": [
    { "id": "a->b", "source": "a", "target": "b", "label": "se aceitarem o favor" }
  ]
}
```

IDs são **slugs estáveis** gerados na criação (renomear não muda o id). Referência completa de tipos: `src/shared/types/board.ts` e `CLAUDE.md`.

### Tipos de card

| type | conteúdo | origem |
|---|---|---|
| `nota` | título, cor (8 opções), imagem por URL, markdown com checkboxes e wiki-links `[[assim]]` | F1 |
| `personagem` | nome, imagem, recursos renomeáveis (barra atual/máx), markdown | F2 |
| `relogio` | progress clock — label, 4/6/8 segmentos clicáveis | F2 |
| `timer` | countdown com play/pause/reset e aviso sonoro | F2 |
| `midia` | áudio por arquivo/URL — play/pause, loop, volume | F2 |
| `bestiario` | **referência viva** a uma ficha (`refId` → `salvos.json`): renderiza nome/imagem/atributos/habilidades/brecha da ficha; no card mora só o estado de mesa (`folegoAtual`, `guardaAtual`); topo fixo + seções colapsáveis; ficha excluída vira placeholder | F8 |

Cards do bestiário entram no board pelo botão **"+ Bestiário"** (picker com busca e filtro monstro/NPC).

### Bestiário

- **Gerador**: 5 dificuldades (Capanga, Fera, Chefe, Aflição, NPC); nome opcional com **semente determinística** (mesmo nome + tipo = mesma ficha); Fôlego = base da dificuldade (5/9/15) + Corpo; Dano pela dificuldade; Guarda com teto de 4 fichas, máx. 3 por zona.
- **Ficha**: edição inline nos textos, steppers de atributos/guarda com recálculo automático, habilidades/notas adicionáveis, imagem por URL, campo Sessão (NPCs).
- **Listas**: monstros agrupados por nível, NPCs por sessão, com contagem nas sub-abas.
- **Opções**: listas de geração expansíveis; adições do usuário vão para `conteudo.json` e entram nos sorteios.
- Conteúdo embutido em `src/renderer/src/bestiario/data.ts`; lógica em `gerador.ts` (porte 1:1 do app antigo).

## Integração com IA

- `.claude/agents/game-master.md` — agente **co-mestre** (Shift+Tab): pipeline intake → pre-recon obrigatório → grill → spec → spec-skeptic → approval gate → implementação → gate 1 (checks + simplify) → gate 2 (review) → ship; regras de autoria de boards (formatação `➤`/`▓`/`✦`, espaçamentos, handles por posição real, relógios com consequência em card ligado, música por URL real, cliffhanger); seção de Learnings auto-atualizada com as correções do mestre.
- `.claude/skills\` — `grill-me`, `simplify`, `npcs`, `monsters`, `create-content`, `session-review`, `doubt`.
- `AGENTS.md` — guia em inglês para agentes; `CLAUDE.md` — schema e convenções operacionais.
- Material de campanha que segue no vault: `Hamilton\RPG\` (`rpg.md`, `regras-ia.md`, `transcricoes\`).

## Histórico de decisões

### v1 — entrevista 2026-07-21

| # | Decisão | Escolha |
|---|---|---|
| D1 | Stack de canvas | React + React Flow (@xyflow/react) |
| D2 | Local dos dados | Pasta configurável (padrão da época: vault Hamilton; ver D14) |
| D3 | Granularidade | 1 arquivo JSON por board |
| D4 | Modelo de cards | Tipos fixos com campo `type` |
| D5 | Card de personagem | 2 recursos renomeáveis (default Fôlego/Aura) + markdown livre |
| D6 | Timers | Card de timer (countdown) + cronômetro global de sessão |
| D7 | Ligações | Setas direcionais com label + wiki-links `[[assim]]` no markdown |
| D8 | Mídia | Imagem/GIF por URL; som por arquivo local ou URL |
| D9 | Sincronização | Autosave (debounce ~1s) + file watcher com reload automático |
| D10 | Mapas (opcional, v2) | Imagem de fundo + pins/tokens ligáveis a cards |
| D11 | Redimensionamento | Alça de resize em todo card; tamanho persiste em `width`/`height` |

### v2 — entrevista 2026-08-01 (integração do bestiário)

| # | Decisão | Escolha |
|---|---|---|
| D12 | Integração do bestiário | App único: bestiário reescrito em TS/React dentro do RPGMasterPlan; app antigo aposentado |
| D13 | Navegação superior | Abas Boards \| Bestiário \| Sessões; cronômetro sempre visível |
| D14 | Local dos boards | `<repo>\sessions\` — movidos do vault; `Hamilton\RPG\masterplan\` apagada |
| D15 | Dados do bestiário | `<repo>\bestiario\`; `data.js` virou módulo TS; watcher cobre a pasta |
| D16 | Versionamento | `sessions\`, `bestiario\` (e depois `specs\`) no `.gitignore` |
| D17 | Fechar tab de board | Só guarda; aba Sessões gerencia (reabrir, renomear, excluir, reordenar) |
| D18 | Card de bestiário | Referência viva por `refId`; recursos atuais da cena ficam no card, por board |
| D19 | UI do card | Compacto: topo fixo (imagem, nome, tipo, recursos) + seções colapsáveis |
| D20 | Inserção no board | Botão "+ Bestiário" com picker (busca + filtro monstro/NPC) |
| D21 | Ficha excluída | Cards viram placeholder "ficha removida"; boards nunca alterados automaticamente |
| D22 | Escopo do porte | Paridade 1:1, sem features novas, visual adaptado ao app |
| D23 | Toolbar de cards | Uma linha; quebra só quando faltar largura |
| D24 | Cronômetro de sessão | Contagem por timestamp; só pausa/reset/fechar param; sem persistência |

## Fases

| Fase | Escopo | Status |
|---|---|---|
| F1 — Fundação | Projeto Electron+Vite+React+TS, card `nota` completo, setas com label, tabs, autosave + watcher | Concluída |
| F2 — Cards de mesa | `personagem`, `relogio`, `timer`, `midia`, cronômetro de sessão | Concluída |
| F3 — Qualidade de vida | Wiki-links clicáveis com autocomplete, busca global (Ctrl+F), minimapa, atalhos | **Pendente** (wiki-links hoje são só texto) |
| F4 — Mapas (opcional) | Board de mapa com imagem de fundo + pins/tokens ligáveis a cards | Pendente |
| F5 — Migração de dados e shell v2 | `sessions\`/`bestiario\` no repo, vault limpo, abas superiores, toolbar numa linha, cronômetro por timestamp, watcher sem glob (bugfix chokidar v5) | Concluída em 2026-08-01 |
| F6 — Aba Sessões | Fechar = guardar; tela com lista completa, reabrir, renomear, excluir, reordenar (`boardOrder`) | Concluída em 2026-08-01 |
| F7 — Bestiário portado | `data.ts` + `gerador.ts`, IPC com escrita atômica, sub-abas com paridade 1:1, reload por watcher | Concluída em 2026-08-01 |
| F8 — Card de bestiário | Tipo `bestiario` com referência viva, picker, placeholder, schema documentado | Concluída em 2026-08-01 |
| — Agente e skills | `game-master.md` (pipeline + regras de autoria absorvidas da skill `/masterplan` do vault, agora removida), 7 skills, `AGENTS.md`, `livros\`, `specs\` | Concluída em 2026-08-01 |

## Fora de escopo

Fog of war, grid tático/VTT, multiusuário, sync em nuvem, rolador de dados, export/import. Fichas completas do sistema moram no bestiário integrado (a planilha `ficha-personagem.xlsx` do vault segue para PJs).
