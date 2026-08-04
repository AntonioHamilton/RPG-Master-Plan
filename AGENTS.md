# AGENTS.md — RPG Master Plan

Guide for AI agents working in this repository. App internals, board schema, and data conventions live in `CLAUDE.md` (Portuguese) — read it before editing any data file.

## What this repository is

An Electron + TypeScript + React desktop app (**RPG Master Plan**) plus the campaign data for a Hunter x Hunter tabletop RPG campaign. The GM keeps the app open while narrating; agents help by planning sessions and editing the data files, which the app watches and live-reloads.

## Layout

| Path | What it is |
|---|---|
| `src/` | App source (main / preload / renderer / shared) |
| `sessions/` | Boards — one `<slug>.board.json` per board; `jogadores` (players), `ideias-futuras` (future ideas), `sessao-N*` (sessions); `workspace.json` (open tabs — leave alone) |
| `bestiario/` | `salvos.json` (monsters, NPCs, afflictions) and `conteudo.json` (extra generation content) |
| `livros/HxH_RPG.pdf` | The rulebook — source of truth for every rule |
| `specs/` | Session specs written by the agent (`{slug}.md`, gitignored) |

`sessions/`, `bestiario/`, and `specs/` are user data, outside git.

## The game-master agent

`.claude/agents/game-master.md` defines the co-GM agent (select it with Shift+Tab in Claude Code, or via `/agents`). It follows a fixed pipeline: intake → pre-recon (mandatory) → grill → spec → spec-skeptic → approval gate → implementation → gate 1 (checks + simplify) → gate 2 (review) → ship.

## Skills

Repo skills in `.claude/skills/`, loaded on demand:

| Skill | Purpose |
|---|---|
| `grill-me` | Interview the GM until shared understanding, one question at a time |
| `simplify` | Reduce over-complexity in recent changes, preserving behavior |
| `npcs` | Map bestiary NPCs to the story; create new ones consistently |
| `monsters` | Balance review against the rulebook; encounter sizing |
| `create-content` | Create NPCs/monsters/locations + Gemini image prompts (HxH style) |
| `session-review` | Post-session debrief; persist learnings to the right boards |
| `doubt` | Adversarial review before consequential decisions |

## Rules that protect the data

- Always write **valid JSON** — the app refuses to persist a broken board and shows an error until it's fixed.
- IDs are **stable slugs** generated at creation; renaming a card or board never changes its `id` (wiki-links and edges depend on it).
- Never delete a session, finish a spec, or rename a file without the GM's permission.
- App code changes (in `src/`) follow the normal dev flow: `npm run build`, `npm run lint`.
