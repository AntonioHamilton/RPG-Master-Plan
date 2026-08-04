---
name: monsters
description: Analyze bestiary monsters for balance against the rulebook — encounter sizing (how many monsters for how many players), Fôlego and damage, guarda, brechas — and check consistency before a session.
---

# Monsters

## Sources

- `livros/HxH_RPG.pdf` — the rulebook; **source of truth** for balance. Read the relevant chapter before judging numbers.
- `bestiario/salvos.json` — saved monsters (entries with `tipo` other than `"npc"`).
- `src/renderer/src/bestiario/gerador.ts` — the app's generation rules, kept in line with the book:
  - Fôlego = base by difficulty (capanga 5 · fera 9 · chefe 15) + Corpo, minimum 1.
  - Dano: capanga 2 · fera 2 (3 if Corpo ≥ 2) · chefe 3 (4 if Corpo ≥ 3) · enxame −1.
  - Guarda (fera de nen / chefe): max 4 chips total, max 3 per zone (Cabeça/Torço/Pernas).
  - Attributes range −3..+5; chefe gets 1 Lance + 1 manobra per round.

## Balance review process

1. **Read the encounter context**: which session, how many players, party state (`sessions/jogadores.board.json` — current Fôlego/Aura, conditions).
2. **Check each monster against the formulas above** — flag any saved entry whose Fôlego/Dano drifted from what its attributes imply, and say whether the drift looks intentional (edited by the GM) or like an error.
3. **Size the encounter**: capangas act in groups (roughly match player count); a fera challenges a full party; a chefe is a set-piece — verify against the book's guidance, and count action economy (monsters' actions per round vs players').
4. **Check the soft parts**: every monster needs a usable `brecha` (and its `camada2`); habilidades should be at-the-table usable, not vague; aflições need their clock defined.
5. **Report**: monster · verdict (ok / adjust) · suggested numbers with the book/formula justification. Never silently change a saved ficha — propose, then edit after the GM agrees.
