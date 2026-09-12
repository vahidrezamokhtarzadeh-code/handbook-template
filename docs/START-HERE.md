# START HERE — <Project Name> Handbook <v0.1.0>

This file is written for a new Chat/Tool/Engineer continuing this project.

## Mandatory reading order

Reading only *what* was decided is not enough; the *why* is part of the architecture. Read in this order:

1. `LATEST-STATE.md` — what is true now: Accepted/Candidate/Deferred/Open.
2. `PROJECT-NARRATIVE.md` — the causal story behind the architecture's shape.
3. `DECISION-TRACE.md` — evidence/story → decision → why → deliberately-not-built.
4. `CONTEXT-COVERAGE.md` — which conversation discoveries are preserved and where.
5. `project/runbooks/new-chat-continuation.md` — how to continue work.
6. `SOURCE-HANDOFF.md` and repository-root `IMPLEMENTATION-STATUS.md` if source accompanies the handbook.
7. The ADR relevant to whatever you are about to change.

## Before implementing, also read

- `EXECUTABLE-DESIGN-INDEX.md`
- <list the executable design docs: platform contracts, published API definition, runtime flows, data model, implementation plan, remaining gates>

## Rules for continuing the project

- Treat Accepted/Confirmed as current truth unless a new Story invalidates it.
- Do not unilaterally finalize Candidate/TBD/Open items.
- Before changing an Accepted decision, read the Context/Rationale in its ADR and the Decision Trace.
- Do not remove MVP simplifications: many things that look incomplete are deliberately Deferred.
- Avoid building generic rule engines, entities, microservices, or abstractions purely for future-proofing.
- Express domain/architecture in capabilities; keep tool names in technology decisions.
- <add project-specific continuation rules here>

## Current status of work

Phase: <discovery / executable design / implementation — current phase and slice>

Current next action: <one sentence>

## Versioning

This handbook is snapshotted after each meaningful design block. Current version: <v0.1.0>. See `CHANGELOG.md`.
