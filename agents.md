# AGENTS.md — Working with this repository

> Copy this file to the repository root as `AGENTS.md` when bootstrapping a project. It is the compressed entry point for any engineer/chat/tool starting work here; the full handbook below it holds the details.

## 1. Where to start

Read these before proposing or making any change:

1. `docs/START-HERE.md` — mandatory reading order, continuation rules, current phase.
2. `docs/LATEST-STATE.md` — **what is true now** (Accepted / Candidate / Deferred / Open / Not-modeled).
3. `docs/PROJECT-NARRATIVE.md` — **why** the architecture has this shape.
4. `docs/DECISION-TRACE.md` — evidence → decision → why → deliberately-not-built.
5. `docs/CONTEXT-COVERAGE.md` — where each discovery lives.
6. `docs/EXECUTABLE-DESIGN-INDEX.md` — the shortest path from architecture into code.

To work in code, also read: `docs/SOURCE-HANDOFF.md`, repository-root `IMPLEMENTATION-STATUS.md`, and the ADR(s) relevant to what you are changing.

## 2. The handbook pattern (30-second map)

| File / folder | Answers |
|---|---|
| `docs/LATEST-STATE.md` | What is true now |
| `docs/PROJECT-NARRATIVE.md`, `docs/DECISION-TRACE.md` | Why it is true |
| `docs/CONTEXT-COVERAGE.md` | Which discovery is preserved, and where |
| `docs/project/stories/` | Real use-cases (evidence) that produce decisions |
| `docs/project/decisions/` | One ADR per decision: Status/Decision/Consequence/Context-Rationale/Rejected-Deferred |
| `docs/project/domain/` | Confirmed concepts + explicitly non-modeled concepts |
| `docs/project/architecture/` | Boundaries, flows, contracts (each with Non-goals) |
| `docs/project/technology/` | Tool choices (kept separate from domain) |
| `docs/project/data-model/`, `docs/project/contracts/` | Schema (md + SQL) and machine-readable contract JSON |
| `docs/project/open-decisions/` | Intentionally unresolved questions and the bar to revisit |
| `docs/project/implementation/` | Plan, test matrix, remaining technical gates |
| `docs/project/runbooks/` | How to continue work |
| `docs/architect-journal/` | Reusable principles / patterns / heuristics / mistakes / glossary |

## 3. Rules for continuing (do not skip)

- **Accepted/Confirmed is current truth.** Candidate/TBD/Open Decision stays unresolved — do not finalize it on your own.
- **Before changing an Accepted decision**, read its ADR Context/Rationale + the Decision Trace + Narrative. Find the new Story/evidence that invalidates the old rationale; never redesign from aesthetic preference.
- **A Story is evidence, not a universal template.** A concrete example (e.g. one API) never becomes the generic model unless a separate ADR explicitly generalizes it.
- **"Deliberately not built" is first-class.** MVP simplifications are intentional — do not treat missing features as bugs to fix.
- **No speculative abstraction.** Do not build generic rule engines, entities, microservices, or config DSLs purely for future-proofing. Add complexity only when a real Story requires it.
- **Domain in capabilities, tools in technology docs.** The capability boundary is durable; the tool is replaceable.
- **Express everything with a status tag**: `Accepted` / `Candidate` / `Deferred` / `Open Decision` / `Explicitly-not-modeled`.

## 4. The flow

**A. Discovery (evidence first)** — write each real use-case as a numbered `docs/project/stories/story-NNN-*.md`; immediately record each decision as an ADR in `docs/project/decisions/`; keep `docs/DECISION-TRACE.md` and `docs/CONTEXT-COVERAGE.md` in sync; promote confirmed concepts into `docs/project/domain/`; freeze discovery explicitly once remaining questions are implementation/deferred rather than blockers.

**B. Executable design** — `docs/project/architecture/` (boundaries → flows → contracts) → `docs/project/data-model/` (markdown + SQL) → `docs/project/contracts/` (JSON schemas) → `docs/project/implementation/` (phased plan with definition of done, test matrix, remaining gates).

**C. Implementation** — build **vertical slices**, not all infrastructure first. Write implementation ADRs as you go; add implementation checkpoints to `docs/LATEST-STATE.md`; update the implementation-evidence section of `docs/CONTEXT-COVERAGE.md`.

**D. Snapshot + handoff** — bump the version in `docs/CHANGELOG.md` and headers after each meaningful design block; keep `docs/START-HERE.md`, `docs/EXECUTABLE-DESIGN-INDEX.md`, `docs/SOURCE-HANDOFF.md`, and `docs/project/runbooks/new-chat-continuation.md` current; promote lessons that generalize beyond one decision into `docs/architect-journal/`.

## 5. Before you end a session

- Every decision you made has a home (ADR + trace row). No decision lives only in chat.
- `docs/LATEST-STATE.md` says what is true now and the next action.
- If you changed an Accepted decision, the new evidence and rationale are recorded.
- The version in `docs/CHANGELOG.md` reflects the current snapshot.

## 6. Mandatory doc-update rule

- After any decision or change, update the relevant handbook doc(s) and the indexes.
- Keep status tags honest: Accepted only with real evidence; inferred content stays Candidate/Needs-confirmation.
- Keep `docs/DECISION-TRACE.md` and `docs/PROJECT-NARRATIVE.md` in sync with accepted decisions.
- Keep `docs/CONTEXT-COVERAGE.md`, `docs/EXECUTABLE-DESIGN-INDEX.md`, and `docs/project/decisions/DECISION-INDEX.md` in sync with what changed.
- If a file is not updated because there is no new evidence, state that explicitly rather than leaving it silently stale.
- This rule applies to both humans and agents and is not optional.

## 7. How the handbook gets filled

The handbook is filled in stages by an AI agent (for example Freebuff) using the staged prompts in
`docs/project/runbooks/fill-handbook-stages.md` and the prompt package in
`docs/project/runbooks/fill-prompts.md`.

To start a fill run:
1. Run `node docs/project/runbooks/fill-handbook-pipeline.mjs` from the repository root.
2. Read `docs/project/runbooks/fill-prompts.md`.
3. Work through the stages in order.
4. End with the fill summary in `docs/project/runbooks/fill-summary.md`.

The fill pipeline does not call an LLM itself. It only assembles the prompt package from the
mining package and fill plan that bootstrap produced.
