# New Chat Continuation

## Required handoff sequence
1. Upload the latest handbook snapshot.
2. Tell the new assistant/tool to read `START-HERE.md` first.
3. Then read `LATEST-STATE.md`, `PROJECT-NARRATIVE.md`, and `DECISION-TRACE.md` before proposing architectural changes.
4. Read the relevant ADR before changing an Accepted decision.
5. Treat Accepted/Confirmed as current truth; Candidate/TBD/Open Decision remain unresolved.
6. Preserve rationale and trade-offs, not only final states.

## Working method
- Discovery is intentionally paused unless a genuine blocker appears.
- Continue in the order: <component boundaries → contracts → data model → flows → deployment → implementation slices>.
- Ask a Business question only when a design decision cannot safely be inferred from accepted rules.
- Prefer the simplest MVP behavior supported by a real Story.
- Do not add generic rule engines, entities, microservices, or future-proofing without evidence.
- Periodically create a new versioned snapshot after a meaningful design block.

## Current snapshot
<version + phase>

## Important current reasoning checkpoints
- <decision 1 and its one-line rationale>
- <decision 2 and its one-line rationale>
- <...>
