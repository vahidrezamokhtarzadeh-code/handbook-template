# Architect Journal

Reusable meta-knowledge distilled from this project's decisions, so the *next* project starts smarter instead of re-learning the same lessons.

| Folder | What goes in it | Shape of an entry |
|---|---|---|
| `principles/` | Durable design rules that generalize across projects | rule + why + how to apply |
| `patterns/` | Reusable structural patterns | problem → structure → when to use / when not |
| `heuristics/` | Quick checklists to run before acting | 3-6 yes/no questions |
| `mistakes/` | Anti-patterns this project hit or avoided | the trap + why it happens + the guard |
| `glossary/` | Shared vocabulary with status tags | term → one-line definition |

## How to write an entry
- See `_TEMPLATE.md` in each folder.
- Promote a lesson here only when it **generalizes beyond one decision**; leave single decisions in the ADRs.
- Reference the ADR/story that taught the lesson.
