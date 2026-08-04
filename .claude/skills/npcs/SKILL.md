---
name: npcs
description: Work with campaign NPCs — read the bestiary to understand where each NPC fits the story, where they should appear, whether they already appeared, and how to create new ones consistently.
---

# NPCs

## Sources

- `bestiario/salvos.json` — entries with `"tipo": "npc"`. Fields: `nome`, `caracteristica`, `plot`, `aparencia`, `contexto`, `sessao` (which session groups them), `imagem` (URL), `id`.
- `sessions/*.board.json` — where NPCs actually appear: `bestiario` cards (`refId` → bestiary `id`), `personagem` cards, and `[[wiki-links]]` inside markdown.
- `sessions/jogadores.board.json` — player-NPC bonds.

## Process

1. **Map the cast**: list bestiary NPCs grouped by `sessao`; note each one's `plot` (their open agenda).
2. **Cross-reference with the boards**: for each NPC, find where they are referenced (cards, refIds, wiki-links). Conclude: already appeared? in which session? was their plot advanced, resolved, or left hanging?
3. **Place them forward**: propose where each unresolved NPC should appear next, grounded in their `plot` and `contexto` — an NPC's agenda keeps moving even off-screen (the world is alive). Prefer escalating their existing `plot` over inventing an unrelated reason for them to reappear — recurrence with rising stakes is what builds world depth (see the game-master agent's "World depth" rule).
4. **Report** in a compact table: NPC · session(s) seen · plot status · suggested next appearance.

## Creating new NPCs

- Follow the bestiary NPC shape exactly (same fields as above; `id` is a unique timestamp; `dificuldade: "npc"`).
- Give every NPC a `caracteristica` the GM can act out in five seconds — including how they sound (tone, pace, a verbal tic) — and a `plot` that wants something.
- Set `sessao` to the session where they will debut.
- For the portrait, use the `create-content` skill (image prompt) and put the resulting full URL in `imagem`.
- Append to `bestiario/salvos.json` with valid JSON — the app reloads it live.
