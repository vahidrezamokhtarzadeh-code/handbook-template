# How to Progress a Project with This Handbook

> This is a project-independent checklist. It applies to any project bootstrapped
> with `bootstrap-handbook.mjs`, whether the project is fresh or already in progress.

The handbook is not a one-time writeup. It is the continuity layer for:
- humans,
- agents,
- sessions,
- and handoffs.

Use it to answer three questions every time work continues:
1. What is true now?
2. What is the next action?
3. How do we get there without inventing facts?

---

## 1. Choose the right mode before you run anything

### Existing project
Use this when the project already exists and has code, docs, history, or decisions
that should be reflected in the handbook.

Typical signs:
- there is an existing repo or code tree,
- there are existing docs,
- there is an existing `AGENTS.md` or similar,
- the project has already made decisions.

### Fresh / near-empty project
Use this when there is not enough evidence yet to describe the project confidently.

Typical signs:
- the project is new,
- there is little or no code yet,
- there is no clear decision history,
- the first job is discovery, not documentation.

If you are unsure, start with **fresh mode**. It is safer to discover first than to
pretend an existing project is understood.

---

## 2. Run bootstrap the intended way

### Required setup
1. Open a shell in the project you want to study.
2. Run `bootstrap-handbook.mjs` from the template.
3. Use `--target` to choose where the handbook should be written.
4. If you are not sure of the project name, let bootstrap infer it.

### Existing-project bootstrap
From inside the project you want to study:

```bash
node /path/to/handbook-template/bootstrap-handbook.mjs \
  --existing \
  --target /path/to/handbook-output \
  --project "OptionalProjectName" \
  --version "OptionalVersion" \
  --date "OptionalDate" \
  --force
```

Notes:
- `--target` is required.
- `--target` must differ from both the template directory and the project you are studying.
- `--force` is needed if the target already has `AGENTS.md` or `docs/START-HERE.md`.
- If `--project` is omitted, bootstrap tries to infer the name from the current directory.

### Fresh-project bootstrap
From inside the project you want to study:

```bash
node /path/to/handbook-template/bootstrap-handbook.mjs \
  --fresh \
  --target /path/to/handbook-output \
  --project "OptionalProjectName" \
  --version "OptionalVersion" \
  --date "OptionalDate" \
  --force
```

Use `--fresh` when the project is new or nearly empty.

### What bootstrap does and does not do
Bootstrap creates the skeleton and stamps the mechanically resolvable placeholders.
It does not:
- invent decisions,
- invent owners,
- invent product intent,
- or fill the handbook with real content.

That part is left for the agent and the human.

---

## 3. Inspect the generated handbook before asking an agent to fill it

Before filling, read:

1. `docs/PROJECT-COMPASS.md`
2. `docs/START-HERE.md`
3. `docs/project/runbooks/handbook-fill-plan.md`
4. `docs/project/runbooks/mining-package.json`

Look for:
- whether the inspected project and target paths are correct,
- whether the mode matches reality,
- whether the detected context looks plausible,
- whether anything important is missing or wrong.

If the mining package or fill plan looks off, fix the input before filling.
A bad bootstrap input tends to produce a confident but misleading handbook.

---

## 4. Hand the handbook to an agent the right way

Do not dump the whole repo into the agent and hope for the best.

The minimal handoff is:

1. Tell the agent where the handbook lives.
2. Tell the agent which project/tree was inspected.
3. Tell the agent to read the four entry files first.
4. Tell the agent to follow the staged prompts in:
   - `docs/project/runbooks/fill-handbook-stages.md` for existing projects
   - `docs/project/runbooks/fill-handbook-stages-fresh.md` for fresh projects

For existing projects, the agent should:
- start from evidence in the inspected tree and the mining package,
- separate observed facts from inferences,
- keep inferred content as Candidate or Needs-confirmation,
- fill in stages, not all at once,
- record what is still placeholder after each stage.

For fresh projects, the agent should:
- write a short “what I see so far” note,
- ask targeted questions,
- draft a discovery brief,
- draft a first-slice candidate,
- stop and wait for confirmation before inventing scope.

---

## 5. How to interact with the agent while it fills the documents

Treat the agent as a drafter, not an authority.

### What to tell the agent
- the project’s purpose, if you know it,
- the boundaries of the system,
- the important external contracts or interfaces,
- the things that matter to the product owner,
- the things that are deliberately out of scope,
- any known decisions and where they are recorded.

### What to ask the agent to do
- fill one stage at a time,
- cite where each claim comes from,
- label uncertainty explicitly,
- leave placeholders when evidence is missing,
- avoid inventing Acceptable decisions.

### What to check as the agent works
- Does it infer too much?
- Does it present guesses as decisions?
- Does it duplicate existing repo docs without adding value?
- Does it know where the existing docs live?
- Is it leaving clear “needs a human” items?

### How to answer the agent
- answer specific questions directly,
- correct wrong inferences early,
- mark items as confirmed, rejected, or still-open,
- do not let the agent fill large unknown areas by guessing.

If the project is fresh, keep the first interaction focused on:
- what the project is for,
- who it is for,
- what the first slice should be,
- what done looks like for that slice,
- what is out of scope for now.

---

## 6. Review the filled handbook like a human reviewer

After the agent runs, review in this order:

1. `docs/PROJECT-COMPASS.md`
   - correct any inaccurate synthesis,
   - make sure the one-or-two-sentence purpose is real.

2. `docs/LATEST-STATE.md`
   - replace placeholder-only sections with real content,
   - keep Accepted/Candidate/Deferred/Open honest.

3. `docs/DECISION-TRACE.md`
   - add only evidence-backed rows,
   - do not add rows that sound plausible but have no source.

4. `docs/PROJECT-NARRATIVE.md`
   - add real “why” sections,
   - reconstruct causal stories only when there is evidence for them.

5. `docs/START-HERE.md`
   - set the current phase,
   - set the next action,
   - add project-specific continuation rules.

6. Indexes and related docs
   - after any later change, update the affected docs and indexes.

If the handbook says something important, ask:
- where is the evidence?
- is it inferred?
- is it confirmed?
- is it still open?

If there is no good answer, the handbook should say so.

---

## 7. Keep the handbook honest over time

The handbook decays quickly if it is treated as a one-time artifact.

Rules to keep it alive:
- After any decision, update the relevant handbook doc and the indexes.
- After any change to the project, check whether the handbook still matches.
- If something is not updated because there is no new evidence, say that explicitly.
- Do not leave status tags frozen when reality has moved.

This rule should live in `AGENTS.md` and apply to both humans and agents.

---

## 8. When to stop

Stop filling when:
- the handbook gives a new human or agent enough orientation to continue,
- the current phase and next action are clear,
- the major uncertainties are marked,
- the document does not invent decisions to look complete.

Do not try to make the handbook exhaustive before it is useful.
A small honest handbook is better than a large speculative one.

---

## 9. Quick decision checklist

- Is the project already real and in progress?
  - Yes → existing mode.
  - No → fresh mode.
- Is the handbook output folder separate from the inspected project?
  - Yes → that is the intended model.
  - No → make sure you know which tree is inspected and which is output.
- Did bootstrap write the handbook where you expected?
  - Yes → continue.
  - No → stop and verify paths before filling.
- Does the mining package look plausible?
  - Yes → continue.
  - No → correct the bootstrap input first.
- Did the agent invent decisions?
  - Yes → rewrite those parts from evidence or mark them as open.
- Did the agent leave important things uncertain?
  - Yes → that is fine if it is labeled clearly.

---

## 10. Where to find the current workflow details

- `docs/project/runbooks/handbook-fill-plan.md` — the plan for this project
- `docs/project/runbooks/mining-package.json` — what bootstrap detected
- `docs/project/runbooks/fill-handbook-stages.md` — staged prompts for existing projects
- `docs/project/runbooks/fill-handbook-stages-fresh.md` — discovery-first prompts for fresh projects
- `AGENTS.md` — working rules for the repository

If anything here conflicts with the project-specific files, the project-specific files
are more authoritative for that project. This file is the generic checklist.
