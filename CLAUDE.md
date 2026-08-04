# RPG Master Plan

App desktop (Electron) de planejamento de sessões de RPG: boards de cards ligados por setas, feitos para preparar e narrar sessões. Ver `SPEC.md` para a especificação completa e o histórico de decisões.

## Stack

Electron + Vite + React + TypeScript, usando `electron-vite` para orquestrar os três processos:

```
src/
  main/        processo main do Electron (janela, IPC, file system, watcher)
  preload/     contextBridge — expõe window.api pro renderer
  renderer/    app React (canvas, stores, componentes)
  shared/      tipos e utilitários usados pelos três lados (types/board.ts, lib/slug.ts)
```

Comandos: `npm run dev` (electron-vite dev), `npm run build` (tsc -b + electron-vite build).

## Pasta de dados

Configurável em `settings.json` (userData do Electron). Padrão: `C:\development\RPGMasterPlan\` (a raiz deste repo), com duas subpastas fora do git:

- `sessions\` — boards. Cada board é um arquivo `<slug>.board.json`; `workspace.json` guarda as tabs **abertas** (`tabOrder`), o último board aberto e a ordem manual da lista de Sessões (`boardOrder`). Boards fora do `tabOrder` continuam existindo — aparecem na aba Sessões do app, de onde podem ser reabertos, renomeados ou excluídos. Fechar uma tab no app não apaga o arquivo.
- `bestiario\` — fichas do bestiário (`salvos.json`) e conteúdo de geração extra (`conteudo.json`).

**São essas subpastas que a IA edita para preparar boards e fichas** — não os arquivos de código deste repo.

Além delas: `livros\HxH_RPG.pdf` é o livro de regras (fonte de verdade) e `specs\` guarda specs de sessão escritas pelo agente (fora do git). O agente co-mestre fica em `.claude/agents/game-master.md` (acessível via Shift+Tab) e as skills do repo em `.claude/skills\` — ver `AGENTS.md` para o guia em inglês.

## Bestiário (aba superior)

Porte do app antigo `C:\development\Bestiário RPG\` (aposentado) para TS/React, com sub-abas Gerador / Monstros / NPCs / Opções:

- `src/renderer/src/bestiario/data.ts` — conteúdo de geração embutido (era o `data.js`)
- `src/renderer/src/bestiario/gerador.ts` — lógica de geração (semente determinística por nome, atributos, guarda, habilidades, brechas)
- `src/renderer/src/store/bestiarioStore.ts` — estado (salvos, conteúdo custom, ficha atual)
- `src/renderer/src/components/bestiario/` — componentes da aba
- `bestiario\salvos.json` — array de fichas; cada uma tem `id` (timestamp), `dificuldade` (`capanga|fera|chefe|aflicao|npc`), `tipo`, `nome`, `imagem` (URL) e campos por tipo (`atributos/guarda/habilidades/brecha/notas` para monstros, `caracteristica/plot/aparencia/sessao` para NPCs, `aflicao` para aflições)
- `bestiario\conteudo.json` — listas extras que entram no sorteio junto com o `data.ts` (estrutura espelha `ConteudoCustom` em `src/shared/types/bestiario.ts`)

Edições externas nesses dois JSONs são detectadas pelo watcher e recarregadas ao vivo.

## Schema de um board (`<slug>.board.json`)

```json
{
  "id": "sessao-2",
  "name": "Sessão 2 — Dos Sapos à Licença",
  "nodes": [
    {
      "id": "combate-dos-sapos",
      "type": "nota",
      "position": { "x": 120, "y": 80 },
      "width": 320,
      "data": {
        "title": "Combate dos sapos",
        "color": "amber",
        "image": "https://i.imgur.com/IXTB6ur.jpeg",
        "markdown": "Cap de **3 rodadas**.\n\n- [ ] anotar quem viu o quê\n- [ ] introduzir [[donga-dois-dentes]]"
      }
    }
  ],
  "edges": [
    { "id": "combate-dos-sapos->donga", "source": "combate-dos-sapos", "target": "donga-dois-dentes", "label": "se aceitarem o favor" }
  ]
}
```

Tipos de referência em `src/shared/types/board.ts` (`Board`, `BoardNode`, `BoardEdge`, `CardData`).

### Tipos de card (`data.type`)

| type | campos de `data` | fase |
|---|---|---|
| `nota` | `title, color, image?, markdown` | F1 |
| `personagem` | `name, image?, resources: {label,current,max}[], markdown` | F2 |
| `relogio` | `label, segments, filled` | F2 |
| `timer` | `label, durationSec, alertSound` | F2 |
| `midia` | `label, src, loop, volume` | F2 |
| `bestiario` | `refId, folegoAtual?, guardaAtual?` | F8 (v2) |

O card `bestiario` é uma **referência viva**: `refId` aponta para o `id` de uma ficha em `bestiario\salvos.json` e o card renderiza nome, imagem, atributos, habilidades e brecha direto da ficha. Só o estado de mesa da cena (`folegoAtual`, `guardaAtual`) mora no card. Ficha excluída → o card vira placeholder "Ficha removida" (nada é apagado no board).

`color` é uma de 8: `slate, red, amber, green, teal, blue, purple, pink`.

### Convenções importantes

- **IDs são slugs estáveis, gerados só na criação** do card/board (a partir do título). Renomear um card ou board **não** muda seu `id` — isso quebraria wiki-links e edges que apontam pra ele. Colisão de slug resolve com sufixo `-2`, `-3`...
- **Wiki-links**: `[[id-ou-título]]` dentro do markdown. Em F1 são só texto; autocomplete/clique viram funcionais na F3.
- **To-do lists**: `- [ ]` / `- [x]` em GFM, clicáveis na UI (o toggle reescreve a linha correspondente no markdown).
- **Escrita atômica**: sempre grava em `<arquivo>.tmp` e faz rename — nunca edite o `.tmp` nem deixe um editor gravar parcialmente o `.board.json`.
- **Autosave**: debounce de ~1s no app. Edições externas (por IA) são detectadas por file watcher e recarregadas automaticamente na tela.
- **JSON inválido**: se o board ficar com JSON quebrado, o app mostra um erro e para de escrever no arquivo até ele voltar a ser válido — não sobrescreve.
