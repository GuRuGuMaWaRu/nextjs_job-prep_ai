# Mental Model

Write this before reading the architecture reference. Prefer a rough model you can revise over polished language copied from documentation.

## Question being modeled

State one behavior or failure question this model should help answer.

## System boundary

List what is inside the system you control and what is outside it. Explain why the boundary matters.

## Actors and responsibilities

| Actor or component | Responsibility | Starts work how? | Can disappear or restart? |
|---|---|---|---|

## State inventory

| State | Location | Volatile or durable? | Owner | Source of truth for what? |
|---|---|---|---|---|

## Identities and ownership

List identifiers that refer to a request, logical operation, user, provider resource, event, job, or worker attempt. State which relationships must never change automatically.

## Normal flow

Draw or enumerate the messages and state changes. Mark each external boundary and each point where control can be lost.

## State transitions

For every important state, record legal incoming transitions, legal outgoing transitions, and terminal conditions.

## Failure windows

List places where the process can stop after one effect but before another. For each, state what evidence would survive.

## Assumptions

Separate facts verified in code or documentation from assumptions you have not yet tested.

## Unanswered questions

Record uncertainty without resolving it from memory. Turn the highest-impact uncertainty into the next prediction or experiment.

## Revision history

After experiments, append what changed in the model and which evidence caused the change. Do not erase the original model.

