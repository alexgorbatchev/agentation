# Skills Directory Instructions

This directory contains Agentation skills used by coding agents.

## Available skills

- `agentation/` — Install/configure `<Agentation />` in app code (endpoint optional; CLI sync optional).
- `agentation-fix-loop/` — Annotation processing loop using the `agentation` CLI.
- `agentation-self-driving/` — Headed browser autonomous UI critique workflow.

## Important maintenance note

`skills/agentation-fix-loop/SKILL.md` is a symlink to:

- `cli/cmd/agentation/embedded/agentation-fix-loop-skill.md`

If you need to update the fix-loop skill content, edit the embedded file so CLI output and skill docs stay in sync.
