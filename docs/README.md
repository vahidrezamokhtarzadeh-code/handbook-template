# Architecture Handbook Template

A blank, ready-to-fill structure for the architecture-handbook pattern (modeled on the APIMarketPlace handbook). Its real audience is the **next engineer / chat / tool** that inherits the project.

> This repository is also published as a Git template for new projects.
> The same files live under `docs/` in the working copy you are reading now.

## What this system preserves

For every material choice, four things, plus a status tag:

> Evidence/Story → Decision → Why → What we deliberately did NOT build
>
> Status: `Accepted` / `Candidate` / `Deferred` / `Open Decision` / `Explicitly-not-modeled`

A decision record that says only *what* was chosen is incomplete — future maintainers will "improve" it back into previously-rejected designs.

## How to use

1. Copy this directory into your project root (contents up to the root, or keep as `handbook/`).
2. Copy `agents.md` to the repository root as `AGENTS.md` — it is the compressed entry point agents read first.
3. Replace placeholders: `<Project Name>`, `<...>` markers, and version numbers.
4. Fill in this order (the production flow):

**Phase A — Discovery (evidence first)**
1. `project/stories/` — write each real use-case as a Story as it emerges.
2. `project/decisions/` — one ADR per decision, immediately, numbered sequentially.
3. Keep `DECISION-TRACE.md` and `CONTEXT-COVERAGE.md` in sync as decisions land.
4. Promote confirmed concepts into `project/domain/`; keep tool names in `project/technology/`.
5. Freeze discovery explicitly when remaining questions are implementation/deferred rather than blockers.

**Phase B — Executable design**
6. `project/architecture/` (boundaries, flows, contracts) → `project/data-model/` (md + SQL) → `project/contracts/` (machine schemas) → `project/implementation/` (plan, test matrix, remaining gates).

**Phase C — Implementation**
7. Build **vertical slices**, not all infrastructure first. Write implementation ADRs; add implementation checkpoints to `LATEST-STATE.md`.

**Phase D — Snapshot + handoff**
8. Bump the version in `CHANGELOG.md` and headers after each meaningful design block.
9. Keep `START-HERE.md`, `EXECUTABLE-DESIGN-INDEX.md`, and `project/runbooks/new-chat-continuation.md` current.
10. Promote lessons that generalize beyond one decision into `architect-journal/`.

## Conventions used throughout

- Status tags on everything: `Accepted/Confirmed`, `Candidate/TBD`, `Deferred`, `Open Decision`, `Explicitly-not-modeled`.
- Non-goals ("what we deliberately didn't build") are first-class content in ADRs, stories, and architecture docs.
- A Story is **evidence, never a universal template**, until a separate ADR explicitly generalizes it.
- Index/coverage maps (`DECISION-INDEX.md`, `CONTEXT-COVERAGE.md`, `EXECUTABLE-DESIGN-INDEX.md`) keep the whole tree navigable.

## Automation

### Bootstrap

Bootstrap the handbook into a project automatically:

```bash
# from inside the target project:
node /path/to/handbook-template/bootstrap-handbook.mjs "MyProject"

# or explicitly:
node bootstrap-handbook.mjs --project "MyProject" --target /path/to/my-project
```

The script copies the template in, promotes `agents.md` to `AGENTS.md`, stamps the project name and version, and generates:

- `docs/START-HERE.md`, `docs/LATEST-STATE.md`, `docs/PROJECT-NARRATIVE.md`, `docs/DECISION-TRACE.md`,
  `docs/CONTEXT-COVERAGE.md`, `docs/EXECUTABLE-DESIGN-INDEX.md`, `docs/SOURCE-HANDOFF.md`,
  `docs/CHANGELOG.md`
- `docs/PROJECT-COMPASS.md` (short orientation synthesis)
- `docs/project/runbooks/mining-package.json`
- `docs/project/runbooks/handbook-fill-plan.md`

The script is project-agnostic and does not call an LLM. It infers project name, version, and snapshot
date where it can (from `package.json`, git, or an existing changelog), and it records a pre-flight
summary of what it detected.

Modes:
- `--existing` — existing project, mid-development (**implemented**).
- `--fresh` — fresh/new/near-empty project (**implemented**).
- `--new` — deprecated; use `--fresh` instead.

Run `node bootstrap-handbook.mjs --help` for all options.

## Repository

- Repository root: this file
- Template entrypoint: `bootstrap-handbook.mjs`
- Template guide: `docs/README.md` (what you are reading)
- Handbook living copy: `docs/` (copied into a target project by bootstrap)

## Layout

- `bootstrap-handbook.mjs` — project-agnostic bootstrap script (no LLM)
- `agents.md` — template for the repository root `AGENTS.md`
- `docs/` — the handbook template that gets copied into a target project
- `docs/project/runbooks/` — fill pipeline, staged prompts, mining package, and fill plan


### Filling the handbook

After bootstrap, an AI agent (for example Freebuff) fills the handbook using staged prompts.
The fill pipeline is prompt generation only; it does not call an LLM.

```bash
# from the repository root:
node docs/project/runbooks/fill-handbook-pipeline.mjs
```

This writes:

- `docs/project/runbooks/fill-prompts.json`
- `docs/project/runbooks/fill-prompts.md`
- `docs/project/runbooks/fill-summary.md`

Then the agent follows the staged prompts in `docs/project/runbooks/fill-handbook-stages.md`.

The fill pipeline reads the mining package and fill plan that bootstrap produced, plus the existing
handbook state, and assembles staged prompts that are honest by default: inferred content stays
Candidate/Needs-confirmation unless there is real evidence.

## Pruning for small projects

The irreducible core is `LATEST-STATE.md` (what is true), `PROJECT-NARRATIVE.md` or `DECISION-TRACE.md` (why it is true), and `START-HERE.md` (how to continue). Delete the rest of `project/` and `architect-journal/` if a project is small, and re-add folders only when the content exists.

## First commit note

This repository was initialized with a README and pushed to GitHub before the working copy was expanded.
Later commits include the full template tree under `docs/` and the bootstrap/fill pipeline.
