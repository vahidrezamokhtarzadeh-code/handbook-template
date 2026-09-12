# Contract Artifacts

Machine-readable schemas that accompany the architecture docs. These are implementation baselines, not immutable external standards.

- `<schema-name>.schema.json` — <purpose>
- `<schema-name>.schema.json` — <purpose>

Rules:
- A published API's success payload is not forced into a global schema; it belongs to that API's own contract.
- Field names may evolve without changing the domain decisions.
- Keep the human rationale in `project/architecture/`; keep the machine truth here.
