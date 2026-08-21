# Mastery Rubric

A module is marked `mastered` only when every dimension reaches `transferable`. Evidence matters more than confidence or elapsed time.

| Dimension | Not yet | Developing | Independent | Transferable |
|---|---|---|---|---|
| Vocabulary | Repeats terms without distinguishing them | Explains terms with prompts but mixes boundaries | Defines terms accurately in the module context | Explains the same idea without framework vocabulary and contrasts nearby concepts |
| Modeling | Diagram omits actors, durable state, or external boundaries | Captures the happy path but misses failure windows | Models state, identity, ownership, and failure boundaries | Revises the model for a changed requirement and predicts downstream effects |
| Prediction | Predicts only the happy path or changes prediction after observing | Predicts common failures without an explicit interleaving | Records timelines and final state before execution | Predicts an unfamiliar compound failure and names evidence that could falsify the prediction |
| Experimental method | Changes several variables or cannot reproduce the result | Runs a repeatable experiment but evidence is weak | Controls the relevant variable, records evidence, and cleans up | Designs a smaller discriminating experiment when competing explanations remain |
| Design tradeoffs | Selects a pattern because it is common | States advantages but not failure costs | Defends invariant, mechanism, and rejected alternative | Adapts or removes the pattern when constraints change and explains the new guarantee |
| Testing | Tests implementation details or one happy example | Tests a failure but can pass without the claimed guarantee | Writes a failing test tied to an invariant and meaningful interleaving | Identifies false positives and extends proof across a new concurrency or crash boundary |
| Diagnosis | Guesses from the error message | Uses logs but not durable state or timelines | Correlates database state, logs, traces, and provider evidence | Isolates an unfamiliar fault, states uncertainty, and chooses the next highest-information observation |
| Teach-back | Reads code or notes to explain behavior | Explains mechanism but overclaims guarantees | Explains guarantee, limit, failure behavior, and recovery from memory | Transfers the reasoning to a different external system and rejects non-transferable assumptions |

## Gate rules

### Concept gate

Required before production design:

- vocabulary at least `independent`;
- modeling at least `independent`;
- prediction at least `developing`;
- learner can distinguish safety from eventual progress for the module.

### Construction gate

Required before opening a production PR:

- experimental method at least `independent`;
- design tradeoffs at least `independent`;
- testing at least `independent`;
- required failure drills have persistent-state evidence.

### Transfer gate

Required for `mastered`:

- every dimension is `transferable`;
- learner answers an unfamiliar scenario without opening the implementation;
- remaining uncertainty is recorded rather than hidden;
- assistance used is recorded in `progress.md`.

## When a gate does not pass

Do not repeat the same explanation immediately. Choose one smaller response:

- redraw a single boundary;
- enumerate one two-actor interleaving;
- reduce the experiment to one changed variable;
- explain the concept through an unrelated domain;
- compare two mechanisms against one invariant;
- rerun a previously mastered experiment from memory.

The course advances after new evidence, not after rereading.

