# Latest State — <Project Name>

## Direction

<One paragraph: what the system is, expressed in capabilities, not tool names.>

### Deployment (current)
- <e.g. Docker Compose; Kubernetes outside MVP>

### Currency / units (if business-facing)
- <e.g. IRR; FX rules: TBD>

---

## Accepted — <Topic 1>

<Current decision in plain language. Include:>
- <what it is responsible for>
- <what it is explicitly NOT responsible for>
- <principles, e.g. `Route -> Upstream`, `Execution -> Metering -> Pricing -> Billing -> Ledger`>

## Accepted — <Topic 2>

...

---

## Explicitly NOT Accepted as Domain Concepts

- <Concept A> — <why not modeled>
- <Concept B> — <why not modeled>

---

## Deferred / Open Decisions

- <item 1>
- <item 2>

(For a full per-item write-up, see `project/open-decisions/`.)

---

## Technology — Current Implementation Choices

| Concern | Choice | Status |
|---|---|---|
| <Runtime> | <e.g. Node.js + TypeScript> | Accepted |
| <Database> | <e.g. PostgreSQL> | Accepted |
| <Tool X> | <Name> | Candidate / needs validation |
| <Tool Y> | <Name> | Not finalized |

---

## Current Phase

<discovery paused? / executable design complete? / implementation slice N>

Next action: <one sentence>

For the *why* behind these decisions read `PROJECT-NARRATIVE.md` and `DECISION-TRACE.md` — they are part of the official handoff.
