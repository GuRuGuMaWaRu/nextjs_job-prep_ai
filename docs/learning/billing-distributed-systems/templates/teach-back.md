# Teach-Back

> **Optional tool:** Use this only when the resulting document will have future value. It is not required for progress.

Use this to consolidate a substantial idea or test whether it transfers to another system. It is not a ceremonial final exam.

## Plain-language explanation

Explain the problem and mechanism to a developer who knows HTTP and SQL but not the named distributed-systems pattern.

## Precise explanation

Define identities, durable state, transitions, concurrency control, failure behavior, and recovery trigger.

## Diagram from memory

Draw the relevant components and mark every external and transaction boundary.

## Guarantee

State exactly what the system guarantees and the enforcement mechanism.

## Non-guarantee

State what remains at-least-once, eventually consistent, ambiguous, manually remediated, or dependent on a provider promise.

## Novel scenario

Record the transfer scenario, your prediction, evidence you would inspect, and recovery decision.

## Alternative design

Describe when a simpler design would be sufficient and when a more complex design would become justified.

## Changed requirement

Choose one changed scale, provider guarantee, ownership rule, or latency target. Identify affected invariants, schema, tests, and operations.

## Remaining uncertainty

Record questions you still cannot answer confidently and the smallest next retrieval or experiment.

## Useful references

Link only the code, tests, experiments, decisions, or incidents that would help you or a future maintainer reconstruct the reasoning.
