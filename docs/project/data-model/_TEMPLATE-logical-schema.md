# Logical Schema — <Scope: e.g. MVP>

> Template. Rename to `<scope>-logical-schema.md`; place the runnable SQL beside it as `<scope>-schema.sql`.

## Status
<Candidate baseline | Accepted baseline>

## Principles
- <e.g. one DB with logical module ownership>
- <immutable revision records for audit>
- <privacy: raw PII not persisted by default>

## Tables / entities

### <table or aggregate>
- <column/field> — <type> — <notes>
- ...

## Invariants
- <e.g. balance never negative>
- <unique keys / idempotency constraints>

## Relationship to SQL
- The runnable skeleton lives next to this file as `<scope>-schema.sql`.
- Markdown is the design; SQL is the machine artifact; keep them in sync.

## Non-goals
- <physical tuning, partitioning, versioning policy, etc.>
