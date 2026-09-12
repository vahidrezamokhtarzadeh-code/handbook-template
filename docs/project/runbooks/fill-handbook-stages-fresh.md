# Fill Handbook — Staged Prompts (fresh / near-empty projects)

> This is the fresh-mode variant of the staged prompt set.
> It is for projects where the handbook skeleton exists but the product is not yet established enough
> to fill the full handbook right away.
>
> Use this path first for fresh / near-empty projects. For an existing mid-development project,
> use `fill-handbook-stages.md` instead.

## How to use these stages

- Work through the stages in order.
- Each stage is a separate prompt.
- Stop after stage 4 and wait for product-owner confirmation before continuing.
- Do not invent Accepted decisions.
- Do not propose scope the product owner has not confirmed.
- Mark clearly what is confirmed, what is inferred, and what is still open.

Stages 0–4 are the fresh-mode discovery path. Stage 5 converts confirmation into the handbook.
Stage 6 is optional and reuses the normal staged prompts once there is enough confirmed material.

## Mandatory rules for every stage

1. Do not invent Accepted decisions. A decision is Accepted only when there is real evidence and confirmation.
2. Do not generalize one example into a platform rule unless a separate ADR explicitly does so.
3. Keep status tags honest: Accepted, Candidate, Deferred, Open Decision, Explicitly-not-modeled.
4. Keep DECISION-TRACE.md and PROJECT-NARRATIVE.md in sync with whatever you accept.
5. Keep CONTEXT-COVERAGE.md and the index files in sync with what you write.
6. If a file already has content, do not silently overwrite accepted content. Patch or append, and say what you changed.
7. After any decision or change, update the relevant doc(s) and the indexes. This rule is obligatory and lives in AGENTS.md.
8. In fresh mode, discovery comes before doc completion. Do not fill the whole handbook before there is enough to start.

## Inputs the agent should load first

1. `docs/PROJECT-COMPASS.md`
2. `docs/START-HERE.md`
3. `docs/project/runbooks/handbook-fill-plan.md`
4. `docs/project/runbooks/mining-package.json`

If the project has any other material, load it too: README, manifest files, notes, outlines, manuscripts, config, existing docs, chat exports, prior conversations, or anything that describes what the project is for. The more real material the agent has, the less it has to infer.

## Fresh-mode project-type note

Before filling, the agent should decide what kind of project this is, using the mining package and a quick scan of the target.

- If `mining-package.json` says `projectTypeHint`, start from that and verify it.
- If the project looks like a code repo, treat code, configs, infra files, tests, and existing docs as the main evidence.
- If the project looks like a book/manuscript project, treat manuscript files, outline, notes, and any existing front matter as the main evidence.
- If the project is mixed or unrecognized, say so explicitly and proceed cautiously.

Do not force a code-project shape onto a book project, and do not force a book shape onto a code project.

## Stage 0 — Read what exists and write “what I see so far”

### Input
- mining-package.json
- handbook-fill-plan.md
- PROJECT-COMPASS.md
- START-HERE.md
- any available evidence

### Output
- A short “what I see so far” note covering:
  - what the project appears to be,
  - what kind of project it seems to be,
  - what evidence was found,
  - what is missing,
  - what the agent will infer versus what it found.

### Constraints
- Do not assume purpose from a single file.
- If no purpose is visible, say “purpose not yet established.”
- This note is not a final draft. It is the basis for the questions.

---

## Stage 1 — Ask targeted questions

### Input
- the “what I see so far” note
- any existing material
- `docs/project/discovery/_TEMPLATE-discovery-brief.md`

### Output
- A short question list for the product owner
- A short note on why each question matters for reaching a first slice

### Constraints
- Ask only the questions needed to reach a first slice, not everything at once.
- Make questions concrete and bounded.
- Avoid vague requests like “tell me about the project.”
- If answers arrive in a file, record the file path and what changed.

### Suggested question areas to consider
- product intent and success,
- primary user / customer and their problem,
- smallest useful outcome for the first slice,
- explicit out-of-scope items,
- constraints and non-functional needs,
- integration and deployment context,
- existing material that should be treated as ground truth.

Use only the areas that matter for this project.

---

## Stage 2 — Draft the discovery brief

### Input
- the “what I see so far” note
- the question list
- any answers already received
- `docs/project/discovery/_TEMPLATE-discovery-brief.md`

### Output
- `docs/project/discovery/discovery-brief.md`

Use the discovery-brief template. Keep it short.

In the brief:
- mark what is confirmed,
- mark what is inferred,
- mark what is still open,
- do not present inferred content as accepted.

If there is not enough to draft a useful brief yet, say what is missing and stop.

---

## Stage 3 — Draft the first-slice candidate

### Input
- the discovery brief
- `docs/project/discovery/_TEMPLATE-first-slice-candidate.md`

### Output
- `docs/project/discovery/first-slice-candidate.md`

Use the first-slice template. Keep it short and concrete.

The candidate should answer:
- why this slice first,
- what it delivers,
- what is in scope,
- what is out of scope,
- what evidence supports it,
- what decisions it implies,
- what still needs confirmation,
- a definition of done.

Do not present the candidate as approved. It is a proposal.

---

## Stage 4 — Handoff for confirmation

### Input
- discovery brief
- first-slice candidate

### Output
- A short handoff note to the product owner

The handoff note should say:
- what the agent has drafted,
- what is inferred vs confirmed,
- what it needs the product owner to confirm or correct,
- whether anything is blocked on missing answers.

After this stage, stop and wait.

Do not proceed to implementation until the product owner has confirmed enough to start.

---

## Stage 5 — Convert confirmation into the handbook

### Input
- the discovery brief
- the first-slice candidate
- any corrections from the product owner
- the handbook skeleton

### Output
- updates to `LATEST-STATE.md`
- updates to `PROJECT-NARRATIVE.md`
- updates to `DECISION-TRACE.md` if any decisions are now accepted
- updates to `START-HERE.md`
- initial implementation-plan skeleton if enough is confirmed

### Constraints
- Convert confirmed content into the handbook, not inferred content.
- If the product owner confirmed a decision, record it with evidence and status Accepted only if justified.
- If something is still open, leave it open and point at the discovery brief.
- After this stage, continue with the normal staged prompts in `fill-handbook-stages.md` to deepen the rest of the handbook.

---

## Stage 6 — Optional: deepen the handbook

Use the normal staged prompts in `fill-handbook-stages.md` once the project is ready for it.

Do not run this stage until there is enough confirmed material to avoid inventing content.

---

## End-of-run rule

Before finishing, the agent should confirm:

- No Accepted decision was invented.
- Every inferred claim is marked Candidate/Needs-confirmation or otherwise flagged.
- The discovery brief and first-slice candidate exist and are honest.
- The handoff note clearly says what needs confirmation.
- AGENTS.md's mandatory doc-update rule is still intact.

If any of those is false, fix it or say explicitly what is wrong and why.
