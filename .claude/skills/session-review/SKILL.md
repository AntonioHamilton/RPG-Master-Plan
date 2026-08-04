---
name: session-review
description: Post-session debrief — interview the GM with focused questions and record what matters for future sessions in the right place (session board, players board, bestiary, future ideas).
---

# Session Review

Interview the GM about the session that just happened and persist what matters for future sessions. Ask **one question at a time**, and only what the boards can't answer.

## Interview topics

1. **What happened vs what was planned** — which branches fired, which cards were never reached.
2. **Player decisions and consequences** — anything the world must remember.
3. **NPCs and monsters that appeared** — update their bestiary entries (`sessao`, evolved `plot`); mark the fallen.
4. **Unresolved hooks** — everything left open goes to `sessions/ideias-futuras.board.json`.
5. **Player/character changes** — resources, bonds, items, scars → `sessions/jogadores.board.json`.
6. **Rules friction** — moments where a rule was unclear or improvised; note the ruling so it stays consistent.
7. **Pacing** — what dragged, what landed; one lesson for the next spec.

## Persisting

Every answer has a home (see the agent's auto-memory policy): facts of the session → the session's own board; forward material → future-ideas board; people → bestiary; party state → players board. Write as you go, with valid JSON.

## Post-session recap (required)

Addresses the campaign's weak point on "Preparação e Dedicação" (3/5 on the Octógono do Mestre) — the GM doesn't feel prepared walking into a session. Once the interview and persisting above are done, write a short flowing-prose recap — a few short paragraphs, **no bullet points**, in Portuguese since the GM reads it directly (this is not a durable spec artifact) — narrating what happened in-fiction. Save it to `specs/{session-slug}-resumo.md`. Keep it readable in under two minutes: this is what the GM rereads right before the next session to walk in with the story already in mind.

Finish with a summary of **what was recorded where**, including the recap file.
