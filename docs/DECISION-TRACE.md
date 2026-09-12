# Decision Trace — Story/Evidence -> Decision -> Why

This table exists so that no decision is preserved without its cause. It is the single map from evidence to decisions.

| Topic | Evidence / Story | Current Decision | Why | What we deliberately did NOT build |
|---|---|---|---|---|
| <Gateway boundary> | <real story: ...> | <decision> | <rationale> | <rejected alternative> |
| <Concept X> | <story NNN: ...> | <decision> | <rationale> | <rejected alternative> |
| <Tool choice> | <evidence: ...> | <decision> | <rationale> | <rejected alternative> |

## How to maintain

- Add a row whenever a decision is Accepted or an existing decision changes.
- Keep the Evidence cell pointing at a real Story/use-case — never an invented one.
- The last column is as important as the decision itself.
- If a decision needs more depth, write an ADR in `project/decisions/` and reference it here.

## Implementation-phase additions

Add further tables (or sections) here for implementation/technology closures, with the same columns.
