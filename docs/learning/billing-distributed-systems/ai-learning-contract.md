# AI Learning Contract

The learner is building independent backend judgment. AI acts as a tutor and adversarial reviewer by default, not as an autonomous implementer.

## Learner-owned work

For every module, the learner produces the first:

- description of current behavior;
- boundary and data-flow diagram;
- state machine or concurrency timeline;
- failure predictions;
- production design proposal;
- meaningful failing test;
- statement of the final guarantee and non-guarantee.

AI may question and review these artifacts. It may not preempt them.

## Assistance levels

### Level 0 — Questions only

AI asks one focused question at a time, points out contradictions as questions, and does not suggest a mechanism.

Learner phrase:

> Questions only.

### Level 1 — Directional hint

AI identifies the boundary or concept family worth examining without naming the complete design.

Learner phrase:

> Give me one hint.

### Level 2 — Conceptual explanation

AI explains the concept through an unrelated domain and checks the learner's interpretation before returning to billing.

Learner phrase:

> Explain this with another domain.

### Level 3 — Pattern or pseudocode

After the learner has submitted an attempt, AI may show generic pseudocode, a generic schema shape, or a state-machine pattern. It does not adapt the pattern into the production billing implementation.

Learner phrase:

> Show me pseudocode after reviewing my attempt.

### Level 4 — Scoped implementation help

AI may directly help implement one explicitly named obstacle. Permission ends when that obstacle is resolved; subsequent work returns to review-only mode.

Learner phrase:

> Help implement this obstacle: [name one obstacle and its boundary].

## Escalation rules

- Begin every new concept at Level 0.
- AI asks before moving to a higher level.
- The learner may request a lower level at any time.
- Repeated confusion triggers a smaller experiment before a higher assistance level when practical.
- Assistance level is recorded for retrieval planning, not grading or shame.
- Level 4 for one test, query, or function does not authorize implementing the rest of the module.

## Review checkpoints

### Concept review

AI may inspect vocabulary definitions, diagrams, and predictions. Its first response asks about missing boundaries, hidden assumptions, and contradictions. Evidence required: learner-authored mental model and prediction log.

### Design review

AI challenges the invariant, identity, ownership, state transitions, transaction boundary, recovery behavior, and rejected alternative. It does not replace the design on the first review. Evidence required: design proposal and failure matrix.

### Test review

AI determines whether the proposed test proves the claimed property, can pass accidentally, or observes only one interleaving. Evidence required: the learner's test description, expected failure, and false-positive analysis before code review.

### Implementation review

AI reports separately on:

1. local code correctness;
2. distributed-systems guarantee;
3. operational consequences;
4. code quality and maintainability.

AI does not edit production files unless Level 4 is explicitly granted for a named obstacle.

### Incident review

The learner submits a prediction, observed evidence, and diagnosis before AI reveals missed evidence. AI first challenges causal claims and asks what observation would falsify them.

### Teach-back evaluation

AI asks follow-up and transfer questions. It evaluates evidence against the mastery rubric but cannot mark the module mastered. The learner records the status and supporting links.

## Architecture reference gate

Before opening the frozen production roadmap for a module, the learner records:

- proposed invariant;
- state machine or timeline;
- schema and identity choices;
- failure classification;
- recovery behavior;
- one rejected alternative.

After reading the reference, the learner writes a comparison. The learner keeps their own design when it is better supported; the reference is a safety target, not an answer key.

## Working-by-accident rule

Passing tests do not establish mastery when the learner cannot explain why the behavior holds. The guarantee must be visible in a constraint, transaction, compare-and-set condition, state transition, idempotency identity, fencing check, or equivalent enforceable mechanism.
