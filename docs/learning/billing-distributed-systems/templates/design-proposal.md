# Design Proposal

Complete this before opening the frozen architecture reference.

## Problem

Describe the concrete incorrect or unrecoverable behavior, not the desired technology.

## Invariant

State the property that must remain true across concurrency, retries, process death, and dependency failure.

## Guarantee and non-guarantee

- Guarantee provided:
- Guarantee explicitly not provided:
- Maximum period of uncertainty or inconsistency:

## Identities and ownership

Define the identity of the logical operation, provider resources, events, jobs, attempts, and owners. State which identity relationships are immutable.

## Public interface

Describe caller intent, inputs, result variants, and errors without exposing provider-specific choices unnecessarily.

## Schema and durable state

For each field, state why it exists, who writes it, uniqueness requirements, nullable transitions, and retention.

## State machine

List legal transitions, terminal states, retry states, and invalid transitions. Explain enforcement.

## Concurrency boundary

Draw at least two competing interleavings. Identify the serialization, compare-and-set, uniqueness, locking, or fencing mechanism.

## Transaction boundary

List effects committed atomically. List external effects that cannot join the transaction.

## Failure classification

Define retryable, permanent, ignored, dead-letter, and ambiguous outcomes relevant to this module.

## Recovery

For every non-terminal failure, name the next trigger, recovery owner, persisted evidence, and bounded retry behavior.

## Observability

State the operator question each proposed log, metric, trace, status query, or audit entry answers.

## Rollout and rollback

Describe additive deployment, comparison evidence, authority switch, cleanup, and the point after which rollback requires data restoration.

## Rejected alternative

Describe one credible alternative, its benefit, and why its failure or complexity cost is worse under current constraints.

## Unresolved uncertainty

List questions requiring an experiment, primary source, or production observation before implementation.

## Architecture comparison

After the gate opens, append differences from the frozen reference and justify every adopted or rejected change.
