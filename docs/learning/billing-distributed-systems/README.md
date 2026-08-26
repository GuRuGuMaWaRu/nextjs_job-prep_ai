# Billing Distributed Systems Apprenticeship

This apprenticeship uses the project's real Stripe billing subsystem as the spine for learning backend and distributed systems. The goal is not merely to make billing work. It is to understand why it works, which failures it survives, and where its guarantees end.

The material assumes elementary backend knowledge. We will explain unfamiliar mechanisms when they become relevant, use tiny experiments to make uncertain behavior visible, and then bring the understanding back into production code.

## Start here

1. Read the [five learning trails](curriculum.md) for a map of the territory.
2. Read the [AI teaching contract](ai-learning-contract.md) for how Petro and the tutor work together.
3. Begin with [Session 1: recoverable checkout intent](sessions/01-recoverable-checkout-intent/README.md).
4. Use the [journey map](progress.md) to retain context between sessions.

These are optional tools, not gates:

- [Learning checks](learning-checks.md) help decide whether to investigate further or change production code.
- [Source policy](source-policy.md) explains when documentation is useful.
- [Reasoning toolbox](templates/) contains reusable prompts and note shapes.

## The working loop

```text
production question → prediction when useful → tiny experiment
→ observation → explanation → production guarantee
→ proportional verification → next exposed problem
```

The loop is a guide, not a form to complete. A direct explanation may replace prediction when prerequisite knowledge is missing. An experiment may be unnecessary when the behavior is already understood. Curiosity may open another trail without requiring the current trail to be "finished."

## Production discipline

Production code may be inspected at any time. Change it when you can state the intended guarantee and have enough understanding to do so safely. Otherwise, first use the smallest useful explanation, documentation lookup, or disposable experiment.

A fix is not considered learned merely because it works. Before moving on, be able to explain:

1. What failure does it prevent?
2. Where does the guarantee come from?
3. What does it not protect against?

Prefer the lowest-cost test that can actually falsify the guarantee. Local logic may need only a unit test; concurrency, crashes, ordering, persistence, and third-party boundaries must be tested where those behaviors exist.

## Keeping useful knowledge

Documentation is created when it has future value, not to prove that learning occurred. Production guarantees, non-obvious failure assumptions, and operational constraints should live near the code when future maintainers would otherwise have to rediscover them.

The earlier foundations course is preserved in [history](history/) as a record of the first learning approach. It has no gatekeeping role in this apprenticeship.

## Safety

- Use disposable data in learning experiments.
- Use Stripe test mode.
- Never copy real customer data, emails, provider payloads, secrets, or tokens into learning notes.
- Do not weaken the repository's migration, testing, or deployment requirements for an experiment.
- Add rollout and recovery planning when a change can leave persistent data or deployed versions in incompatible states.
