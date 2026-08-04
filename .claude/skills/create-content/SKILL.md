---
name: create-content
description: Create NPCs, monsters, and locations for the campaign — bestiary-format entry plus a ready-to-paste Gemini image prompt in the campaign's Hunter x Hunter art style. Use when the GM asks for a new NPC, monster, or scenario/location.
---

# Create Content (NPCs · Monsters · Scenarios)

Two deliverables per creation:

1. **The content itself** — NPCs and monsters in the bestiary format (`bestiario/salvos.json`; see the `npcs` and `monsters` skills for field shapes and balance); locations as a `nota` card on the relevant board.
2. **An image prompt** for Gemini (Nano Banana / Gemini 2.5 Flash Image), using the templates below. The GM pastes it into Gemini, uploads the result, and puts the image URL in the card/ficha (`imagem` field). Always remind the GM you need the **full image URL** back.

The description inside the prompt may be in Portuguese — the model understands. The prompt scaffolding stays in English. The **style block is shared by the three templates — never alter it**; it keeps the campaign's images visually consistent.

Since 2026-08-02 the style moved away from flat, static portraits (GM feedback: the early Arc II images "felt generic," like a reference sheet, not a character). Reference: the Emeric Solenne image (`bestiario/salvos.json`, id `1785693205903`) is the current visual bar — expressive hand-drawn linework, a body caught mid-motion, dramatic mood lighting, not a stiff 3/4 standee.

## 1. Scenarios / locations

```
Generate an image. Anime illustration in the spirit of Hunter x Hunter (2011 Madhouse adaptation) and Yoshihiro Togashi's background art, rendered with the expressive energy of traditional hand-drawn/painterly art — visible brush and ink texture, confident bold strokes, atmospheric watercolor-style backgrounds, subtle film grain. NOT flat clean cel-shading, NOT modern digital anime style, NOT 3D render, NOT photorealistic.

Wide establishing shot of a location, landscape 16:9, like a scene-setting background frame from the anime — but with a sense of life or motion in the frame (weather, drifting smoke, movement, dramatic light) rather than a static empty diorama. No main characters — at most tiny distant silhouettes for scale. Dramatic, high-contrast atmospheric lighting that matches the mood of the description.

Location name: [NOME]
Description: [DESCRIÇÃO]

Render a small elegant title caption with the location name in the lower corner, like an episode location card.
```

## 2. NPCs

```
Generate an image. Anime illustration in the spirit of Hunter x Hunter (2011 Madhouse adaptation) and Yoshihiro Togashi's character design DNA, but rendered with the expressive energy of traditional hand-drawn art — visible pencil/ink linework, cross-hatching, confident bold strokes. NOT flat clean cel-shading, NOT a static reference-sheet pose, NOT modern digital anime style, NOT 3D render, NOT photorealistic.

Dynamic pose that captures the character mid-motion or mid-gesture — never a static standing portrait. Their expression and bearing should stay true to their personality even in motion (composed, feral, nervous, etc. — whatever fits them). Dramatic, high-contrast lighting with a mood-appropriate background (a strong color, a gradient, an implied setting) rather than a neutral blurred backdrop. If the character has a distinctive design mark established in their `aparencia` (scar, tattoo, ritual detail, signature prop — every named, narratively relevant character should have one; see the game-master agent's "Distinctive design for named characters" rule) — make sure it reads clearly in the image, it's there for a reason.

Character name: [NOME]
Description: [DESCRIÇÃO]

Vertical character-portrait framing (3:4), dynamic full-body composition, dramatic and painterly, not a static pose.
```

## 3. Monsters

```
Generate an image. Anime illustration in the spirit of Hunter x Hunter (2011 Madhouse adaptation) and Yoshihiro Togashi's creature design — in the vein of the Chimera Ants and the beasts of the Dark Continent — rendered with the expressive energy of traditional hand-drawn art — visible pencil/ink linework, cross-hatching, confident bold strokes. NOT flat clean cel-shading, NOT modern digital anime style, NOT 3D render, NOT photorealistic.

Full-body shot of a single creature caught mid-motion in a threatening or unnerving pose (lunging, coiling, mid-strike — not a standing reference pose), seen slightly from below to feel imposing. Include something in the scene that shows its scale (terrain, vegetation, debris). Dramatic, high-contrast mood lighting — dangerous, eerie, like the moment the party first sees it. If it is a Nen beast, add a faint dark aura around its body.

Creature name: [NOME]
Description: [DESCRIÇÃO]

Landscape orientation (4:3), dynamic composition.
```

## Process

1. Create the content first (stats/fields grounded in the rulebook and the bestiary conventions), get the GM's OK on it. Give named, narratively relevant NPCs/monsters a distinctive design mark as part of this step, not as an afterthought in the image prompt — see the game-master agent's "Distinctive design for named characters" rule. At the same time, give them a voice note (tone, pace, a verbal tic) so the GM can perform them — same rule.
2. Fill `[NOME]` and `[DESCRIÇÃO]` from the created content — the `aparencia` field is usually the description.
3. Deliver the filled prompt in a copy-paste-ready block, and ask for the image URL back to store in `imagem`.
