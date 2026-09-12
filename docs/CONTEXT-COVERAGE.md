# Context Coverage — What from the discovery conversation is preserved?

This file prevents a new Chat/Tool from seeing conclusions without the causal context. It maps every major conversation discovery to a durable handbook file.

| Topic from discovery | Current state | Where rationale/state is preserved |
|---|---|---|
| <topic 1> | <Accepted / Deferred / Open / story evidence only> | <file(s)> |
| <topic 2> | <...> | <...> |

## Important interpretation rule

A row marked as <story>/evidence behavior is *evidence*, not a universal platform rule, unless a separate ADR explicitly generalizes the boundary/invariant.

## If a new Chat disagrees with an Accepted decision

It should first read the referenced ADR + Narrative context and identify the new Story/evidence that invalidates the old rationale. It should not redesign based only on aesthetic preference.

## Maintenance

- Update this map every time a discovery lands in a durable file.
- When implementation produces evidence, add a second table mapping implementation concern → doc/source evidence.
