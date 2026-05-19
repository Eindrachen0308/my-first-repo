# Repository Guide

## What this repo is
A small Python utility repository. The current contents:

- `generate_jd_docx.py` — Generates a Word (`.docx`) document containing job descriptions (Backend / ML / MLOps engineer roles) using `python-docx`.

## How to run

```bash
pip install python-docx
python3 generate_jd_docx.py
```

The script writes a `.docx` file into the current working directory.

## Conventions
- Python 3, standard library + `python-docx` only unless a new dependency is justified.
- Keep scripts self-contained and runnable with a single `python3 <file>.py` invocation.
- Output files (`.docx`, `.pdf`, etc.) should not be committed — they are build artifacts.

## Git workflow
- Default branch: `master`.
- Web-session work uses `claude/<topic>-<slug>` branches.
- Every change is committed and pushed before the session ends (enforced by the user-level Stop hook).

## Claude Code setup
- Project settings: `.claude/settings.json` (permission allowlist).
- Subagents: `.claude/agents/` (e.g. `code-reviewer`).
- Personal routines (e.g. AI digest email) live in `~/.claude/` — **not** in this repo.
